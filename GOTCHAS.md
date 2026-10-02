# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

<!-- Add new entries here, newest first. -->

### 2026-09-29 · Forced preloader could trap visitors when the script failed
- Area: loader
- Scope: template-candidate
- Symptom: The original head forced `.preloader { display: flex !important }`
  and locked scroll on `html.is-loading` (`originals/webflow-head.html`);
  if the CodeSandbox script was slow or failed, the overlay stayed up.
- Cause: The overlay was only released by external JS after `window.load`
  plus a one-second IX3 pause.
- Fix: `webflow/head.html` carries a small inline fallback that removes the
  intro after 2.2 s regardless; the JS drops the `window.load` wait and
  skips the intro on mobile, coarse pointers and reduced motion. Covered by
  `tests/intro.test.cjs`.
- Status: fixed 4af7471
- Found by: human

### 2026-09-29 · Intro skip condition lives in three places
- Area: js
- Scope: project
- Symptom: Changing the 991px / coarse-pointer / reduced-motion rule in one
  place leaves the intro shown or hidden inconsistently.
- Cause: The same media query is in the head `<style>`, the head
  `<script>` (`webflow/head.html`) and `socialedit-main.js`.
- Fix: change all three together and re-paste the head snippet.
- Status: documented
- Found by: human

### 2026-09-29 · Custom CSS no longer renders on the Designer canvas
- Area: designer
- Scope: template-candidate
- Symptom: Repo styles do not appear in the Designer.
- Cause: The migration moved the stylesheet link from the shared Embed
  (README install step 3) into Head code (`webflow/head.html`); site
  custom code is not rendered on the canvas.
- Fix: none yet. Check on staging, or ask the user whether to move the
  `<link>` back into an Embed.
- Status: open
- Found by: human

### 2026-09-29 · Journal styles are keyed to Webflow page IDs
- Area: css
- Scope: project
- Symptom: Journal grid or drop-cap styling silently disappears.
- Cause: The rules migrated from per-page Embeds are scoped with
  `html[data-wf-page="…"]` (`socialedit-main.css`, journal-grid section).
  Duplicating or recreating the Contact/Journal page or the Journal CMS
  template changes its page ID.
- Fix: update the IDs in `socialedit-main.css` when a page is recreated;
  prefer moving these styles into the Designer.
- Status: open
- Found by: human

### 2026-09-29 · Hero video is ~21 MB
- Area: perf
- Scope: project
- Symptom: Slow first load, especially in the Instagram in-app browser.
- Cause: 2560×1280 MP4, autoplay, `preload="auto"`, no poster (README
  "Replace the hero video").
- Fix: not in this repo — re-export a compressed 720p/1080p MP4 without
  audio, add a poster, prefer a static mobile hero. Done in Webflow.
- Status: open
- Found by: human

## Known from previous projects

Inherited from `wf-template`; only the entries that apply to this
repo's architecture are copied. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: open
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: open
- Found by: human

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: open
- Found by: human

### 2026-10-02 · CDN `defer` scripts cannot be ordered against the bundle
- Area: js
- Scope: template-candidate
- Symptom: Lenis, GSAP or Finsweet is undefined when a module runs.
- Cause: The footer loader appends the bundle dynamically (async), so a
  sibling `<script defer>` has no ordering promise.
- Fix: bundle libraries with `pnpm add`. Do not also load Webflow's own GSAP
  or jQuery a second time.
- Status: documented
- Found by: human
