# The Social Edit House — Webflow custom code

Agent instructions for this repository. Codex, Cursor and similar tools read
this file directly; Claude Code reads it through `CLAUDE.md`. It is the single
source of agent rules — edit this file, never a copy of it.

This is a **hosting migration of inherited studio code** (Blankboard Studio,
previously on CodeSandbox), not a project built from `brandvm/wf-template`.
There is **no build step**: `socialedit-main.css`, `socialedit-main.js` and
`assets/intro.json` are served as-is from pinned jsDelivr tags. No bundler,
no loader, no staging bundle.

## Project facts

- Client / site: The Social Edit House
- GitHub: `brandvm/socialedithouse`, default branch `main`
- Webflow site ID: `6a2c23e994e4e8e4391f3636` (inferred from the Webflow
  asset CDN path in `originals/socialedit-main.js`; verify)
- Staging site: unknown — fill in (README refers to "the Webflow staging
  domain" without naming it)
- Assets (production, pinned):
  `https://cdn.jsdelivr.net/gh/brandvm/socialedithouse@v1.0.0/socialedit-main.css`,
  `https://cdn.jsdelivr.net/gh/brandvm/socialedithouse@v1.0.0/socialedit-main.js`
  (`assets/intro.json` resolves relative to the JS URL)
- Production domain: `https://www.thesocialedithouse.com/`
- Production release: `v1.0.0`
- Libraries: Lenis 1.1.5 from jsDelivr npm (footer tag); Lottie 5.12.2
  requested by the JS on desktop only. Webflow supplies jQuery, GSAP,
  ScrollTrigger, SplitText, CustomEase and IX3.

## Who owns what

Webflow owns markup, layout, classes, components, CMS content, interactions
**and styling by default**. This repo owns JavaScript behaviour and only the
CSS the Designer cannot express.

That split is deliberate. Repo CSS loads from Head code after `webflow.css`,
so it wins every specificity tie against the Designer. Any rule written here
that the Designer could have expressed becomes a hidden override: the next
person changes that style in the Designer, nothing happens, and the only fix
is edit `socialedit-main.css` → tag a release → update the Head link →
publish. Every project has lost time to that loop.

## CSS policy — Designer first

Before writing any CSS, decide where it belongs.

1. **Can the Designer do it?** A class or combo class style, a variable, a
   breakpoint style, a state (hover/focus/current), an interaction. If yes:
   - With the Webflow MCP connected, apply it in Webflow (styles and
     variables tools), then tell the user what was changed.
   - Without the MCP, give the user exact Designer steps: class, breakpoint,
     property, value.
   - Do **not** add it to `socialedit-main.css`.
2. **Repo CSS needs a reason.** Every rule — or the section header comment
   covering a group of rules — carries one tag from this list:

   ```css
   /* repo-css: <tag> — <short why> */
   ```

   | Tag | Use for |
   | --- | --- |
   | `js-state` | Classes/attributes a module toggles (`.is-open`, `.is-loading`, `[data-state]`) |
   | `designer-cant` | Name the feature: `:has()`, complex combinators, `@keyframes`, `@supports`, container queries, `::marker`, `color-mix()`, masks |
   | `third-party` | Swiper, Lenis, Finsweet or other library markup |
   | `canvas-preview` | `.w-editor`, `.wf-design-mode`, `html:not([data-wf-domain])` helpers |
   | `approved-base` | A site-wide base the user explicitly asked to keep in code |
   | `override-webflow` | Overriding a `.w-*` default or a Designer style |

3. **`override-webflow` needs the user's explicit approval** and a
   `GOTCHAS.md` entry explaining why. Ask before writing it.
4. **Never, without that approval:** set `font-size` on `:root`/`html`,
   neutralize `.w-*` defaults, or reference Webflow variable names
   (`--_layout---…`, `--_typography---…`). A renamed variable in Webflow
   silently breaks every rule that reads it — Webflow rewrites its own
   references, never this repo's.
5. **Ambiguous request?** Say which parts go in the Designer and which go in
   code before editing anything. "Make the heading bigger on mobile" is a
   Designer breakpoint style, not a media query here.

Existing rules predate this policy and are untagged; add a `repo-css` tag to
any rule you touch, and question rules the Designer could own. (The inherited
§01 Token Hub already sets a fluid `:root` font-size and reads
`--_colors---*` Webflow variables, and the journal rules are scoped by
`data-wf-page` IDs — see `GOTCHAS.md`; do not extend these patterns.)

## Inherited code stays behaviour-identical

`socialedit-main.css` and `socialedit-main.js` are inherited studio code,
already changed once on purpose in v1.0.0 (intro loading, see README "What
changed"). Unless the user asks otherwise, every further change must leave
existing behaviour identical:

- No refactors, reformatting, selector rewrites, rule reordering, library
  upgrades (Lenis stays 1.1.5, Lottie 5.12.2) or "cleanups" mixed into
  another change. Propose them separately.
- Keep nav shrink, sticky positioning, ampersand formatting, reveal
  animations, anchors and tab deep links (`/studio#Fashion`), the editor
  exclusions (`Webflow.env("editor")`) and the touch/reduced-motion native
  scrolling exactly as they are.
- `originals/` is the read-only snapshot of the published CodeSandbox code,
  Webflow head/footer and page-specific styles. Never edit it; diff against
  it when checking behaviour, and use it for rollback.
- `npm test` intro tests must keep passing.

## Architecture

- `socialedit-main.js` — all site logic plus the Lenis initializer and the
  desktop intro (Lottie, 2× speed, 200 ms fade). It derives its own
  versioned directory from `document.currentScript.src` and loads
  `assets/intro.json` from there.
- `socialedit-main.css` — the CodeSandbox CSS plus the migrated global
  utilities and the journal grid / drop-cap styles, scoped to their original
  Webflow page IDs (`html[data-wf-page="…"]`).
- `webflow/head.html` holds an **inline** preloader fallback (`<style>` +
  `<script>`) that removes the intro after 2.2 s even if the CDN script
  never arrives. The skip condition
  `(max-width: 991px), (pointer: coarse), (prefers-reduced-motion: reduce)`
  is duplicated in that `<style>`, that `<script>` and `socialedit-main.js`
  — change all three together, or none.
- `tests/intro.test.cjs` runs the JS and the head script in `node:vm`.

## Where code loads in Webflow (drives the Designer workflow)

| Snippet | Webflow location | Contents |
| --- | --- | --- |
| `webflow/head.html` | Site settings → Custom code → Head | theme-color, preconnect, `<link>` to `socialedit-main.css`, inline preloader fallback |
| `webflow/footer.html` | Site settings → Custom code → Footer | `<script defer>` Lenis, then `<script defer>` `socialedit-main.js` |

- CSS loads from **Head code, so none of it is visible on the Designer
  canvas.** (The original CodeSandbox link sat in a shared Embed; the
  migration moved it to the head.) Check CSS on the published staging site.
- **The Designer canvas never runs scripts.** No live reload; reload the
  Designer tab after publishing.
- Required Designer markup: `[data-preloader]` with a
  `[data-preloader-lottie]` child. The old IX3 "Custom Preloader"
  interaction is no longer used.

## Snippets are not versioned

A push or tag changes nothing on the site. The release tag is pinned in
**both** snippets (CSS in head, JS in footer); the head's inline fallback is
only live once re-pasted. A release means updating both in Webflow and
publishing. Say so in the commit message, and keep `webflow/` identical to
what is installed.

## Commands and release

```sh
npm run check  # node --check socialedit-main.js
npm test       # node:test intro/loader cases
```

There are no dependencies to install, no build and no CI. Edit the served
files directly, run check and test, commit, then push a new `vX.Y.Z` tag
(and bump `package.json`). Verify the jsDelivr URLs, update **both** URLs in
Webflow, publish to staging and check the homepage, menu, enquiry form
(without submitting), `/studio#Fashion`, journal layout and an article,
then publish to the custom domain. Never move a pushed tag; cut the next
patch. Never use `@latest`, `@main` or a branch URL in production. Rollback
is described in the README.

## Webflow MCP limits

Worked around, not fixed — do not rediscover these.

- `custom_value` is rejected for Color and Size variables (`color-mix()`,
  `oklch()`, `calc()`). Create those through the variables JSON import with
  `valueType: "custom"`.
- No variable rename or reorder within a collection. Rename in the Designer
  (preserves ids and aliases; recreating does not).
- The WHTML importer drops `class` attributes. Create the style, then apply
  it.
- `get_all_elements` does not descend into component definitions — pass the
  component scope. An element "missing" from a page is usually inside one.
- Concurrent Designer edits change element ids. Re-query on "Element not
  found" instead of assuming deletion.
- Responsive styles are only returned when breakpoints are requested
  explicitly (`include_breakpoints`).

## Session protocol

1. **Start:** read `GOTCHAS.md`. Do not repeat a mistake already logged.
2. **During:** when something surprising costs time — a Webflow quirk, an
   inherited-code trap, an MCP limitation, a fix that had to be reverted —
   add an entry to `GOTCHAS.md` in the same commit as the fix, using the
   format at the top of that file.
3. **Scope:** tag an entry `template-candidate` when it would recur on other
   client projects (including those built from `wf-template`); those entries
   are collected later to improve the template. Otherwise tag it `project`.
4. Never delete entries. Update `Status` when something is fixed or
   upstreamed.
