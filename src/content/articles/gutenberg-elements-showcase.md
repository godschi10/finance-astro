---
title: "Gutenberg Elements Showcase"
description: "Every content block WordPress renders on this site, ported one-for-one so the theme's own CSS can be checked against it."
subtitle: "Headings, lists, quotes, tables, code, images, galleries, embeds, cover, columns, media+text, buttons, details and the widget blocks — each one styled by the theme's own rules."
category: "banking"
author: "G-will Chijioke"
authorSlug: "gwill-chijioke"
pubDate: 2026-03-14
readMins: 6
---

<p class="wp-block-paragraph">Welcome to the <strong>Gutenberg element showcase</strong> — every block on this page is styled by the finance theme’s own CSS (zero WordPress block-library bloat). Scroll through: headings, text, lists, quotes, tables, code, images, galleries, local video, local audio, YouTube, Vimeo, Spotify, cover, columns, media+text, buttons, file downloads, details, footnotes and more.</p>

<hr class="wp-block-separator has-alpha-channel-opacity">

<h2 class="wp-block-heading" id="1-headings">1. Headings</h2>

<h3 class="wp-block-heading" id="h3-subheading-level">H3 — subheading level</h3>

<h4 class="wp-block-heading">H4 — small section header</h4>

<p class="wp-block-paragraph">Body paragraph with <a href="#top">a link</a>, <code>inline code</code>, <strong>bold</strong> and <em>emphasis</em> — all matching the cream-and-gold editorial look. Long paragraphs stay readable with relaxed line-height, and links inherit the gold accent without shouting.</p>

<ul class="wp-block-list">
<li>Bullet list item one</li>
<li>Bullet list item two with <code>code</code> inside</li>
<li>Bullet list item three</li>
</ul>

<ol class="wp-block-list">
<li>Ordered item one</li>
<li>Ordered item two</li>
<li>Ordered item three</li>
</ol>

<h2 class="wp-block-heading" id="2-quotes">2. Quotes</h2>

<blockquote class="wp-block-quote is-layout-flow wp-block-quote-is-layout-flow"><p>Standard blockquote — gold bar on the left, muted italic text, styled for pull-out wisdom without stealing focus.</p><cite>— G-Will</cite></blockquote>

<figure class="wp-block-pullquote"><blockquote><p>Pullquote block — a surface card with a gold edge, made for emphasis.</p><cite>Gutenberg Pullquote</cite></blockquote></figure>

<h2 class="wp-block-heading" id="3-tables">3. Tables</h2>

<figure class="wp-block-table"><table><thead><tr class="tbl-best"><th>Feature</th><th>Status</th></tr></thead><tbody><tr><td>Self-hosted fonts</td><td>JetBrains Mono</td></tr><tr><td>Custom block CSS</td><td>v1.0.14</td></tr><tr><td>WP block-library CSS</td><td>Zero bytes</td></tr></tbody></table></figure>

<h2 class="wp-block-heading" id="4-code-blocks">4. Code blocks</h2>

<pre tabindex="0" class="wp-block-code"><code>&lt;?php
// The finance theme's own code surface
$rate = gwill_finance_ticker_items();
echo $rate[0]['value']; // ₦1,582
</code></pre>

<pre tabindex="0" class="wp-block-preformatted">preformatted block — raw whitespace preserved, warm-black surface in both modes.</pre>

<h2 class="wp-block-heading" id="5-images-gallery">5. Images &amp; gallery</h2>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1200" height="675" src="/finance-astro/wp-content/uploads/2026/06/dollar.png" alt="Dollar accounts cover" class="wp-image-34" srcset="/finance-astro/wp-content/uploads/2026/06/dollar.png 1200w, /finance-astro/wp-content/uploads/2026/06/dollar-300x169.png 300w, /finance-astro/wp-content/uploads/2026/06/dollar-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/06/dollar-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px" tabindex="0" role="button" aria-label="Enlarge image: Dollar accounts cover"><figcaption class="wp-element-caption">Image block with a cream caption, rounded corners — click to zoom (lightbox)</figcaption></figure>

