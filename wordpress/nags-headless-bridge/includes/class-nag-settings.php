<?php
/**
 * WooCommerce → Settings → "Nag's Beauty" tab. Business values that must
 * stay configurable (deposit amount, legacy-customer policy, wholesale
 * role) live here — never hard-coded. Secrets never go here; they belong
 * in wp-config.php.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Settings {

	const TAB = 'nag_beauty';

	public static function init() {
		add_filter( 'woocommerce_settings_tabs_array', array( __CLASS__, 'add_tab' ), 50 );
		add_action( 'woocommerce_settings_tabs_' . self::TAB, array( __CLASS__, 'output' ) );
		add_action( 'woocommerce_update_options_' . self::TAB, array( __CLASS__, 'save' ) );
	}

	public static function add_tab( $tabs ) {
		$tabs[ self::TAB ] = __( "Nag's Beauty", 'nag-bridge' );
		return $tabs;
	}

	public static function fields() {
		return array(
			array(
				'title' => __( 'Storefront', 'nag-bridge' ),
				'type'  => 'title',
				'id'    => 'nag_storefront_section',
				'desc'  => __( 'Settings for the Next.js storefront connected through the Headless Bridge.', 'nag-bridge' ),
			),
			array(
				'title'       => __( 'Storefront URL', 'nag-bridge' ),
				'id'          => 'nag_frontend_url',
				'type'        => 'url',
				'desc'        => __( 'Used for links in verification and password-reset emails, e.g. https://taupe-buttercream-c55e75.netlify.app. The NAG_FRONTEND_URL constant overrides this.', 'nag-bridge' ),
				'placeholder' => 'https://',
				'default'     => '',
			),
			array(
				'title'   => __( 'Registration notification email', 'nag-bridge' ),
				'id'      => 'nag_admin_notify_email',
				'type'    => 'email',
				'desc'    => __( 'Receives new registration requests. Defaults to the site admin email.', 'nag-bridge' ),
				'default' => '',
			),
			array(
				'title'   => __( 'Existing customers can order online', 'nag-bridge' ),
				'id'      => 'nag_legacy_customers_can_checkout',
				'type'    => 'checkbox',
				'desc'    => __( 'Customers who registered before email verification/approval existed can check out without re-approval. Wholesale access still requires approval.', 'nag-bridge' ),
				'default' => 'yes',
			),
			array(
				'title'   => __( 'Wholesale role', 'nag-bridge' ),
				'id'      => 'nag_wholesale_role',
				'type'    => 'text',
				'desc'    => __( 'Optional role slug added to approved, verified customers (e.g. the role a wholesale-pricing plugin uses). Leave blank to only set the _nag_wholesale_access flag.', 'nag-bridge' ),
				'default' => '',
			),
			array(
				'title'   => __( 'Offer Langley local pickup', 'nag-bridge' ),
				'id'      => 'nag_provide_pickup_rate',
				'type'    => 'checkbox',
				'desc'    => __( 'Adds a free "Local pickup" option to storefront checkout when no WooCommerce local pickup method is configured for the customer\'s zone.', 'nag-bridge' ),
				'default' => 'yes',
			),
			array(
				'title'   => __( 'Local pickup label', 'nag-bridge' ),
				'id'      => 'nag_pickup_label',
				'type'    => 'text',
				'default' => __( 'Local pickup — Langley store', 'nag-bridge' ),
			),
			array(
				'type' => 'sectionend',
				'id'   => 'nag_storefront_section',
			),
			array(
				'title' => __( 'Course payments', 'nag-bridge' ),
				'type'  => 'title',
				'id'    => 'nag_course_section',
			),
			array(
				'title'             => __( 'Course deposit amount (CAD)', 'nag-bridge' ),
				'id'                => 'nag_course_deposit_amount',
				'type'              => 'text',
				'desc'              => __( 'Fixed deposit amount. Leave blank to offer full payment only.', 'nag-bridge' ),
				'default'           => '',
				'custom_attributes' => array( 'inputmode' => 'decimal' ),
			),
			array(
				'title'   => __( 'Charge tax on course fees', 'nag-bridge' ),
				'id'      => 'nag_course_fee_taxable',
				'type'    => 'checkbox',
				'desc'    => __( 'Apply WooCommerce tax rates to course payments. Confirm with your accountant before enabling.', 'nag-bridge' ),
				'default' => 'no',
			),
			array(
				'type' => 'sectionend',
				'id'   => 'nag_course_section',
			),
		);
	}

	public static function output() {
		WC_Admin_Settings::output_fields( self::fields() );
	}

	public static function save() {
		WC_Admin_Settings::save_fields( self::fields() );
	}

	/** Storefront base URL for email links, without trailing slash. */
	public static function frontend_url() {
		$url = defined( 'NAG_FRONTEND_URL' ) ? (string) NAG_FRONTEND_URL : (string) get_option( 'nag_frontend_url', '' );
		if ( '' === $url ) {
			$url = home_url();
		}
		return untrailingslashit( esc_url_raw( $url ) );
	}

	public static function admin_notify_email() {
		$email = (string) get_option( 'nag_admin_notify_email', '' );
		return is_email( $email ) ? $email : (string) get_option( 'admin_email' );
	}

	/** Configured deposit as a decimal string, or null when no deposit is offered. */
	public static function course_deposit_amount() {
		$raw = trim( (string) get_option( 'nag_course_deposit_amount', '' ) );
		if ( '' === $raw || ! is_numeric( $raw ) ) {
			return null;
		}
		$amount = (float) $raw;
		return $amount > 0 ? wc_format_decimal( $amount, 2 ) : null;
	}
}
