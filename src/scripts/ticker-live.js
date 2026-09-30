/* GWill Finance, ticker: live prices + pause/scrub marquee (v1.0.155)
 * Ported VERBATIM from the theme's assets/js/ticker-live.js (2026-09-30).
 * The static build bakes build-time values (scripts/fetch-snapshot.mjs);
 * this script refreshes them to live prices in the visitor's browser, and
 * the data-ts attribute on .ticker lets it skip the network within 60s of
 * a fresh build stamp — same contract as WP's transient cache.
 *
 * LIVE PRICES: updates the header ticker's rates IN PLACE with live
 * prices from free, keyless APIs. The server renders " - " (never a
 * hardcoded price, user directive); if any fetch fails, times out (8s
 * abort) or is rate-limited, the dash simply stays. Runs after first
 * paint (requestIdleCallback) so page speed is untouched. Design
 * untouched: only the .t-rate text is replaced.
 *
 * SERVER-SIDE CACHE: the theme also caches live values server-side
 * (inc/finance-helpers.php, gwill_ticker_cache transient, 60s). When the
 * server-rendered DOM carries a fresh data-ts (<60s) on .ticker, this
 * script SKIPS the network entirely, the widget is instant.
 *
 * MARQUEE (user request): hover (desktop) or press-and-drag (any device)
 * pauses the auto loop so a price can be read; letting go resumes it.
 *
 * Sources (no login, no API key, CORS-open):
 *   fx   → https://open.er-api.com/v6/latest/USD  (ONE call → all FX pairs)
 *   btc  → fallback chain: Coinbase spot → CoinGecko simple price → Binance
 *   eth  → same chain, ETH symbols (each source independent)
 *   gold → https://api.gold-api.com/price/XAU (free, keyless, CORS-open)
 *         (one source down/rate-limited never blocks the others)
 *
 * Client cache: 60s in localStorage, every page load with a stale cache
 * refetches live; rapid reloads reuse the near-live cache (protects the
 * free APIs from reload-hammering).
 */

