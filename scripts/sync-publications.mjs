import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { preferredWorks, convertWork, sortAndDeduplicate } from '../src/lib/publications.mjs';

async function requestJson(url, fetchImpl) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'EnricoLepre-PersonalBlog/1.0 (https://enlepre.github.io/Personal-Blog/)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`ORCID HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export async function syncPublications({ root = process.cwd(), fetchImpl = fetch, now = new Date(), warn = console.warn } = {}) {
  const config = JSON.parse(await readFile(resolve(root, 'src/data/publication-sync.json'), 'utf8'));
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(config.orcid)) throw new Error('Invalid ORCID configuration');
  const cachePath = resolve(root, 'src/data/publications.json');
  const previous = JSON.parse(await readFile(cachePath, 'utf8'));
  if (previous.schemaVersion !== 1 || !Array.isArray(previous.publications) || previous.orcid !== config.orcid) throw new Error('Publication cache does not match the configured ORCID');
  let publications;
  try {
    const base = `https://pub.orcid.org/v3.0/${config.orcid}`;
    const codes = preferredWorks(await requestJson(`${base}/works`, fetchImpl));
    const works = [];
    for (const code of codes) {
      const work = await requestJson(`${base}/work/${code}`, fetchImpl);
      if (work['put-code'] !== code) throw new Error('ORCID returned the wrong work');
      works.push(convertWork(work, config.orcid));
    }
    publications = sortAndDeduplicate(works);
  } catch (error) {
    if (!previous.publications.length) throw error;
    warn(`ORCID refresh unavailable: ${error.message}. Keeping ${previous.publications.length} saved publications.`);
    return { cached: true, total: previous.publications.length };
  }
  if (JSON.stringify(publications) === JSON.stringify(previous.publications)) return { changed: false, total: publications.length };
  const next = { schemaVersion: 1, orcid: config.orcid, updatedAt: now.toISOString(), publications };
  await writeFile(cachePath + '.tmp', JSON.stringify(next, null, 2) + '\n');
  await rename(cachePath + '.tmp', cachePath);
  return { changed: true, total: publications.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await syncPublications())); }
  catch (error) { console.error(`Publication sync failed: ${error.message}`); process.exitCode = 1; }
}
