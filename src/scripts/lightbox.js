/**
 * Lightbox, click-to-view full-size images in post content
 *
 * Vanilla JS, no dependencies. Applied to all images inside .art-body
 * that aren't inside a gallery block (gallery uses its own viewer).
 *
 * Ported verbatim from gwill-finance-theme assets/js/lightbox.js (1.13.39),
 * enqueued on every singular page (inc/enqueue.php:170-192) with the
 * GwillLightbox i18n object printed by wp_localize_script(). In the port the
 * i18n object is printed inline right before this script's tag.
 *
 * @package GWill_Finance
 */

/*
Table of Contents
1. State
2. Build DOM
3. build
4. Touch / swipe
5. open
6. close
7. navigate
8. Show current
9. showImage
10. Presentational-image guard
11. isPresentational
12. Gather images in context
13. gatherImages
14. Init: attach click handlers
15. init
16. Kick off after DOM
*/

(function() {
  'use strict';

  // Aria labels, localized via GwillLightbox.i18n (inc/enqueue.php), English
  // fallback keeps output identical when no translation is loaded.
  var L_I18N = ( typeof window.GwillLightbox !== 'undefined' && window.GwillLightbox.i18n ) || {};

  // ── 1. State ──────────────────────────────────────────────────
  var overlay, img, closeBtn, prevBtn, nextBtn, counterEl, captionEl;
  var currentImg, images, currentIndex;
  // The image that opened the dialog, focus returns here on close (2.4.3).
  var lastTrigger = null;

  // ── 2. Build DOM ──────────────────────────────────────────────
  // ── 3. build ──────────────────────────────────────────────────
  function build() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'gl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', L_I18N.lightbox || 'Image lightbox');
    overlay.innerHTML =
      '<button class="gl-close" aria-label="' + ( L_I18N.close || 'Close' ) + '">&times;</button>' +
      '<button class="gl-nav gl-prev" aria-label="' + ( L_I18N.prev || 'Previous image' ) + '">&lsaquo;</button>' +
      '<div class="gl-image-wrap"><img class="gl-image" src="" alt=""></div>' +
      '<button class="gl-nav gl-next" aria-label="' + ( L_I18N.next || 'Next image' ) + '">&rsaquo;</button>' +
      '<div class="gl-counter"></div>' +
      '<div class="gl-caption"></div>';

    document.body.appendChild(overlay);

    img       = overlay.querySelector('.gl-image');
    closeBtn  = overlay.querySelector('.gl-close');
    prevBtn   = overlay.querySelector('.gl-prev');
    nextBtn   = overlay.querySelector('.gl-next');
    counterEl = overlay.querySelector('.gl-counter');
    captionEl = overlay.querySelector('.gl-caption');

    // Events
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    prevBtn.addEventListener('click', function(e) { e.stopPropagation(); navigate(-1); });
    nextBtn.addEventListener('click', function(e) { e.stopPropagation(); navigate(1); });

    document.addEventListener('keydown', function(e) {
      if (!overlay.classList.contains('gl-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      // Tab trap (WCAG 2.4.3): keep focus inside the dialog.
      if (e.key === 'Tab') {
        var focusables = Array.prototype.filter.call(overlay.querySelectorAll('button'), function(b) {
          var st = getComputedStyle(b);
          return st.display !== 'none' && st.visibility !== 'hidden' && !b.disabled;
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !overlay.contains(document.activeElement)) {
            e.preventDefault(); last.focus();
          }
        } else {
          if (document.activeElement === last || !overlay.contains(document.activeElement)) {
            e.preventDefault(); first.focus();
          }
        }
      }
    });

    // ── 4. Touch / swipe ──────────────────────────────────────────
    var touchStartX = 0, touchStartY = 0;
    overlay.addEventListener('touchstart', function(e) {
      if (e.target.closest('.gl-close') || e.target.closest('.gl-nav')) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    overlay.addEventListener('touchend', function(e) {
      if (e.target.closest('.gl-close') || e.target.closest('.gl-nav')) return;
      var dx = e.changedTouches[0].screenX - touchStartX;
      var dy = e.changedTouches[0].screenY - touchStartY;
      // Only trigger if horizontal swipe > vertical and > threshold
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        navigate(dx > 0 ? -1 : 1);
      }
    }, { passive: true });
  }

  // ── 5. open ───────────────────────────────────────────────────
  function open(imgEl, index) {
    build();
    images = gatherImages(imgEl);
    currentIndex = index !== undefined ? index : images.indexOf(imgEl);
    if (currentIndex === -1) currentIndex = 0;
    lastTrigger = imgEl;
    showImage();
    overlay.classList.add('gl-open');
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog (WCAG 2.4.3).
    if (closeBtn) closeBtn.focus();
  }

  // ── 6. close ──────────────────────────────────────────────────
  function close() {
    overlay.classList.remove('gl-open');
    document.body.style.overflow = '';
    // Return focus to the triggering image (WCAG 2.4.3).
    if (lastTrigger && lastTrigger.focus) { lastTrigger.focus(); lastTrigger = null; }
  }

  // ── 7. navigate ───────────────────────────────────────────────
  function navigate(dir) {
    if (!images || images.length < 2) return;
    currentIndex = (currentIndex + dir + images.length) % images.length;
    showImage();
  }

  // ── 8. Show current ───────────────────────────────────────────
  // ── 9. showImage ──────────────────────────────────────────────
  function showImage() {
    if (!images || !images[currentIndex]) return;
    var el = images[currentIndex];
    var src = el.getAttribute('data-full') || el.src || el.getAttribute('data-src') || '';
    // Use the largest available src
    var fullSrc = el.dataset.fullUrl || el.src;
    // For WP images, try to get the full size
    var srcset = el.srcset || '';
    if (srcset) {
      var sources = srcset.split(',');
      var last = sources[sources.length - 1].trim().split(' ')[0];
      if (last) fullSrc = last;
    }
    img.src = fullSrc || src;
    img.alt = el.alt || '';

    // Caption
    var fig = el.closest('figure');
    var cap = fig ? fig.querySelector('.wp-element-caption, figcaption') : null;
    captionEl.textContent = cap ? cap.textContent : '';

    // Counter
    counterEl.textContent = images.length > 1 ? (currentIndex + 1) + ' / ' + images.length : '';

    // Nav visibility
    prevBtn.style.display = images.length > 1 ? '' : 'none';
    nextBtn.style.display = images.length > 1 ? '' : 'none';
  }

  // ── 10. Presentational-image guard ────────────────────────────
  // Decorative images (cover backgrounds, aria-hidden, role=presentation,
  // empty alt with no title) must stay OUT of the interaction tree .
  // agentic-browsing audit: "Elements marked as presentational should be
  // consistently ignored". Marking them role=button made the tree
  // ambiguous (interactive AND presentational at once).
  // ── 11. isPresentational ──────────────────────────────────────
  function isPresentational(img) {
    if (img.closest('.wp-block-cover')) return true;
    if (img.getAttribute('role') === 'presentation') return true;
    if (img.getAttribute('aria-hidden') === 'true') return true;
    if (img.getAttribute('alt') === '' && !img.getAttribute('title')) return true;
    return false;
  }

  // ── 12. Gather images in context ──────────────────────────────
  // ── 13. gatherImages ──────────────────────────────────────────
  function gatherImages(startEl) {
    // If inside a gallery block, get all images in that gallery
    var gallery = startEl.closest('.wp-block-gallery');
    if (gallery) {
      return Array.from(gallery.querySelectorAll('img')).filter(function(i) { return !isPresentational(i); });
    }
    // Otherwise, get all images in .art-body
    var prose = startEl.closest('.art-body');
    if (prose) {
      return Array.from(prose.querySelectorAll('img')).filter(function(i) { return !isPresentational(i); });
    }
    return [startEl];
  }

  // ── 14. Init: attach click handlers ───────────────────────────
  // ── 15. init ──────────────────────────────────────────────────
  function init() {
    // Keyboard-openable images (WCAG 2.1.1): every unlinked art-body image
    // becomes a focusable button that opens the lightbox on Enter/Space.
    // The image's alt stays in the accessible name (aria-label prefix +
    // description, never a bare "Enlarge image" that would swallow alt).
    var enlarge = L_I18N.enlarge || 'Enlarge image';
    Array.prototype.forEach.call(document.querySelectorAll('.art-body img'), function(el) {
      if (el.closest('a')) return; // already linked, skip
      if (isPresentational(el)) return; // decorative, keep out of the a11y tree
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', enlarge + (el.alt ? ': ' + el.alt : ''));
    });
    document.addEventListener('keydown', function(e) {
      var t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t && t.tagName === 'IMG' && !isPresentational(t) && t.closest('.art-body') && !t.closest('a')) {
        e.preventDefault();
        var all = gatherImages(t);
        var idx = all.indexOf(t);
        open(t, idx !== -1 ? idx : 0);
      }
    });

    document.addEventListener('click', function(e) {
      // Only handle clicks on images inside .art-body
      var target = e.target.closest('.art-body img');
      if (!target) return;
      // Skip presentational/decorative images (cover backgrounds etc.)
      if (isPresentational(target)) return;

      // Skip if the image is inside an <a> tag (already linked)
      if (target.closest('a')) return;

      // Skip if inside a gallery that uses native linking
      e.preventDefault();

      // Find index
      var allImgs = gatherImages(target);
      var idx = allImgs.indexOf(target);
      open(target, idx !== -1 ? idx : 0);
    });
  }

  // ── 16. Kick off after DOM ────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
