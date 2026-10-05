<?php
/**
 * Private storage for certification documents uploaded at registration.
 *
 * - Stored outside the Media Library, under a random server-generated name.
 * - Default directory: wp-content/uploads/nag-private-certifications, with
 *   deny-all .htaccess (Apache/LiteSpeed), web.config (IIS) and index.php
 *   files so it can't be listed or fetched directly. On nginx those files
 *   are ignored — define NAG_CERT_DIR to a directory OUTSIDE the web root
 *   (recommended everywhere).
 * - Re-validated here (size, magic bytes, extension, finfo) independently
 *   of the storefront's own checks.
 * - Downloadable only by logged-in staff who can edit that user, via a
 *   nonce-protected admin-post handler, always as an attachment.
 *
 * @package NagBridge
 */

defined( 'ABSPATH' ) || exit;

class Nag_Certifications {

	const MAX_BYTES = 4194304; // 4 MB

	/** kind => [ extensions, canonical mime, acceptable finfo results ] */
	private static function rules() {
		return array(
			'pdf'  => array( array( 'pdf' ), 'application/pdf', array( 'application/pdf' ) ),
			'jpeg' => array( array( 'jpg', 'jpeg' ), 'image/jpeg', array( 'image/jpeg', 'image/pjpeg' ) ),
			'png'  => array( array( 'png' ), 'image/png', array( 'image/png' ) ),
			'webp' => array( array( 'webp' ), 'image/webp', array( 'image/webp' ) ),
			'heic' => array( array( 'heic', 'heif' ), 'image/heic', array( 'image/heic', 'image/heif', 'image/heic-sequence', 'application/octet-stream' ) ),
		);
	}

	public static function init() {
		add_action( 'admin_post_nag_download_cert', array( __CLASS__, 'download' ) );
		add_action( 'delete_user', array( __CLASS__, 'delete_for_user' ) );
	}

	public static function directory() {
		if ( defined( 'NAG_CERT_DIR' ) && '' !== (string) NAG_CERT_DIR ) {
			return untrailingslashit( (string) NAG_CERT_DIR );
		}
		$uploads = wp_upload_dir( null, false );
		return untrailingslashit( $uploads['basedir'] ) . '/nag-private-certifications';
	}

