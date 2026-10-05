<?php
/**
 * Plugin Name:       Nag's Headless Bridge
 * Description:       Secure server-to-server bridge between the Nag's Beauty Next.js storefront and WooCommerce: customer login/registration with email verification and admin approval, private certification uploads, WooCommerce-calculated checkout, Interac e-Transfer, local pickup ready emails, automatic 3-day cancellation of unpaid e-Transfer orders, course payments and account wishlists.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Nag's Beauty Supplies & Training Centre
 * License:           Proprietary
 * WC requires at least: 7.0
 *
 * Configuration (wp-config.php, never the database):
 *   define( 'NAG_BRIDGE_SECRET', '<same 64+ char value as WORDPRESS_BRIDGE_SECRET on Netlify>' );
 *   define( 'NAG_FRONTEND_URL', 'https://taupe-buttercream-c55e75.netlify.app' ); // optional; also settable in WooCommerce → Settings → Nag's Beauty
 *   define( 'NAG_CERT_DIR', '/home/<account>/private/nag-certifications' );    // optional; recommended: outside the web root
 *
 * Nothing in this plugin deletes or rewrites existing customers, orders,
 * products, passwords, addresses or stock. It only adds metadata, a payment
 * method, an order status and REST routes under /nag-bridge/v1.
 */

defined( 'ABSPATH' ) || exit;

define( 'NAG_BRIDGE_VERSION', '1.0.0' );
define( 'NAG_BRIDGE_DIR', plugin_dir_path( __FILE__ ) );
define( 'NAG_BRIDGE_NAMESPACE', 'nag-bridge/v1' );

require_once NAG_BRIDGE_DIR . 'includes/class-nag-bridge-auth.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-rate-limit.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-settings.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-emails.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-certifications.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-accounts.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-admin-approvals.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-wishlist.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-checkout.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-orders.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-courses.php';
require_once NAG_BRIDGE_DIR . 'includes/class-nag-rest.php';

/** Declare HPOS (custom order tables) compatibility — all order access goes through WC CRUD/wc_get_orders. */
add_action(
	'before_woocommerce_init',
	static function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

add_action(
	'plugins_loaded',
	static function () {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action(
				'admin_notices',
				static function () {
					echo '<div class="notice notice-error"><p>' . esc_html__( "Nag's Headless Bridge requires WooCommerce to be active.", 'nag-bridge' ) . '</p></div>';
				}
			);
			return;
		}

		require_once NAG_BRIDGE_DIR . 'includes/class-nag-etransfer-gateway.php';

		Nag_Settings::init();
		Nag_Admin_Approvals::init();
		Nag_Certifications::init();
		Nag_Checkout::init();
		Nag_Orders::init();
		Nag_Rest::init();

		add_filter(
			'woocommerce_payment_gateways',
			static function ( $gateways ) {
				$gateways[] = 'WC_Gateway_Nag_ETransfer';
				return $gateways;
			}
		);

		if ( ! defined( 'NAG_BRIDGE_SECRET' ) && is_admin() ) {
			add_action(
				'admin_notices',
				static function () {
					if ( ! current_user_can( 'manage_options' ) ) {
						return;
					}
					echo '<div class="notice notice-warning"><p>' . esc_html__( "Nag's Headless Bridge: NAG_BRIDGE_SECRET is not defined in wp-config.php, so the storefront cannot connect yet.", 'nag-bridge' ) . '</p></div>';
				}
			);
		}
	}
);

register_activation_hook(
	__FILE__,
	static function () {
		if ( ! wp_next_scheduled( Nag_Orders::CRON_HOOK ) ) {
			wp_schedule_event( time() + 300, 'hourly', Nag_Orders::CRON_HOOK );
		}
		Nag_Certifications::ensure_directory();
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		wp_clear_scheduled_hook( Nag_Orders::CRON_HOOK );
	}
);
