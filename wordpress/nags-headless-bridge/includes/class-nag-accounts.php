<?php
/**
 * Customer accounts for the storefront, on top of the existing WordPress
 * user table — no separate customer database.
 *
 * Status model (user meta, all underscore-prefixed/protected):
 *   _nag_registration_source  "headless" for accounts created by the storefront.
 *                             Absent = existing ("legacy") customer — never
 *                             forced through re-verification.
 *   _nag_email_verified       "yes" | "no"
 *   _nag_approval_status      "pending" | "approved" | "rejected"
 *                             (absent on legacy accounts until staff decide)
 *   _nag_wholesale_access     "yes" | "no" — only "yes" when verified AND approved
 *
 * Sessions are real WordPress session tokens (WP_Session_Tokens), so
 * logout, password changes and rejection invalidate them everywhere.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Accounts {

	const VERIFY_TTL       = 172800; // 48 hours
	const MIN_SESSION_TTL  = 3600;
	const MAX_SESSION_TTL  = 2592000; // 30 days
	const GENERIC_LOGIN    = 'We couldn\'t log you in with that email and password.';

	/* ------------------------------------------------------------------ */
	/* Status                                                             */
	/* ------------------------------------------------------------------ */

	public static function is_storefront_account( $user_id ) {
		return '' !== (string) get_user_meta( $user_id, '_nag_registration_source', true );
	}

	/** Staff accounts never get a storefront session (they have wp-admin, with its own 2FA). */
	public static function is_staff( WP_User $user ) {
		return user_can( $user, 'edit_posts' ) || user_can( $user, 'manage_woocommerce' ) || user_can( $user, 'list_users' );
	}

	public static function status( $user_id ) {
		$legacy   = ! self::is_storefront_account( $user_id );
		$approval = (string) get_user_meta( $user_id, '_nag_approval_status', true );
		if ( ! in_array( $approval, array( 'pending', 'approved', 'rejected' ), true ) ) {
			$approval = $legacy ? 'legacy' : 'pending';
		}
		$verified  = $legacy ? true : 'yes' === get_user_meta( $user_id, '_nag_email_verified', true );
		$wholesale = 'yes' === get_user_meta( $user_id, '_nag_wholesale_access', true ) && $verified && 'approved' === $approval;

		if ( 'rejected' === $approval ) {
			$can_checkout = false;
		} elseif ( 'approved' === $approval ) {
			$can_checkout = $verified;
		} elseif ( 'legacy' === $approval ) {
			$can_checkout = 'yes' === get_option( 'nag_legacy_customers_can_checkout', 'yes' );
		} else {
			$can_checkout = false;
		}

		return array(
			'emailVerified' => (bool) $verified,
			'approval'      => $approval,
			'wholesale'     => (bool) $wholesale,
			'canCheckout'   => (bool) $can_checkout,
		);
	}

	/** Recomputes the wholesale flag (and optional role) from verification + approval. */
	public static function sync_wholesale( $user_id ) {
		$legacy   = ! self::is_storefront_account( $user_id );
		$verified = $legacy || 'yes' === get_user_meta( $user_id, '_nag_email_verified', true );
		$approved = 'approved' === get_user_meta( $user_id, '_nag_approval_status', true );
		$grant    = $verified && $approved;

		update_user_meta( $user_id, '_nag_wholesale_access', $grant ? 'yes' : 'no' );

		$role = sanitize_key( (string) get_option( 'nag_wholesale_role', '' ) );
		$user = get_user_by( 'id', $user_id );
		if ( $role && $user && wp_roles()->is_role( $role ) && ! in_array( $role, array( 'administrator', 'shop_manager', 'editor' ), true ) ) {
			if ( $grant && ! in_array( $role, (array) $user->roles, true ) ) {
				$user->add_role( $role );
			} elseif ( ! $grant && in_array( $role, (array) $user->roles, true ) ) {
				$user->remove_role( $role );
			}
		}
		return $grant;
	}

	/* ------------------------------------------------------------------ */
	/* Login / sessions                                                   */
	/* ------------------------------------------------------------------ */

	public static function login( array $p ) {
		$email    = sanitize_email( (string) ( $p['email'] ?? '' ) );
		$password = (string) ( $p['password'] ?? '' );
		$ip       = (string) ( $p['ip'] ?? '' );
		$ttl      = min( self::MAX_SESSION_TTL, max( self::MIN_SESSION_TTL, absint( $p['ttl'] ?? 259200 ) ) );

		if ( ! Nag_Rate_Limit::hit( 'login_email', $email, 5, 900 ) || ! Nag_Rate_Limit::hit( 'login_ip', $ip, 20, 900 ) ) {
			return Nag_Rate_Limit::error();
		}

		$user = is_email( $email ) ? get_user_by( 'email', $email ) : false;

		// Password checked with WordPress's own hasher. wp_authenticate() is
		// deliberately not used: every request arrives from the storefront
		// server's IP, so a lockout plugin keyed on IP would lock out every
		// customer at once. Rate limits above are keyed on the real client
		// IP and the email instead.
		if ( ! $user ) {
			// Equalise timing with a well-formed (34-char) phpass hash that matches nothing.
			wp_check_password( $password, '$P$BnagDummySaltAndHashForTiming12' );
			return self::invalid_login();
		}
		if ( ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
			return self::invalid_login();
		}
		if ( self::is_staff( $user ) ) {
			return self::invalid_login();
		}

		$status = self::status( $user->ID );
		if ( 'rejected' === $status['approval'] ) {
			return new WP_Error( 'nag_account_rejected', 'Account not approved.', array( 'status' => 403 ) );
		}

		Nag_Rate_Limit::clear( 'login_email', $email );
		$token = WP_Session_Tokens::get_instance( $user->ID )->create( time() + $ttl );
		update_user_meta( $user->ID, '_nag_last_storefront_login', time() );

		return array(
			'userId' => $user->ID,
			'email'  => $user->user_email,
			'token'  => $token,
			'status' => $status,
		);
	}

	private static function invalid_login() {
		return new WP_Error( 'nag_invalid_credentials', self::GENERIC_LOGIN, array( 'status' => 401 ) );
	}

	public static function verify_session( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		$token   = (string) ( $p['token'] ?? '' );
		$user    = $user_id ? get_user_by( 'id', $user_id ) : false;
		if ( ! $user || '' === $token || self::is_staff( $user ) ) {
			return array( 'valid' => false );
		}
		if ( ! WP_Session_Tokens::get_instance( $user_id )->verify( $token ) ) {
			return array( 'valid' => false );
		}
		$status = self::status( $user_id );
		if ( 'rejected' === $status['approval'] ) {
			return array( 'valid' => false );
		}
		return array(
			'valid'  => true,
			'status' => $status,
		);
	}

	public static function logout( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		$token   = (string) ( $p['token'] ?? '' );
		if ( $user_id && '' !== $token ) {
			WP_Session_Tokens::get_instance( $user_id )->destroy( $token );
		}
		return array( 'ok' => true );
	}

	/* ------------------------------------------------------------------ */
	/* Registration                                                       */
	/* ------------------------------------------------------------------ */

	public static function register( array $p ) {
		$ip = (string) ( $p['ip'] ?? '' );
		if ( ! Nag_Rate_Limit::hit( 'register_ip', $ip, 5, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}

		$first    = sanitize_text_field( (string) ( $p['firstName'] ?? '' ) );
		$last     = sanitize_text_field( (string) ( $p['lastName'] ?? '' ) );
		$email    = sanitize_email( (string) ( $p['email'] ?? '' ) );
		$phone    = sanitize_text_field( (string) ( $p['phone'] ?? '' ) );
		$salon    = sanitize_text_field( (string) ( $p['salonName'] ?? '' ) );
		$password = (string) ( $p['password'] ?? '' );
		$terms_at = sanitize_text_field( (string) ( $p['agreedToTermsAt'] ?? '' ) );
		$cert     = is_array( $p['certification'] ?? null ) ? $p['certification'] : array();

		$errors = array();
		if ( '' === $first || strlen( $first ) > 120 ) {
			$errors['firstName'] = __( 'First name is required.', 'nag-bridge' );
		}
		if ( '' === $last || strlen( $last ) > 120 ) {
			$errors['lastName'] = __( 'Last name is required.', 'nag-bridge' );
		}
		if ( ! is_email( $email ) ) {
			$errors['email'] = __( 'Enter a valid email address.', 'nag-bridge' );
		}
		if ( ! preg_match( '/^\(\d{3}\) \d{3}-\d{4}$/', $phone ) ) {
			$errors['phone'] = __( 'Enter a valid Canadian phone number.', 'nag-bridge' );
		}
		if ( '' === $salon ) {
			$errors['salonName'] = __( 'Salon/spa name is required.', 'nag-bridge' );
		}
		if ( strlen( $password ) < 8 || strlen( $password ) > 200 || ! preg_match( '/[A-Za-z]/', $password ) || ! preg_match( '/\d/', $password ) ) {
			$errors['password'] = __( 'Password must be 8–200 characters and include a letter and a number.', 'nag-bridge' );
		}
		if ( '' === $terms_at ) {
			$errors['agreedToTerms'] = __( 'You must agree to the Privacy Policy and Terms and Conditions.', 'nag-bridge' );
		}
		if ( empty( $cert['base64'] ) ) {
			$errors['certification'] = __( 'Please upload your certification document or photo.', 'nag-bridge' );
		}
		if ( $errors ) {
			return new WP_Error(
				'nag_invalid_registration',
				__( 'Please correct the highlighted fields.', 'nag-bridge' ),
				array(
					'status'  => 400,
					'details' => array( 'fieldErrors' => $errors ),
				)
			);
		}

		if ( email_exists( $email ) ) {
			return new WP_Error( 'nag_email_exists', __( 'An account with this email already exists.', 'nag-bridge' ), array( 'status' => 409 ) );
		}

		$username = function_exists( 'wc_create_new_customer_username' )
			? wc_create_new_customer_username( $email, array( 'first_name' => $first, 'last_name' => $last ) )
			: sanitize_user( current( explode( '@', $email ) ) . '_' . wp_rand( 1000, 9999 ), true );

		$user_id = wp_insert_user(
			array(
				'user_login'   => $username,
				'user_email'   => $email,
				'user_pass'    => $password,
				'first_name'   => $first,
				'last_name'    => $last,
				'display_name' => trim( $first . ' ' . $last ),
				'role'         => 'customer',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			if ( in_array( $user_id->get_error_code(), array( 'existing_user_email', 'existing_user_login' ), true ) ) {
				return new WP_Error( 'nag_email_exists', __( 'An account with this email already exists.', 'nag-bridge' ), array( 'status' => 409 ) );
			}
			error_log( '[nag-bridge] wp_insert_user failed: ' . $user_id->get_error_code() );
			return new WP_Error( 'nag_registration_failed', __( "We couldn't create your account. Please try again.", 'nag-bridge' ), array( 'status' => 500 ) );
		}

		$stored = Nag_Certifications::store( $user_id, $cert['base64'], (string) ( $cert['extension'] ?? '' ), (string) ( $cert['fileName'] ?? '' ) );
		if ( is_wp_error( $stored ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
			wp_delete_user( $user_id );
			return $stored;
		}

		$meta = array(
			'billing_first_name'        => $first,
			'billing_last_name'         => $last,
			'billing_email'             => $email,
			'billing_phone'             => $phone,
			'billing_company'           => $salon,
			'billing_country'           => 'CA',
			'shipping_country'          => 'CA',
			'nag_salon_name'            => $salon,
			'_nag_registration_source'  => 'headless',
			'_nag_email_verified'       => 'no',
			'_nag_approval_status'      => 'pending',
			'_nag_wholesale_access'     => 'no',
			'_nag_terms_accepted_at'    => $terms_at,
			'_nag_registered_at'        => time(),
		);
		foreach ( $meta as $key => $value ) {
			update_user_meta( $user_id, $key, $value );
		}

		$user = get_user_by( 'id', $user_id );
		self::send_verification( $user );
		Nag_Emails::admin_new_registration( $user );

		return array( 'ok' => true );
	}

	/* ------------------------------------------------------------------ */
	/* Email verification                                                 */
	/* ------------------------------------------------------------------ */

	private static function send_verification( WP_User $user ) {
		$token = bin2hex( random_bytes( 32 ) );
		update_user_meta( $user->ID, '_nag_email_verify_hash', hash( 'sha256', $token ) );
		update_user_meta( $user->ID, '_nag_email_verify_expires', time() + self::VERIFY_TTL );
		$url = add_query_arg(
			array(
				'uid'   => $user->ID,
				'token' => $token,
			),
			Nag_Settings::frontend_url() . '/account/verify-email'
		);
		return Nag_Emails::verification( $user, $url );
	}

	public static function verify_email( array $p ) {
		$user_id = absint( $p['userId'] ?? 0 );
		$token   = (string) ( $p['token'] ?? '' );
		$invalid = new WP_Error( 'nag_invalid_token', __( 'This verification link is invalid or has expired.', 'nag-bridge' ), array( 'status' => 400 ) );

		if ( ! Nag_Rate_Limit::hit( 'verify_user', (string) $user_id, 10, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}
		if ( ! $user_id || ! preg_match( '/^[a-f0-9]{64}$/', $token ) ) {
			return $invalid;
		}
		$user = get_user_by( 'id', $user_id );
		if ( ! $user || ! self::is_storefront_account( $user_id ) ) {
			return $invalid;
		}
		$hash    = (string) get_user_meta( $user_id, '_nag_email_verify_hash', true );
		$expires = (int) get_user_meta( $user_id, '_nag_email_verify_expires', true );

		if ( '' === $hash ) {
			// Link already used — succeed quietly if the account is verified.
			return 'yes' === get_user_meta( $user_id, '_nag_email_verified', true ) ? array( 'ok' => true ) : $invalid;
		}
		if ( $expires < time() || ! hash_equals( $hash, hash( 'sha256', $token ) ) ) {
			return $invalid;
		}

		update_user_meta( $user_id, '_nag_email_verified', 'yes' );
		update_user_meta( $user_id, '_nag_email_verified_at', time() );
		delete_user_meta( $user_id, '_nag_email_verify_hash' );
		delete_user_meta( $user_id, '_nag_email_verify_expires' );
		self::sync_wholesale( $user_id );

		if ( 'pending' === get_user_meta( $user_id, '_nag_approval_status', true ) ) {
			Nag_Emails::registration_received( $user );
		}
		return array( 'ok' => true );
	}

	public static function resend_verification( array $p ) {
		$email = sanitize_email( (string) ( $p['email'] ?? '' ) );
		$ip    = (string) ( $p['ip'] ?? '' );
		if ( ! Nag_Rate_Limit::hit( 'resend_ip', $ip, 10, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}
		// Same response whether or not anything is sent (no enumeration).
		if ( ! is_email( $email ) || ! Nag_Rate_Limit::hit( 'resend_email', $email, 3, HOUR_IN_SECONDS ) ) {
			return array( 'ok' => true );
		}
		$user = get_user_by( 'email', $email );
		if ( $user && self::is_storefront_account( $user->ID ) && 'yes' !== get_user_meta( $user->ID, '_nag_email_verified', true ) ) {
			self::send_verification( $user );
		}
		return array( 'ok' => true );
	}

	/* ------------------------------------------------------------------ */
	/* Password reset (WordPress's own reset keys)                        */
	/* ------------------------------------------------------------------ */

	public static function forgot_password( array $p ) {
		$email = sanitize_email( (string) ( $p['email'] ?? '' ) );
		$ip    = (string) ( $p['ip'] ?? '' );
		if ( ! Nag_Rate_Limit::hit( 'forgot_ip', $ip, 10, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}
		if ( ! is_email( $email ) || ! Nag_Rate_Limit::hit( 'forgot_email', $email, 3, HOUR_IN_SECONDS ) ) {
			return array( 'ok' => true );
		}
		$user = get_user_by( 'email', $email );
		// Staff reset through wp-login.php; no storefront link is sent for them.
		if ( $user && ! self::is_staff( $user ) ) {
			$key = get_password_reset_key( $user );
			if ( ! is_wp_error( $key ) ) {
				$url = add_query_arg(
					array(
						'key'   => $key,
						'login' => rawurlencode( $user->user_login ),
					),
					Nag_Settings::frontend_url() . '/account/reset-password'
				);
				Nag_Emails::password_reset( $user, $url );
			}
		}
		return array( 'ok' => true );
	}

	public static function reset_password( array $p ) {
		$login    = (string) ( $p['login'] ?? '' );
		$key      = (string) ( $p['key'] ?? '' );
		$password = (string) ( $p['password'] ?? '' );
		$ip       = (string) ( $p['ip'] ?? '' );

		if ( ! Nag_Rate_Limit::hit( 'reset_ip', $ip, 10, HOUR_IN_SECONDS ) || ! Nag_Rate_Limit::hit( 'reset_login', $login, 10, HOUR_IN_SECONDS ) ) {
			return Nag_Rate_Limit::error();
		}
		if ( strlen( $password ) < 8 || strlen( $password ) > 200 || ! preg_match( '/[A-Za-z]/', $password ) || ! preg_match( '/\d/', $password ) ) {
			return new WP_Error( 'nag_weak_password', __( 'Password must be 8–200 characters and include a letter and a number.', 'nag-bridge' ), array( 'status' => 400 ) );
		}

		$user = check_password_reset_key( $key, $login );
		if ( is_wp_error( $user ) || ! $user instanceof WP_User || self::is_staff( $user ) ) {
			return new WP_Error( 'nag_invalid_reset_key', __( 'This password reset link is invalid or has expired. Please request a new one.', 'nag-bridge' ), array( 'status' => 400 ) );
		}

		reset_password( $user, $password );
		// Log out everywhere (storefront and wp-admin sessions alike).
		WP_Session_Tokens::get_instance( $user->ID )->destroy_all();
		Nag_Rate_Limit::clear( 'login_email', $user->user_email );
		return array( 'ok' => true );
	}
}
