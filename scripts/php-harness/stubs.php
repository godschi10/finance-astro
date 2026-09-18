<?php
// WP stubs so the theme's pure-PHP engines run under plain PHP CLI.
define( 'ABSPATH', '/tmp/' );
define( 'MINUTE_IN_SECONDS', 60 );
define( 'HOUR_IN_SECONDS', 3600 );

$GLOBALS['stub_rates'] = null; // when set: ['rates'=>[...],'as_of'=>..., 'ok'=>bool]

function add_action( ...$a ) {}
function add_filter( ...$a ) {}
function apply_filters( $tag, $value ) {
	if ( 'gwill_finance_parallel_spread' === $tag ) { return 1.045; }
	if ( 'gwill_finance_parallel_active' === $tag ) { return false; }
	return $value;
}
function __( $s, $d = null ) { return $s; }
function esc_html__( $s, $d = null ) { return $s; }
function esc_html_e( $s, $d = null ) { echo $s; }
function esc_attr( $s ) { return $s; }
function esc_html( $s ) { return $s; }
function esc_url( $s ) { return $s; }
function wp_kses_post( $s ) { return $s; }
function sanitize_title( $s ) { return $s; }
function get_option( $k, $d = false ) { return $d; }
function get_transient( $k ) {
	if ( null !== $GLOBALS['stub_rates'] && 'gwill_fx_usd_rates' === $k ) {
		return $GLOBALS['stub_rates'];
	}
	return false;
}
function set_transient( $k, $v, $t ) { return true; }
class WP_Error_Gwill {}
function is_wp_error( $t ) { return $t instanceof WP_Error_Gwill; }
function wp_safe_remote_get( $u, $a = array() ) { return new WP_Error_Gwill(); }
function wp_remote_retrieve_response_code( $r ) { return 0; }
function wp_remote_retrieve_body( $r ) { return ''; }
function get_date_from_gmt( $s, $f ) { return $s; }
function is_page_template( $t = null ) { return false; }
function is_singular( $t = null ) { return false; }
function get_post() { return null; }
define( 'OBJECT', 'OBJECT' );
function get_page_by_path( $p, $o = null, $t = null ) { return array( 'path' => $p ); }
function home_url( $p = '' ) { return 'https://example.test' . $p; }
function get_permalink( $p ) { return 'https://example.test/'; }
function wp_json_encode( $d, $o = 0 ) { return json_encode( $d, $o ); }
function date_i18n( $f, $t = null ) { return gmdate( $f, $t ); }
