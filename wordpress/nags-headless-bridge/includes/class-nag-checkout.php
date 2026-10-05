<?php
/**
 * Storefront checkout — quotes and orders built by WooCommerce itself.
 *
 * The storefront sends only product/variation IDs, quantities, a coupon
 * code, a chosen shipping-rate ID and a Canadian address. Everything with
 * a money value is computed here by WooCommerce's own classes:
 *
 *   WC_Cart::add_to_cart()       current price, stock, purchasability, variations
 *   WC_Cart::apply_coupon()      coupon validity, usage limits, restrictions
 *   WC_Cart::calculate_totals()  shipping zones/rates, tax rates, totals
 *   WC_Checkout::create_order()  the real order (line items, shipping, taxes, coupons)
 *   gateway->process_payment()   on-hold status → WooCommerce reduces stock
 *
 * The cart lives only in memory for this request (Nag_Memory_Session): it
 * never reads or overwrites the customer's saved cart on the WordPress
 * site, and never sets cookies.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Checkout {

	/** True while a bridge checkout request is running (scopes this plugin's checkout-only filters). */
	public static $in_bridge = false;

	const PICKUP_RATE_ID = 'nag_local_pickup';

	public static function init() {
		add_filter( 'woocommerce_package_rates', array( __CLASS__, 'maybe_add_pickup_rate' ), 20, 2 );
		add_filter( 'woocommerce_local_pickup_methods', array( __CLASS__, 'register_pickup_method' ) );
	}

	/** WooCommerce applies the store's base tax rate to local pickup orders; include our pickup rate in that list. */
	public static function register_pickup_method( $methods ) {
		$methods[] = self::PICKUP_RATE_ID;
		return $methods;
	}

	/**
	 * Offers "Local pickup — Langley store" ($0) in storefront checkout when
	 * the store has no WooCommerce local pickup method for the zone. Scoped
	 * to bridge requests, so the WordPress site's own checkout is unchanged.
	 */
	public static function maybe_add_pickup_rate( $rates, $package ) {
		if ( ! self::$in_bridge || 'yes' !== get_option( 'nag_provide_pickup_rate', 'yes' ) ) {
			return $rates;
		}
		if ( 'CA' !== ( $package['destination']['country'] ?? '' ) ) {
			return $rates;
		}
		foreach ( $rates as $rate ) {
			if ( in_array( $rate->get_method_id(), array( 'local_pickup', 'pickup_location', self::PICKUP_RATE_ID ), true ) ) {
				return $rates;
			}
		}
		$label                          = (string) get_option( 'nag_pickup_label', __( 'Local pickup — Langley store', 'nag-bridge' ) );
		$rates[ self::PICKUP_RATE_ID ] = new WC_Shipping_Rate( self::PICKUP_RATE_ID, $label, 0, array(), self::PICKUP_RATE_ID );
		return $rates;
	}

	/* ------------------------------------------------------------------ */
	/* Cart building                                                      */
	/* ------------------------------------------------------------------ */

	private static function boot( $user_id ) {
		self::$in_bridge = true;
		wp_set_current_user( $user_id );
		add_filter( 'woocommerce_persistent_cart_enabled', '__return_false', 999 );
		add_filter( 'woocommerce_set_cookie_enabled', '__return_false', 999 );

		require_once NAG_BRIDGE_DIR . 'includes/class-nag-memory-session.php';
		WC()->frontend_includes();
		WC()->session  = new Nag_Memory_Session( $user_id );
		WC()->customer = new WC_Customer( $user_id, false );
		WC()->cart     = new WC_Cart();
		// Trigger WooCommerce's one-time "load cart from session" now, while
		// the in-memory cart is empty, so it can't reset lines added later.
		WC()->cart->get_cart();
		wc_clear_notices();
	}

	private static function set_destination( array $billing, array $shipping ) {
		$c = WC()->customer;
		$c->set_billing_country( 'CA' );
		$c->set_billing_state( (string) ( $billing['province'] ?? '' ) );
		$c->set_billing_postcode( (string) ( $billing['postalCode'] ?? '' ) );
		$c->set_billing_city( (string) ( $billing['city'] ?? '' ) );
		$c->set_shipping_country( 'CA' );
		$c->set_shipping_state( (string) ( $shipping['province'] ?? '' ) );
		$c->set_shipping_postcode( (string) ( $shipping['postalCode'] ?? '' ) );
		$c->set_shipping_city( (string) ( $shipping['city'] ?? '' ) );
		$c->set_calculated_shipping( true );
	}

	private static function notices_text() {
		$messages = array();
		foreach ( wc_get_notices( 'error' ) as $notice ) {
			$messages[] = wp_strip_all_tags( is_array( $notice ) ? (string) $notice['notice'] : (string) $notice );
		}
		wc_clear_notices();
		return trim( implode( ' ', $messages ) );
	}

	/** Same rule as the storefront's GlyMed filter: never sell GlyMed products until authorised. */
	public static function is_glymed( $product_id ) {
		$product_id = absint( $product_id );
		$haystack   = array( get_the_title( $product_id ) );
		foreach ( array( 'product_cat', 'product_tag', 'product_brand', 'pwb-brand', 'yith_product_brand' ) as $taxonomy ) {
			if ( ! taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			$terms = get_the_terms( $product_id, $taxonomy );
			if ( is_array( $terms ) ) {
				foreach ( $terms as $term ) {
					$haystack[] = $term->name;
					$haystack[] = $term->slug;
				}
			}
		}
		foreach ( $haystack as $value ) {
			if ( is_string( $value ) && false !== stripos( $value, 'glymed' ) ) {
				return true;
			}
		}
		return false;
	}

	private static function issue( $product_id, $variation_id, $code, $message, $available = null ) {
		$issue = array(
			'productId' => (string) $product_id,
			'code'      => $code,
			'message'   => $message,
		);
		if ( $variation_id ) {
			$issue['variationId'] = (string) $variation_id;
		}
		if ( null !== $available ) {
			$issue['availableQuantity'] = (int) $available;
		}
		return $issue;
	}

	/**
	 * Adds the requested lines to the in-memory cart, re-checking each one
	 * against live WooCommerce data. Returns a list of issues (empty = OK).
	 */
	private static function add_lines( array $lines ) {
		$issues = array();
		$lines  = array_slice( $lines, 0, 50 );

		foreach ( $lines as $line ) {
			$product_id   = absint( $line['productId'] ?? 0 );
			$variation_id = absint( $line['variationId'] ?? 0 );
			$quantity     = absint( $line['quantity'] ?? 0 );
			if ( ! $product_id || $quantity < 1 || $quantity > 999 ) {
				$issues[] = self::issue( $product_id, $variation_id, 'unavailable', __( 'An item in your cart is invalid.', 'nag-bridge' ) );
				continue;
			}

			$parent  = wc_get_product( $product_id );
			$product = $variation_id ? wc_get_product( $variation_id ) : $parent;
			$name    = $product ? $product->get_name() : __( 'An item', 'nag-bridge' );

			if ( ! $parent || ! $product || 'publish' !== $parent->get_status() || 'hidden' === $parent->get_catalog_visibility() || self::is_glymed( $product_id ) ) {
				$issues[] = self::issue( $product_id, $variation_id, 'unavailable', sprintf( __( '%s is no longer available.', 'nag-bridge' ), $name ) );
				continue;
			}

			$attributes = array();
			if ( $variation_id ) {
				if ( ! $product->is_type( 'variation' ) || (int) $product->get_parent_id() !== $product_id ) {
					$issues[] = self::issue( $product_id, $variation_id, 'invalid_variation', sprintf( __( 'The selected option for %s is no longer available.', 'nag-bridge' ), $parent->get_name() ) );
					continue;
				}
				$attributes = $product->get_variation_attributes();
				// "Any value" attributes can't be chosen by this storefront yet.
				if ( in_array( '', array_map( 'strval', $attributes ), true ) ) {
					$issues[] = self::issue( $product_id, $variation_id, 'invalid_variation', sprintf( __( 'Please choose options for %s in store or by phone.', 'nag-bridge' ), $parent->get_name() ) );
					continue;
				}
			} elseif ( $product->is_type( 'variable' ) ) {
				$issues[] = self::issue( $product_id, 0, 'invalid_variation', sprintf( __( 'Please choose an option for %s.', 'nag-bridge' ), $name ) );
				continue;
			}

			if ( ! $product->is_purchasable() || '' === (string) $product->get_price() || (float) $product->get_price() <= 0 ) {
				$issues[] = self::issue( $product_id, $variation_id, 'not_purchasable', sprintf( __( '%s cannot be ordered online. Please contact us.', 'nag-bridge' ), $name ) );
				continue;
			}
			if ( ! $product->is_in_stock() ) {
				$issues[] = self::issue( $product_id, $variation_id, 'out_of_stock', sprintf( __( '%s is out of stock.', 'nag-bridge' ), $name ), 0 );
				continue;
			}

			$accept = $quantity;
			if ( $product->managing_stock() && ! $product->backorders_allowed() ) {
				$available = (int) $product->get_stock_quantity();
				if ( function_exists( 'wc_get_held_stock_quantity' ) ) {
					$available -= (int) wc_get_held_stock_quantity( $product );
				}
				$available = max( 0, $available );
				if ( $available < $quantity ) {
					$issues[] = self::issue(
						$product_id,
						$variation_id,
						$available > 0 ? 'insufficient_stock' : 'out_of_stock',
						$available > 0
							? sprintf( __( 'Only %1$d of %2$s available.', 'nag-bridge' ), $available, $name )
							: sprintf( __( '%s is out of stock.', 'nag-bridge' ), $name ),
						$available
					);
					$accept = $available;
				}
			}
			if ( $product->is_sold_individually() && $accept > 1 ) {
				$issues[] = self::issue( $product_id, $variation_id, 'insufficient_stock', sprintf( __( 'Only 1 %s can be ordered at a time.', 'nag-bridge' ), $name ), 1 );
				$accept   = 1;
			}
			$max = (int) $product->get_max_purchase_quantity();
			if ( $max > 0 && $accept > $max ) {
				$issues[] = self::issue( $product_id, $variation_id, 'insufficient_stock', sprintf( __( 'Only %1$d of %2$s can be ordered.', 'nag-bridge' ), $max, $name ), $max );
				$accept   = $max;
			}

			if ( $accept < 1 ) {
				continue;
			}
			$key = WC()->cart->add_to_cart( $product_id, $accept, $variation_id, $attributes );
			if ( ! $key ) {
				$message  = self::notices_text();
				$issues[] = self::issue( $product_id, $variation_id, 'unavailable', '' !== $message ? $message : sprintf( __( '%s could not be added to your order.', 'nag-bridge' ), $name ) );
			}
		}
		return $issues;
	}

	/**
	 * Builds the cart, applies the coupon and chosen shipping rate, and
	 * computes totals. Returns the quote array (see lib/checkout/types.ts).
	 */
	private static function build( array $p, array $billing, array $shipping ) {
		$coupon_code = wc_format_coupon_code( (string) ( $p['coupon'] ?? '' ) );
		$wanted_rate = (string) ( $p['shippingMethod'] ?? '' );

		self::set_destination( $billing, $shipping );
		$issues = self::add_lines( (array) ( $p['lines'] ?? array() ) );

		$coupon = null;
		if ( '' !== $coupon_code && ! WC()->cart->is_empty() ) {
			$applied = WC()->cart->apply_coupon( $coupon_code );
			$message = self::notices_text();
			$coupon  = array(
				'code'    => $coupon_code,
				'applied' => (bool) $applied && WC()->cart->has_discount( $coupon_code ),
			);
			if ( ! $coupon['applied'] ) {
				$coupon['message'] = '' !== $message ? $message : __( 'This coupon can\'t be applied to your order.', 'nag-bridge' );
			}
		}

		$has_destination = '' !== (string) ( $shipping['postalCode'] ?? '' );
		if ( '' !== $wanted_rate ) {
			WC()->session->set( 'chosen_shipping_methods', array( $wanted_rate ) );
		}
		WC()->cart->calculate_totals();

		$rates = array();
		if ( $has_destination && WC()->cart->needs_shipping() ) {
			$packages = WC()->shipping()->get_packages();
			foreach ( (array) ( $packages[0]['rates'] ?? array() ) as $rate_id => $rate ) {
				$rates[] = array(
					'id'            => (string) $rate_id,
					'label'         => wp_strip_all_tags( $rate->get_label() ),
					'cost'          => wc_format_decimal( (float) $rate->get_cost(), 2 ),
					'isLocalPickup' => in_array( $rate->get_method_id(), array( 'local_pickup', 'pickup_location', self::PICKUP_RATE_ID ), true ),
				);
			}
		}
		// The rate WooCommerce actually used for these totals — the customer's
		// choice when valid, otherwise WooCommerce's default (which the
		// storefront then shows as pre-selected, so what's displayed always
		// matches the total).
		$rate_ids = wp_list_pluck( $rates, 'id' );
		$chosen   = WC()->session->get( 'chosen_shipping_methods' );
		$selected = is_array( $chosen ) && isset( $chosen[0] ) && in_array( (string) $chosen[0], $rate_ids, true ) ? (string) $chosen[0] : null;

		$lines = array();
		foreach ( WC()->cart->get_cart() as $item ) {
			$product   = $item['data'];
			$qty       = (int) $item['quantity'];
			$requested = $qty;
			foreach ( (array) ( $p['lines'] ?? array() ) as $req ) {
				if ( absint( $req['productId'] ?? 0 ) === (int) $item['product_id'] && absint( $req['variationId'] ?? 0 ) === (int) $item['variation_id'] ) {
					$requested = absint( $req['quantity'] ?? $qty );
				}
			}
			$options = array();
			if ( $item['variation_id'] && $product instanceof WC_Product_Variation ) {
				foreach ( $product->get_variation_attributes( false ) as $attr_name => $attr_value ) {
					$options[] = wc_attribute_label( $attr_name, $product ) . ': ' . $product->get_attribute( $attr_name );
				}
			}
			$line = array(
				'productId'         => (string) $item['product_id'],
				'name'              => wp_strip_all_tags( $product->get_name() ),
				'quantity'          => $qty,
				'requestedQuantity' => $requested,
				'unitPrice'         => wc_format_decimal( $qty > 0 ? (float) $item['line_subtotal'] / $qty : 0, 2 ),
				'lineSubtotal'      => wc_format_decimal( (float) $item['line_subtotal'], 2 ),
				'lineTotal'         => wc_format_decimal( (float) $item['line_total'], 2 ),
				'options'           => array_map( 'wp_strip_all_tags', $options ),
			);
			if ( $item['variation_id'] ) {
				$line['variationId'] = (string) $item['variation_id'];
			}
			$lines[] = $line;
		}

		$tax_lines = array();
		foreach ( WC()->cart->get_tax_totals() as $tax ) {
			$tax_lines[] = array(
				'label'  => wp_strip_all_tags( $tax->label ),
				'amount' => wc_format_decimal( (float) $tax->amount, 2 ),
			);
		}

		$cart = WC()->cart;
		return array(
			'currency'             => get_woocommerce_currency(),
			'lines'                => $lines,
			'issues'               => $issues,
			'coupon'               => $coupon,
			'shippingRates'        => $rates,
			'selectedShippingRate' => $selected,
			'needsShipping'        => $cart->needs_shipping(),
			'totals'               => array(
				'subtotal' => wc_format_decimal( (float) $cart->get_subtotal(), 2 ),
				'discount' => wc_format_decimal( (float) $cart->get_discount_total(), 2 ),
				'shipping' => wc_format_decimal( (float) $cart->get_shipping_total(), 2 ),
				'tax'      => wc_format_decimal( (float) $cart->get_total_tax(), 2 ),
				'total'    => wc_format_decimal( (float) $cart->get_total( 'edit' ), 2 ),
				'taxLines' => $tax_lines,
			),
		);
	}

	private static function end() {
		if ( WC()->cart ) {
			WC()->cart->empty_cart( false );
		}
		wc_clear_notices();
		self::$in_bridge = false;
	}

	private static function valid_customer( $user_id ) {
		$user = $user_id ? get_user_by( 'id', $user_id ) : false;
		if ( ! $user || Nag_Accounts::is_staff( $user ) ) {
			return new WP_Error( 'nag_unknown_user', __( 'Please log in again.', 'nag-bridge' ), array( 'status' => 403 ) );
		}
		return $user;
	}

	private static function canadian( $address ) {
		$address = is_array( $address ) ? $address : array();
		$country = strtoupper( (string) ( $address['country'] ?? 'CA' ) );
		return 'CA' === $country ? $address : null;
	}

	/* ------------------------------------------------------------------ */
	/* REST handlers                                                      */
	/* ------------------------------------------------------------------ */

	public static function quote( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		$user    = self::valid_customer( $user_id );
		if ( is_wp_error( $user ) ) {
			return $user;
		}
		$destination = is_array( $p['destination'] ?? null ) ? self::canadian( $p['destination'] ) : array();
		if ( null === $destination ) {
			return new WP_Error( 'nag_canada_only', __( 'We currently ship within Canada only.', 'nag-bridge' ), array( 'status' => 400 ) );
		}

		self::boot( $user_id );
		try {
			return self::build( $p, $destination, $destination );
		} finally {
			self::end();
		}
	}

	/** Finds an order this customer already placed with this idempotency key. */
	private static function find_by_key( $user_id, $key ) {
		$ids = wc_get_orders(
			array(
				'customer_id' => $user_id,
				'limit'       => 1,
				'return'      => 'ids',
				'status'      => array_keys( wc_get_order_statuses() ),
				'meta_query'  => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array(
						'key'   => '_nag_idempotency_key',
						'value' => $key,
					),
				),
			)
		);
		return $ids ? wc_get_order( $ids[0] ) : null;
	}

	private static function placed( WC_Order $order, $duplicate ) {
		return array(
			'orderId'     => $order->get_id(),
			'orderNumber' => (string) $order->get_order_number(),
			'total'       => wc_format_decimal( (float) $order->get_total(), 2 ),
			'status'      => $order->get_status(),
			'duplicate'   => (bool) $duplicate,
		);
	}

	public static function order( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		$user    = self::valid_customer( $user_id );
		if ( is_wp_error( $user ) ) {
			return $user;
		}
		$key = strtolower( (string) ( $p['idempotencyKey'] ?? '' ) );
		if ( ! preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $key ) ) {
			return new WP_Error( 'nag_invalid_request', __( 'Invalid request.', 'nag-bridge' ), array( 'status' => 400 ) );
		}

		$status = Nag_Accounts::status( $user_id );
		if ( ! $status['canCheckout'] ) {
			return new WP_Error( 'nag_account_not_ready', __( "Your account isn't approved for online ordering yet.", 'nag-bridge' ), array( 'status' => 403 ) );
		}

		$billing  = self::canadian( $p['billing'] ?? array() );
		$shipping = self::canadian( $p['shipping'] ?? array() );
		if ( null === $billing || null === $shipping ) {
			return new WP_Error( 'nag_canada_only', __( 'We currently ship within Canada only.', 'nag-bridge' ), array( 'status' => 400 ) );
		}
		if ( 'nag_etransfer' !== ( $p['paymentMethod'] ?? '' ) ) {
			return new WP_Error( 'nag_payment_invalid', __( 'Please choose a payment method.', 'nag-bridge' ), array( 'status' => 400 ) );
		}

		// Duplicate protection, part 1: an order already exists for this key.
		$existing = self::find_by_key( $user_id, $key );
		if ( $existing ) {
			return self::placed( $existing, true );
		}

		// Part 2: an atomic lock (add_option fails if the row exists) so two
		// simultaneous requests with the same key can't both create orders.
		$lock = 'nag_order_lock_' . md5( $user_id . '|' . $key );
		if ( ! add_option( $lock, time(), '', 'no' ) ) {
			if ( time() - (int) get_option( $lock ) < 120 ) {
				return new WP_Error( 'nag_order_in_progress', __( 'Your order is already being placed. Please wait a moment.', 'nag-bridge' ), array( 'status' => 409 ) );
			}
			update_option( $lock, time(), false );
		}

		self::boot( $user_id );
		try {
			$existing = self::find_by_key( $user_id, $key );
			if ( $existing ) {
				return self::placed( $existing, true );
			}

			$quote = self::build( $p, $billing, $shipping );

			if ( ! empty( $quote['issues'] ) || WC()->cart->is_empty() ) {
				return new WP_Error(
					'nag_stock',
					__( 'Some items in your cart changed (price, stock or availability). Please review your order.', 'nag-bridge' ),
					array(
						'status'  => 409,
						'details' => array( 'issues' => $quote['issues'] ),
					)
				);
			}
			if ( '' !== (string) ( $p['coupon'] ?? '' ) && ( ! $quote['coupon'] || ! $quote['coupon']['applied'] ) ) {
				return new WP_Error( 'nag_coupon_invalid', $quote['coupon']['message'] ?? __( 'This coupon can\'t be applied.', 'nag-bridge' ), array( 'status' => 409 ) );
			}
			if ( WC()->cart->needs_shipping() && ( null === $quote['selectedShippingRate'] || $quote['selectedShippingRate'] !== (string) ( $p['shippingMethod'] ?? '' ) ) ) {
				return new WP_Error( 'nag_shipping_invalid', __( 'Please choose a delivery option.', 'nag-bridge' ), array( 'status' => 409 ) );
			}
			$expected = wc_format_decimal( (string) ( $p['expectedTotal'] ?? '' ), 2 );
			if ( $expected !== $quote['totals']['total'] ) {
				return new WP_Error(
					'nag_total_changed',
					__( 'Your order total has changed. Please review the updated total and place your order again.', 'nag-bridge' ),
					array(
						'status'  => 409,
						'details' => array( 'total' => $quote['totals']['total'] ),
					)
				);
			}

			$gateways = WC()->payment_gateways()->payment_gateways();
			$gateway  = $gateways['nag_etransfer'] ?? null;
			if ( ! $gateway || 'yes' !== $gateway->enabled ) {
				return new WP_Error( 'nag_payment_unavailable', __( 'e-Transfer payments are not available right now. Please contact us.', 'nag-bridge' ), array( 'status' => 503 ) );
			}

			$pickup = in_array( $quote['selectedShippingRate'], wp_list_pluck( array_filter( $quote['shippingRates'], static function ( $r ) {
				return $r['isLocalPickup'];
			} ), 'id' ), true );
			$ship   = ( ! empty( $p['shipToDifferentAddress'] ) && ! $pickup ) ? $shipping : $billing;

			$data = array(
				'billing_first_name'        => sanitize_text_field( (string) ( $billing['firstName'] ?? '' ) ),
				'billing_last_name'         => sanitize_text_field( (string) ( $billing['lastName'] ?? '' ) ),
				'billing_company'           => sanitize_text_field( (string) ( $billing['company'] ?? '' ) ),
				'billing_address_1'         => sanitize_text_field( (string) ( $billing['addressLine1'] ?? '' ) ),
				'billing_address_2'         => sanitize_text_field( (string) ( $billing['addressLine2'] ?? '' ) ),
				'billing_city'              => sanitize_text_field( (string) ( $billing['city'] ?? '' ) ),
				'billing_state'             => sanitize_text_field( (string) ( $billing['province'] ?? '' ) ),
				'billing_postcode'          => sanitize_text_field( (string) ( $billing['postalCode'] ?? '' ) ),
				'billing_country'           => 'CA',
				'billing_phone'             => sanitize_text_field( (string) ( $billing['phone'] ?? '' ) ),
				'billing_email'             => $user->user_email,
				'shipping_first_name'       => sanitize_text_field( (string) ( $ship['firstName'] ?? '' ) ),
				'shipping_last_name'        => sanitize_text_field( (string) ( $ship['lastName'] ?? '' ) ),
				'shipping_company'          => sanitize_text_field( (string) ( $ship['company'] ?? '' ) ),
				'shipping_address_1'        => sanitize_text_field( (string) ( $ship['addressLine1'] ?? '' ) ),
				'shipping_address_2'        => sanitize_text_field( (string) ( $ship['addressLine2'] ?? '' ) ),
				'shipping_city'             => sanitize_text_field( (string) ( $ship['city'] ?? '' ) ),
				'shipping_state'            => sanitize_text_field( (string) ( $ship['province'] ?? '' ) ),
				'shipping_postcode'         => sanitize_text_field( (string) ( $ship['postalCode'] ?? '' ) ),
				'shipping_country'          => 'CA',
				'order_comments'            => sanitize_textarea_field( (string) ( $p['customerNote'] ?? '' ) ),
				'payment_method'            => 'nag_etransfer',
				'shipping_method'           => null !== $quote['selectedShippingRate'] ? array( $quote['selectedShippingRate'] ) : array(),
				'ship_to_different_address' => $ship !== $billing,
			);

			$order_id = WC()->checkout()->create_order( $data );
			if ( is_wp_error( $order_id ) || ! $order_id ) {
				error_log( '[nag-bridge] create_order failed: ' . ( is_wp_error( $order_id ) ? $order_id->get_error_code() : 'unknown' ) );
				return new WP_Error( 'nag_order_failed', __( "We couldn't create your order. Please try again or contact us.", 'nag-bridge' ), array( 'status' => 500 ) );
			}

			$order = wc_get_order( $order_id );
			$order->set_created_via( 'nag-storefront' );
			$order->update_meta_data( '_nag_idempotency_key', $key );
			$order->update_meta_data( '_nag_order_source', 'storefront' );
			$order->update_meta_data( '_nag_terms_accepted_at', sanitize_text_field( (string) ( $p['termsAcceptedAt'] ?? '' ) ) );
			if ( $pickup ) {
				$order->update_meta_data( '_nag_local_pickup', 'yes' );
			}
			$order->save();

			do_action( 'woocommerce_checkout_order_processed', $order_id, $data, $order );

			// Sets "on-hold"; WooCommerce reduces stock and sends the
			// customer on-hold (with e-Transfer instructions) and admin
			// new-order emails as part of that status change.
			$gateway->process_payment( $order_id );

			return self::placed( wc_get_order( $order_id ), false );
		} finally {
			self::end();
			delete_option( $lock );
		}
	}
}
