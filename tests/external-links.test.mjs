import test from 'node:test';
import assert from 'node:assert/strict';
import { externalLinks } from '../src/lib/external-links.mjs';

test('external links open separately while internal and non-web links retain their behavior', () => {
  const link = (href, extra = {}) => ({ type: 'element', tagName: 'a', properties: { href, ...extra }, children: [] });
  const external = [link('https://doi.org/10.1234/example'), link('//orcid.org/example'), link('HTTP://example.com', { rel: 'author nofollow', target: '_self' })];
  const internal = [link('/Personal-Blog/'), link('../essays.html'), link('#top'), link('https://enlepre.github.io/Personal-Blog/notes.html'), link('mailto:contact@example.com'), link('https://example.com/email', { dataEmailRedirect: '' }), link('tel:+123'), link('https://[')];
  const originals = structuredClone(internal);
  const tree = { type: 'root', children: [{ type: 'element', tagName: 'section', children: [...external, ...internal] }] };
  externalLinks({ site: 'https://enlepre.github.io' })(tree);
  for (const node of external) {
    assert.equal(node.properties.target, '_blank');
    assert.ok(node.properties.rel.includes('noopener'));
    assert.ok(node.properties.rel.includes('noreferrer'));
  }
  assert.ok(external[2].properties.rel.includes('nofollow'));
  assert.deepEqual(internal, originals);
  externalLinks({ site: 'https://enlepre.github.io' })(tree);
  assert.equal(external[0].properties.rel.filter(token => token === 'noopener').length, 1);
});

import vm from 'node:vm';
import { readFileSync } from 'node:fs';
test('author-written HTML links are updated on initial load and after page navigation', () => {
  const makeLink = href => ({ target: '', getAttribute: () => href, relList: { tokens: new Set(), add(...tokens) { tokens.forEach(token => this.tokens.add(token)); } } });
  let links = [makeLink('https://example.com'), makeLink('/Personal-Blog/essays.html'), makeLink('mailto:example@example.com'), { ...makeLink('https://example.com/email'), dataset: { emailRedirect: '' } }];
  const events = {};
  const document = { querySelectorAll: () => links, addEventListener(name, handler) { events[name] = handler; } };
  const window = { location: new URL('https://enlepre.github.io/Personal-Blog/') };
  vm.runInNewContext(readFileSync('src/scripts/external-links.js', 'utf8'), { document, window, URL });
  assert.equal(links[0].target, '_blank');
  assert.ok(links[0].relList.tokens.has('noopener'));
  assert.equal(links[1].target, '');
  assert.equal(links[2].target, '');
  assert.equal(links[3].target, '');
  links = [makeLink('//orcid.org/example')];
  events['astro:page-load']();
  assert.equal(links[0].target, '_blank');
});
