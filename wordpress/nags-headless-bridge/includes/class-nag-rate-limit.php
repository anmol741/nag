<?php
/**
 * Shared rate limits (WordPress transients), enforced for every storefront
 * server instance at once. Keys are hashed so no email/IP is stored in
 * plain text in the options table.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Rate_Limit {

	/**
	 * Records one attempt and returns whether it is within the limit.
	 *
	 * @param string $bucket  Action name, e.g. "login_email".
	 * @param string $subject Email, IP or user ID.
	 * @param int    $limit   Max attempts per window.
	 * @param int    $window  Window in seconds.
	 */
	public static function hit( $bucket, $subject, $limit, $window ) {
		if ( '' === (string) $subject ) {
			return true;
		}
		$key  = 'nag_rl_' . md5( $bucket . '|' . strtolower( (string) $subject ) );
		$data = get_transient( $key );
		$now  = time();
		if ( ! is_array( $data ) || empty( $data['reset'] ) || $data['reset'] <= $now ) {
			$data = array(
				'count' => 0,
				'reset' => $now + $window,
			);
		}
		++$data['count'];
		set_transient( $key, $data, max( 1, $data['reset'] - $now ) );
		return $data['count'] <= $limit;
	}

	public static function clear( $bucket, $subject ) {
		delete_transient( 'nag_rl_' . md5( $bucket . '|' . strtolower( (string) $subject ) ) );
	}

	public static function error() {
		return new WP_Error( 'nag_rate_limited', 'Too many attempts. Please wait a few minutes and try again.', array( 'status' => 429 ) );
	}
}
