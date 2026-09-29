/* Social Edit House custom code. Webflow owns its runtime and GSAP dependencies. */
(() => {
  "use strict";
  if (window.__SEH_INITIALIZED) return;
  window.__SEH_INITIALIZED = true;
  const assetBase = new URL(".", document.currentScript.src);
// ============================================
// Helpers
// ============================================
function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

// ============================================
// Debug — add ?debug=1 to the URL (or #debug). Logs to console + on-screen panel.
// No-op when off — safe to leave in production. Remove this block once done.
// ============================================
const Debug = (() => {
  const ON =
    /[?&]debug=1(?:&|$)/.test(location.search) ||
    /(?:^|#).*debug/.test(location.hash) ||
    window.__SEH_DEBUG === true;

  let panel = null;
  const ts = () => String(Math.round(performance.now())).padStart(5, " ");

  function ensurePanel() {
    if (!ON || panel || !document.body) return;
    panel = document.createElement("div");
    panel.id = "seh-debug";
    Object.assign(panel.style, {
      position: "fixed",
      top: "8px",
      right: "8px",
      zIndex: "2147483647",
      maxWidth: "min(440px, 92vw)",
      maxHeight: "62vh",
      overflow: "auto",
      background: "rgba(12,12,12,.86)",
      color: "#9bffa3",
      font: "11px/1.5 ui-monospace, Menlo, Consolas, monospace",
      padding: "8px 10px",
      borderRadius: "6px",
      whiteSpace: "pre-wrap",
      pointerEvents: "auto",
      boxShadow: "0 6px 24px rgba(0,0,0,.45)",
    });
    panel.textContent = "SEH debug\n";
    document.body.appendChild(panel);
  }

  function fmt(a) {
    if (a === null) return "null";
    if (typeof a === "object") {
      try {
        return JSON.stringify(a);
      } catch (_) {
        return String(a);
      }
    }
    return String(a);
  }

  function log(...args) {
    if (!ON) return;
    const line = `[${ts()}ms] ` + args.map(fmt).join(" ");
    console.log("%c[SEH]", "color:#7cc;font-weight:bold", line);
    const write = () => {
      ensurePanel();
      if (panel) {
        panel.appendChild(document.createTextNode(line + "\n"));
        panel.scrollTop = panel.scrollHeight;
      }
    };
    if (document.body) write();
    else document.addEventListener("DOMContentLoaded", write, { once: true });
  }

  return { ON, log };
})();

Debug.log(
  "script loaded — readyState:",
  document.readyState,
  "| hash:",
  location.hash || "(none)",
  "| search:",
  location.search || "(none)"
);

// Resolves ONCE the page is unlocked & scrollable (preloader done, or none).
const PageReady = (() => {
  let resolved = false;
  const queue = [];
  return {
    signal() {
      if (resolved) return;
      resolved = true;
      Debug.log("PageReady -> SIGNAL (page unlocked). queued:", queue.length);
      while (queue.length) {
        try { queue.shift()(); } catch (error) { console.warn("SEH ready callback:", error); }
      }
    },
    ready(fn) {
      resolved ? fn() : queue.push(fn);
    },
  };
})();

// ============================================
// Nav Shrink
// ============================================
const NavShrink = (() => {
  function init() {
    const targets = document.querySelectorAll(".g-nav-w, .s-g-nav, .sw-g-nav");
    if (!targets.length) return;

    const getThresholdPx = () => window.innerHeight * 0.05; // 5vh
    let thresholdPx = getThresholdPx();
    let last = null;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const shouldShrink = window.scrollY >= thresholdPx;
      if (shouldShrink === last) return;
      last = shouldShrink;
      targets.forEach((el) => el.classList.toggle("is-shrunk", shouldShrink));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const onResize = () => {
      thresholdPx = getThresholdPx();
      last = null;
      apply();
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
  }

  return { init };
})();

// ============================================
// Sticky Center
// ============================================
const StickyCenter = (() => {
  function init(selector = "[data-sticky-center]") {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length) return;

    let ticking = false;

    const apply = () => {
      ticking = false;
      const tops = elements.map((el) =>
        Math.max(0, (window.innerHeight - el.offsetHeight) / 2)
      );
      elements.forEach((el, i) => {
        el.style.top = `${tops[i]}px`;
      });
    };

    const onResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", onResize, { passive: true });
  }

  return { init };
})();

// ============================================
// Ampersand — wrap each "&" so it can use its own font.
// ============================================
const Ampersand = (() => {
  const SKIP =
    "script,style,textarea,code,pre,kbd,samp,noscript,svg,.amp,[data-no-amp]";

  function wrapIn(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeValue.indexOf("&") === -1) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach((textNode) => {
      const frag = document.createDocumentFragment();
      const parts = textNode.nodeValue.split("&");
      parts.forEach((part, i) => {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          const span = document.createElement("span");
          span.className = "amp";
          span.textContent = "&";
          frag.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function init() {
    if (window.Webflow?.env?.("editor")) return;
    const scoped = document.querySelectorAll("[data-amp]");
    if (scoped.length) scoped.forEach(wrapIn);
    else wrapIn(document.body);
  }

  return { init };
})();

// ============================================
// Reveals — text / element entrance animations (tab-aware)
// ============================================
const Reveals = (() => {
  const TEXT_VARS = {
    y: "0.15em",
    opacity: 0,
    filter: "blur(8px)",
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.024,
  };
  const EL_VARS = {
    y: "0.15em",
    opacity: 0,
    filter: "blur(8px)",
    duration: 0.8,
    ease: "power2.out",
  };

  function buildAnim(el) {
    if (el.hasAttribute("data-animate-in-text")) {
      const split = SplitText.create(el, { type: "words" });
      return gsap.from(split.words, { ...TEXT_VARS, paused: true });
    }
    return gsap.from(el, { ...EL_VARS, paused: true });
  }

  function init() {
    if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
      Debug.log("Reveals: gsap/ScrollTrigger/SplitText MISSING — skipped");
      return;
    }
    gsap.registerPlugin(ScrollTrigger, SplitText);

    gsap.utils
      .toArray("[data-animate-in-text], [data-animate-in]")
      .forEach((el) => {
        const tween = buildAnim(el);
        const pane = el.closest(".w-tab-pane");
        const startsActive = !pane || pane.classList.contains("w--tab-active");

        let st = null;
        if (startsActive) {
          st = ScrollTrigger.create({
            trigger: el,
            start: "top 80%",
            animation: tween,
            toggleActions: "play none none none",
          });
        } else {
          tween.pause(0);
        }

        if (!pane) return;

        (pane._anim ||= []).push({ tween, st });

        if (!pane._animObserver) {
          let wasActive = pane.classList.contains("w--tab-active");
          pane._animObserver = new MutationObserver(() => {
            const isActive = pane.classList.contains("w--tab-active");

            if (isActive && !wasActive) {
              pane._anim.forEach(({ tween, st }) => {
                if (st) st.disable();
                tween.restart();
              });
            } else if (!isActive && wasActive) {
              pane._anim.forEach(({ tween, st }) => {
                if (st) st.disable();
                tween.pause(0);
              });
            }
            wasActive = isActive;
          });
          pane._animObserver.observe(pane, {
            attributes: true,
            attributeFilter: ["class"],
          });
        }
      });
  }

  return { init };
})();

// ============================================
// Tab Deep Link — open a tab from the URL, then scroll its section into view.
//   link to:  /studio#fashion   (or  /studio?tab=fashion )
//   matches   data-tab-id / data-w-tab on the .w-tab-link
//   scroll target: the element carrying data-tab-scroll anywhere inside the
//                  tab's <section> (e.g. your .anchor-extension). If its value
//                  names a real element id, scroll there; otherwise scroll to
//                  the element that carries the attribute. Falls back to .w-tabs.
// ============================================
const TabDeepLink = (() => {
  const slug = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, "-");

  function wanted() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, "")).split(
      "?"
    )[0];
    if (hash) return slug(hash);
    const q = new URLSearchParams(location.search).get("tab");
    return q ? slug(q) : "";
  }

  function targetLink() {
    const want = wanted();
    if (!want) return null;
    let match = null;
    document.querySelectorAll(".w-tab-link").forEach((link) => {
      if (match) return;
      if (
        slug(link.getAttribute("data-tab-id")) === want ||
        slug(link.getAttribute("data-w-tab")) === want
      ) {
        match = link;
      }
    });
    return match;
  }

  function open() {
    const link = targetLink();
    if (link && !link.classList.contains("w--current")) link.click();
    return link;
  }

  function resolveScrollTarget(link) {
    const tabs = link.closest(".w-tabs");
    const scope = link.closest("section") || tabs || document;

    // marker = the element that carries data-tab-scroll (link, .w-tabs, or
    // anywhere in the section — e.g. your .anchor-extension div).
    const marker =
      (link.hasAttribute("data-tab-scroll") && link) ||
      (tabs && tabs.hasAttribute("data-tab-scroll") && tabs) ||
      scope.querySelector("[data-tab-scroll]");

    if (marker) {
      const id = (marker.getAttribute("data-tab-scroll") || "").replace(
        /^#/,
        ""
      );
      // value names a real element → use it; else scroll to the marker itself
      return (id && document.getElementById(id)) || marker;
    }
    return tabs; // last-resort default: the tabs block
  }

  function scrollIntoView() {
    const link = targetLink();
    if (!link) return;
    const target = resolveScrollTarget(link);
    Debug.log(
      "TabDeepLink.scroll — target:",
      target ? target.id || target.className || "(element)" : "NONE"
    );
    if (target) requestAnimationFrame(() => Anchors.scrollToEl(target, false));
  }

  function init() {
    // open early (behind the preloader)…
    if (window.Webflow?.push) window.Webflow.push(() => open());
    else open();
    // …then, once unlocked, re-confirm the tab and scroll its section in.
    PageReady.ready(() => {
      open();
      scrollIntoView();
    });
    window.addEventListener("hashchange", () => open());
  }

  return { init, open };
})();

// ============================================
// Anchors — make hash links work with the preloader + Lenis
// ============================================
const Anchors = (() => {
  const HEADER_OFFSET = 0; // your .anchor-extension divs already offset for the nav

  const getById = (id) => {
    if (!id) return null;
    try {
      return document.getElementById(id);
    } catch (_) {
      return null;
    }
  };

  function scrollToEl(el, smooth) {
    if (!el) return;
    const hasLenis = !!window.lenis;
    if (hasLenis) {
      // Lenis measured its scroll limit while the page was locked, so refresh
      // its dimensions before scrolling or the jump gets clamped to 0.
      if (typeof window.lenis.resize === "function") window.lenis.resize();
      Debug.log(
        "scrollToEl ->",
        smooth ? "smooth" : "jump",
        "| via: lenis | limit:",
        window.lenis.limit
      );
      window.lenis.scrollTo(el, { offset: HEADER_OFFSET, immediate: !smooth });
    } else {
      Debug.log("scrollToEl ->", smooth ? "smooth" : "jump", "| via: native");
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }

  function landing() {
    const id = decodeURIComponent(
      (location.hash || "").replace(/^#/, "")
    ).split("?")[0];
    const el = getById(id);
    Debug.log(
      "Anchors.landing — hash:",
      location.hash || "(none)",
      "| id:",
      id || "-",
      "| element found:",
      !!el,
      "| lenis:",
      !!window.lenis
    );
    if (el) requestAnimationFrame(() => scrollToEl(el, false));
  }

  function onClick(e) {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;

    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (a.classList.contains("w-tab-link") || a.closest(".w-tab-menu")) return;

    let url;
    try {
      url = new URL(a.href, location.href);
    } catch (_) {
      return;
    }
    if (url.pathname !== location.pathname || url.search !== location.search)
      return;

    const id = decodeURIComponent(url.hash.replace(/^#/, ""));
    const el = getById(id);
    if (!el) return;

    e.preventDefault();
    Debug.log("Anchors.onClick — intercept #", id);
    scrollToEl(el, true);
    history.pushState(null, "", "#" + id);
  }

  function init() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    document.addEventListener("click", onClick);
    PageReady.ready(landing);
  }

  return { init, landing, scrollToEl };
})();

// Desktop smooth scrolling; use native touch/reduced-motion scrolling.
const SmoothScroll = (() => {
  function init() {
    if (window.Webflow?.env?.("editor") || window.lenis || !window.Lenis ||
        !window.gsap || !window.ScrollTrigger ||
        matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical", gestureDirection: "vertical", smooth: true,
      mouseMultiplier: 1, smoothTouch: false, touchMultiplier: 2, infinite: false,
    });
    window.lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => instance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  return { init };
})();

// ============================================
// DOM Ready → init modules
// ============================================
onReady(() => {
  Debug.log("onReady -> init modules");
  [SmoothScroll, NavShrink, StickyCenter, Ampersand, Reveals, TabDeepLink, Anchors].forEach((module) => {
    try { module.init(); } catch (error) { console.warn("SEH module:", error); }
  });

  if (Debug.ON) {
    window.__SEH = {
      lenis: () => window.lenis || null,
      hash: () => location.hash,
      scrollY: () => window.scrollY,
      landing: () => Anchors.landing(),
      openTab: () => TabDeepLink.open(),
    };
    Debug.log("window.__SEH helpers ready");
  }
});

// Nonblocking intro. The head snippet owns the overall 2.2-second safety deadline.
onReady(() => {
  const html = document.documentElement;
  const preloader = document.querySelector("[data-preloader]");
  const mount = preloader?.querySelector("[data-preloader-lottie]");
  let animation = null;
  let finished = false;
  let exiting = false;

  function complete() {
    if (finished) return;
    finished = true;
    html.classList.remove("seh-intro-pending", "seh-intro-exit", "is-loading");
    if (preloader) {
      preloader.style.setProperty("display", "none", "important");
      preloader.style.pointerEvents = "none";
    }
    if (animation) animation.destroy();
    window.lenis?.start();
    window.lenis?.resize?.();
    window.ScrollTrigger?.refresh();
    // Webflow tabs must have initialized before opening an incoming tab deep link.
    if (window.Webflow?.push) window.Webflow.push(() => PageReady.signal());
    else PageReady.signal();
    Debug.log("intro: complete");
  }

  function reveal() {
    if (finished || exiting) return;
    exiting = true;
    if (!html.classList.contains("seh-intro-pending")) return complete();
    html.classList.add("seh-intro-exit");
    setTimeout(complete, 220);
  }

  window.addEventListener("seh:intro-timeout", complete, { once: true });
  if (!preloader || !mount || window.Webflow?.env?.("editor") ||
      !html.classList.contains("seh-intro-pending") ||
      matchMedia("(max-width: 991px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches) {
    complete();
    return;
  }

  function play() {
    if (finished || !html.classList.contains("seh-intro-pending")) return complete();
    try {
      animation = window.lottie.loadAnimation({
        container: mount, renderer: "svg", loop: false, autoplay: false,
        path: new URL("assets/intro.json", assetBase).href,
      });
      animation.addEventListener("complete", reveal);
      animation.addEventListener("data_failed", complete);
      animation.addEventListener("error", complete);
      animation.addEventListener("DOMLoaded", () => {
        if (finished) return;
        animation.setSpeed(2);
        animation.play();
      });
    } catch (error) { complete(); }
  }

  if (window.lottie) play();
  else {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js";
    script.async = true;
    script.onload = play;
    script.onerror = complete;
    document.head.appendChild(script);
  }
  // Standalone fallback if the head script is accidentally removed later.
  setTimeout(complete, 2200);
});
})();
