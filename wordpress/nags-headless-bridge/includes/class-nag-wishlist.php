<?php
/**
 * Account wishlist stored as user meta (_nag_wishlist: list of product IDs).
 * The user ID always comes from the storefront's verified session.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Wishlist {

	const META_KEY  = '_nag_wishlist';
	const MAX_ITEMS = 200;

	private static function user_id( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		return ( $user_id && get_user_by( 'id', $user_id ) ) ? $user_id : 0;
	}

	private static function clean( $ids ) {
		if ( ! is_array( $ids ) ) {
			return array();
		}
		$clean = array();
		foreach ( $ids as $id ) {
			$id = absint( $id );
			if ( $id > 0 ) {
				$clean[ $id ] = $id; // keyed = de-duplicated, order preserved
			}
		}
		return array_slice( array_values( $clean ), 0, self::MAX_ITEMS );
	}

	private static function read( $user_id ) {
		return self::clean( get_user_meta( $user_id, self::META_KEY, true ) );
	}

	private static function respond( array $ids ) {
		return array( 'ids' => array_map( 'strval', $ids ) );
	}

	private static function unknown_user() {
		return new WP_Error( 'nag_unknown_user', 'Unknown account.', array( 'status' => 404 ) );
	}

	public static function get( array $p ) {
		$user_id = self::user_id( $p );
		return $user_id ? self::respond( self::read( $user_id ) ) : self::unknown_user();
	}

	public static function set( array $p ) {
		$user_id = self::user_id( $p );
		if ( ! $user_id ) {
			return self::unknown_user();
		}
		$ids = self::clean( $p['ids'] ?? array() );
		update_user_meta( $user_id, self::META_KEY, $ids );
		return self::respond( $ids );
	}

	/** Union of the account list and the guest list — nothing duplicated, nothing lost. */
	public static function merge( array $p ) {
		$user_id = self::user_id( $p );
		if ( ! $user_id ) {
			return self::unknown_user();
		}
		$ids = self::clean( array_merge( self::read( $user_id ), (array) ( $p['ids'] ?? array() ) ) );
		update_user_meta( $user_id, self::META_KEY, $ids );
		return self::respond( $ids );
	}
}
