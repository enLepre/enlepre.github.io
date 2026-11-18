import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preferredWorks, convertWork, sortAndDeduplicate, safeUrl } from '../src/lib/publications.mjs';
import { syncPublications } from '../scripts/sync-publications.mjs';

const orcid = '0000-0003-4252-3056';
function work(code = 1, options = {}) {
  return {
    'put-code': code, path: `/${orcid}/work/${code}`, title: { title: { value: 'An article' } },
    type: 'journal-article', 'journal-title': { value: 'Journal' },
    'publication-date': { year: { value: '2024' }, month: { value: '5' } },
    'external-ids': { 'external-id': [{ 'external-id-type': 'doi', 'external-id-value': 'https://doi.org/10.1234/ABC', 'external-id-relationship': 'self' }] },
    contributors: { contributor: [{ 'credit-name': { value: 'Enrico Lepre' }, 'contributor-attributes': { 'contributor-role': 'author' } }] },
    ...options,
  };
}
const response = value => ({ ok: true, json: async () => value });
const works = codes => ({ group: codes.map(code => ({ 'work-summary': [{ 'put-code': code }] })) });

test('selects preferred ORCID records and rejects incomplete groups', () => {
  assert.deepEqual(preferredWorks({ group: [{ 'work-summary': [{ 'put-code': 1, 'display-index': '0' }, { 'put-code': 2, 'display-index': '1' }] }] }), [2]);
  assert.throws(() => preferredWorks({ group: [{}] }), /Incomplete/);
  assert.throws(() => preferredWorks({}), /Invalid/);
});

test('normalizes DOI, keeps available citation metadata and includes works without DOIs or dates', () => {
  const article = convertWork(work(), orcid);
  assert.equal(article.doi, '10.1234/abc');
  assert.equal(article.authors, 'Enrico Lepre');
  assert.equal(article.date, '2024-05-00');
  assert.equal(convertWork(work(1, { title: { title: { value: 'CO<sub>2</sub> &amp; catalysis' } } }), orcid).title, 'CO2 & catalysis');
  const thesis = convertWork(work(2, { type: 'dissertation', 'publication-date': null, 'external-ids': null, contributors: null, url: { value: 'javascript:alert(1)' } }), orcid);
  assert.equal(thesis.url, `https://orcid.org/${orcid}/work/2`);
  assert.equal(thesis.year, '');
  assert.equal(safeUrl('data:text/html,unsafe'), '');
  assert.throws(() => convertWork(work(1, { path: '/other-person/work/1' }), orcid), /Invalid/);
});

test('deduplicates DOIs without collapsing different works with no DOI and sorts newest first', () => {
  const article = convertWork(work(), orcid);
  const duplicate = { ...article, id: '2', doi: '10.1234/ABC' };
  const older = { ...article, id: '3', doi: '', date: '2020-00-00' };
  const undated = { ...older, id: '4', date: '' };
  assert.deepEqual(sortAndDeduplicate([undated, duplicate, older, article]).map(p => p.id), ['1', '3', '4']);
});

async function fixture(t, publications = []) {
  const root = await mkdtemp(join(tmpdir(), 'blog-publications-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/data'), { recursive: true });
  await writeFile(join(root, 'src/data/publication-sync.json'), JSON.stringify({ orcid }));
  const cache = join(root, 'src/data/publications.json');
  await writeFile(cache, JSON.stringify({ schemaVersion: 1, orcid, updatedAt: null, publications }));
  return { root, cache };
}

test('refreshes all groups, updates metadata/removals, and leaves unchanged caches untouched', async t => {
  const { root, cache } = await fixture(t, [convertWork(work(9), orcid)]);
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    return response(url.endsWith('/works') ? works([1, 2]) : work(Number(url.split('/').at(-1)), { 'external-ids': null }));
  };
  const result = await syncPublications({ root, fetchImpl, now: new Date('2026-10-08T06:17:00Z') });
  assert.equal(result.total, 2);
  assert.equal(calls.length, 3);
  const saved = await readFile(cache, 'utf8');
  assert.deepEqual(JSON.parse(saved).publications.map(p => p.id), ['1', '2']);
  assert.deepEqual(await syncPublications({ root, fetchImpl }), { changed: false, total: 2 });
  assert.equal(await readFile(cache, 'utf8'), saved);
});

test('partial refresh failure keeps the entire saved list and allows a cached build', async t => {
  const { root, cache } = await fixture(t, [convertWork(work(9), orcid)]);
  const before = await readFile(cache, 'utf8');
  const fetchImpl = async url => response(url.endsWith('/works') ? works([1, 2]) : url.endsWith('/1') ? work(1) : {});
  const messages = [];
  assert.deepEqual(await syncPublications({ root, fetchImpl, warn: message => messages.push(message) }), { cached: true, total: 1 });
  assert.equal(await readFile(cache, 'utf8'), before);
  assert.equal(messages.length, 1);
});

test('first failed sync cannot publish an empty list; legitimate empty ORCID records clear saved works', async t => {
  const empty = await fixture(t);
  await assert.rejects(syncPublications({ root: empty.root, fetchImpl: async () => response({}) }), /Invalid ORCID/);
  const populated = await fixture(t, [convertWork(work(), orcid)]);
  const result = await syncPublications({ root: populated.root, fetchImpl: async () => response({ group: [] }) });
  assert.equal(result.total, 0);
  assert.deepEqual(JSON.parse(await readFile(populated.cache, 'utf8')).publications, []);
});
