const text = value => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

export function normalizeDoi(value) {
  return text(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function preferredWorks(response) {
  if (!Array.isArray(response.group)) throw new Error('Invalid ORCID works response');
  return response.group.map(group => {
    if (!Array.isArray(group['work-summary']) || !group['work-summary'].length) throw new Error('Incomplete ORCID work group');
    const summary = [...group['work-summary']].sort((a, b) => Number(b['display-index'] || 0) - Number(a['display-index'] || 0))[0];
    if (!Number.isSafeInteger(summary['put-code']) || summary['put-code'] <= 0) throw new Error('Invalid ORCID work identifier');
    return summary['put-code'];
  });
}

export function convertWork(work, orcid) {
  const title = text(work.title?.title?.value);
  const code = work['put-code'];
  if (!title || !Number.isSafeInteger(code) || code <= 0 || work.path !== `/${orcid}/work/${code}`) throw new Error('Invalid ORCID work detail');
  const identifiers = work['external-ids']?.['external-id'] || [];
  const doi = normalizeDoi(identifiers.find(id => id['external-id-type'] === 'doi' && id['external-id-relationship'] === 'self')?.['external-id-value']);
  const validDoi = /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : '';
  const year = text(work['publication-date']?.year?.value);
  const month = text(work['publication-date']?.month?.value);
  const day = text(work['publication-date']?.day?.value);
  const date = /^\d{4}$/.test(year) ? [year, month.padStart(2, '0') || '00', day.padStart(2, '0') || '00'].join('-') : '';
  const authors = (work.contributors?.contributor || [])
    .filter(author => !author['contributor-attributes']?.['contributor-role'] || author['contributor-attributes']['contributor-role'] === 'author')
    .map(author => text(author['credit-name']?.value)).filter(Boolean).join(', ');
  const url = validDoi ? `https://doi.org/${validDoi}` : safeUrl(work.url?.value) || `https://orcid.org/${orcid}/work/${code}`;
  return { id: String(code), title, authors, journal: text(work['journal-title']?.value), year: /^\d{4}$/.test(year) ? year : '', date, doi: validDoi, url, type: text(work.type) };
}

export function sortAndDeduplicate(publications) {
  const seen = new Set();
  return [...publications].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)).filter(paper => {
    const key = paper.doi ? normalizeDoi(paper.doi) : `orcid:${paper.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
