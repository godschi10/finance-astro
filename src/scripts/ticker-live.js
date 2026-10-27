/* GWill Finance, ticker: pause/scrub marquee + live prices (restored)
 * Ported VERBATIM from the theme's assets/js/ticker-live.js (2026-09-30).
 * The static build bakes build-time values (scripts/fetch-snapshot.mjs).
 *
 * S2b (fifth audit P0-2, v0.7.57) REMOVED the live price fetch: the FX feed
 * (open.er-api.com) updates once per 24h, so refetching FX per visit bought
 * nothing and added throttle exposure. That reasoning was HALF RIGHT —
 * re-verified 2026-10-27: Coinbase BTC/ETH spot and gold-api XAU ARE genuinely
 * live (updated seconds before the probe), only FX is once-daily. So section 2
 * is restored: BTC/ETH/XAU refresh per visit, FX re-reads the same daily feed
 * at its next 00:02 UTC window. The .tl-tx label states this honestly; there is
 * no "LIVE" badge on a once-daily feed (P0-2 stands for that wording).
 *
 * The build-side snapshot pipeline (scripts/fetch-snapshot.mjs) is unchanged
 * and still feeds the same pairs; the client layer only improves on it.
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

	/* P0-2 (fifth audit, v0.7.57) lives on as the *label* rule only: a
	   once-daily feed must never carry the "LIVE" badge. The feed itself
	   is selectively live again: BTC/ETH/XAU are genuinely live and refresh
	   per visit; FX re-reads at its next 00:02 UTC window (gate P0-2).

	   The restored section 2 is PORTED VERBATIM from the WP theme's
	   assets/js/ticker-live.js v1.0.169 plus the S2b gate: a 60s
	   localStorage cache + the data-ts freshness skip preserve the
	   "build snapshot serves honestly" property when the FX feed has not
	   rotated since the build. */

	// ── 2. Live prices ────────────────────────────────────────────
	if ( window.fetch ) {
		var items = Array.prototype.slice.call( document.querySelectorAll( '.ticker .ti[data-src]' ) );
		if ( items.length ) {
			var CACHE_KEY = 'gwill-ticker-v1';
			var TTL = 60 * 1000;
			var fmt = function ( n, sym ) { return sym + Math.round( n ).toLocaleString( 'en-US' ); };
			var symbolFor = function ( quote ) { return quote === 'NGN' ? '₦' : quote === 'USD' ? '$' : ''; };
			var applyRates = function ( pairs ) {
				items.forEach( function ( ti ) {
					var pair = ti.getAttribute( 'data-pair' );
					if ( ! pair || ! pairs[ pair ] ) { return; }
					var rate = ti.querySelector( '.t-rate' );
					if ( rate ) { rate.textContent = pairs[ pair ]; }
				} );
			};
			var readCache = function () {
				try {
					var c = JSON.parse( localStorage.getItem( CACHE_KEY ) || 'null' );
					if ( c && c.ts && ( Date.now() - c.ts ) < TTL && c.pairs ) { return c.pairs; }
				} catch ( e ) {}
				return null;
			};
			var writeCache = function ( pairs ) {
				try { localStorage.setItem( CACHE_KEY, JSON.stringify( { ts: Date.now(), pairs: pairs } ) ); } catch ( e ) {}
			};
			var get = function ( url ) {
				var ctrl = window.AbortController ? new AbortController() : null;
				var timer = setTimeout( function () { if ( ctrl ) ctrl.abort(); }, 8000 );
				var opts = { cache: 'no-cache' };
				if ( ctrl ) opts.signal = ctrl.signal;
				return fetch( url, opts ).then(
					function ( r ) { return r.ok ? r.json() : Promise.reject( new Error( 'HTTP ' + r.status ) ); },
					function ( e ) { clearTimeout( timer ); throw e; }
				).then(
					function ( d ) { clearTimeout( timer ); return d; },
					function ( e ) { clearTimeout( timer ); throw e; }
				);
			};

			var run = function () {
				// Server-side (build) snapshot guard: if the DOM still carries
				// a fresh snapshot (feed has not rotated since build), skip.
				if ( ticker ) {
					var serverTs = parseInt( ticker.getAttribute( 'data-ts' ) || '0', 10 );
					if ( serverTs && ( Date.now() - serverTs * 1000 ) < TTL ) { return; }
				}
				var cached = readCache();
				if ( cached ) { applyRates( cached ); return; }

				var fxItems = items.filter( function ( ti ) { return ti.getAttribute( 'data-src' ) === 'fx'; } );
				var API = ( typeof window.GwillTickerApi !== 'undefined' ) ? window.GwillTickerApi : {};

				var fetchFx = function () {
					if ( ! fxItems.length ) { return Promise.resolve( {} ); }
					return get( API.fx || 'https://open.er-api.com/v6/latest/USD' ).then( function ( d ) {
						var pairs = {};
						if ( d && d.result === 'success' && d.rates ) {
							var r = d.rates;
							fxItems.forEach( function ( ti ) {
								var pair = ti.getAttribute( 'data-pair' ) || '';
								var parts = pair.split( '/' );
								if ( parts.length !== 2 ) { return; }
								var base = parts[ 0 ]; var quote = parts[ 1 ];
								if ( ! r[ base ] || ! r[ quote ] ) { return; }
								pairs[ pair ] = fmt( r[ quote ] / r[ base ], symbolFor( quote ) );
							} );
						}
						return pairs;
					} ).catch( function () { return {}; } );
				};

				var CRYPTO_CHAINS = {
					btc: { 'BTC/USD': { coinbase: API.btc || 'https://api.coinbase.com/v2/prices/BTC-USD/spot', coingecko: API.btcGeo || 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', binance: API.btcBin || 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT' } },
					eth: { 'ETH/USD': { coinbase: API.eth || 'https://api.coinbase.com/v2/prices/ETH-USD/spot', coingecko: API.ethGeo || 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', binance: API.ethBin || 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT' } }
				};

				var fetchCrypto = function ( src ) {
					var chain = CRYPTO_CHAINS[ src ];
					if ( ! chain || ! items.some( function ( ti ) { return ti.getAttribute( 'data-src' ) === src; } ) ) { return Promise.resolve( {} ); }
					var pair = Object.keys( chain )[ 0 ];
					var urls = chain[ pair ];
					var i = 0;
					var attempt = function () {
						var keys = Object.keys( urls );
						if ( i >= keys.length ) { return Promise.resolve( {} ); }
						var provider = keys[ i++ ];
						return get( urls[ provider ] ).then( function ( d ) {
							var amount = null;
							if ( d && d.data && d.data.amount ) { amount = parseFloat( d.data.amount ); }
							else if ( d && d[ 'bitcoin' ] && d.bitcoin.usd && 'btc' === src ) { amount = d.bitcoin.usd; }
							else if ( d && d.ethereum && d.ethereum.usd && 'eth' === src ) { amount = d.ethereum.usd; }
							else if ( d && d.price ) { amount = parseFloat( d.price ); }
							if ( amount && amount > 0 ) { var out = {}; out[ pair ] = fmt( amount, '$' ); return out; }
							return attempt();
						} ).catch( function () { return attempt(); } );
					};
					return attempt();
				};

				var fetchGold = function () {
					if ( ! items.some( function ( ti ) { return ti.getAttribute( 'data-src' ) === 'gold'; } ) ) { return Promise.resolve( {} ); }
					return get( API.gold || 'https://api.gold-api.com/price/XAU' ).then( function ( d ) {
						var price = d && d.price ? parseFloat( d.price ) : null;
						if ( price && price > 0 ) { return { 'XAU/USD': fmt( price, '$' ) }; }
						return {};
					} ).catch( function () { return {}; } );
				};

				Promise.all( [ fetchFx(), fetchCrypto( 'btc' ), fetchCrypto( 'eth' ), fetchGold() ] ).then( function ( res ) {
					var pairs = Object.assign( {}, res[ 0 ], res[ 1 ], res[ 2 ], res[ 3 ] );
					if ( Object.keys( pairs ).length ) { applyRates( pairs ); writeCache( pairs ); }
				} );
			};

			if ( 'requestIdleCallback' in window ) {
				window.requestIdleCallback( run, { timeout: 3000 } );
			} else {
				setTimeout( run, 500 );
			}
		}
	}
} )();
