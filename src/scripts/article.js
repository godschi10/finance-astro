/**
 * GWill Finance — article (single post) page behaviours.
 *
 * A faithful port of everything the WordPress theme runs on a single post.
 * Every block below cites its provenance as `file:line` against the theme
 * source at /home/opc/projects/gwill-finance-theme (theme v1.13.39, git HEAD
 * fadf888; the live `main.js?ver=1.13.39` bytes were diff-verified identical
 * to the file on disk, see 03-article-js.md header):
 *
 *   assets/js/main.js      §5  reading progress       main.js:244-254
 *                          §6  mobile TOC dropdown    main.js:256-300
 *                          §6b table a11y / fade      main.js:302-326
 *                          §6b table feature chips    main.js:328-358
 *                          §6c sidebar TOC fade       main.js:360-373
 *                          §7  TOC scroll-spy         main.js:376-394
 *                          §8  copy-link share row    main.js:396-437
 *                          §11 ad-slot device variants main.js:508-565
 *                          §12 comment-section ads    main.js:567-609
 *   assets/js/lightbox.js  whole file, enqueued `is_singular()` (enqueue.php:169-193)
 *   assets/js/embeds.js    whole file, enqueued `is_singular() && has_block('core/embed')`
 *                          (enqueue.php:464-487)
 *
 * End state this must produce (04-live-oracle.md measurements, 390/768/1280):
 *   #gwill-toc-mobile      class "toc-dropdown toc-mobile toc-open toc-scrolled-end"
 *   .toc-summary[aria-expanded]="true"      (oracle §B5, at every width)
 *   #gwill-toc-mobile-list display:flex
 *   .toc-i.cur             ABSENT at scrollY 0 — all five items are plain `.toc-i`
 *                          (oracle §B11 + "Oddities" #6: PHP ships `cur` on the
 *                          first item, the scroll-spy's initial call removes it,
 *                          because every heading's offsetTop is already > 120)
 *   [data-copy]            label "Copy Link" at rest (oracle §B8)
 *
 * Two theme quirks are reproduced on purpose and documented inline where they
 * live: the brace nesting that gates table wiring on #gwill-toc-mobile
 * (main.js:258-374, section 3 below) and the comment-ad double-insert guard
 * that cannot line up past the first ad (main.js:592, section 10 below — it
 * makes the insert pass non-terminating from 11 main comments up, in the theme
 * too; measured, and left untouched so the port stays behaviourally identical).
 *
 * Everything is guarded: `if (!el) return` / `if (!el) { … }` so the module is
 * safe on a page where any of these elements are absent.
 *
 * NOT ported here, deliberately (see the notes at the foot of the file):
 *   - CSS-only behaviours (smooth scroll + scroll-padding-top, .toc-bar/.toc-g
 *     choice, mobile table overflow, print hiding) — no JS in the theme.
 *   - Code-block copy buttons — they do not exist in the theme (NOT FOUND).
 *   - The site shell in main.js §1-§4 / §9-§10 / §13-§15 / §16 (mobile nav,
 *     consent-gated sticky ad, category pills, font-scale .fs-lg), which is
 *     page chrome shared by every template, not an article behaviour.
 *
 * Table of Contents
 *  1. i18n strings
 *  2. Reading progress bar                     (main.js §5)
 *  3. Mobile TOC dropdown + affordances        (main.js §6)
 *  4. Table a11y + scrollbar fade              (main.js §6b)
 *  5. Table feature chips                      (main.js §6b)
 *  6. Desktop sidebar TOC scrollbar fade       (main.js §6c)
 *  7. TOC scroll-spy                           (main.js §7)
 *  8. Copy-link share button                   (main.js §8)
 *  9. Ad slots, device-aware variants          (main.js §11)
 * 10. Comment-section ads                      (main.js §12)
 * 11. Image lightbox                           (lightbox.js)
 * 12. Embed facades + fullscreen scroll fixes  (embeds.js)
 * 13. Not ported / not found
 */