	/** Creates the directory and its deny-all guard files. */
	public static function ensure_directory() {
		$dir = self::directory();
		if ( ! is_dir( $dir ) && ! wp_mkdir_p( $dir ) ) {
			return false;
		}
		$guards = array(
			'.htaccess'  => "# Deny all direct web access (Apache 2.4+ / LiteSpeed, and Apache 2.2)\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\nOptions -Indexes\n",
			'web.config' => "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<configuration><system.webServer><authorization><deny users=\"*\" /></authorization></system.webServer></configuration>\n",
			'index.php'  => "<?php\n// Silence is golden.\n",
		);
		foreach ( $guards as $name => $contents ) {
			$path = $dir . '/' . $name;
			if ( ! file_exists( $path ) ) {
				file_put_contents( $path, $contents, LOCK_EX ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			}
		}
		return true;
	}

	/** Identifies the real file type from its leading bytes. */
	public static function detect_kind( $bytes ) {
		if ( 0 === strncmp( $bytes, '%PDF-', 5 ) ) {
			return 'pdf';
		}
		if ( 0 === strncmp( $bytes, "\xFF\xD8\xFF", 3 ) ) {
			return 'jpeg';
		}
		if ( 0 === strncmp( $bytes, "\x89PNG\r\n\x1A\n", 8 ) ) {
			return 'png';
		}
		if ( 'RIFF' === substr( $bytes, 0, 4 ) && 'WEBP' === substr( $bytes, 8, 4 ) ) {
			return 'webp';
		}
		if ( 'ftyp' === substr( $bytes, 4, 4 ) && in_array( substr( $bytes, 8, 4 ), array( 'heic', 'heix', 'heif', 'mif1', 'msf1', 'hevc' ), true ) ) {
			return 'heic';
		}
		return null;
	}

	/**
	 * Validates and stores a base64-encoded certification for a user.
	 *
	 * @return true|WP_Error
	 */
	public static function store( $user_id, $base64, $extension, $display_name ) {
		$bytes = base64_decode( (string) $base64, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions
		if ( false === $bytes || '' === $bytes ) {
			return self::invalid( __( 'Please upload your certification document or photo.', 'nag-bridge' ) );
		}
		if ( strlen( $bytes ) > self::MAX_BYTES ) {
			return self::invalid( __( 'The file is too large. Please upload a file under 4 MB.', 'nag-bridge' ) );
		}

		$kind  = self::detect_kind( $bytes );
		$rules = self::rules();
		if ( null === $kind ) {
			return self::invalid( __( 'Please upload a PDF, JPG, PNG, WEBP or HEIC file.', 'nag-bridge' ) );
		}
		list( $extensions, $canonical_mime, $finfo_ok ) = $rules[ $kind ];

		$extension = strtolower( (string) $extension );
		if ( ! in_array( $extension, $extensions, true ) ) {
			return self::invalid( __( "The file name doesn't match its contents.", 'nag-bridge' ) );
		}

		if ( function_exists( 'finfo_open' ) ) {
			$finfo    = finfo_open( FILEINFO_MIME_TYPE );
			$detected = $finfo ? finfo_buffer( $finfo, $bytes ) : false;
			if ( $finfo ) {
				finfo_close( $finfo );
			}
			if ( $detected && ! in_array( $detected, $finfo_ok, true ) ) {
				return self::invalid( __( "The file type doesn't match its contents.", 'nag-bridge' ) );
			}
		}

		if ( ! self::ensure_directory() ) {
			error_log( '[nag-bridge] certification directory could not be created' );
			return new WP_Error( 'nag_upload_failed', __( "We couldn't save your file. Please try again.", 'nag-bridge' ), array( 'status' => 500 ) );
		}

		$filename = absint( $user_id ) . '-' . bin2hex( random_bytes( 16 ) ) . '.' . $extensions[0];
		$path     = self::directory() . '/' . $filename;
		if ( false === file_put_contents( $path, $bytes, LOCK_EX ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions
			error_log( '[nag-bridge] certification write failed' );
			return new WP_Error( 'nag_upload_failed', __( "We couldn't save your file. Please try again.", 'nag-bridge' ), array( 'status' => 500 ) );
		}
		@chmod( $path, 0640 ); // phpcs:ignore

		update_user_meta( $user_id, '_nag_cert_file', $filename );
		update_user_meta( $user_id, '_nag_cert_mime', $canonical_mime );
		update_user_meta( $user_id, '_nag_cert_name', sanitize_file_name( (string) $display_name ) );
		update_user_meta( $user_id, '_nag_cert_size', strlen( $bytes ) );
		update_user_meta( $user_id, '_nag_cert_sha256', hash( 'sha256', $bytes ) );
		update_user_meta( $user_id, '_nag_cert_uploaded_at', time() );
		update_user_meta( $user_id, 'nag_certification', 'on_file' );
		return true;
	}

	private static function invalid( $message ) {
		return new WP_Error(
			'nag_invalid_upload',
			$message,
			array(
				'status'  => 400,
				'details' => array( 'fieldErrors' => array( 'certification' => $message ) ),
			)
		);
	}

	public static function has_file( $user_id ) {
		return '' !== (string) get_user_meta( $user_id, '_nag_cert_file', true );
	}

	public static function download_url( $user_id ) {
		return wp_nonce_url( admin_url( 'admin-post.php?action=nag_download_cert&user_id=' . absint( $user_id ) ), 'nag_download_cert_' . absint( $user_id ) );
	}

	/** admin-post handler — staff only, nonce-checked, served as an attachment. */
	public static function download() {
		$user_id = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
		check_admin_referer( 'nag_download_cert_' . $user_id );
		if ( ! $user_id || ! current_user_can( 'edit_user', $user_id ) ) {
			wp_die( esc_html__( 'You are not allowed to view this file.', 'nag-bridge' ), 403 );
		}

		$filename = (string) get_user_meta( $user_id, '_nag_cert_file', true );
		if ( '' === $filename || ! preg_match( '/^\d+-[a-f0-9]{32}\.(pdf|jpg|png|webp|heic)$/', $filename ) ) {
			wp_die( esc_html__( 'No certification file on record.', 'nag-bridge' ), 404 );
		}
		$dir  = realpath( self::directory() );
		$path = realpath( self::directory() . '/' . $filename );
		if ( ! $dir || ! $path || 0 !== strpos( $path, $dir . DIRECTORY_SEPARATOR ) || ! is_readable( $path ) ) {
			wp_die( esc_html__( 'The certification file could not be found.', 'nag-bridge' ), 404 );
		}

		$mime = (string) get_user_meta( $user_id, '_nag_cert_mime', true );
		$ext  = pathinfo( $filename, PATHINFO_EXTENSION );
		nocache_headers();
		header( 'Content-Type: ' . ( $mime ? $mime : 'application/octet-stream' ) );
		header( 'Content-Disposition: attachment; filename="certification-' . $user_id . '.' . $ext . '"' );
		header( 'Content-Length: ' . filesize( $path ) );
		header( 'X-Content-Type-Options: nosniff' );
		header( "Content-Security-Policy: default-src 'none'; sandbox" );
		readfile( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		exit;
	}

	/** Removes the stored file when a user account is deleted. */
	public static function delete_for_user( $user_id ) {
		$filename = (string) get_user_meta( $user_id, '_nag_cert_file', true );
		if ( '' === $filename || ! preg_match( '/^\d+-[a-f0-9]{32}\.[a-z]+$/', $filename ) ) {
			return;
		}
		$path = self::directory() . '/' . $filename;
		if ( is_file( $path ) ) {
			wp_delete_file( $path );
		}
	}
}
