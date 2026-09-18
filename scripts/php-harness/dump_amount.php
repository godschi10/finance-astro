<?php
// Dump the amount-pages config (copy included) to JSON for the Astro port.
// Read-only against the truth theme; run: php dump_amount.php > ../../src/data/amount-pages.json
error_reporting( E_ALL & ~E_DEPRECATED );
require __DIR__ . '/stubs.php';
require '/home/ubuntu/gwill-finance-theme/inc/amount-pages.php';
echo json_encode(
	gwill_amount_pages_config(),
	JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION
);
