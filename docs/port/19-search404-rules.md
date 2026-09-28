# Search results + 404 page — theme CSS slice (source: wp-style.css, captured 2026-09-27)

- `.phd`  [.phd]
  - background: var(--surface); border-bottom: 1px solid var(--border); padding: 40px var(--con-pad) 32px;
- `.phd`  [@media (max-width: 1023px) :: .phd, .about-hero]
  - padding-left: var(--con-pad); padding-right: var(--con-pad);
- `.phd`  [@media (max-width: 767px) :: .phd]
  - padding: 24px 20px 20px;
- `.phd h1`  [.phd h1]
  - font-size: 28px; font-weight: 800; letter-spacing: -0.04em; color: var(--text); margin-bottom: 6px;
- `.phd p`  [.phd p]
  - font-size: 13px; font-weight: 300; color: var(--text-dim); max-width: 520px;
- `.search-pill`  [.search-pill]
  - display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: var(--r-md); padding: 8px 8px 8px 14px; background: var(--surface); transition: border-color var(--t), box-shadow var(--t);
- `.search-pill .search-form`  [.search-pill .search-form]
  - flex: 1;
- `.search-pill:focus-within`  [.search-pill:focus-within]
  - border-color: var(--gold-border); box-shadow: 0 0 0 3px rgba(217,119,6,0.08);
- `.search-form`  [.search-form]
  - display: flex; align-items: center; gap: 8px; flex: 1;
- `.search-form`  [@media print :: .sh, .snav, .nsearch, .msearch, .hbg, .mno, .ticker, .ticker-inner,
  .ad-bg, .gwill-comment-ad, .share-row, .share-b, .cp-strip, .cp-scroll-btn,
  .gconsent, .gpwa, .gwill-bell-panel, .gbp-btn, .m-nl-wrap, .article-sidebar,
  .sw, .prog, .ftop, .fpush, .toc-list, .toc-dropdown, .legal-toc,
  .search-form, .btt]
  - display: none !important;
- `.search-label`  [.search-label]
  - position: relative; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; margin: 0;
- `.search-icon`  [.search-icon]
  - color: var(--text-dim); flex-shrink: 0;
- `.search-field`  [.search-field]
  - border: none; outline: none; font-size: 12px; color: var(--text); background: transparent; width: 100%; padding: 0; font-family: var(--font);
- `.search-field`  [@media (max-width: 767px) :: .gs-input, .search-field,
  .gwill-form input[type="text"], .gwill-form input[type="email"], .gwill-form input[type="tel"],
  .gwill-form textarea, .gwill-form select,
  .nl-hero-form .gwill-form input[type="email"],
  .comment-respond input[type="text"], .comment-respond input[type="email"], .comment-respond input[type="url"],
  .comment-respond textarea,
  .art-body .wp-block-search__input]
  - font-size: 16px;
- `.search-field::placeholder`  [.search-field::placeholder]
  - color: var(--text-dim);
- `.search-field:focus-visible`  [.search-field:focus-visible]
  - outline: 2px solid var(--gold); outline-offset: 2px; border-radius: var(--r-sm);
- `.search-submit`  [.search-submit]
  - background: var(--gold-btn); color: #fff; border: none; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; padding: 9px 18px; border-radius: var(--r-sm); white-space: nowrap; cursor: pointer; transition: background var(--t); line-height: 1; height: 36px;
- `.search-submit`  [@media (pointer: coarse) :: .search-submit]
  - height: 44px;
- `.search-submit:hover`  [.search-submit:hover]
  - background: #92400e;
- `.error-404`  [.error-404]
  - text-align: center; padding: 80px var(--con-pad) 100px;
- `.error-404`  [@media (max-width: 767px) :: .error-404]
  - padding: 60px 20px 80px;
- `.error-404__code`  [.error-404__code]
  - font-size: 96px; font-size: clamp(64px, 10vw, 120px); font-weight: 800; color: var(--gold); letter-spacing: -0.05em; line-height: 1; text-shadow: 0 0 30px var(--gold-glow);
- `.es`  [.es]
  - max-width: 560px; margin: 0 auto; text-align: center;
- `.es-glyph`  [.es-glyph]
  - width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 20px;
  background: var(--gold-muted); border: 1px solid var(--gold-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 800; color: var(--gold);
- `.es-title`  [.es-title]
  - font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: var(--text); margin: 0 0 8px;
- `.es-copy`  [.es-copy]
  - font-size: 13px; font-weight: 300; color: var(--text-dim); line-height: 1.7; margin: 0 auto 24px; max-width: 400px;
- `.es .cp-strip`  [.es .cp-strip]
  - justify-content: center; justify-content: safe center; margin-bottom: 28px; padding-left: 4px; padding-right: 4px; padding-inline: 4px; scroll-padding-left: 4px; scroll-padding-right: 4px; scroll-padding-inline: 4px;
- `.es .btn`  [.es .btn]
  - text-decoration: none;
- `.es .search-pill`  [.es .search-pill]
  - max-width: 360px; margin: 0 auto 24px; text-align: left;
- `.es .gwill-breadcrumbs__list`  [.es .gwill-breadcrumbs__list]
  - justify-content: center;
- `.gwill-breadcrumbs`  [.gwill-breadcrumbs]
  - margin-bottom: 18px;
