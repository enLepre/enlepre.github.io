import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/scripts/theme.js', 'utf8');
function setup({ stored = null, dark = false, blocked = false, reduced = false } = {}) {
  const events = {}, windowEvents = {}, values = new Map();
  if (stored !== null) values.set('personal-blog-theme', stored);
  const makeDocument = () => ({ documentElement: { dataset: {}, style: {} }, button: { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } },
    querySelector() { return this.button; }, addEventListener(name, fn) { (events[name] ||= []).push(fn); } });
  const document = makeDocument();
  const system = { matches: dark, addEventListener(name, fn) { this.change = fn; } };
  const window = { matchMedia: query => query.includes('reduced-motion') ? { matches: reduced } : system, addEventListener(name, fn) { windowEvents[name] = fn; } };
  const localStorage = {
    getItem(key) { if (blocked) throw Error('blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw Error('blocked'); values.set(key, value); },
    removeItem(key) { if (blocked) throw Error('blocked'); values.delete(key); },
  };
  const context = vm.createContext({ window, document, localStorage });
  vm.runInContext(source, context);
  const fire = (name, event) => events[name].forEach(fn => fn(event));
  const toggle = () => fire('click', { target: { closest: selector => selector === '#theme-toggle' ? document.button : null } });
  return { document, system, windowEvents, values, toggle, fire, makeDocument, context, events };
}

test('uses the system default, tracks it, and ignores invalid saved values', () => {
  for (const stored of [null, 'invalid']) {
    const s = setup({ stored, dark: true });
    assert.equal(s.document.documentElement.dataset.theme, 'dark');
    assert.equal(s.document.button.attrs['aria-label'], 'Switch to light mode');
    s.system.matches = false; s.system.change();
    assert.equal(s.document.documentElement.dataset.theme, 'light');
  }
});

test('toggles and persists explicit preferences independently of system changes', () => {
  const s = setup({ stored: 'light', dark: true });
  assert.equal(s.document.documentElement.dataset.theme, 'light');
  s.toggle();
  assert.equal(s.values.get('personal-blog-theme'), 'dark');
  s.system.matches = false; s.system.change();
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
  s.toggle();
  assert.equal(s.values.get('personal-blog-theme'), 'light');
  assert.equal(s.document.documentElement.dataset.theme, 'light');
  assert.equal(s.document.button.attrs['aria-label'], 'Switch to dark mode');
});

test('survives unavailable storage and updates Astro destinations before swapping', () => {
  const s = setup({ blocked: true });
  s.toggle();
  const next = s.makeDocument();
  s.fire('astro:before-swap', { newDocument: next });
  assert.equal(next.documentElement.dataset.theme, 'dark');
  assert.equal(next.documentElement.style.colorScheme, 'dark');
  assert.equal(next.button.attrs['aria-label'], 'Switch to light mode');
  s.fire('astro:page-load');
  vm.runInContext(source, s.context);
  assert.equal(s.events.click.length, 1);
  assert.equal(s.document.button.attrs['aria-label'], 'Switch to light mode');
});

test('synchronizes another tab and storage clearing', () => {
  const s = setup();
  s.windowEvents.storage({ key: 'personal-blog-theme', newValue: 'dark' });
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
  s.windowEvents.storage({ key: 'other-key', newValue: 'light' });
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
  s.windowEvents.storage({ key: null, newValue: null });
  assert.equal(s.document.documentElement.dataset.theme, 'light');
  s.system.matches = true; s.system.change();
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
});

test('animates deliberate toggles, guards repeated clicks, and cleans up after interruption', async () => {
  const s = setup();
  let complete, updates = 0, skips = 0;
  s.document.startViewTransition = update => {
    updates++; update();
    return { finished: new Promise(resolve => { complete = resolve; }), skipTransition() { skips++; complete(); } };
  };
  s.toggle();
  assert.equal(updates, 1);
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
  assert.equal(s.document.documentElement.dataset.themeTransition, '');
  s.toggle();
  assert.equal(updates, 1);
  s.fire('astro:before-preparation');
  await Promise.resolve();
  assert.equal(skips, 1);
  assert.equal(s.document.documentElement.dataset.themeTransition, undefined);
  s.toggle(); complete(); await Promise.resolve();
  assert.equal(updates, 2);
});

test('reduced motion changes the theme immediately without creating an animation', () => {
  const s = setup({ reduced: true });
  s.document.startViewTransition = () => { throw Error('Animation must be skipped'); };
  s.toggle();
  assert.equal(s.document.documentElement.dataset.theme, 'dark');
  assert.equal(s.document.documentElement.dataset.themeTransition, undefined);
});
