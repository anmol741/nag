<?php
/**
 * Verifies that a REST request really comes from the Next.js server.
 *
 * Every /nag-bridge/v1 route is POST-only and must carry an HMAC-SHA256
 * signature made with NAG_BRIDGE_SECRET (wp-config.php) over:
 *
 *   v1 \n <unix ts> \n <nonce> \n <METHOD> \n <route> \n <sha256(body)>
 *
 * (mirrors lib/security/bridge-signing.ts). Requests older than 5 minutes
 * or reusing a nonce are refused, so a captured request can't be replayed.
 * Browsers never talk to these routes directly.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Bridge_Auth {

	const MAX_SKEW_SECONDS = 300;
	const NONCE_TTL        = 900;

	/**
	 * REST permission callback.
	 *
	 * Error codes here deliberately do NOT start with "nag_": the storefront
	 * treats those as business outcomes (e.g. "wrong password"); a signature
	 * failure is a configuration problem and must surface as one.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public static function verify( WP_REST_Request $request ) {
		if ( ! defined( 'NAG_BRIDGE_SECRET' ) || strlen( (string) NAG_BRIDGE_SECRET ) < 32 ) {
			return new WP_Error( 'bridge_not_configured', 'Bridge is not configured.', array( 'status' => 503 ) );
		}

		if ( ! is_ssl() && ! ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			return new WP_Error( 'bridge_https_required', 'HTTPS is required.', array( 'status' => 403 ) );
		}

		$timestamp = (string) $request->get_header( 'x_nag_timestamp' );
		$nonce     = (string) $request->get_header( 'x_nag_nonce' );
		$signature = strtolower( (string) $request->get_header( 'x_nag_signature' ) );

		if ( ! ctype_digit( $timestamp ) || abs( time() - (int) $timestamp ) > self::MAX_SKEW_SECONDS ) {
			return self::unauthorized();
		}
		if ( ! preg_match( '/^[a-f0-9]{32}$/', $nonce ) || ! preg_match( '/^[a-f0-9]{64}$/', $signature ) ) {
			return self::unauthorized();
		}

		$prefix = '/' . NAG_BRIDGE_NAMESPACE;
		$route  = (string) $request->get_route();
		if ( 0 !== strpos( $route, $prefix ) ) {
			return self::unauthorized();
		}
		$route = substr( $route, strlen( $prefix ) );

		$canonical = implode(
			"\n",
			array(
				'v1',
				$timestamp,
				$nonce,
				strtoupper( $request->get_method() ),
				$route,
				hash( 'sha256', (string) $request->get_body() ),
			)
		);
		$expected  = hash_hmac( 'sha256', $canonical, (string) NAG_BRIDGE_SECRET );

		if ( ! hash_equals( $expected, $signature ) ) {
			return self::unauthorized();
		}

		// Replay protection: each nonce is accepted once.
		$nonce_key = 'nag_bn_' . $nonce;
		if ( false !== get_transient( $nonce_key ) ) {
			return self::unauthorized();
		}
		set_transient( $nonce_key, 1, self::NONCE_TTL );

		return true;
	}

	private static function unauthorized() {
		return new WP_Error( 'bridge_unauthorized', 'Unauthorized.', array( 'status' => 401 ) );
	}
}