<figure class="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-4 is-layout-flex wp-block-gallery-is-layout-flex">

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1200" height="675" data-id="35" src="/finance-astro/wp-content/uploads/2026/05/savings.png" alt="Savings cover" class="wp-image-35" srcset="/finance-astro/wp-content/uploads/2026/05/savings.png 1200w, /finance-astro/wp-content/uploads/2026/05/savings-300x169.png 300w, /finance-astro/wp-content/uploads/2026/05/savings-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/05/savings-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px" tabindex="0" role="button" aria-label="Enlarge image: Savings cover"></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1200" height="675" data-id="37" src="/finance-astro/wp-content/uploads/2026/04/investing.png" alt="Investing cover" class="wp-image-37" srcset="/finance-astro/wp-content/uploads/2026/04/investing.png 1200w, /finance-astro/wp-content/uploads/2026/04/investing-300x169.png 300w, /finance-astro/wp-content/uploads/2026/04/investing-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/04/investing-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px" tabindex="0" role="button" aria-label="Enlarge image: Investing cover"></figure>

<figure class="wp-block-image size-large"><img loading="lazy" decoding="async" width="1200" height="675" data-id="39" src="/finance-astro/wp-content/uploads/2026/03/crypto.png" alt="Crypto cover" class="wp-image-39" srcset="/finance-astro/wp-content/uploads/2026/03/crypto.png 1200w, /finance-astro/wp-content/uploads/2026/03/crypto-300x169.png 300w, /finance-astro/wp-content/uploads/2026/03/crypto-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/03/crypto-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px" tabindex="0" role="button" aria-label="Enlarge image: Crypto cover"></figure>

</figure>

<h2 class="wp-block-heading" id="6-embeds-youtube-vimeo-spotify">6. Embeds — YouTube, Vimeo, Spotify</h2>

<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper"><button type="button" class="gwill-embed gwill-embed--youtube" style="background-image:url('https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg')" data-gwill-src="https://www.youtube.com/embed/aqz-KE-bpKQ?feature=oembed&amp;autoplay=1" data-gwill-title="Big Buck Bunny" data-gwill-allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" data-gwill-referrer="strict-origin-when-cross-origin" aria-label="Play YouTube: Big Buck Bunny"><span class="gwill-embed__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></span><span class="gwill-embed__label">YouTube</span></button></div></figure>

<figure class="wp-block-embed is-type-video is-provider-vimeo wp-block-embed-vimeo wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper"><button type="button" class="gwill-embed gwill-embed--vimeo" style="background-image:url('https://i.vimeocdn.com/video/22439234_640x360.jpg')" data-gwill-src="https://player.vimeo.com/video/22439234?dnt=1&amp;app_id=122963&amp;autoplay=1" data-gwill-title="The Mountain" data-gwill-allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" data-gwill-referrer="strict-origin-when-cross-origin" aria-label="Play Vimeo: The Mountain"><span class="gwill-embed__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></span><span class="gwill-embed__label">Vimeo</span></button></div></figure>

<figure class="wp-block-embed is-type-rich is-provider-spotify wp-block-embed-spotify"><div class="wp-block-embed__wrapper"><button type="button" class="gwill-embed gwill-embed--spotify" data-gwill-src="https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=oembed" data-gwill-title="Spotify Embed: Never Gonna Give You Up" data-gwill-allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" aria-label="Play Spotify: Spotify Embed: Never Gonna Give You Up"><span class="gwill-embed__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg></span><span class="gwill-embed__label">Spotify</span></button></div></figure>

<h2 class="wp-block-heading" id="7-cover-block">7. Cover block</h2>

<div style="aspect-ratio:unset;" class="wp-block-cover alignwide"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-60 has-background-dim"></span><img loading="lazy" decoding="async" width="1200" height="675" class="wp-block-cover__image-background wp-image-34" alt="" src="/finance-astro/wp-content/uploads/2026/06/dollar.png" data-object-fit="cover" srcset="/finance-astro/wp-content/uploads/2026/06/dollar.png 1200w, /finance-astro/wp-content/uploads/2026/06/dollar-300x169.png 300w, /finance-astro/wp-content/uploads/2026/06/dollar-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/06/dollar-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px"><div class="wp-block-cover__inner-container is-layout-flow wp-block-cover-is-layout-flow"><p class="has-text-align-center has-large-font-size wp-block-paragraph">Cover block — image background with dark dim, rounded, content centered</p></div></div>

<h2 class="wp-block-heading" id="8-columns-mediatext">8. Columns &amp; media+text</h2>

