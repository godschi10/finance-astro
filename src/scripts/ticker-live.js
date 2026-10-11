/* GWill Finance, ticker: pause/scrub marquee (v1.0.155 → S2b v0.7.57)
 * Ported VERBATIM from the theme's assets/js/ticker-live.js (2026-09-30).
 * The static build bakes build-time values (scripts/fetch-snapshot.mjs).
 *
 * S2b (fifth audit P0-2, v0.7.57): the LIVE PRICE FETCH WAS REMOVED. The FX
 * feed (open.er-api.com) updates once per 24h, so per-visit browser refetches
 * bought nothing and added throttle exposure on every page view; the ticker
 * now serves the build snapshot honestly, stamped with the feed's own update
 * time. This file now owns ONLY the marquee interaction below. The removed
 * client fetch covered: fx (open.er-api.com), btc/eth (Coinbase spot →
 * CoinGecko → Binance chain), gold (api.gold-api.com), a 60s localStorage
 * cache, and the data-ts freshness skip. The build-side snapshot pipeline
 * (scripts/fetch-snapshot.mjs) is unchanged and still feeds the same pairs.
 *
 * MARQUEE (user request): hover (desktop) or press-and-drag (any device)
 * pauses the auto loop so a price can be read; letting go resumes it.
 */

/*
Table of Contents
1. Marquee interaction (v1.0.155, user request)
*/

( function () {
	'use strict';

	// ── 1. Marquee interaction (v1.0.155, user request) ───────────
	// Hover (desktop) or press-and-drag (any device) pauses the auto
	// loop so a price can be read; letting go resumes it. The manual
	// offset lives on .ticker-drag (the inner keeps the CSS animation);
	// clamped to the seamless [-50%, 0] range so no blank gap can appear.
	var ticker = document.querySelector( '.ticker' );
	if ( ticker && window.PointerEvent ) {
		var dragEl = ticker.querySelector( '.ticker-drag' );
		var inner = ticker.querySelector( '.ticker-inner' );
		if ( dragEl && inner ) {
			var pointerId = null;
			var startX = 0;
			var frozenTx = 0; // inner translateX while paused (negative)
			var limit = 0;    // content width = 50% of inner

			var readFrozen = function () {
				var m = new DOMMatrixReadOnly( getComputedStyle( inner ).transform );
				return m.m41;
			};
			var applyDrag = function ( x ) {
				dragEl.style.transform = 'translateX(' + x + 'px)';
			};
			var onDown = function ( e ) {
				if ( pointerId !== null ) {
					return;
				}
				pointerId = e.pointerId;
				startX = e.clientX;
				frozenTx = readFrozen();
				limit = inner.offsetWidth / 2;
				dragEl.classList.remove( 'gwill-returning' );
				ticker.classList.add( 'is-dragging' );
				ticker.classList.add( 'is-paused' );
				try {
					ticker.setPointerCapture( e.pointerId );
				} catch ( err ) {}
			};
			var onMove = function ( e ) {
				if ( e.pointerId !== pointerId ) {
					return;
				}
				var d = e.clientX - startX;
				var lo = -limit - frozenTx;
				var hi = -frozenTx;
				applyDrag( Math.max( lo, Math.min( hi, d ) ) );
			};
			var onUp = function ( e ) {
				if ( e.pointerId !== pointerId ) {
					return;
				}
				pointerId = null;
				ticker.classList.remove( 'is-dragging' );
				ticker.classList.remove( 'is-paused' );
				// Glide the manual offset back to 0, then hand over to the loop.
				dragEl.classList.add( 'gwill-returning' );
				applyDrag( 0 );
				setTimeout( function () {
					dragEl.classList.remove( 'gwill-returning' );
					dragEl.style.transform = '';
				}, 450 );
			};
			ticker.addEventListener( 'pointerdown', onDown );
			ticker.addEventListener( 'pointermove', onMove );
			ticker.addEventListener( 'pointerup', onUp );
			ticker.addEventListener( 'pointercancel', onUp );
		}
	}

	/* P0-2 (fifth audit, v0.7.57): section 2 (live prices) was REMOVED here.
	   The free FX feed updates once per 24h, so per-visit browser refetches
	   bought nothing and added throttle exposure on every page view. The ticker
	   serves the build snapshot honestly (fetch-snapshot.mjs stamps it with the
	   feed's own update time). See the file header for what the removed section
	   covered. */
} )();
