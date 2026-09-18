<?php
// Reference-vector generator: runs every PHP engine, prints JSON to stdout.
error_reporting( E_ALL & ~E_DEPRECATED );
require __DIR__ . '/stubs.php';
$INC = '/home/ubuntu/gwill-finance-theme/inc/';
foreach ( array( 'helpers.php', 'currency.php', 'salary-tax.php', 'gross-to-net.php',
	'savings-goal.php', 'compound-interest.php', 'naira-value.php', 'inflation-savings.php',
	'budget-503020.php', 'budget-allocator.php', 'loan-repayment.php', 'crypto-profit.php',
	'dividend-estimator.php', 'emergency-fund.php', 'transfer-comparator.php',
	'savings-rate.php', 'fx-history.php', 'amount-pages.php' ) as $f ) {
	require_once $INC . $f;
}

// Canned "live" rates (USD-anchored, shape of open.er-api.com).
$LIVE = array(
	'USD' => 1.0, 'NGN' => 1482.0, 'GBP' => 0.79, 'EUR' => 0.92,
	'CAD' => 1.36, 'AED' => 3.6725, 'SAR' => 3.75, 'GHS' => 16.2,
	'XOF' => 565.0, 'XAF' => 565.0, 'CNY' => 6.74, 'JPY' => 159.9,
	'INR' => 95.5, 'KES' => 129.5, 'EGP' => 54.0, 'ZAR' => 18.2,
);
$GLOBALS['stub_rates'] = array( 'ok' => true, 'rates' => $LIVE, 'as_of' => 'Mon, 14 Sep 2026 00:00:01 GMT', 'cached' => false );

$V = array();
$rec = function ( $name, $val ) use ( &$V ) { $V[] = array( 'name' => $name, 'value' => $val ); };

// ── salary tax ──
$rec( 'paye_new_300k', gwill_paye_calculate( 300000.0, 0.08, 0.0, 0.0, true ) );
$rec( 'paye_new_70k_exempt', gwill_paye_calculate( 70000.0, 0.08, 0.0, 0.0, true ) );
$rec( 'paye_new_70k001', gwill_paye_calculate( 70001.0, 0.08, 0.0, 0.0, true ) );
$rec( 'paye_new_500k_rent24', gwill_paye_calculate( 500000.0, 0.08, 0.0, 2400000.0, true ) );
$rec( 'paye_new_500k_rent99_cap', gwill_paye_calculate( 500000.0, 0.08, 0.0, 99000000.0, true ) );
$rec( 'paye_new_5m_exec', gwill_paye_calculate( 5000000.0, 0.08, 5000.0, 6000000.0, true, 10000.0, 20000.0, 5000.0 ) );
$rec( 'paye_old_300k', gwill_paye_calculate( 300000.0, 0.08, 0.0, 0.0, false ) );
$rec( 'paye_compare_300k', gwill_paye_compare( 300000.0, 0.08, 0.0, 0.0 ) );
$rec( 'paye_bonus', gwill_paye_bonus_tax( 300000.0, 500000.0, 0.08 ) );
$rec( 'paye_bonus_zero', gwill_paye_bonus_tax( 300000.0, 0.0, 0.08 ) );
$rec( 'paye_bonus_exempt_base', gwill_paye_bonus_tax( 60000.0, 200000.0, 0.08 ) );
$rec( 'paye_band_breakdown_new', gwill_paye_band_breakdown( 3312000.0, gwill_paye_bands_2026() ) );
$rec( 'paye_band_compare', gwill_paye_band_compare( 3312000.0 ) );
$rec( 'paye_bands_old', gwill_paye_bands_old() );
$rec( 'paye_bands_2026', gwill_paye_bands_2026() );

// ── gross→net ──
$rec( 'gross_find_250k', gwill_reverse_gross_find( 250000.0, 0.08 ) );
$rec( 'gross_full_250k', gwill_reverse_gross( 250000.0, 0.08 ) );
$rec( 'gross_full_60k_exemptzone', gwill_reverse_gross( 60000.0, 0.08 ) );

