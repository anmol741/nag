<?php
/**
 * Interac e-Transfer — an offline WooCommerce payment method.
 *
 * Orders are created "on-hold" (unpaid). WooCommerce reduces stock on that
 * status change, sends its on-hold email (this gateway adds the e-Transfer
 * instructions to it) and the admin new-order email. Staff mark the order
 * Processing/Completed when the transfer arrives; unpaid orders are
 * cancelled automatically after three days (Nag_Orders).
 *
 * By default this method is offered only to the Next.js storefront, so the
 * WordPress site's own checkout is unchanged (see "Storefront only").
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class WC_Gateway_Nag_ETransfer extends WC_Payment_Gateway {

	const DEFAULT_EMAIL = 'info@nagsbeautysupply.com';

	public function __construct() {
		$this->id                 = 'nag_etransfer';
		$this->has_fields         = false;
		$this->method_title       = __( 'Interac e-Transfer', 'nag-bridge' );
		$this->method_description = __( 'Customers send an Interac e-Transfer. Orders stay on-hold (unpaid) until you mark them Processing; unpaid orders are cancelled automatically after 3 days.', 'nag-bridge' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_email_before_order_table', array( $this, 'email_instructions' ), 10, 3 );
	}

	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'         => array(
				'title'   => __( 'Enable/Disable', 'nag-bridge' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable Interac e-Transfer', 'nag-bridge' ),
				'default' => 'yes',
			),
			'title'           => array(
				'title'   => __( 'Title', 'nag-bridge' ),
				'type'    => 'text',
				'default' => __( 'Interac e-Transfer', 'nag-bridge' ),
			),
			'description'     => array(
				'title'   => __( 'Description', 'nag-bridge' ),
				'type'    => 'textarea',
				'default' => __( 'Pay by Interac e-Transfer. Your order is not paid until we receive your transfer.', 'nag-bridge' ),
			),
			'payment_email'   => array(
				'title'   => __( 'e-Transfer email', 'nag-bridge' ),
				'type'    => 'email',
				'default' => self::DEFAULT_EMAIL,
			),
			'storefront_only' => array(
				'title'   => __( 'Storefront only', 'nag-bridge' ),
				'type'    => 'checkbox',
				'label'   => __( 'Offer this method only on the Next.js storefront (not on the WordPress site checkout)', 'nag-bridge' ),
				'default' => 'yes',
			),
		);
	}

	public static function payment_email() {
		$settings = get_option( 'woocommerce_nag_etransfer_settings', array() );
		$email    = is_array( $settings ) && ! empty( $settings['payment_email'] ) ? (string) $settings['payment_email'] : self::DEFAULT_EMAIL;
		return is_email( $email ) ? $email : self::DEFAULT_EMAIL;
	}

	public function is_available() {
		if ( 'yes' === $this->get_option( 'storefront_only', 'yes' ) && ! Nag_Checkout::$in_bridge && ! Nag_Courses::$in_bridge ) {
			return false;
		}
		return parent::is_available();
	}

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return array( 'result' => 'failure' );
		}
		// on-hold = awaiting payment. WooCommerce reduces stock on this
		// transition (wc_maybe_reduce_stock_levels) and sends its emails.
		$order->update_status( 'on-hold', __( 'Awaiting Interac e-Transfer payment.', 'nag-bridge' ) );
		return array(
			'result'   => 'success',
			'redirect' => $this->get_return_url( $order ),
		);
	}

	/** Adds payment instructions to WooCommerce's customer on-hold email. */
	public function email_instructions( $order, $sent_to_admin, $plain_text = false ) {
		if ( $sent_to_admin || ! $order instanceof WC_Order || $this->id !== $order->get_payment_method() || ! $order->has_status( 'on-hold' ) ) {
			return;
		}
		$html = Nag_Emails::etransfer_instructions_html( $order );
		if ( $plain_text ) {
			echo esc_html( wp_strip_all_tags( str_replace( array( '</li>', '</h2>', '</p>' ), "\n", $html ) ) ) . "\n\n";
		} else {
			echo wp_kses_post( $html );
		}
	}
}