<div class="wp-block-columns is-layout-flex wp-container-core-columns-is-layout-8f761849 wp-block-columns-is-layout-flex">
<div class="wp-block-column is-layout-flow wp-block-column-is-layout-flow">
<p class="wp-block-paragraph"><strong>Left column.</strong> Columns flex side-by-side on desktop, stack on mobile.</p>
</div>

<div class="wp-block-column is-layout-flow wp-block-column-is-layout-flow">
<p class="wp-block-paragraph"><strong>Right column.</strong> Equal flex widths, gap handled by the theme.</p>
</div>
</div>

<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img loading="lazy" decoding="async" width="1200" height="675" src="/finance-astro/wp-content/uploads/2026/06/dollar.png" alt="" class="wp-image-34 size-full" srcset="/finance-astro/wp-content/uploads/2026/06/dollar.png 1200w, /finance-astro/wp-content/uploads/2026/06/dollar-300x169.png 300w, /finance-astro/wp-content/uploads/2026/06/dollar-1024x576.png 1024w, /finance-astro/wp-content/uploads/2026/06/dollar-768x432.png 768w" sizes="auto, (max-width: 1200px) 100vw, 1200px"></figure><div class="wp-block-media-text__content">
<p class="wp-block-paragraph">Media + text block — image left, content right, vertically centered. Stacks to one column on small screens.</p>
</div></div>

<h2 class="wp-block-heading" id="9-buttons-details">9. Buttons &amp; details</h2>

<div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex">
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Solid button</a></div>

<div class="wp-block-button is-style-outline is-style-outline--5"><a class="wp-block-button__link wp-element-button">Outline button</a></div>
</div>

<details class="wp-block-details is-layout-flow wp-block-details-is-layout-flow"><summary>Click to expand — details block</summary>
<p class="wp-block-paragraph">Hidden content revealed. Summary is a gold mono prompt, body sits on the surface card.</p>
</details>

<hr class="wp-block-separator has-alpha-channel-opacity">

<p class="wp-block-paragraph"><em>That’s the whole tour — every Gutenberg block styled custom, no WordPress CSS shipped. 🚀</em></p>

<h2 class="wp-block-heading" id="10-widget-utility-blocks">10. Widget &amp; utility blocks</h2>

<p class="wp-block-paragraph">Everything below is styled by the theme too — drop any of these into any post.</p>

<form role="search" method="get" action="/finance-astro/search/" class="wp-block-search__button-outside wp-block-search__text-button wp-block-search"><label class="wp-block-search__label" for="wp-block-search__input-6">Search the blog</label><div class="wp-block-search__inside-wrapper"><input class="wp-block-search__input" id="wp-block-search__input-6" placeholder="" value="" type="search" name="q" required=""><button aria-label="Go" class="wp-block-search__button wp-element-button" type="submit">Go</button></div></form>

<ul class="wp-block-categories-list wp-block-categories-taxonomy-category wp-block-categories">	<li class="cat-item cat-item-7"><a href="/finance-astro/category/banking/">Banking</a>
</li>
<li class="cat-item cat-item-8"><a href="/finance-astro/category/budgeting/">Budgeting</a>
</li>
<li class="cat-item cat-item-6"><a href="/finance-astro/category/crypto/">Crypto</a>
</li>
<li class="cat-item cat-item-2"><a href="/finance-astro/category/dollar-accounts/">Dollar Accounts</a>
</li>
<li class="cat-item cat-item-12"><a href="/finance-astro/category/investing/fixed-income/">Fixed Income</a>
</li>
<li class="cat-item cat-item-5"><a href="/finance-astro/category/investing/">Investing</a>
</li>
<li class="cat-item cat-item-4"><a href="/finance-astro/category/remittance/">Remittance</a>
</li>
<li class="cat-item cat-item-3"><a href="/finance-astro/category/savings/">Savings</a>
</li>
</ul>

<ul class="wp-block-archives-list wp-block-archives">	<li><a href="/finance-astro/articles/">July 2026</a></li>
<li><a href="/finance-astro/articles/">June 2026</a></li>
<li><a href="/finance-astro/articles/">May 2026</a></li>
<li><a href="/finance-astro/articles/">April 2026</a></li>
<li><a href="/finance-astro/articles/">March 2026</a></li>
<li><a href="/finance-astro/articles/">February 2026</a></li>
<li><a href="/finance-astro/articles/">January 2026</a></li>
</ul>

