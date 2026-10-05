<?php
/**
 * A WooCommerce session that exists only in memory: no cookie, no database
 * read or write. Lets WC_Cart run inside a bridge REST request without
 * touching the customer's real (website) cart session or saved cart.
 *
 * Loaded lazily by Nag_Checkout::boot() — WooCommerce must already be
 * loaded (this plugin's main file is included before WooCommerce's, since
 * WordPress loads plugins alphabetically).
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Memory_Session extends WC_Session_Handler {

	public function __construct( $customer_id = 0 ) {
		parent::__construct();
		$this->_customer_id = (string) $customer_id;
		// A non-null empty cart stops WC_Cart_Session from merging (or
		// clearing flags on) the customer's saved website cart.
		$this->_data = array( 'cart' => array() );
	}

	public function init() {}

	public function has_session() {
		return false;
	}

	public function set_customer_session_cookie( $set ) {}

	public function get_session_data() {
		return array();
	}

	public function save_data( $old_session_key = 0 ) {}

	public function destroy_session() {
		$this->_data = array();
	}

	public function forget_session() {
		$this->_data = array();
	}
}
