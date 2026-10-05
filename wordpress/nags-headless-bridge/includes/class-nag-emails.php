<?php
/**
 * Customer and administrator emails.
 *
 * Every email is wrapped in WooCommerce's own email template and sent with
 * WooCommerce's mailer, so it uses the store's configured "From" name and
 * address (WooCommerce → Settings → Emails) and whatever SMTP plugin the
 * site already uses. No credentials live in this plugin.
 *
 * All dynamic values are escaped (esc_html / esc_url) at output.
 *
 * Emails that WooCommerce already sends are NOT duplicated:
 *   - New order (admin)                → WooCommerce "New order"
 *   - Customer order confirmation      → WooCommerce "Order on-hold" (+ e-Transfer instructions injected by the gateway)
 *   - Order processing / completed     → WooCommerce "Processing order" / "Completed order"
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Emails {

	/* ------------------------------------------------------------------ */
	/* Helpers                                                            */
	/* ------------------------------------------------------------------ */

	private static function send( $to, $subject, $heading, $body_html ) {
		if ( ! is_email( $to ) || ! function_exists( 'WC' ) ) {
			return false;
		}
		$mailer  = WC()->mailer();
		$message = $mailer->wrap_message( $heading, $body_html );
		$sent    = $mailer->send( $to, wp_strip_all_tags( $subject ), $message );
		if ( ! $sent ) {
			// Never log addresses or content — only which template failed.
			error_log( '[nag-bridge] email send failed: ' . sanitize_key( $heading ) );
		}
		return $sent;
	}

	private static function p( $text ) {
		return '<p>' . esc_html( $text ) . '</p>';
	}

	private static function button( $url, $label ) {
		return '<p style="margin:24px 0;"><a href="' . esc_url( $url ) . '" style="display:inline-block;padding:12px 24px;background:#c9a96e;color:#1a1a1a;text-decoration:none;border-radius:6px;font-weight:bold;">' . esc_html( $label ) . '</a></p>'
			. '<p style="font-size:12px;color:#666;">' . esc_html__( 'If the button does not work, copy this link into your browser:', 'nag-bridge' ) . '<br>' . esc_html( $url ) . '</p>';
	}

	private static function site_name() {
		return wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	}

	private static function money( $amount ) {
		return wp_strip_all_tags( html_entity_decode( wc_price( $amount ) ) ) . ' CAD';
	}

	private static function first_name( WP_User $user ) {
		$name = trim( (string) get_user_meta( $user->ID, 'first_name', true ) );
		return '' !== $name ? $name : __( 'there', 'nag-bridge' );
	}

	private static function contact_line() {
		return self::p( __( "Questions? Reply to this email or call us at 778-278-7727.", 'nag-bridge' ) );
	}

	/* ------------------------------------------------------------------ */
	/* Account emails                                                     */
	/* ------------------------------------------------------------------ */

	public static function verification( WP_User $user, $url ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), self::first_name( $user ) ) );
		$body .= self::p( __( 'Thank you for registering for a professional account. Please confirm your email address:', 'nag-bridge' ) );
		$body .= self::button( $url, __( 'Verify my email', 'nag-bridge' ) );
		$body .= self::p( __( 'This link expires in 48 hours. If you did not create an account, you can ignore this email.', 'nag-bridge' ) );
		return self::send( $user->user_email, sprintf( __( 'Verify your email for %s', 'nag-bridge' ), self::site_name() ), __( 'Verify your email', 'nag-bridge' ), $body );
	}

	public static function registration_received( WP_User $user ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), self::first_name( $user ) ) );
		$body .= self::p( __( 'Your email is verified and your registration has been received. Our team is now reviewing your certification.', 'nag-bridge' ) );
		$body .= self::p( __( "We'll email you as soon as your account is approved. Wholesale access and pricing are enabled after approval.", 'nag-bridge' ) );
		$body .= self::contact_line();
		return self::send( $user->user_email, __( 'We received your registration', 'nag-bridge' ), __( 'Registration received', 'nag-bridge' ), $body );
	}

	public static function admin_new_registration( WP_User $user ) {
		$salon = (string) get_user_meta( $user->ID, 'nag_salon_name', true );
		$phone = (string) get_user_meta( $user->ID, 'billing_phone', true );
		$url   = admin_url( 'user-edit.php?user_id=' . $user->ID . '#nag-approval' );

		$body  = self::p( __( 'A new professional account is waiting for review:', 'nag-bridge' ) );
		$body .= '<ul>'
			. '<li>' . esc_html__( 'Name:', 'nag-bridge' ) . ' ' . esc_html( trim( $user->first_name . ' ' . $user->last_name ) ) . '</li>'
			. '<li>' . esc_html__( 'Email:', 'nag-bridge' ) . ' ' . esc_html( $user->user_email ) . '</li>'
			. '<li>' . esc_html__( 'Phone:', 'nag-bridge' ) . ' ' . esc_html( $phone ) . '</li>'
			. '<li>' . esc_html__( 'Salon/Spa:', 'nag-bridge' ) . ' ' . esc_html( $salon ) . '</li>'
			. '</ul>';
		$body .= self::p( __( 'The certification document is attached to the customer profile (download requires an administrator login). The customer must also verify their email before wholesale access is enabled.', 'nag-bridge' ) );
		$body .= self::button( $url, __( 'Review registration', 'nag-bridge' ) );
		return self::send( Nag_Settings::admin_notify_email(), sprintf( __( 'New registration to review: %s', 'nag-bridge' ), $user->user_email ), __( 'New registration request', 'nag-bridge' ), $body );
	}

	public static function approved( WP_User $user ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), self::first_name( $user ) ) );
		$body .= self::p( __( 'Good news — your professional account has been approved.', 'nag-bridge' ) );
		if ( 'yes' !== get_user_meta( $user->ID, '_nag_email_verified', true ) && '' !== (string) get_user_meta( $user->ID, '_nag_registration_source', true ) ) {
			$body .= self::p( __( 'Please verify your email address using the link we sent earlier to finish enabling wholesale access.', 'nag-bridge' ) );
		} else {
			$body .= self::p( __( 'Wholesale access is now enabled. You can log in and place orders online.', 'nag-bridge' ) );
		}
		$body .= self::button( Nag_Settings::frontend_url() . '/account', __( 'Go to my account', 'nag-bridge' ) );
		return self::send( $user->user_email, __( 'Your account has been approved', 'nag-bridge' ), __( 'Account approved', 'nag-bridge' ), $body );
	}

	public static function rejected( WP_User $user, $reason ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), self::first_name( $user ) ) );
		$body .= self::p( __( "Thank you for your interest. Unfortunately we weren't able to approve your professional account at this time.", 'nag-bridge' ) );
		if ( '' !== trim( (string) $reason ) ) {
			$body .= self::p( sprintf( __( 'Reason: %s', 'nag-bridge' ), $reason ) );
		}
		$body .= self::p( __( 'If you have updated certification or questions, please contact us.', 'nag-bridge' ) );
		$body .= self::contact_line();
		return self::send( $user->user_email, __( 'About your account registration', 'nag-bridge' ), __( 'Registration update', 'nag-bridge' ), $body );
	}

	public static function password_reset( WP_User $user, $url ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), self::first_name( $user ) ) );
		$body .= self::p( __( 'Someone requested a password reset for your account. To choose a new password, click below:', 'nag-bridge' ) );
		$body .= self::button( $url, __( 'Reset my password', 'nag-bridge' ) );
		$body .= self::p( __( "This link expires in 24 hours. If you didn't request this, you can ignore this email — your password won't change.", 'nag-bridge' ) );
		return self::send( $user->user_email, sprintf( __( 'Password reset for %s', 'nag-bridge' ), self::site_name() ), __( 'Reset your password', 'nag-bridge' ), $body );
	}

	/* ------------------------------------------------------------------ */
	/* Order emails                                                       */
	/* ------------------------------------------------------------------ */

	/** e-Transfer payment instructions block (also used inside WooCommerce's on-hold email). */
	public static function etransfer_instructions_html( WC_Order $order ) {
		$email = WC_Gateway_Nag_ETransfer::payment_email();
		$html  = '<h2>' . esc_html__( 'How to pay by Interac e-Transfer', 'nag-bridge' ) . '</h2>';
		$html .= '<ol>'
			. '<li>' . sprintf( esc_html__( 'Send %1$s by Interac e-Transfer to %2$s.', 'nag-bridge' ), '<strong>' . esc_html( self::money( $order->get_total() ) ) . '</strong>', '<strong>' . esc_html( $email ) . '</strong>' ) . '</li>'
			. '<li>' . sprintf( esc_html__( 'Put your order number %s in the transfer message.', 'nag-bridge' ), '<strong>#' . esc_html( $order->get_order_number() ) . '</strong>' ) . '</li>'
			. '</ol>';
		$html .= '<p><strong>' . esc_html__( 'Your order is not paid until we receive your transfer.', 'nag-bridge' ) . '</strong> '
			. esc_html( sprintf( __( 'Orders not paid within %d days are cancelled automatically.', 'nag-bridge' ), Nag_Orders::UNPAID_DAYS ) ) . '</p>';
		return $html;
	}

	public static function order_auto_cancelled( WC_Order $order ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), $order->get_billing_first_name() ?: __( 'there', 'nag-bridge' ) ) );
		$body .= self::p( sprintf( __( 'We did not receive an e-Transfer for order #%1$s within %2$d days, so the order has been cancelled and the items released.', 'nag-bridge' ), $order->get_order_number(), Nag_Orders::UNPAID_DAYS ) );
		$body .= self::p( __( "If you've already sent the payment or would still like these items, please contact us and we'll help right away.", 'nag-bridge' ) );
		$body .= self::contact_line();
		return self::send( $order->get_billing_email(), sprintf( __( 'Order #%s cancelled — payment not received', 'nag-bridge' ), $order->get_order_number() ), __( 'Order cancelled', 'nag-bridge' ), $body );
	}

	public static function payment_confirmed( WC_Order $order ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), $order->get_billing_first_name() ?: __( 'there', 'nag-bridge' ) ) );
		$body .= self::p( sprintf( __( 'We have received your payment of %1$s for order #%2$s. Thank you!', 'nag-bridge' ), self::money( $order->get_total() ), $order->get_order_number() ) );
		if ( Nag_Orders::is_local_pickup( $order ) ) {
			$body .= self::p( __( "We'll email you again when your order is ready for pickup.", 'nag-bridge' ) );
		} else {
			$body .= self::p( __( 'Orders are processed within 3–5 business days. You will receive another email when your order ships.', 'nag-bridge' ) );
		}
		return self::send( $order->get_billing_email(), sprintf( __( 'Payment received for order #%s', 'nag-bridge' ), $order->get_order_number() ), __( 'Payment received', 'nag-bridge' ), $body );
	}

	public static function pickup_ready( WC_Order $order ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), $order->get_billing_first_name() ?: __( 'there', 'nag-bridge' ) ) );
		$body .= self::p( sprintf( __( 'Your order #%s is ready for pickup.', 'nag-bridge' ), $order->get_order_number() ) );
		$body .= '<p><strong>' . esc_html__( 'Pickup location:', 'nag-bridge' ) . '</strong><br>' . esc_html( Nag_Orders::PICKUP_ADDRESS ) . '</p>';
		$body .= '<p><strong>' . esc_html__( 'Pickup hours:', 'nag-bridge' ) . '</strong><br>' . esc_html( Nag_Orders::PICKUP_HOURS ) . '</p>';
		if ( ! $order->is_paid() ) {
			$body .= self::p( __( 'Our records show this order is not paid yet — please complete payment before pickup.', 'nag-bridge' ) );
		}
		$body .= self::p( __( 'Please bring your order number with you.', 'nag-bridge' ) );
		$body .= self::contact_line();
		return self::send( $order->get_billing_email(), sprintf( __( 'Order #%s is ready for pickup', 'nag-bridge' ), $order->get_order_number() ), __( 'Ready for pickup', 'nag-bridge' ), $body );
	}

	/* ------------------------------------------------------------------ */
	/* Course emails                                                      */
	/* ------------------------------------------------------------------ */

	private static function course_summary_html( WC_Order $order ) {
		$type = $order->get_meta( '_nag_payment_type' );
		$html = '<ul>'
			. '<li>' . esc_html__( 'Course:', 'nag-bridge' ) . ' ' . esc_html( $order->get_meta( '_nag_course_title' ) ) . '</li>'
			. '<li>' . esc_html__( 'Student:', 'nag-bridge' ) . ' ' . esc_html( $order->get_meta( '_nag_student_name' ) ) . '</li>'
			. '<li>' . esc_html__( 'Course price:', 'nag-bridge' ) . ' ' . esc_html( self::money( $order->get_meta( '_nag_course_price' ) ) ) . '</li>'
			. '<li>' . esc_html__( 'Payment type:', 'nag-bridge' ) . ' ' . esc_html( 'deposit' === $type ? __( 'Deposit', 'nag-bridge' ) : __( 'Full payment', 'nag-bridge' ) ) . '</li>'
			. '<li>' . esc_html__( 'Amount due now:', 'nag-bridge' ) . ' ' . esc_html( self::money( $order->get_meta( '_nag_amount_due_now' ) ) ) . '</li>';
		if ( 'deposit' === $type ) {
			$html .= '<li>' . esc_html__( 'Remaining balance:', 'nag-bridge' ) . ' ' . esc_html( self::money( $order->get_meta( '_nag_remaining_balance' ) ) ) . '</li>';
		}
		return $html . '</ul>';
	}

	private static function course_policy_html() {
		return '<p style="font-size:13px;color:#555;">'
			. esc_html__( 'Transfer requests must be made at least 7 days before the course, and only one transfer is allowed. Student kits are non-refundable once picked up or opened; unopened kits returned within 7 days may be considered for a partial refund. No refunds are provided for missed classes, lateness or personal scheduling conflicts.', 'nag-bridge' )
			. '</p>';
	}

	public static function course_enrollment_received( WC_Order $order ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), $order->get_billing_first_name() ?: __( 'there', 'nag-bridge' ) ) );
		$body .= self::p( sprintf( __( 'Thank you — we received your course enrollment #%s.', 'nag-bridge' ), $order->get_order_number() ) );
		$body .= self::course_summary_html( $order );
		$body .= self::etransfer_instructions_html( $order );
		$body .= self::course_policy_html();
		$body .= self::contact_line();
		return self::send( $order->get_billing_email(), sprintf( __( 'Course enrollment received — #%s', 'nag-bridge' ), $order->get_order_number() ), __( 'Enrollment received', 'nag-bridge' ), $body );
	}

	public static function course_deposit_received( WC_Order $order ) {
		$body  = self::p( sprintf( __( 'Hi %s,', 'nag-bridge' ), $order->get_billing_first_name() ?: __( 'there', 'nag-bridge' ) ) );
		$body .= self::p( sprintf( __( 'We received your course deposit for enrollment #%s. Your seat is reserved.', 'nag-bridge' ), $order->get_order_number() ) );
		$body .= self::course_summary_html( $order );
		$body .= self::p( __( 'The remaining balance is due before the course starts. We will contact you with payment details.', 'nag-bridge' ) );
		$body .= self::course_policy_html();
		$body .= self::contact_line();
		return self::send( $order->get_billing_email(), sprintf( __( 'Course deposit received — #%s', 'nag-bridge' ), $order->get_order_number() ), __( 'Deposit received', 'nag-bridge' ), $body );
	}
}