<ul class="wp-block-social-links is-layout-flex wp-block-social-links-is-layout-flex"><li class="wp-social-link wp-social-link-x wp-block-social-link"><a href="https://x.com/gwillchijioke" class="wp-block-social-link-anchor"><svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21h5.245l-7.131-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z"></path></svg><span class="wp-block-social-link-label screen-reader-text">X</span></a></li><li class="wp-social-link wp-social-link-linkedin wp-block-social-link"><a href="https://www.linkedin.com/" class="wp-block-social-link-anchor"><svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z"></path></svg><span class="wp-block-social-link-label screen-reader-text">LinkedIn</span></a></li></ul>

<ol class="has-dates has-excerpts wp-block-latest-comments"><li class="wp-block-latest-comments__comment"><article><footer class="wp-block-latest-comments__comment-meta"><span class="wp-block-latest-comments__comment-author">Groot</span> on <a class="wp-block-latest-comments__comment-link" href="/finance-astro/articles/?from=gutenberg-elements-showcase/#comment-81">Gutenberg Elements Showcase — Every Block Styled</a><time datetime="2026-09-09T13:52:34+00:00" class="wp-block-latest-comments__comment-date">September 9, 2026</time></footer><div class="wp-block-latest-comments__comment-excerpt"><p>8969000866</p>
</div></article></li><li class="wp-block-latest-comments__comment"><article><footer class="wp-block-latest-comments__comment-meta"><span class="wp-block-latest-comments__comment-author">Groot</span> on <a class="wp-block-latest-comments__comment-link" href="/finance-astro/articles/?from=gutenberg-elements-showcase/#comment-80">Gutenberg Elements Showcase — Every Block Styled</a><time datetime="2026-09-09T13:24:17+00:00" class="wp-block-latest-comments__comment-date">September 9, 2026</time></footer><div class="wp-block-latest-comments__comment-excerpt"><p>Alright</p>
</div></article></li><li class="wp-block-latest-comments__comment"><article><footer class="wp-block-latest-comments__comment-meta"><span class="wp-block-latest-comments__comment-author">Groot</span> on <a class="wp-block-latest-comments__comment-link" href="/finance-astro/articles/?from=gutenberg-elements-showcase/#comment-79">Gutenberg Elements Showcase — Every Block Styled</a><time datetime="2026-09-02T05:13:00+00:00" class="wp-block-latest-comments__comment-date">September 2, 2026</time></footer><div class="wp-block-latest-comments__comment-excerpt"><p>I just remembered that vibecommets got a whole lot of features and I want to make sure we have designed…</p>
</div></article></li><li class="wp-block-latest-comments__comment"><article><footer class="wp-block-latest-comments__comment-meta"><span class="wp-block-latest-comments__comment-author">Groot</span> on <a class="wp-block-latest-comments__comment-link" href="/finance-astro/articles/?from=gutenberg-elements-showcase/#comment-78">Gutenberg Elements Showcase — Every Block Styled</a><time datetime="2026-08-04T06:53:44+00:00" class="wp-block-latest-comments__comment-date">August 4, 2026</time></footer><div class="wp-block-latest-comments__comment-excerpt"><p>ssh -i Oracle/ssh-key-2026-04-28.key ubuntu@132.145.8.196</p>
</div></article></li><li class="wp-block-latest-comments__comment"><article><footer class="wp-block-latest-comments__comment-meta"><a class="wp-block-latest-comments__comment-author" href="http://finance.gwillchijioke.com">G-will Chijioke</a> on <a class="wp-block-latest-comments__comment-link" href="/finance-astro/articles/?from=gutenberg-elements-showcase/#comment-77">Gutenberg Elements Showcase — Every Block Styled</a><time datetime="2026-08-04T05:26:22+00:00" class="wp-block-latest-comments__comment-date">August 4, 2026</time></footer><div class="wp-block-latest-comments__comment-excerpt"><p>ssh -i gwillchijioke.com_VPS_Keys/ssh-key-2026-07-31.key ubuntu@150.230.112.34</p>
</div></article></li></ol>

<pre tabindex="0" class="wp-block-verse">$ naira watch
USD/NGN  ₦1,582
EUR/NGN  ₦1,842
GBP/NGN  ₦2,110</pre>

<p class="wp-block-paragraph">This sentence has a footnote.<sup class="footnote-ref"><a href="#fn-1" id="fnref-1">[1]</a></sup></p>
