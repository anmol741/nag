<?php
/**
 * Order lifecycle additions:
 *
 * 1. "Ready for pickup" — a custom order status plus an order action. The
 *    customer gets ONE pickup-ready email, only when staff mark the order
 *    ready (guarded by _nag_pickup_ready_emailed_at, so repeated status
 *    changes never re-send it).
 * 2. Automatic cancellation of unpaid e-Transfer orders older than three
 *    days (hourly WP-Cron + a signed REST trigger from the storefront's
 *    scheduled function). Cancellation uses WooCommerce's normal status
 *    change, which restores stock (wc_maybe_increase_stock_levels) and
 *    releases coupon usage.
 * 3. Payment confirmation email when an e-Transfer order moves from
 *    on-hold to a paid status; course deposits get their own email.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Orders {

	const STATUS         = 'nag-ready-pickup';
	const CRON_HOOK      = 'nag_bridge_cancel_unpaid_etransfer';
	const UNPAID_DAYS    = 3;
	const PICKUP_HOURS   = 'Monday–Friday, 10:00 AM–4:30 PM';
	const PICKUP_ADDRESS = '102-19623 56 Avenue, Langley, BC V3A 3X7';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_status' ) );
		add_filter( 'wc_order_statuses', array( __CLASS__, 'add_status' ) );
		add_filter( 'woocommerce_reports_order_statuses', array( __CLASS__, 'report_statuses' ) );
		add_filter( 'woocommerce_order_actions', array( __CLASS__, 'order_actions' ), 10, 2 );
		add_action( 'woocommerce_order_action_nag_mark_ready_pickup', array( __CLASS__, 'mark_ready' ) );
		add_action( 'woocommerce_order_status_' . self::STATUS, array( __CLASS__, 'on_ready_status' ), 10, 2 );
		// Stock for orders moved straight from pending → ready (normally already reduced at on-hold/processing).
		add_action( 'woocommerce_order_status_' . self::STATUS, 'wc_maybe_reduce_stock_levels' );
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'on_status_changed' ), 10, 4 );

		add_action( self::CRON_HOOK, array( __CLASS__, 'cancel_unpaid_etransfer_orders' ) );
		add_action(
			'init',
			static function () {
				if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
					wp_schedule_event( time() + 300, 'hourly', self::CRON_HOOK );
				}
			}
		);
	}

	/* ------------------------------------------------------------------ */
	/* Ready for pickup                                                   */
	/* ------------------------------------------------------------------ */

	public static function register_status() {
		register_post_status(
			'wc-' . self::STATUS,
			array(
				'label'                     => _x( 'Ready for pickup', 'Order status', 'nag-bridge' ),
				'public'                    => false,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				/* translators: %s: number of orders */
				'label_count'               => _n_noop( 'Ready for pickup <span class="count">(%s)</span>', 'Ready for pickup <span class="count">(%s)</span>', 'nag-bridge' ),
			)
		);
	}

	public static function add_status( $statuses ) {
		$result = array();
		foreach ( $statuses as $key => $label ) {
			$result[ $key ] = $label;
			if ( 'wc-processing' === $key ) {
				$result[ 'wc-' . self::STATUS ] = _x( 'Ready for pickup', 'Order status', 'nag-bridge' );
			}
		}
		if ( ! isset( $result[ 'wc-' . self::STATUS ] ) ) {
			$result[ 'wc-' . self::STATUS ] = _x( 'Ready for pickup', 'Order status', 'nag-bridge' );
		}
		return $result;
	}

	public static function report_statuses( $statuses ) {
		if ( is_array( $statuses ) ) {
			$statuses[] = self::STATUS;
		}
		return $statuses;
	}

	public static function is_local_pickup( WC_Order $order ) {
		if ( 'yes' === $order->get_meta( '_nag_local_pickup' ) ) {
			return true;
		}
		foreach ( $order->get_shipping_methods() as $method ) {
			if ( in_array( $method->get_method_id(), array( 'local_pickup', 'pickup_location', Nag_Checkout::PICKUP_RATE_ID ), true ) ) {
				return true;
			}
		}
		return false;
	}

	public static function order_actions( $actions, $order = null ) {
		if ( $order instanceof WC_Order && self::is_local_pickup( $order ) && ! $order->has_status( array( self::STATUS, 'cancelled', 'refunded', 'failed' ) ) ) {
			$actions['nag_mark_ready_pickup'] = __( 'Mark ready for local pickup (emails customer)', 'nag-bridge' );
		}
		return $actions;
	}

	public static function mark_ready( $order ) {
		if ( $order instanceof WC_Order ) {
			$order->update_status( self::STATUS, __( 'Marked ready for local pickup.', 'nag-bridge' ), true );
		}
	}

	public static function on_ready_status( $order_id, $order = null ) {
		$order = $order instanceof WC_Order ? $order : wc_get_order( $order_id );
		if ( ! $order || $order->get_meta( '_nag_pickup_ready_emailed_at' ) ) {
			return; // already emailed once — never send duplicates
		}
		// Record first, then send, so a concurrent second trigger can't double-send.
		$order->update_meta_data( '_nag_pickup_ready_emailed_at', time() );
		$order->save_meta_data();
		if ( Nag_Emails::pickup_ready( $order ) ) {
			$order->add_order_note( __( 'Pickup-ready email sent to customer.', 'nag-bridge' ) );
		} else {
			$order->add_order_note( __( 'Pickup-ready email could not be sent — please contact the customer.', 'nag-bridge' ) );
		}
	}

	/* ------------------------------------------------------------------ */
	/* Payment confirmation                                               */
	/* ------------------------------------------------------------------ */

	public static function on_status_changed( $order_id, $from, $to, $order = null ) {
		$order = $order instanceof WC_Order ? $order : wc_get_order( $order_id );
		if ( ! $order || 'nag_etransfer' !== $order->get_payment_method() ) {
			return;
		}
		if ( ! in_array( $from, array( 'on-hold', 'pending' ), true ) || ! in_array( $to, array( 'processing', 'completed', self::STATUS ), true ) ) {
			return;
		}
		if ( $order->get_meta( '_nag_payment_confirmed_at' ) ) {
			return;
		}
		$order->update_meta_data( '_nag_payment_confirmed_at', time() );
		if ( $order->get_meta( '_nag_course_slug' ) ) {
			$order->update_meta_data( '_nag_amount_paid', wc_format_decimal( (float) $order->get_total(), 2 ) );
		}
		$order->save_meta_data();

		if ( 'deposit' === $order->get_meta( '_nag_payment_type' ) ) {
			Nag_Emails::course_deposit_received( $order );
		} else {
			Nag_Emails::payment_confirmed( $order );
		}
	}

	/* ------------------------------------------------------------------ */
	/* Three-day cancellation                                             */
	/* ------------------------------------------------------------------ */

	/**
	 * Cancels unpaid e-Transfer orders older than UNPAID_DAYS. Safe to run
	 * repeatedly and concurrently (lock + per-order re-checks).
	 *
	 * @return int Number of orders cancelled.
	 */
	public static function cancel_unpaid_etransfer_orders() {
		if ( ! add_option( 'nag_cancel_unpaid_lock', time(), '', 'no' ) ) {
			if ( time() - (int) get_option( 'nag_cancel_unpaid_lock' ) < 600 ) {
				return 0;
			}
			update_option( 'nag_cancel_unpaid_lock', time(), false );
		}

		$cancelled = 0;
		try {
			$cutoff = time() - self::UNPAID_DAYS * DAY_IN_SECONDS;
			$orders = wc_get_orders(
				array(
					'status'         => array( 'on-hold', 'pending' ),
					'payment_method' => 'nag_etransfer',
					'date_created'   => '<' . $cutoff,
					'limit'          => 50,
					'orderby'        => 'date',
					'order'          => 'ASC',
				)
			);
			foreach ( $orders as $order ) {
				$order = wc_get_order( $order->get_id() ); // fresh copy
				if ( ! $order || 'nag_etransfer' !== $order->get_payment_method() ) {
					continue;
				}
				if ( ! $order->has_status( array( 'on-hold', 'pending' ) ) || $order->is_paid() || $order->get_date_paid() ) {
					continue;
				}
				$created = $order->get_date_created();
				if ( ! $created || $created->getTimestamp() > $cutoff ) {
					continue;
				}
				$order->update_meta_data( '_nag_auto_cancelled_at', time() );
				$order->update_status(
					'cancelled',
					sprintf( __( 'Automatically cancelled: Interac e-Transfer not received within %d days.', 'nag-bridge' ), self::UNPAID_DAYS )
				);
				Nag_Emails::order_auto_cancelled( $order );
				++$cancelled;
			}
		} finally {
			delete_option( 'nag_cancel_unpaid_lock' );
		}
		return $cancelled;
	}
}