(function () {
	'use strict';

	// ── 1. i18n strings ─────────────────────────────────────────────
	// The theme reads its UI strings from wp_localize_script globals with
	// English fallbacks that are byte-identical to the localised values
	// (main.js:39, lightbox.js:35, enqueue.php:71-77 / 183-190). Reading the
	// same globals keeps behaviour identical whether or not the Astro page
	// localises them.
	const I18N = (typeof window.GwillMain !== 'undefined' && window.GwillMain.i18n) || {};
	// (GwillLightbox i18n is consumed by scripts/lightbox.js, which
	// [slug].astro imports beside this module — not by this file.)

	// ── 2. Reading progress bar (main.js:244-254) ───────────────────
	// Fills .prog-f, the INNER element; .prog (the sticky track) is never
	// touched by JS. Geometry is the whole DOCUMENT scroll range, not the
	// article element's. One style write per scroll event — the theme has no
	// rAF, no debounce, no throttle (main.js:252 is a bare listener) — and
	// no reduced-motion guard: the smoothing is purely the CSS
	// `transition: width 120ms linear` (style.css:1965). At scrollY 0 the
	// width is 0%, at the bottom 100%; the bar is never hidden by JS.
	// The initial call at parse time is what makes a restored scroll position
	// (reload / back-forward) correct before the first scroll event.
	const prog = document.querySelector('.prog-f');
	if (prog) {
		const onScroll = () => {
			const doc = document.documentElement;
			const max = doc.scrollHeight - window.innerHeight;
			prog.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	// ── 3. Mobile TOC dropdown (main.js:256-300) ────────────────────
	// Open by default, remembers the visitor's choice. Visibility is 100% CSS
	// off the `toc-open` class (style.css:2415-2416) — no `hidden` attribute,
	// no inline display, no <details>.
	const tocDrop = document.getElementById('gwill-toc-mobile');

	// ── QUIRK, reproduced exactly ───────────────────────────────────
	// In the theme, `if (tocDrop) {` opens at main.js:258 and closes at
	// main.js:374 — which means the table wiring (§6b), the feature chips
	// (§6b) and the sidebar TOC scrollbar fade (§6c) all sit INSIDE that
	// guard: on a page without #gwill-toc-mobile the theme wires none of them
	// either. The nesting is deliberate here, not an accident of the port;
	// sections 3-6 below are the theme's guarded block verbatim. The
	// scroll-spy (section 7) is OUTSIDE it in the theme (main.js:377) and is
	// outside it here too.
	if (tocDrop) {
		const TOC_KEY = 'gwill_toc_mobile_open';
		const tocBtn = tocDrop.querySelector('.toc-summary');

		const setToc = (open) => {
			tocDrop.classList.toggle('toc-open', open);
			if (tocBtn) tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
		};

		// Server-rendered default vs JS default: single.php:126 hard-codes
		// aria-expanded="true" while the class starts absent, and main.js is
		// deferred — so between first paint and script execution the panel is
		// collapsed while announcing expanded (spec 03 §3a FOUC note). The
		// port reproduces the theme's JS exactly (open unless the visitor
		// stored 'closed'), which is the state the live oracle measured:
		// `toc-open` + aria-expanded="true" (04-live-oracle.md §B5).
		// Astro should therefore render aria-expanded="true" server-side to
		// kill that mismatch, or add `toc-open` pre-paint.
		try {
			const savedToc = localStorage.getItem(TOC_KEY);
			setToc(savedToc !== 'closed'); // default open
		} catch (e) {
			setToc(true); // private mode / storage disabled
		}

		if (tocBtn) {
			tocBtn.addEventListener('click', () => {
				const open = !tocDrop.classList.contains('toc-open');
				setToc(open);
				try { localStorage.setItem(TOC_KEY, open ? 'open' : 'closed'); } catch (e) { /* private mode */ }
			});
		}

		// Mobile TOC scroll affordances (main.js:277-300): bottom fade class
		// `toc-scrolled-end` when within 2px of the list's end, and the
		// inverted `toc-idle` scrollbar rule (CSS defaults to a visible gold
		// bar; .toc-idle, added 1500ms after the first user scroll, fades it).
		// On load only the scrolled-end state is evaluated — the idle timer is
		// deliberately NOT started, so a JS-less page and a fresh page both
		// keep the scrollbar visible (main.js:295-299).
		const tocList = tocDrop.querySelector('.toc-list');
		if (tocList) {
			let tocScrollTimer = null;
			const tocFade = () => {
				const atEnd = tocList.scrollTop + tocList.clientHeight >= tocList.scrollHeight - 2;
				tocDrop.classList.toggle('toc-scrolled-end', atEnd);
				tocDrop.classList.remove('toc-idle');
				clearTimeout(tocScrollTimer);
				tocScrollTimer = setTimeout(() => {
					tocDrop.classList.add('toc-idle');
				}, 1500);
			};
			tocList.addEventListener('scroll', tocFade, { passive: true });
			// Load-time state only (oracle §B5: the live dropdown carries
			// `toc-scrolled-end` at every width, including 390 where the list
			// is 200.94px tall with scrollHeight 201).
			const listAtEnd = tocList.scrollTop + tocList.clientHeight >= tocList.scrollHeight - 2;
			tocDrop.classList.toggle('toc-scrolled-end', listAtEnd);
		}

		// ── 4. Table a11y + scrollbar fade (main.js:302-326) ────────
		// The theme never wraps tables in a JS scroller: `.wp-block-table`
		// IS the scroller (style.css:901-904 makes it overflow-x:auto on
		// mobile, overflow:hidden with a radius above 767px). JS only makes an
		// overflowing one keyboard-reachable and fades its scrollbar.
		Array.prototype.forEach.call(document.querySelectorAll('.wp-block-table'), (tbl) => {
			// Overflow test with a 1px tolerance (main.js:311).
			if (tbl.scrollWidth > tbl.clientWidth + 1) {
				tbl.setAttribute('tabindex', '0');
				tbl.setAttribute('role', 'group');
				if (!tbl.getAttribute('aria-label')) {
					tbl.setAttribute('aria-label', I18N.scrollableTable || 'Scrollable table');
				}
			}
			let tblTimer = null;
			tbl.addEventListener('scroll', () => {
				tbl.classList.remove('tbl-idle');
				clearTimeout(tblTimer);
				tblTimer = setTimeout(() => {
					tbl.classList.add('tbl-idle');
				}, 1500);
			}, { passive: true });
			// No initial evaluation on purpose: CSS ships a visible gold
			// scrollbar, so a JS failure leaves it visible (style.css:906-917).
		});

		// ── 5. Table feature chips (main.js:328-358) ────────────────
		// Turns "★ 4.5 / 5", "✓ Yes", "✗ No" cell text into chips and
		// highlights the best row. `.st-table` is the tools-page table; the
		// theme scans it in the same pass, which is a harmless no-op on an
		// article. Runs once at parse — there is no observer, so tables
		// injected later are not decorated (main.js:445 in the spec).
		const gwillExposeTableFeatures = (tbl) => {
			const rows = tbl.querySelectorAll('tr');
			let bestEl = null;
			let bestScore = -1;
			Array.prototype.forEach.call(rows, (tr) => {
				const cells = tr.querySelectorAll('th, td');
				let rowScore = 0;
				Array.prototype.forEach.call(cells, (cell) => {
					const txt = cell.textContent.trim();
					// ★ rating: score by the numeric value (e.g. "★ 4.5 / 5")
					if (cell.classList.contains('tbl-star')) { return; }
					const starMatch = txt.match(/^\s*★\s*(\d+(?:\.\d+)?)/);
					if (starMatch) {
						cell.classList.add('tbl-star');
						rowScore += parseFloat(starMatch[1]) * 10;
						return;
					}
					if (/^[✓✔]/.test(txt)) { cell.classList.add('tbl-ck', 'tbl-yes'); rowScore += 1; return; }
					if (/^[✗✘]/.test(txt)) { cell.classList.add('tbl-ck', 'tbl-no'); return; }
					if (/^[\u2605]/.test(txt)) { cell.classList.add('tbl-star'); return; }
				});
				if (rowScore > bestScore) { bestScore = rowScore; bestEl = tr; }
			});
			if (bestEl && !bestEl.classList.contains('tbl-best')) { bestEl.classList.add('tbl-best'); }
		};
		Array.prototype.forEach.call(document.querySelectorAll('.wp-block-table, .st-table'), gwillExposeTableFeatures);

		// ── 6. Desktop sidebar TOC scrollbar fade (main.js:360-373) ──
		// Same inverted pattern as the tables: visible until the user scrolls,
		// then .toc-idle 1500ms after the last scroll. No initial call.
		// `.toc-scroll` is display:none at 390 (oracle §C1), so no scroll
		// events fire there.
		Array.prototype.forEach.call(document.querySelectorAll('.toc-scroll'), (tocScroll) => {
			let tocScrollTimer = null;
			tocScroll.addEventListener('scroll', () => {
				tocScroll.classList.remove('toc-idle');
				clearTimeout(tocScrollTimer);
				tocScrollTimer = setTimeout(() => {
					tocScroll.classList.add('toc-idle');
				}, 1500);
			}, { passive: true });
		});
	}

	// ── 7. TOC scroll-spy (main.js:376-394) ─────────────────────────
	// Plain scroll maths, NOT an IntersectionObserver — the theme has no
	// IntersectionObserver anywhere in assets/js/. Gated on more than one
	// link: a one-heading article gets no spy at all. The offset is a
	// hard-coded `window.scrollY + 120` proxy for "just below the sticky
	// header"; it does not read --header-h (64px) and is not responsive.
	// The winner is the LAST link in document order whose target heading
	// has `offsetTop <= pos` (later matches overwrite `current`), compared
	// with offsetTop — not getBoundingClientRect().
	// The class is toggled on every `.toc-i` in the document, and the
	// initial call is what removes PHP's server-rendered `cur` on the first
	// item: at scrollY 0 every heading's offsetTop is already past 120, so
	// `current` stays null and no item is highlighted (oracle "Oddities" #6).
	const tocLinks = document.querySelectorAll('.toc-i a');
	if (tocLinks.length > 1) {
		const tocSpy = () => {
			const pos = window.scrollY + 120; // below sticky header
			let current = null;
			tocLinks.forEach((link) => {
				const target = document.getElementById(link.getAttribute('href').slice(1));
				if (target && target.offsetTop <= pos) {
					current = link.closest('.toc-i');
				}
			});
			document.querySelectorAll('.toc-i').forEach((item) => {
				item.classList.toggle('cur', item === current);
			});
		};
		window.addEventListener('scroll', tocSpy, { passive: true });
		tocSpy();
	}

	// ── 8. Copy-link share button (main.js:396-437) ─────────────────
	// Only the fourth control in the share row is scripted. The other three
	// (X, LinkedIn, WhatsApp) are plain `<a target="_blank"
	// rel="noopener noreferrer">` with pre-built URLs and need NO JS —
	// deliberately no handlers are added for them here (spec 03 §4: "no JS
	// handler"). The selector set is generic (`[data-copy]`), matching the
	// theme, so any template that renders one gets the behaviour.
	const copyBtns = document.querySelectorAll('[data-copy]');
	// a11y (WCAG 4.1.2): one lazily-created visually-hidden polite region
	// serves every copy button, appended to <body> once, cleared then re-set
	// 50ms later so copying the same link twice re-announces.
	let copyStatus = null;
	const copyDone = (btn, ok) => {
		const msg = ok ? (I18N.copied || '✓ Copied') : (I18N.copyFailed || 'Copy failed');
		btn.textContent = msg;
		// Disabled while the feedback shows, so double-clicks cannot stack.
		// Note: the theme ships NO `.share-b:disabled` styling, so the button
		// looks identical to an enabled one for those 2 seconds (spec §4a).
		btn.disabled = true;
		if (!copyStatus) {
			copyStatus = document.createElement('div');
			copyStatus.className = 'screen-reader-text';
			copyStatus.setAttribute('aria-live', 'polite');
			document.body.appendChild(copyStatus);
		}
		copyStatus.textContent = '';
		setTimeout(() => { copyStatus.textContent = msg; }, 50);
		setTimeout(() => {
			btn.textContent = I18N.copyLink || 'Copy Link';
			btn.disabled = false;
		}, 2000);
	};
	copyBtns.forEach((btn) => {
		btn.addEventListener('click', () => {
			// The theme always renders the permalink in data-copy; the href
			// fallback is defensive and kept identical.
			const url = btn.getAttribute('data-copy') || window.location.href;
			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard.writeText(url)
					.then(() => { copyDone(btn, true); })
					.catch(() => { copyDone(btn, false); });
			} else {
				// No clipboard API or an insecure context: throwaway
				// textarea, select(), execCommand('copy') inside try/catch.
				const ta = document.createElement('textarea');
				ta.value = url;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				let ok = false;
				try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
				document.body.removeChild(ta);
				copyDone(btn, ok);
			}
		});
	});

	// ── 9. Ad slots, device-aware variants (main.js:508-565) ────────
	// In-content rect ads are PHP-injected (inc/in-content-ad.php); the
	// client-side half is this scan. Each `.ad-slot` ships up to three inert
	// `<template class="ad-variant" data-device>` codes and only the matching
	// one is instantiated, then the templates are removed so they cannot be
	// re-used, and the slot gets `.ad-filled` to drop its placeholder ring.
	// Comment-ad clones call `gwillScanAdSlots(clone)` to resolve their own
	// template variants (main.js:601), which is why this block is ported even
	// though it looks like a chrome concern.
	const gwillGetDevice = () => {
		if (window.matchMedia('(max-width: 767px)').matches) {
			return 'mobile';
		}
		if (window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches) {
			return 'tablet';
		}
		return 'desktop';
	};

	const gwillFillSlot = (slot) => {
		const content = slot.querySelector('.ad-slot__content');
		if (!content) return;
		if (content.querySelector('template.ad-variant')) {
			const device = gwillGetDevice();
			let tpl = content.querySelector('template.ad-variant[data-device="' + device + '"]');
			if (!tpl) {
				// No device-specific code, fall back to the desktop/base variant.
				tpl = content.querySelector('template.ad-variant[data-device="desktop"]');
			}
			if (tpl) {
				content.appendChild(tpl.content.cloneNode(true));
				content.dataset.gwillDevice = device;
			}
			// Templates are removed whether or not one matched.
			Array.prototype.forEach.call(content.querySelectorAll('template.ad-variant'), (t) => { t.remove(); });
		}
		// Filled slots drop the placeholder (coin + label).
		if (content.children.length > 0) {
			slot.classList.add('ad-filled');
		}
	};

	const gwillScanAdSlots = (root) => {
		const slots = root.querySelectorAll ? root.querySelectorAll('.ad-slot') : [];
		Array.prototype.forEach.call(slots, gwillFillSlot);
	};

	gwillScanAdSlots(document);
	// Exposed for other scripts (the theme's homepage AJAX grid re-scans after
	// swapping cards, main.js:556-558); kept because the comment-ad clone path
	// documents it as the public entry point.
	window.gwillScanAdSlots = gwillScanAdSlots;

	// Rotate device variant on resize (phone -> tablet landscape etc.),
	// debounced 250ms (main.js:561-565).
	let gwillResizeTimer = null;
	window.addEventListener('resize', () => {
		clearTimeout(gwillResizeTimer);
		gwillResizeTimer = setTimeout(() => { gwillScanAdSlots(document); }, 250);
	});

	// ── 10. Comment-section ads (main.js:567-609) ───────────────────
	// VibeComments renders its list over AJAX, so nothing is server-side to
	// hook: the theme keeps hidden rect slots in #gwill-comment-ads and clones
	// them into #vibe-comment-list after EVERY 5th MAIN comment (5th, 10th,
	// 15th …), never inside reply threads.
	//
	// INERT IN THIS PORT, BY DESIGN: the static Astro article page has no
	// live comment thread and no #vibe-comment-list, so `gwillCommentAdInsert`
	// returns on its first lookup and the MutationObserver watches a list that
	// never appears. The code is ported faithfully anyway (guarded so it
	// no-ops) because the behaviour is part of the theme's article page and
	// will start working the moment a comment list is rendered.
	const gwillCommentAdSource = document.getElementById('gwill-comment-ads');
	if (gwillCommentAdSource) {
		const gwillCommentAdInsert = () => {
			const list = document.querySelector('#vibe-comment-list');
			if (!list) return; // inert until a comment list exists
			// Direct children only, top-level main comments, never replies:
			// the plugin nests replies inside the parent <li>, so
			// `list.children` can never yield one (spec 03 §5a).
			const mains = Array.prototype.filter.call(list.children, (li) => {
				return li.classList && li.classList.contains('comment');
			});
			if (mains.length < 6) return; // Fewer than 6 mains: no ad.
			const sources = gwillCommentAdSource.querySelectorAll('.gwill-comment-ad');
			if (!sources.length) return;
			// After the 5th, 10th, 15th… main comment, cycling the sources so
			// multiple configured codes alternate down the thread.
			//
			// ⚠ REPRODUCED THEME QUIRK (verified, not introduced here): the
			// double-insert guard below reads `list.children[at]`, but each
			// insertion shifts every later index by one, so the guard only
			// lines up for the FIRST ad. From 11 main comments up, the 10th
			// slot never reports "already filled", the observer re-inserts a
			// clone on every mutation, and the insert pass never terminates
			// (measured: 10 mains => exactly 1 ad, terminates; 11 mains =>
			// MutationObserver microtask loop, identical in the theme's own
			// main.js). Left byte-faithful for parity; the fix, if ever
			// wanted, is to compare the slot AFTER the anchor
			// (`anchor.nextElementSibling`) instead of `list.children[at]`.
			// Inert in this static port: there is no #vibe-comment-list.
			for (let at = 5; at < mains.length; at += 5) {
				const srcIndex = ((at / 5) - 1) % sources.length;
				// Never double-insert: a slot with the marker already sits there.
				if (list.children[at] && list.children[at].classList.contains('gwill-comment-ad')) continue;
				const clone = sources[srcIndex].cloneNode(true);
				clone.removeAttribute('id'); // the holder's id must not duplicate
				clone.style.display = '';    // the source holder is display:none
				clone.classList.add('gwill-comment-ad');
				// Insert AFTER the Nth main comment (nth child of the list).
				const anchor = mains[at - 1];
				anchor.parentNode.insertBefore(clone, anchor.nextSibling);
				// The clone carries <template> device variants, instantiate.
				gwillScanAdSlots(clone);
			}
		};
		// Never disconnected and unthrottled in the theme too (main.js:604-607):
		// every DOM mutation anywhere re-runs the insert pass, plus one
		// immediate call at parse.
		const gwillCommentObserver = new MutationObserver(() => {
			gwillCommentAdInsert();
		});
		gwillCommentObserver.observe(document.body, { childList: true, subtree: true });
		gwillCommentAdInsert();
	}

	// ── 11. Image lightbox — REMOVED: the theme enqueues assets/js/lightbox.js
	// as its own file (enqueue.php:169-193); the verbatim port src/scripts/lightbox.js
	// is imported beside this module in [slug].astro. One script, one overlay,
	// exactly the theme's architecture. (A folded copy here previously bound a
	// second document-level click listener → two stacked .gl-overlay per click,
	// which is why the × needed two presses to close.)
	// ── 12. Embed facades (embeds.js, whole file) ───────────────────
	// The theme only enqueues embeds.js when the post actually has a
	// core/embed block (`is_singular() && has_block('core/embed')`,
	// enqueue.php:464-487) — it is ABSENT on the reference article. The port
	// mirrors that by doing nothing unless `.gwill-embed` facades are
	// present, so it is inert on an article without embeds.
	//
	// v1.0.189 fullscreen-exit scroll restore: the flagship mobile bug fix of
	// this page (spec 03 §6b). Numbers are the theme's: a guarded rAF loop for
	// up to 1500ms, restores de-duplicated within 500ms, coarse-pointer
	// resize arming at ±40px width / +300px height, |orientation| === 90,
	// and a scroll watchdog for a single jump > 200px landing at y <= 120
	// with an anchor >= 300 and no touch/wheel gesture in the last 600ms.
	const embedsInit = () => {
		if (!document.querySelector('.gwill-embed')) return; // no embed facades on this page

		let active = null; // { y, iframe, w, h, armed, lastRestoreAt }
		const isCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
		let lastGesture = 0;
		let lastY = -1;

		const pageY = () => {
			return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
		};

		const inFullscreen = () => {
			return !!(document.fullscreenElement || document.webkitFullscreenElement);
		};

		const restoreScroll = (target) => {
			const html = document.documentElement;
			const prev = html.style.scrollBehavior;
			const deadline = Date.now() + 1500; // outlast the WebView's late reset
			let cancelled = false;

			// Rotation + resize fire back-to-back for the same exit; one
			// guarded restore is enough.
			if (active && active.lastRestoreAt && Date.now() - active.lastRestoreAt < 500) {
				return;
			}
			if (active) {
				active.lastRestoreAt = Date.now();
			}

			html.style.scrollBehavior = 'auto'; // instant, never animate the restore

			const apply = () => {
				if (cancelled || Date.now() > deadline) {
					if (!cancelled) {
						html.style.scrollBehavior = prev;
					}
					return;
				}
				if (Math.abs(pageY() - target) > 2) {
					window.scrollTo(0, target);
				}
				if (window.requestAnimationFrame) {
					window.requestAnimationFrame(apply);
				} else {
					window.setTimeout(apply, 32);
				}
			};

			// Never fight the user: the guard stops on their first input.
			const stop = () => {
				cancelled = true;
				html.style.scrollBehavior = prev;
			};
			document.addEventListener('wheel', stop, { passive: true, once: true });
			document.addEventListener('touchstart', stop, { passive: true, once: true });
			document.addEventListener('keydown', stop, { once: true });

			apply();
		};

		const onFullscreenChange = () => {
			if (!active) {
				return;
			}
			if (inFullscreen()) {
				// Entered fullscreen. Refresh the anchor on fine pointers
				// (desktop: the page has not scrolled yet). On touch devices
				// the layout may already be rotating, so trust the activation
				// offset instead of reading a possibly-clobbered position.
				if (!isCoarse) {
					const y = pageY();
					if (y > 0) {
						active.y = y;
					}
				}
			} else {
				// Exited fullscreen: restore, with the guard.
				restoreScroll(active.y);
			}
		};

		const onResize = () => {
			if (!active || !isCoarse) {
				return;
			}
			// Mobile WebViews that use a rotating custom view (or iOS native
			// fullscreen) may never fire fullscreenchange; the viewport resize
			// IS the fullscreen signal.
			const w = window.innerWidth;
			const h = window.innerHeight;
			const wider = w > active.w + 40;   // rotation into landscape
			const narrower = w < active.w - 40; // back to portrait
			const taller = h > active.h + 300; // fullscreen chrome hidden, no rotation
			if (wider || taller) {
				active.armed = true;
			} else if (narrower || (h < active.h - 300 && active.armed)) {
				active.armed = false;
				restoreScroll(active.y);
			}
			active.w = w;
			active.h = h;
		};

		const onOrientationChange = () => {
			if (!active || !isCoarse) {
				return;
			}
			if (Math.abs(window.orientation) === 90) {
				active.armed = true; // landscape, fullscreen-ish
			} else if (active.armed) {
				active.armed = false; // back to portrait, exit fullscreen
				restoreScroll(active.y);
			}
		};

		// Scroll watchdog: the failure signature on phones is a SINGLE
		// programmatic jump that lands at the top while the video is active
		// and no page gesture preceded it. The user's own scrolling is exempt:
		// it is made of small deltas and always follows a touch/wheel gesture.
		const bumpGesture = () => {
			lastGesture = Date.now();
		};
		document.addEventListener('touchstart', bumpGesture, { passive: true });
		document.addEventListener('touchend', bumpGesture, { passive: true });
		document.addEventListener('wheel', bumpGesture, { passive: true });

		const onScrollWatchdog = () => {
			if (!active) {
				lastY = pageY();
				return;
			}
			const y = pageY();
			const jump = lastY >= 0 && Math.abs(y - lastY) > 200; // one big move
			lastY = y;
			if (!jump) {
				return; // gesture scrolling / momentum steps
			}
			if (y > 120) {
				return; // not the top, leave it
			}
			if (active.y < 300) {
				return; // the anchor is near the top anyway, nothing to save
			}
			if (Date.now() - lastGesture < 600) {
				return; // the user's own gesture drove this
			}
			restoreScroll(active.y);
		};
		window.addEventListener('scroll', onScrollWatchdog, { passive: true });

		document.addEventListener('fullscreenchange', onFullscreenChange);
		document.addEventListener('webkitfullscreenchange', onFullscreenChange);
		window.addEventListener('resize', onResize);
		window.addEventListener('orientationchange', onOrientationChange);

		const activate = (facade) => {
			const src = facade.getAttribute('data-gwill-src');
			if (!src) {
				return;
			}

			const iframe = document.createElement('iframe');
			iframe.src = src;
			iframe.title = facade.getAttribute('data-gwill-title') || '';
			iframe.allow = facade.getAttribute('data-gwill-allow') || '';
			iframe.referrerPolicy = facade.getAttribute('data-gwill-referrer') || 'strict-origin-when-cross-origin';
			iframe.allowFullscreen = true;
			iframe.loading = 'lazy';
			iframe.setAttribute('frameborder', '0');

			if (facade.classList.contains('gwill-embed--spotify')) {
				// No aspect-ratio class; the iframe provides its own box.
				iframe.style.width = '100%';
				iframe.style.height = '152px';
				iframe.style.borderRadius = '12px';
				facade.replaceWith(iframe);
			} else {
				// Aspect-ratio box comes from the block's wp-has-aspect-ratio
				// ::before. Lay the iframe OVER the button and HIDE the button
				// in place (v1.0.188): removing it would destroy the browser's
				// scroll anchor and focus target at the video's position.
				iframe.style.position = 'absolute';
				iframe.style.inset = '0';
				iframe.style.width = '100%';
				iframe.style.height = '100%';
				facade.style.visibility = 'hidden';
				facade.style.pointerEvents = 'none';
				facade.setAttribute('tabindex', '-1');
				facade.setAttribute('aria-hidden', 'true');
				facade.parentNode.insertBefore(iframe, facade.nextSibling);
			}

			// Hand focus to the player (keyboard path); also gives the browser
			// a stable focus target for its own exit restoration.
			iframe.focus();

			// Remember where the video lives on the page; the guarded restore
			// and the scroll watchdog both return here.
			active = { y: pageY(), iframe: iframe, w: window.innerWidth, h: window.innerHeight, armed: false, lastRestoreAt: 0 };
			lastY = active.y;
		};

		document.addEventListener('click', (event) => {
			const facade = event.target && event.target.closest ? event.target.closest('.gwill-embed') : null;
			if (facade) {
				activate(facade);
			}
		});
	};

	embedsInit();

	/*
	 * ── 13. NOT PORTED / NOT FOUND ──────────────────────────────────
	 *
	 * CSS-only on this page — deliberately NO JS written for them:
	 *   - Smooth scrolling + the sticky-header offset: `html { scroll-behavior:
	 *     smooth; scroll-padding-top: calc(var(--header-h, 64px) + 20px) }`
	 *     (style.css:172 → 84px desktop / 76px ≤767px, style.css:2986).
	 *     There is no click handler on TOC anchors anywhere in the theme's JS
	 *     (spec 03 §2d, §9). `prefers-reduced-motion: reduce` turns it off in
	 *     CSS (style.css:3189) — so there is no JS reduced-motion guard to port
	 *     either.
	 *   - `.toc-bar` vs `.toc-g` (h2 tick vs h3 spacer) is chosen by PHP in
	 *     single.php:255-268; JS never adds, removes or swaps them.
	 *   - Heading ids and the TOC list itself are PHP
	 *     (inc/table-of-contents.php) — nothing to do in JS.
	 *   - Mobile table overflow: `.art-body .wp-block-table { overflow-x: auto }`
	 *     + `table { width: max-content; min-width: 100% }` (style.css:901-904),
	 *     `.sb-layout > div { min-width: 0 }` (style.css:2970) and
	 *     `html { overflow-x: hidden; overflow-x: clip }` (style.css:172).
	 *   - The mobile-TOC caret rotation, the bottom fade and the print-hide
	 *     lists are all CSS (style.css:2352, :2365-2370, :3457).
	 *   - Firefox-Android scrollbar blowout is CSS (style.css:2379-2408).
	 *   - Comment-thread indentation on phones is CSS in
	 *     assets/css/vibe-comments.css:233-278 — no theme JS participates.
	 *
	 * NOT FOUND in the theme (so nothing was written):
	 *   - No code-block copy button and no syntax highlighter. The only
	 *     code-block handling is PHP: `gwill_finance_content_a11y_fixes()`
	 *     rewrites `<pre` → `<pre tabindex="0"` (helpers.php:691-709).
	 *   - No IntersectionObserver, no rAF/debounce on the progress bar or the
	 *     TOC scroll-spy, no hide/show of the progress bar at either end, no
	 *     reduced-motion guard on either (spec 03 §9).
	 *   - No theme-side comment sort / Load More / reply logic — that is the
	 *     VibeComments plugin script (v3.20.28), not part of this port.
	 *
	 * Site shell, out of scope for article.js (shared by every template; the
	 * theme keeps them in the same main.js but they are not article
	 * behaviours, and none of them were asked for here):
	 *   - main.js:41-242   mobile nav overlay, split-tap sub-menus, desktop
	 *                      dropdowns on touch, dual html+body scroll lock
	 *                      (main.js:103-131, "body-only locking never locks
	 *                      when html has overflow-x: clip") and
	 *                      `focus({ preventScroll: true })` at main.js:143 /
	 *                      :154.
	 *   - main.js:439-506  consent-gated sticky footer ad + the 160px
	 *                      bottom guard, and the consent dialog's
	 *                      `preventScroll` focus (main.js:467).
	 *   - main.js:611-741  category pill scroll buttons and arrow-key
	 *                      navigation (listing pages only).
	 *   - main.js:742-767  `gwillFontScaleCheck()` — the `.fs-lg` ≥20px
	 *                      font-scale probe, which belongs with the shared
	 *                      base layer, not with one page.
	 *   - The dark-mode boot / theme pill is an inline `<head>` script
	 *     (inc/darkmode.php:51-169) and the flex-gap probe is inline in
	 *     header.php:37-47 — both are head bootstraps, not article JS.
	 */
})();