/*
Table of Contents
1. Marquee interaction (v1.0.155, user request)
2. Live prices
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

	// ── 2. Live prices ────────────────────────────────────────────
	if ( ! window.fetch ) {
		return;
	}

	var items = Array.prototype.slice.call( document.querySelectorAll( '.ticker .ti[data-src]' ) );
	if ( ! items.length ) {
		return;
	}

	var CACHE_KEY = 'gwill-ticker-v1';
	var TTL = 60 * 1000; // 60s freshness

	var fmt = function ( n, sym ) {
		return sym + Math.round( n ).toLocaleString( 'en-US' );
	};

	var symbolFor = function ( quote ) {
		return quote === 'NGN' ? '₦' : quote === 'USD' ? '$' : '';
	};

	// Update BOTH marquee copies (the ticker renders the strip twice for
	// the seamless translateX(-50%) loop, both must change together).
	var applyRates = function ( pairs ) {
		items.forEach( function ( ti ) {
			var pair = ti.getAttribute( 'data-pair' );
			if ( ! pair || ! pairs[ pair ] ) {
				return;
			}
			var rate = ti.querySelector( '.t-rate' );
			if ( rate ) {
				rate.textContent = pairs[ pair ];
			}
		} );
	};

	var readCache = function () {
		try {
			var c = JSON.parse( localStorage.getItem( CACHE_KEY ) || 'null' );
			if ( c && c.ts && ( Date.now() - c.ts ) < TTL && c.pairs ) {
				return c.pairs;
			}
		} catch ( e ) {}
		return null;
	};

	var writeCache = function ( pairs ) {
		try {
			localStorage.setItem( CACHE_KEY, JSON.stringify( { ts: Date.now(), pairs: pairs } ) );
		} catch ( e ) {}
	};

	var get = function ( url ) {
		// AbortController is Safari 12.1+ / Chrome 66+ / Firefox 57+, on
		// older engines `new AbortController()` throws, and since get() is
		// called synchronously from the fetch chains that would kill the
		// whole live-ticker update on those engines. Guard it: no signal =
		// the 8s timeout just never aborts (static rates stay as fallback).
		var ctrl = window.AbortController ? new AbortController() : null;
		var timer = setTimeout( function () { if ( ctrl ) ctrl.abort(); }, 8000 );
		// F-2 (v1.0.180): 'no-cache' forces revalidation instead of a blind
		// round-trip, so repeat loads within the API's own freshness window
		// can hit the browser cache; the 60s localStorage TTL stays the gate.
		var opts = { cache: 'no-cache' };
		if ( ctrl ) opts.signal = ctrl.signal;
		return fetch( url, opts )
			.then(
				function ( r ) {
					return r.ok ? r.json() : Promise.reject( new Error( 'HTTP ' + r.status ) );
				},
				function ( e ) {
					clearTimeout( timer );
					throw e;
				}
			)
			.then(
				function ( d ) {
					clearTimeout( timer );
					return d;
				},
				function ( e ) {
					clearTimeout( timer );
					throw e;
				}
			);
	};

	var run = function () {
		// Server-side cache (inc/finance-helpers.php → gwill_ticker_cache):
		// when the DOM already carries fresh values (data-ts within 60s),
		// the widget is instant, skip the network entirely.
		if ( ticker ) {
			var serverTs = parseInt( ticker.getAttribute( 'data-ts' ) || '0', 10 );
			if ( serverTs && ( Date.now() - serverTs * 1000 ) < TTL ) {
				return;
			}
		}

		var cached = readCache();
		if ( cached ) {
			applyRates( cached ); // fresh (<60s), no network
			return;
		}

		var fxItems = items.filter( function ( ti ) { return ti.getAttribute( 'data-src' ) === 'fx'; } );

		// FX: ONE call covers every fx pair (rates are per 1 USD).
		var API = ( typeof window.GwillTickerApi !== 'undefined' ) ? window.GwillTickerApi : {};
		var fetchFx = function () {
			if ( ! fxItems.length ) {
				return Promise.resolve( {} );
			}
			return get( API.fx || 'https://open.er-api.com/v6/latest/USD' ).then( function ( d ) {
				var pairs = {};
				if ( d && d.result === 'success' && d.rates ) {
					var r = d.rates;
					fxItems.forEach( function ( ti ) {
						var pair = ti.getAttribute( 'data-pair' ) || '';
						var parts = pair.split( '/' );
						if ( parts.length !== 2 ) {
							return;
						}
						var base = parts[ 0 ];
						var quote = parts[ 1 ];
						if ( ! r[ base ] || ! r[ quote ] ) {
							return;
						}
						pairs[ pair ] = fmt( r[ quote ] / r[ base ], symbolFor( quote ) );
					} );
				}
				return pairs;
			} ).catch( function () { return {}; } );
		};

		// Crypto: source fallback chain (free keyless, CORS-open), one source
		// being down/rate-limited never blocks the others. BTC and ETH share
		// the same three providers, each with its own symbol mapping.
		var CRYPTO_CHAINS = {
			btc: {
				'BTC/USD': {
					coinbase:  API.btc  || 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
					coingecko: API.btcGeo || 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
					binance:   API.btcBin || 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
				}
			},
			eth: {
				'ETH/USD': {
					coinbase:  API.eth  || 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
					coingecko: API.ethGeo || 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
					binance:   API.ethBin || 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'
				}
			}
		};
		var fetchCrypto = function ( src ) {
			var chain = CRYPTO_CHAINS[ src ];
			if ( ! chain || ! items.some( function ( ti ) { return ti.getAttribute( 'data-src' ) === src; } ) ) {
				return Promise.resolve( {} );
			}
			var pair = Object.keys( chain )[ 0 ];
			var urls = chain[ pair ];
			var i = 0;
			var attempt = function () {
				var keys = Object.keys( urls );
				if ( i >= keys.length ) {
					return Promise.resolve( {} );
				}
				var provider = keys[ i++ ];
				return get( urls[ provider ] ).then( function ( d ) {
					var amount = null;
					if ( d && d.data && d.data.amount ) {
						amount = parseFloat( d.data.amount ); // coinbase
					} else if ( d && d[ 'bitcoin' ] && d.bitcoin.usd && 'btc' === src ) {
						amount = d.bitcoin.usd; // coingecko (btc)
					} else if ( d && d.ethereum && d.ethereum.usd && 'eth' === src ) {
						amount = d.ethereum.usd; // coingecko (eth)
					} else if ( d && d.price ) {
						amount = parseFloat( d.price ); // binance
					}
					if ( amount && amount > 0 ) {
						var out = {};
						out[ pair ] = fmt( amount, '$' );
						return out;
					}
					return attempt(); // unexpected shape, next source
				} ).catch( function () { return attempt(); } );
			};
			return attempt();
		};

		// Gold: single free keyless source (api.gold-api.com), XAU/USD in USD.
		var fetchGold = function () {
			if ( ! items.some( function ( ti ) { return ti.getAttribute( 'data-src' ) === 'gold'; } ) ) {
				return Promise.resolve( {} );
			}
			return get( API.gold || 'https://api.gold-api.com/price/XAU' ).then( function ( d ) {
				var price = d && d.price ? parseFloat( d.price ) : null;
				if ( price && price > 0 ) {
					return { 'XAU/USD': fmt( price, '$' ) };
				}
				return {};
			} ).catch( function () { return {}; } );
		};

		// Sources never reject (each swallows its own failure), FX, crypto and
		// gold update independently; a dead source just keeps the static rate.
		Promise.all( [ fetchFx(), fetchCrypto( 'btc' ), fetchCrypto( 'eth' ), fetchGold() ] ).then( function ( res ) {
			var pairs = Object.assign( {}, res[ 0 ], res[ 1 ], res[ 2 ], res[ 3 ] );
			if ( Object.keys( pairs ).length ) {
				applyRates( pairs );
				writeCache( pairs );
			}
		} );
	};

	// After first paint, never blocks rendering.
	if ( 'requestIdleCallback' in window ) {
		window.requestIdleCallback( run, { timeout: 3000 } );
	} else {
		setTimeout( run, 500 );
	}
} )();
