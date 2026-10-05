<?php
/**
 * Administrator approval / rejection of storefront registrations, inside
 * the standard WordPress Users screens:
 *
 * - Users list: "Nag's status" column, "Pending approval" view, and
 *   Approve / Reject row actions (nonce-protected).
 * - User profile: status panel with certification download, decision
 *   dropdown and rejection reason (saved with the normal "Update User").
 * - Admin notice with the number of registrations awaiting review.
 *
 * Only users who can edit the target user (current_user_can( 'edit_user' ))
 * can approve, reject or download.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Admin_Approvals {

	public static function init() {
		add_filter( 'manage_users_columns', array( __CLASS__, 'add_column' ) );
		add_filter( 'manage_users_custom_column', array( __CLASS__, 'render_column' ), 10, 3 );
		add_filter( 'user_row_actions', array( __CLASS__, 'row_actions' ), 10, 2 );
		add_filter( 'views_users', array( __CLASS__, 'views' ) );
		add_action( 'pre_get_users', array( __CLASS__, 'filter_pending' ) );
		add_action( 'admin_post_nag_user_decision', array( __CLASS__, 'handle_row_action' ) );
		add_action( 'show_user_profile', array( __CLASS__, 'profile_panel' ) );
		add_action( 'edit_user_profile', array( __CLASS__, 'profile_panel' ) );
		add_action( 'edit_user_profile_update', array( __CLASS__, 'save_profile_decision' ) );
		add_action( 'admin_notices', array( __CLASS__, 'pending_notice' ) );
	}

	/* ------------------------------------------------------------------ */
	/* Decisions                                                          */
	/* ------------------------------------------------------------------ */

	public static function approve( $user_id ) {
		$previous = (string) get_user_meta( $user_id, '_nag_approval_status', true );
		update_user_meta( $user_id, '_nag_approval_status', 'approved' );
		update_user_meta( $user_id, '_nag_approval_at', time() );
		update_user_meta( $user_id, '_nag_approval_by', get_current_user_id() );
		delete_user_meta( $user_id, '_nag_rejection_reason' );
		Nag_Accounts::sync_wholesale( $user_id );

		$user = get_user_by( 'id', $user_id );
		if ( $user && 'approved' !== $previous ) {
			Nag_Emails::approved( $user );
		}
	}

	public static function reject( $user_id, $reason = '' ) {
		$previous = (string) get_user_meta( $user_id, '_nag_approval_status', true );
		update_user_meta( $user_id, '_nag_approval_status', 'rejected' );
		update_user_meta( $user_id, '_nag_approval_at', time() );
		update_user_meta( $user_id, '_nag_approval_by', get_current_user_id() );
		update_user_meta( $user_id, '_nag_rejection_reason', sanitize_textarea_field( $reason ) );
		Nag_Accounts::sync_wholesale( $user_id );
		// End any storefront sessions immediately.
		WP_Session_Tokens::get_instance( $user_id )->destroy_all();

		$user = get_user_by( 'id', $user_id );
		if ( $user && 'rejected' !== $previous ) {
			Nag_Emails::rejected( $user, $reason );
		}
	}

	private static function label( $user_id ) {
		$status = Nag_Accounts::status( $user_id );
		$labels = array(
			'legacy'   => __( 'Existing customer', 'nag-bridge' ),
			'pending'  => __( 'Pending approval', 'nag-bridge' ),
			'approved' => __( 'Approved', 'nag-bridge' ),
			'rejected' => __( 'Rejected', 'nag-bridge' ),
		);
		$parts = array( $labels[ $status['approval'] ] );
		if ( ! $status['emailVerified'] ) {
			$parts[] = __( 'email not verified', 'nag-bridge' );
		}
		if ( $status['wholesale'] ) {
			$parts[] = __( 'wholesale', 'nag-bridge' );
		}
		return implode( ' · ', $parts );
	}

	private static function decision_url( $user_id, $decision ) {
		return wp_nonce_url(
			admin_url( 'admin-post.php?action=nag_user_decision&decision=' . $decision . '&user_id=' . absint( $user_id ) ),
			'nag_user_decision_' . $decision . '_' . absint( $user_id )
		);
	}

	/* ------------------------------------------------------------------ */
	/* Users list                                                         */
	/* ------------------------------------------------------------------ */

	public static function add_column( $columns ) {
		$columns['nag_status'] = __( "Nag's status", 'nag-bridge' );
		return $columns;
	}

	public static function render_column( $output, $column, $user_id ) {
		if ( 'nag_status' !== $column ) {
			return $output;
		}
		$html = esc_html( self::label( $user_id ) );
		if ( Nag_Certifications::has_file( $user_id ) && current_user_can( 'edit_user', $user_id ) ) {
			$html .= '<br><a href="' . esc_url( Nag_Certifications::download_url( $user_id ) ) . '">' . esc_html__( 'Certification', 'nag-bridge' ) . '</a>';
		}
		return $html;
	}

	public static function row_actions( $actions, $user ) {
		if ( ! current_user_can( 'edit_user', $user->ID ) || Nag_Accounts::is_staff( $user ) ) {
			return $actions;
		}
		$approval = Nag_Accounts::status( $user->ID )['approval'];
		if ( 'approved' !== $approval ) {
			$actions['nag_approve'] = '<a href="' . esc_url( self::decision_url( $user->ID, 'approve' ) ) . '">' . esc_html__( 'Approve', 'nag-bridge' ) . '</a>';
		}
		if ( 'rejected' !== $approval && 'legacy' !== $approval ) {
			$actions['nag_reject'] = '<a href="' . esc_url( self::decision_url( $user->ID, 'reject' ) ) . '" onclick="return confirm(\'' . esc_js( __( 'Reject this registration and email the customer?', 'nag-bridge' ) ) . '\');">' . esc_html__( 'Reject', 'nag-bridge' ) . '</a>';
		}
		return $actions;
	}

	public static function handle_row_action() {
		$user_id  = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
		$decision = isset( $_GET['decision'] ) ? sanitize_key( $_GET['decision'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! in_array( $decision, array( 'approve', 'reject' ), true ) ) {
			wp_die( esc_html__( 'Invalid action.', 'nag-bridge' ), 400 );
		}
		check_admin_referer( 'nag_user_decision_' . $decision . '_' . $user_id );
		if ( ! $user_id || ! current_user_can( 'edit_user', $user_id ) ) {
			wp_die( esc_html__( 'You are not allowed to do this.', 'nag-bridge' ), 403 );
		}
		if ( 'approve' === $decision ) {
			self::approve( $user_id );
		} else {
			self::reject( $user_id );
		}
		wp_safe_redirect( add_query_arg( 'nag_done', $decision, wp_get_referer() ? wp_get_referer() : admin_url( 'users.php' ) ) );
		exit;
	}

	public static function views( $views ) {
		$count = self::pending_count();
		$url   = add_query_arg( 'nag_approval', 'pending', admin_url( 'users.php' ) );
		$class = ( isset( $_GET['nag_approval'] ) && 'pending' === $_GET['nag_approval'] ) ? ' class="current"' : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$views['nag_pending'] = '<a href="' . esc_url( $url ) . '"' . $class . '>' . esc_html__( 'Pending approval', 'nag-bridge' ) . ' <span class="count">(' . absint( $count ) . ')</span></a>';
		return $views;
	}

	public static function filter_pending( $query ) {
		if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
			return;
		}
		$screen = get_current_screen();
		if ( ! $screen || 'users' !== $screen->id || ! isset( $_GET['nag_approval'] ) || 'pending' !== $_GET['nag_approval'] ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$query->set(
			'meta_query',
			array(
				array(
					'key'   => '_nag_approval_status',
					'value' => 'pending',
				),
			)
		);
	}

	private static function pending_count() {
		$query = new WP_User_Query(
			array(
				'meta_key'    => '_nag_approval_status', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'  => 'pending', // phpcs:ignore WordPress.DB.SlowDBQuery
				'fields'      => 'ID',
				'number'      => 1,
				'count_total' => true,
			)
		);
		return (int) $query->get_total();
	}

	public static function pending_notice() {
		if ( ! current_user_can( 'list_users' ) ) {
			return;
		}
		if ( isset( $_GET['nag_done'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$done = 'approve' === $_GET['nag_done'] ? __( 'Registration approved and customer emailed.', 'nag-bridge' ) : __( 'Registration rejected and customer emailed.', 'nag-bridge' ); // phpcs:ignore WordPress.Security.NonceVerification
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $done ) . '</p></div>';
		}
		$count = self::pending_count();
		if ( $count > 0 ) {
			$url = add_query_arg( 'nag_approval', 'pending', admin_url( 'users.php' ) );
			echo '<div class="notice notice-info"><p>' . sprintf(
				/* translators: %d: number of registrations */
				esc_html( _n( '%d storefront registration is waiting for approval.', '%d storefront registrations are waiting for approval.', $count, 'nag-bridge' ) ),
				absint( $count )
			) . ' <a href="' . esc_url( $url ) . '">' . esc_html__( 'Review', 'nag-bridge' ) . '</a></p></div>';
		}
	}

	/* ------------------------------------------------------------------ */
	/* Profile screen                                                     */
	/* ------------------------------------------------------------------ */

	public static function profile_panel( $user ) {
		if ( ! current_user_can( 'edit_user', $user->ID ) || Nag_Accounts::is_staff( $user ) ) {
			return;
		}
		$status   = Nag_Accounts::status( $user->ID );
		$reason   = (string) get_user_meta( $user->ID, '_nag_rejection_reason', true );
		$cert_at  = (int) get_user_meta( $user->ID, '_nag_cert_uploaded_at', true );
		$cert_nm  = (string) get_user_meta( $user->ID, '_nag_cert_name', true );
		$salon    = (string) get_user_meta( $user->ID, 'nag_salon_name', true );
		?>
		<h2 id="nag-approval"><?php esc_html_e( "Nag's Beauty — professional account", 'nag-bridge' ); ?></h2>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><?php esc_html_e( 'Status', 'nag-bridge' ); ?></th>
				<td><?php echo esc_html( self::label( $user->ID ) ); ?></td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Salon/Spa', 'nag-bridge' ); ?></th>
				<td><?php echo esc_html( $salon ? $salon : '—' ); ?></td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Certification', 'nag-bridge' ); ?></th>
				<td>
					<?php if ( Nag_Certifications::has_file( $user->ID ) ) : ?>
						<a class="button" href="<?php echo esc_url( Nag_Certifications::download_url( $user->ID ) ); ?>"><?php esc_html_e( 'Download certification', 'nag-bridge' ); ?></a>
						<p class="description">
							<?php echo esc_html( $cert_nm ); ?>
							<?php if ( $cert_at ) : ?>
								— <?php echo esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $cert_at ) ); ?>
							<?php endif; ?>
						</p>
					<?php else : ?>
						<?php esc_html_e( 'No certification document on file.', 'nag-bridge' ); ?>
					<?php endif; ?>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="nag_decision"><?php esc_html_e( 'Decision', 'nag-bridge' ); ?></label></th>
				<td>
					<select name="nag_decision" id="nag_decision">
						<option value=""><?php esc_html_e( '— No change —', 'nag-bridge' ); ?></option>
						<option value="approve"><?php esc_html_e( 'Approve (enables wholesale once email is verified)', 'nag-bridge' ); ?></option>
						<option value="reject"><?php esc_html_e( 'Reject', 'nag-bridge' ); ?></option>
					</select>
					<p class="description"><?php esc_html_e( 'The customer is emailed when their account is approved or rejected.', 'nag-bridge' ); ?></p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="nag_rejection_reason"><?php esc_html_e( 'Rejection reason (optional, sent to customer)', 'nag-bridge' ); ?></label></th>
				<td><textarea name="nag_rejection_reason" id="nag_rejection_reason" rows="3" cols="50"><?php echo esc_textarea( $reason ); ?></textarea></td>
			</tr>
			<?php if ( ! $status['emailVerified'] ) : ?>
			<tr>
				<th scope="row"><?php esc_html_e( 'Email verification', 'nag-bridge' ); ?></th>
				<td><?php esc_html_e( 'Not verified yet. Wholesale access stays off until the customer verifies their email, even if approved.', 'nag-bridge' ); ?></td>
			</tr>
			<?php endif; ?>
		</table>
		<?php
	}

	/** Saved with WordPress's own user-edit form; WordPress has already checked its nonce (update-user_{id}) before this runs. */
	public static function save_profile_decision( $user_id ) {
		if ( ! current_user_can( 'edit_user', $user_id ) || ! isset( $_POST['nag_decision'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		check_admin_referer( 'update-user_' . $user_id );
		$decision = sanitize_key( wp_unslash( $_POST['nag_decision'] ) );
		$reason   = isset( $_POST['nag_rejection_reason'] ) ? sanitize_textarea_field( wp_unslash( $_POST['nag_rejection_reason'] ) ) : '';
		if ( 'approve' === $decision ) {
			self::approve( $user_id );
		} elseif ( 'reject' === $decision ) {
			self::reject( $user_id, $reason );
		}
	}
}