// ── savings / compound ──
$rec( 'periodic_monthly_15', gwill_savings_periodic_rate( 0.15, 'monthly' ) );
$rec( 'periodic_quarterly_15', gwill_savings_periodic_rate( 0.15, 'quarterly' ) );
$rec( 'periodic_daily_15', gwill_savings_periodic_rate( 0.15, 'daily' ) );
$rec( 'periodic_annual_15', gwill_savings_periodic_rate( 0.15, 'annual' ) );
$rec( 'periodic_zero', gwill_savings_periodic_rate( 0.0, 'monthly' ) );
$rec( 'savings_5m', gwill_savings_calculate( 5000000.0, 500000.0, 0.15, 24, 'monthly' ) );
$rec( 'savings_already', gwill_savings_calculate( 100000.0, 500000.0, 0.15, 24, 'monthly' ) );
$rec( 'savings_norate', gwill_savings_calculate( 1200000.0, 0.0, 0.0, 12, 'monthly' ) );
$rec( 'savings_schedule', gwill_savings_schedule( 5000000.0, 500000.0, 0.15, 30, 'monthly' ) );
$rec( 'deposits_weekly', gwill_compound_deposits_per_month( 'weekly' ) );
$rec( 'deposits_biweekly', gwill_compound_deposits_per_month( 'biweekly' ) );
$rec( 'deposits_quarterly', gwill_compound_deposits_per_month( 'quarterly' ) );
$rec( 'deposits_annual', gwill_compound_deposits_per_month( 'annual' ) );
$rec( 'deposits_bogus', gwill_compound_deposits_per_month( 'fortnightly' ) );
$rec( 'compound_growth', gwill_compound_growth( 100000.0, 50000.0, 0.10, 60, 'monthly', 'monthly' ) );
$rec( 'compound_growth_q', gwill_compound_growth( 100000.0, 50000.0, 0.10, 60, 'quarterly', 'weekly' ) );
$rec( 'compound_growth_norate', gwill_compound_growth( 100000.0, 50000.0, 0.0, 60, 'monthly', 'monthly' ) );
$rec( 'compound_schedule', gwill_compound_schedule( 100000.0, 50000.0, 0.10, 30, 'monthly', 'monthly' ) );

// ── naira value / inflation ──
$rec( 'naira_value', gwill_naira_value( 1000000.0, 0.20, 5 ) );
$rec( 'naira_value_mo', gwill_naira_value( 1000000.0, 0.20, 5, 6 ) );
$rec( 'naira_history', gwill_naira_value_history( 1000000.0, 0.20, 3 ) );
$rec( 'naira_pv', gwill_naira_value_pv( 2000000.0, 0.20, 5 ) );
$rec( 'naira_save', gwill_naira_value_save( 10000000.0, 1000000.0, 0.15, 0.20, 5, 0, 'monthly' ) );
$rec( 'inflation_goal', gwill_inflation_adjusted_goal( 10000000.0, 1000000.0, 0.15, 0.20, 5, 0, 'monthly', 'monthly' ) );
$rec( 'inflation_goal_weekly', gwill_inflation_adjusted_goal( 10000000.0, 1000000.0, 0.15, 0.20, 5, 0, 'monthly', 'weekly' ) );

// ── budgets ──
$rec( 'budget503020', gwill_budget_503020( 250000.0 ) );
$rec( 'budget503020_custom', gwill_budget_503020( 400000.0, 0.6, 0.25, 0.10 ) );
$rec( 'budget503020_compare', gwill_budget_503020_compare( 250000.0, 0.5, 0.3, 0.2, 140000.0, 90000.0, 30000.0 ) );
$rec( 'allocator', gwill_budget_allocator( 250000.0 ) );
$rec( 'allocator_override', gwill_budget_allocator( 250000.0, 0.5, 0.3, 0.2, array( 'rent' => 0.5 ) ) );

// ── loan ──
$rec( 'loan_daily_seed', gwill_loan_repayment( 100000.0, 30, 'days', 1.0, 'daily' ) );
$rec( 'loan_flat', gwill_loan_repayment( 500000.0, 12, 'months', 3.0, 'flat' ) );
$rec( 'loan_reducing', gwill_loan_repayment( 2000000.0, 24, 'months', 18.0, 'reducing' ) );
$rec( 'loan_flat_days', gwill_loan_repayment( 200000.0, 90, 'days', 2.0, 'flat' ) );
$rec( 'loan_apr_direct', gwill_loan_effective_apr( 500000.0, 500000.0 / 12 + 500000.0 * 0.03, 12, 12 ) );

// ── crypto ──
$rec( 'crypto_seed', gwill_crypto_profit( 200000.0, 1500.0, 1800.0, 0.01, 0.01, 0.0 ) );
$rec( 'crypto_loss', gwill_crypto_profit( 500000.0, 1700.0, 1500.0, 0.005, 0.005, 1000.0 ) );
$rec( 'crypto_zero', gwill_crypto_profit( 0.0, 1500.0, 1800.0 ) );
$rec( 'crypto_usdt', gwill_crypto_profit_usdt( 100.0 ) );

// ── dividend ──
$rec( 'dividend_seed', gwill_dividend_project( 500000.0, 128.0, 11.76, 0.10, 0.08, 5, true ) );
$rec( 'dividend_cash', gwill_dividend_project( 500000.0, 128.0, 11.76, 0.10, 0.08, 5, false ) );
$rec( 'dividend_stocks', gwill_ngx_dividend_stocks() );

// ── emergency ──
$rec( 'emergency_seed', gwill_emergency_fund( 150000.0, 450000.0, 80000.0, 6.0, 0.20 ) );
$rec( 'emergency_nosave', gwill_emergency_fund( 200000.0, 100000.0, 0.0, 6.0, 0.20 ) );

