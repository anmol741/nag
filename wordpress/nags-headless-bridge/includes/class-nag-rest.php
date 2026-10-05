<?php
/**
 * REST routes under /wp-json/nag-bridge/v1 (or ?rest_route=/nag-bridge/v1/...).
 * All routes: POST only, JSON body, HMAC-signed by the storefront server
 * (Nag_Bridge_Auth::verify). None are callable from a browser.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Rest {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register' ) );
	}

	private static function routes() {
		return array(
			'/health'                    => static function () {
				return array(
					'ok'      => true,
					'version' => NAG_BRIDGE_VERSION,
				);
			},
			'/auth/login'                => array( 'Nag_Accounts', 'login' ),
			'/auth/session'              => array( 'Nag_Accounts', 'verify_session' ),
			'/auth/logout'               => array( 'Nag_Accounts', 'logout' ),
			'/auth/register'             => array( 'Nag_Accounts', 'register' ),
			'/auth/verify-email'         => array( 'Nag_Accounts', 'verify_email' ),
			'/auth/resend-verification'  => array( 'Nag_Accounts', 'resend_verification' ),
			'/auth/password/forgot'      => array( 'Nag_Accounts', 'forgot_password' ),
			'/auth/password/reset'       => array( 'Nag_Accounts', 'reset_password' ),
			'/wishlist/get'              => array( 'Nag_Wishlist', 'get' ),
			'/wishlist/set'              => array( 'Nag_Wishlist', 'set' ),
			'/wishlist/merge'            => array( 'Nag_Wishlist', 'merge' ),
			'/checkout/quote'            => array( 'Nag_Checkout', 'quote' ),
			'/checkout/order'            => array( 'Nag_Checkout', 'order' ),
			'/courses/options'           => array( 'Nag_Courses', 'options' ),
			'/courses/order'             => array( 'Nag_Courses', 'order' ),
			'/maintenance/cancel-unpaid' => static function () {
				return array( 'cancelled' => Nag_Orders::cancel_unpaid_etransfer_orders() );
			},
		);
	}

	public static function register() {
		foreach ( self::routes() as $route => $handler ) {
			register_rest_route(
				NAG_BRIDGE_NAMESPACE,
				$route,
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( 'Nag_Bridge_Auth', 'verify' ),
					'callback'            => static function ( WP_REST_Request $request ) use ( $handler ) {
						$params = $request->get_json_params();
						$params = is_array( $params ) ? $params : array();
						try {
							$result = call_user_func( $handler, $params );
						} catch ( Throwable $e ) {
							// Log the class/line only — never request data (passwords, documents).
							error_log( '[nag-bridge] ' . get_class( $e ) . ' at ' . basename( $e->getFile() ) . ':' . $e->getLine() );
							$result = new WP_Error( 'bridge_error', 'Internal error.', array( 'status' => 500 ) );
						}
						if ( is_wp_error( $result ) ) {
							return $result;
						}
						$response = rest_ensure_response( $result );
						$response->header( 'Cache-Control', 'no-store' );
						return $response;
					},
				)
			);
		}
	}
}
