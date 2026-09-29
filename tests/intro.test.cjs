const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'socialedit-main.js'), 'utf8');
const head = fs.readFileSync(path.join(root, 'webflow/head.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

function fixture({ mobile = false, reduced = false, main = true, library = true } = {}) {
  let now = 0;
  const timers = [];
  const classes = new Set();
  const events = new Map();
  const domEvents = new Map();
  const scripts = [];
  const counters = { played: 0, destroyed: 0, loaded: 0, webflowReady: 0 };
  const animationEvents = {};
  const style = { setProperty(k, v) { this[k] = v; } };
  const mount = {};
  const preloader = { style, querySelector: () => mount };
  const animation = {
    addEventListener: (name, fn) => { animationEvents[name] = fn; },
    setSpeed: speed => { counters.speed = speed; },
    play: () => { counters.played++; },
    destroy: () => { counters.destroyed++; },
  };
  const context = {
    URL, URLSearchParams, Event,
    console: { log() {}, warn() {} },
    performance: { now: () => now },
    location: { hash: '', search: '', href: 'https://example.com/', pathname: '/' },
    history: {}, NodeFilter: { SHOW_TEXT: 4 },
    matchMedia: q => ({ matches: (mobile && /max-width|pointer/.test(q)) || (reduced && /reduced-motion/.test(q)) }),
    setTimeout: (fn, ms) => { timers.push({ fn, at: now + ms }); },
    requestAnimationFrame: fn => fn(),
    addEventListener(name, fn) { const list = events.get(name) || []; list.push(fn); events.set(name, list); },
    dispatchEvent(event) { for (const fn of events.get(event.type) || []) fn(event); },
    Webflow: { env: () => false, push(fn) { counters.webflowReady++; fn(); } },
    document: {
      readyState: 'loading',
      documentElement: { classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n) } },
      currentScript: { src: 'https://cdn.jsdelivr.net/gh/brandvm/socialedithouse@v1.0.0/socialedit-main.js' },
      querySelector: s => s === '[data-preloader]' ? preloader : null,
      querySelectorAll: () => [],
      createTreeWalker: () => ({ nextNode: () => null }),
      createElement: () => ({}),
      head: { appendChild: s => scripts.push(s) },
      body: {},
      addEventListener(name, fn) { const list = domEvents.get(name) || []; list.push(fn); domEvents.set(name, list); },
    },
  };
  context.window = context;
  if (library) context.lottie = { loadAnimation(config) { counters.loaded++; counters.config = config; return animation; } };
  vm.createContext(context);
  vm.runInContext(head, context);
  if (main) {
    vm.runInContext(source, context);
    context.document.readyState = 'interactive';
    for (const fn of domEvents.get('DOMContentLoaded') || []) fn();
  }
  function tick(ms) {
    const target = now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      if (!timers.length || timers[0].at > target) break;
      const timer = timers.shift(); now = timer.at; timer.fn();
    }
    now = target;
  }
  return { context, classes, style, scripts, counters, animationEvents, tick };
}

test('mobile skips intro and does not request Lottie', () => {
  const p = fixture({ mobile: true, library: false });
  assert.equal(p.classes.has('seh-intro-pending'), false);
  assert.equal(p.style.display, 'none');
  assert.equal(p.scripts.length, 0);
  assert.equal(p.counters.webflowReady, 2); // initial tab setup + page-ready signal
});
test('reduced motion skips intro', () => {
  const p = fixture({ reduced: true });
  assert.equal(p.counters.loaded, 0);
  assert.equal(p.style.display, 'none');
});
test('desktop reveals after animation without waiting for window.load', () => {
  const p = fixture();
  assert.equal(p.counters.loaded, 1);
  p.animationEvents.DOMLoaded();
  assert.equal(p.counters.speed, 2);
  p.animationEvents.complete();
  p.tick(220);
  assert.equal(p.context.document.readyState, 'interactive');
  assert.equal(p.style.display, 'none');
  assert.equal(p.counters.webflowReady, 2); // initial tab setup + page-ready signal
});
test('head releases overlay even when the main CDN script never loads', () => {
  const p = fixture({ main: false });
  assert.equal(p.classes.has('seh-intro-pending'), true);
  p.tick(2200);
  assert.equal(p.classes.has('seh-intro-pending'), false);
});
test('animation stall is released by the independent deadline', () => {
  const p = fixture();
  p.tick(2200);
  assert.equal(p.style.display, 'none');
  assert.equal(p.counters.destroyed, 1);
  assert.equal(p.counters.webflowReady, 2); // initial tab setup + page-ready signal
});
test('Lottie network error releases the page immediately', () => {
  const p = fixture({ library: false });
  assert.equal(p.scripts.length, 1);
  p.scripts[0].onerror();
  assert.equal(p.style.display, 'none');
  p.tick(2200);
  assert.equal(p.counters.webflowReady, 2); // initial tab setup + page-ready signal
});
