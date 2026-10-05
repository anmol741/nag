<?php
/**
 * Course payments: full fee or a configurable deposit, as a real WooCommerce
 * order paid by e-Transfer. The course price arrives from the storefront
 * server (its own course data, over the signed channel — never from a
 * browser); the deposit comes only from WooCommerce → Settings → Nag's
 * Beauty and is never hard-coded.
 *
 * Order meta retained: _nag_course_slug, _nag_course_title, _nag_student_name,
 * _nag_student_email, _nag_student_phone, _nag_course_price, _nag_payment_type
 * (full|deposit), _nag_amount_due_now, _nag_amount_paid (set when payment is
 * confirmed), _nag_remaining_balance, _nag_course_policy_accepted_at.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Courses {

	public static $in_bridge = false;

	public static function options( array $p ) {
		$price   = (float) wc_format_decimal( (string) ( $p['coursePrice'] ?? '0' ), 2 );
		$deposit = Nag_Settings::course_deposit_amount();
		if ( null === $deposit || (float) $deposit >= $price ) {
			return array( 'depositAvailable' => false );
		}
		return array(
			'depositAvailable' => true,
			'depositAmount'    => $deposit,
		);
	}

	public static function order( array $p ) {
		$ip = (string) ( $p['ip'] ?? '' );
		if ( ! Nag_Rate_Limit::hit( 'course_ip', $ip, 5, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}

		$user_id  = absint( $p['userId'] ?? 0 );
		$slug     = sanitize_title( (string) ( $p['courseSlug'] ?? '' ) );
		$title    = sanitize_text_field( (string) ( $p['courseTitle'] ?? '' ) );
		$price    = (float) wc_format_decimal( (string) ( $p['coursePrice'] ?? '0' ), 2 );
		$type     = 'deposit' === ( $p['paymentType'] ?? '' ) ? 'deposit' : 'full';
		$student  = is_array( $p['student'] ?? null ) ? $p['student'] : array();
		$first    = sanitize_text_field( (string) ( $student['firstName'] ?? '' ) );
		$last     = sanitize_text_field( (string) ( $student['lastName'] ?? '' ) );
		$email    = sanitize_email( (string) ( $student['email'] ?? '' ) );
		$phone    = sanitize_text_field( (string) ( $student['phone'] ?? '' ) );
		$key      = strtolower( (string) ( $p['idempotencyKey'] ?? '' ) );
		$accepted = sanitize_text_field( (string) ( $p['policyAcceptedAt'] ?? '' ) );

		if ( '' === $slug || '' === $title || $price <= 0 || '' === $first || '' === $last || ! is_email( $email ) || '' === $phone || '' === $accepted
			|| ! preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $key ) ) {
			return new WP_Error( 'nag_invalid_request', __( 'Please check your details and try again.', 'nag-bridge' ), array( 'status' => 400 ) );
		}
		if ( $user_id && ! get_user_by( 'id', $user_id ) ) {
			$user_id = 0;
		}

		$amount_due = $price;
		if ( 'deposit' === $type ) {
			$deposit = Nag_Settings::course_deposit_amount();
			if ( null === $deposit || (float) $deposit >= $price ) {
				return new WP_Error( 'nag_deposit_unavailable', __( 'A deposit option is not available for this course.', 'nag-bridge' ), array( 'status' => 409 ) );
			}
			$amount_due = (float) $deposit;
		}
		$remaining = max( 0, $price - $amount_due );

		// Duplicate protection: same key → same order.
		$existing = wc_get_orders(
			array(
				'limit'      => 1,
				'return'     => 'ids',
				'status'     => array_keys( wc_get_order_statuses() ),
				'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array(
						'key'   => '_nag_idempotency_key',
						'value' => $key,
					),
				),
			)
		);
		if ( $existing ) {
			return self::result( wc_get_order( $existing[0] ), true );
		}
		$lock = 'nag_course_lock_' . md5( $key );
		if ( ! add_option( $lock, time(), '', 'no' ) ) {
			return new WP_Error( 'nag_order_in_progress', __( 'Your request is already being processed.', 'nag-bridge' ), array( 'status' => 409 ) );
		}

		self::$in_bridge = true;
		try {
			$gateways = WC()->payment_gateways()->payment_gateways();
			$gateway  = $gateways['nag_etransfer'] ?? null;
			if ( ! $gateway || 'yes' !== $gateway->enabled ) {
				return new WP_Error( 'nag_payment_unavailable', __( 'e-Transfer payments are not available right now. Please contact us.', 'nag-bridge' ), array( 'status' => 503 ) );
			}

			$order = wc_create_order(
				array(
					'customer_id' => $user_id,
					'created_via' => 'nag-storefront-course',
				)
			);
			if ( is_wp_error( $order ) ) {
				return new WP_Error( 'nag_order_failed', __( "We couldn't create your enrollment. Please try again.", 'nag-bridge' ), array( 'status' => 500 ) );
			}

			$taxable = 'yes' === get_option( 'nag_course_fee_taxable', 'no' );
			$fee     = new WC_Order_Item_Fee();
			$fee->set_name(
				sprintf(
					/* translators: 1: course title, 2: payment type */
					__( 'Course: %1$s (%2$s)', 'nag-bridge' ),
					$title,
					'deposit' === $type ? __( 'deposit', 'nag-bridge' ) : __( 'full payment', 'nag-bridge' )
				)
			);
			$fee->set_amount( wc_format_decimal( $amount_due, 2 ) );
			$fee->set_total( wc_format_decimal( $amount_due, 2 ) );
			$fee->set_tax_status( $taxable ? 'taxable' : 'none' );
			$order->add_item( $fee );

			$order->set_billing_first_name( $first );
			$order->set_billing_last_name( $last );
			$order->set_billing_email( $email );
			$order->set_billing_phone( $phone );
			$order->set_billing_country( 'CA' );
			$order->set_billing_state( 'BC' );
			$order->set_payment_method( $gateway );

			$meta = array(
				'_nag_idempotency_key'            => $key,
				'_nag_order_source'               => 'storefront-course',
				'_nag_course_slug'                => $slug,
				'_nag_course_title'               => $title,
				'_nag_student_name'               => trim( $first . ' ' . $last ),
				'_nag_student_email'              => $email,
				'_nag_student_phone'              => $phone,
				'_nag_course_price'               => wc_format_decimal( $price, 2 ),
				'_nag_payment_type'               => $type,
				'_nag_amount_due_now'             => wc_format_decimal( $amount_due, 2 ),
				'_nag_amount_paid'                => '0.00',
				'_nag_remaining_balance'          => wc_format_decimal( $remaining, 2 ),
				'_nag_course_policy_accepted_at'  => $accepted,
			);
			foreach ( $meta as $meta_key => $value ) {
				$order->update_meta_data( $meta_key, $value );
			}
			$order->calculate_totals( $taxable );
			$order->save();

			$gateway->process_payment( $order->get_id() );
			$order = wc_get_order( $order->get_id() );
			Nag_Emails::course_enrollment_received( $order );

			return self::result( $order, false );
		} finally {
			self::$in_bridge = false;
			delete_option( $lock );
		}
	}

	private static function result( $order, $duplicate ) {
		return array(
			'orderId'          => $order->get_id(),
			'orderNumber'      => (string) $order->get_order_number(),
			'amountDue'        => (string) $order->get_meta( '_nag_amount_due_now' ),
			'remainingBalance' => (string) $order->get_meta( '_nag_remaining_balance' ),
			'duplicate'        => (bool) $duplicate,
		);
	}
}