// ── fx / transfer ──
$rec( 'fx_convert_usd_ngn', gwill_fx_convert( 100.0, 'USD', 'NGN', $LIVE ) );
$rec( 'fx_convert_ngn_usd', gwill_fx_convert( 100000.0, 'NGN', 'USD', $LIVE ) );
$rec( 'fx_convert_same', gwill_fx_convert( 123.45, 'EUR', 'EUR', $LIVE ) );
$rec( 'fx_convert_unknown', gwill_fx_convert( 100.0, 'USD', 'XXX', $LIVE ) );
$rec( 'fx_convert_gbp_ngn', gwill_fx_convert( 100.0, 'GBP', 'NGN', $LIVE ) );
$rec( 'fx_parallel', gwill_fx_parallel_ngn_usd( 1482.0 ) );
$rec( 'fx_parallel_custom', gwill_fx_parallel_ngn_usd( 1482.0, 1.10 ) );
$rec( 'transfer_to_ng', gwill_transfer_quote( 500.0, 'to-nigeria', 'USD', 'NGN' ) );
$rec( 'transfer_from_ng', gwill_transfer_quote( 100000.0, 'from-nigeria', 'NGN', 'USD' ) );
$rec( 'transfer_gbp', gwill_transfer_quote( 200.0, 'to-nigeria', 'GBP', 'NGN' ) );
$rec( 'transfer_zero', gwill_transfer_quote( 0.0, 'to-nigeria', 'USD', 'NGN' ) );
$rec( 'transfer_providers_to', gwill_transfer_providers( 'to-nigeria' ) );
$rec( 'transfer_providers_from', gwill_transfer_providers( 'from-nigeria' ) );

// ── fallback path (no feed) ──
$GLOBALS['stub_rates'] = false;
$fb = gwill_fx_rates();
$rec( 'fx_fallback_rates', $fb );
$rec( 'fx_fallback_convert', gwill_fx_convert( 100.0, 'USD', 'NGN', $fb['rates'] ) );
$rec( 'fx_fallback_ngn_rate', $fb['rates']['NGN'] );

// ── fx history pure math (synthetic points) ──
$pts = array();
$base_ts = strtotime( '2026-06-01' );
for ( $i = 0; $i < 100; $i++ ) {
	$pts[] = array( 'date' => gmdate( 'Y-m-d', $base_ts + $i * 86400 ), 'ngn' => 1400.0 + $i * 1.5 + ( $i % 7 ) * 2.0 );
}
$rec( 'fxhist_summary', gwill_fx_history_summary( $pts ) );
$rec( 'fxhist_range_count', count( gwill_fx_history_range( $pts, 30 ) ) );
$rec( 'fxhist_range90_count', count( gwill_fx_history_range( $pts, 90 ) ) );
$rec( 'fxhist_single', gwill_fx_history_summary( array( array( 'date' => '2026-09-01', 'ngn' => 1482.0 ) ) ) );

// ── savings-rate table ──
$rec( 'savings_rate_data', gwill_savings_rate_data() );
$rec( 'maintained_verified', gwill_finance_maintained_verified() );

// ── amount pages ──
$GLOBALS['stub_rates'] = array( 'ok' => true, 'rates' => $LIVE, 'as_of' => 'Mon, 14 Sep 2026 00:00:01 GMT', 'cached' => false );
$rec( 'amount_100usd', gwill_amount_page_data( '100-dollars-to-naira' ) );
$rec( 'amount_1mngn', gwill_amount_page_data( '1-million-naira-to-dollars' ) );
$rec( 'amount_seo_50', gwill_amount_pages_seo( '50-dollars-to-naira', gwill_amount_pages_config()['50-dollars-to-naira'] ) );
$rec( 'amount_tokens_100', gwill_amount_pages_tokens( '100-dollars-to-naira' ) );
$rec( 'amount_siblings_100', array_keys( gwill_amount_pages_siblings( '100-dollars-to-naira' ) ) );
$rec( 'amount_opposite_100', array_keys( gwill_amount_pages_opposite( '100-dollars-to-naira' ) ) );
$rec( 'amount_fmt_ngn', gwill_amount_pages_fmt( 148200.0, 'NGN' ) );
$rec( 'amount_fmt_usd_small', gwill_amount_pages_fmt( 67.47, 'USD' ) );
$rec( 'amount_fmt_usd_big', gwill_amount_pages_fmt( 6747.47, 'USD' ) );
$rec( 'amount_fmt_gbp', gwill_amount_pages_fmt( 52.3, 'GBP' ) );

// seed constants
$rec( 'seeds', array(
	'loan' => gwill_loan_seed(), 'crypto' => gwill_crypto_profit_seed(),
	'dividend' => gwill_dividend_seed(), 'emergency' => gwill_emergency_fund_seed(),
	'naira' => gwill_naira_value_seed(), 'transfer' => gwill_transfer_seed(),
	'budget503020' => gwill_budget_503020_seed_income(), 'allocator' => gwill_budget_allocator_seed_income(),
) );

echo json_encode( $V, JSON_PRESERVE_ZERO_FRACTION );
