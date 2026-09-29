# The Social Edit House

Production custom CSS and JavaScript for https://www.thesocialedithouse.com/.
Published-code migration from CodeSandbox to the `brandvm/socialedithouse` repository, prepared September 29, 2026.

## Install in Webflow

1. Copy the complete contents of [`webflow/head.html`](webflow/head.html) to **Site settings → Custom code → Head code**, replacing the Social Edit House global custom-head block. Preserve any unrelated tracking/verification code you have added separately.
2. Copy [`webflow/footer.html`](webflow/footer.html) to **Site settings → Custom code → Footer code**, replacing the old Lenis loader/initialization, standalone Lottie script, and CodeSandbox JavaScript reference.
3. In the Designer's shared global code Embed, remove the stylesheet link to `https://8n3dq9.csb.app/SocialEditHouse/socialedit-main.css`. The new head already loads its replacement. Remove any duplicate custom JavaScript references from page code or Embeds. Do not run both old and new scripts.
4. Remove the old `.preloader { display: flex !important; }` rule, the old `html.is-loading` scroll-lock rules, and the duplicate viewport meta tag. The replacement head handles the preloader safely; Webflow already supplies its viewport tag.
5. The journal grid and article drop-cap styles have been consolidated into the new CSS, scoped to their original Webflow page IDs. You can remove the matching inline custom style blocks on Contact, Journal, and the Journal CMS template after comparing them with [`originals/journal-grid.css`](originals/journal-grid.css) and [`originals/journal-dropcap.css`](originals/journal-dropcap.css). Other page-specific styles should stay.
6. Keep Webflow's generated CSS, jQuery, Webflow runtime, GSAP, ScrollTrigger, SplitText and CustomEase enabled. Do not paste copies of these generated script tags. Their inclusion is managed by Webflow.
7. Keep the `[data-preloader]` element and its `[data-preloader-lottie]` child for the desktop intro. The custom code now handles its fade directly. The old IX3 interaction named **Custom Preloader** is no longer emitted by this code; it can be deleted after staging verification. Keep the unrelated scrolling and mobile-menu interactions.
8. The existing copyright-year Embed can stay. Its source is backed up in [`originals/copyright-year.js`](originals/copyright-year.js).
9. Save and publish to the Webflow staging domain first. Check the homepage, menu, enquiry form without submitting, `/studio#Fashion`, journal layout, and an article. Then publish the approved changes to the custom domain and test the actual Instagram in-app browser on a phone.

The head and footer point to the immutable `v1.0.0` tag. Do not use `@main` for production. For the next update, create a new tag and update **both** file URLs. The intro JSON resolves relative to the JavaScript URL, so it uses the same release automatically.

## What changed

- Migrated the published custom JavaScript, custom CSS, global utilities and page-specific styles.
- Moved Lenis initialization into the custom JavaScript. Lenis stays at its existing version, 1.1.5; no library upgrade is mixed into the migration.
- Mobile/tablet widths up to 991px, coarse-pointer devices, and reduced-motion users skip the intro and do not request Lottie or its JSON.
- Desktop plays the existing two-second Lottie at 2× speed and uses a 200ms fade. There is no `window.load` dependency and no old one-second IX3 pause.
- The head snippet removes the overlay after 2.2 seconds from head-script execution even if the external custom JavaScript never arrives. This bounds the intro gate, not the total website load time; a slow stylesheet can still delay rendering.
- Touch/reduced-motion devices use native scrolling. Desktop smooth scrolling remains.
- Existing nav shrink, sticky positioning, ampersand formatting, reveal animations, anchors and tab deep links remain.
- Original public custom code is preserved in `originals/`. Webflow layout, CMS data, generated runtime and media assets stay managed in Webflow. This is not a full Webflow site export, and unpublished code was not accessible through the live site.

## Remaining Webflow speed work

### Replace the hero video

The current MP4 is **20,978,410 bytes (~21 MB)**, reports **2560 × 1280** decoded dimensions, and uses autoplay plus `preload="auto"` with no poster.

- Export a shorter, compressed 720p or 1080p H.264 MP4 with the audio track removed and fast-start enabled. Aim for a few MB where visual quality permits; compare the result on a phone.
- Add a compressed poster image to the `<video>` element so there is an immediate fallback when playback is delayed or disabled.
- Prefer a static hero on mobile, or a separate much smaller mobile video. Merely hiding a video with CSS does not reliably prevent downloading it. For a static mobile design, keep the desktop video URL out of `src` until desktop eligibility is known.
- Keep `muted` and `playsinline`. Changing only `preload="auto"` to `none` while retaining autoplay is not a reliable download fix.
- These repository changes do not replace or compress the video itself.

### Images, fonts and publishing

- Optimize the journal screenshot PNGs to WebP/AVIF where appropriate; retain Webflow responsive image variants and lazy loading below the fold.
- Keep the hero poster and visible brand logo eager-loaded. The live logo is currently marked lazy.
- Review which font families/weights are actually used before removing any. The live site requests Cormorant and Playfair via WebFont Loader plus uploaded custom fonts. Avoid deleting a family based only on the homepage.
- Check Webflow's available HTML/CSS/JS minification options and enable those offered for this site. Re-test custom interactions on staging after changing publishing settings.
- Add a title, description and compressed Open Graph image in each important page's settings, including the homepage and Journal CMS template. This improves social previews; it is separate from in-app page-loading speed.

## Validation

- `npm run check`: JavaScript syntax.
- `npm test`: six loader failure/behavior cases: mobile, reduced motion, reveal before `window.load`, missing main script, animation stall, and Lottie network failure.
- Browser test on a local copy of the published homepage: desktop dependencies initialized without errors; mobile loaded zero Lottie/intro JSON requests, used native scrolling, and the Webflow mobile menu opened.
- Browser test on a local copy of Studio: direct `#Fashion` URL activated the Fashion tab and scrolled to its section.
- The live Webflow site has not been changed or published by this migration. Actual Instagram-device testing remains part of rollout.

## Rollback

Restore the original Webflow head/footer from `originals/` and the original CodeSandbox CSS link if those endpoints remain available. The original main CSS/JS are also saved here. Restoring the original configuration restores the original loader delays as well. Avoid mixing the old footer script with the new optimized head.

## Sources

- Existing public custom code: `https://8n3dq9.csb.app/SocialEditHouse/socialedit-main.js` and `.css`.
- Additional custom styles inventoried from the eight pages listed in `originals/page-inventory.json`.
- Lottie intro JSON originally hosted on the site's Webflow assets CDN.
- jsDelivr versioning: https://github.com/jsdelivr/jsdelivr#github
- Webflow custom code: https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags
