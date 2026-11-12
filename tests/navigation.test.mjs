import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('menu opens only on activation and supports dismissal and client navigation', () => {
  const makeElement = () => ({
    dataset: {}, events: {}, attrs: {}, classes: new Set(),
    addEventListener(name, handler) { this.events[name] = handler; },
    setAttribute(name, value) { this.attrs[name] = value; },
    contains(element) { return [this, toggle, nav].includes(element); },
    focus() { document.activeElement = this; this.events.focus?.(); }
  });
  const menu = makeElement(), toggle = makeElement(), nav = makeElement();
  menu.classList = { toggle(name, enabled) { enabled ? menu.classes.add(name) : menu.classes.delete(name); }, contains(name) { return menu.classes.has(name); } };
  menu.querySelector = selector => selector === 'nav' ? nav : toggle;
  const document = { activeElement: null, events: {}, querySelector: () => menu, addEventListener(name, handler) { this.events[name] = handler; } };
  const window = { location: new URL('https://example.com/notes.html') };
  vm.runInNewContext(readFileSync('src/scripts/navigation.js', 'utf8'), { document, window, URL, AbortController });
  const clickLink = (href, options = {}) => {
    toggle.events.click();
    let prevented = false;
    nav.events.click({ button: 0, target: { closest: () => ({ href }) }, preventDefault() { prevented = true; }, ...options });
    assert.equal(nav.inert, true);
    return prevented;
  };
  assert.equal(clickLink('https://example.com/notes.html'), true);
  assert.equal(document.activeElement, toggle);
  assert.equal(clickLink('https://example.com/tools.html'), false);
  assert.equal(clickLink('https://example.com/notes.html', { ctrlKey: true }), false);
  window.location = new URL('https://example.com/index.html');
  assert.equal(clickLink('https://example.com/'), true);
  // Focus alone must not reveal the links; click/tap or keyboard activation does.
  toggle.focus();
  assert.equal(menu.classes.has('is-open'), false);
  toggle.events.click();
  assert.equal(toggle.attrs['aria-expanded'], 'true');
  assert.equal(toggle.attrs['aria-label'], 'Close navigation');
  assert.equal(nav.inert, false);
  toggle.events.click();
  assert.equal(nav.inert, true);
  toggle.events.click();
  menu.events.keydown({ key: 'Escape' });
  assert.equal(nav.inert, true);
  assert.equal(document.activeElement, toggle);
  toggle.events.click();
  document.events.pointerdown({ target: {} });
  assert.equal(nav.inert, true);
  document.events['astro:before-swap']();
  menu.dataset = {};
  document.events['astro:page-load']();
  toggle.events.click();
  assert.equal(nav.inert, false);
});

test('all page controls hide on scroll, return at the top, and reset after navigation', () => {
  const events = {}, scrollListeners = [];
  const makeBody = reading => {
    const classes = new Set();
    return { dataset: { reading: String(reading) }, classes, classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } } };
  };
  const menuClasses = new Set(['is-open']);
  const toggle = { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } };
  const nav = { inert: false };
  const header = { inert: false, querySelector(selector) {
    if (selector === '.menu') return { classList: { remove(name) { menuClasses.delete(name); } } };
    return selector === 'nav' ? nav : toggle;
  } };
  const footer = { inert: false };
  const document = { body: makeBody(true), querySelector(selector) { return selector === '.site-header' ? header : selector === '.site-footer' ? footer : null; }, addEventListener(name, handler) { events[name] = handler; } };
  const window = { scrollY: 0, addEventListener(name, handler, options) { scrollListeners.push({ handler, signal: options.signal }); } };
  vm.runInNewContext(readFileSync('src/scripts/navigation.js', 'utf8'), { document, window, AbortController });
  assert.equal(header.inert, false);
  window.scrollY = 180; scrollListeners[0].handler();
  assert.equal(document.body.classes.has('is-page-scrolled'), true);
  assert.equal(header.inert, true);
  assert.equal(footer.inert, true);
  assert.equal(nav.inert, true);
  assert.equal(menuClasses.has('is-open'), false);
  assert.equal(toggle.attrs['aria-expanded'], 'false');
  window.scrollY = 0; scrollListeners[0].handler();
  assert.equal(document.body.classes.has('is-page-scrolled'), false);
  assert.equal(header.inert, false);
  assert.equal(footer.inert, false);
  events['astro:before-swap']();
  assert.equal(scrollListeners[0].signal.aborted, true);
  document.body = makeBody(false);
  events['astro:page-load']();
  assert.equal(scrollListeners.length, 2);
  assert.equal(document.body.classes.has('is-page-scrolled'), false);
  // Non-reading pages also hide controls while scrolling.
  window.scrollY = 180; scrollListeners[1].handler();
  assert.equal(header.inert, true);
  assert.equal(footer.inert, true);
  events['astro:before-swap']();
  assert.equal(scrollListeners[1].signal.aborted, true);
  // Restoring a page halfway down immediately hides the controls.
  document.body = makeBody(true); window.scrollY = 400;
  events['astro:page-load']();
  assert.equal(scrollListeners.length, 3);
  assert.equal(header.inert, true);
  assert.equal(footer.inert, true);
  assert.equal(document.body.classes.has('is-page-scrolled'), true);
  events['astro:page-load']();
  assert.equal(scrollListeners.length, 3);
});
