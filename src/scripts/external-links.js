import { isExternalLink } from '../lib/external-links.mjs';
// Covers author-written HTML links and any future links outside Markdown.
function initializeExternalLinks() {
  const blog = new URL(import.meta.env.BASE_URL, window.location.origin);
  for (const link of document.querySelectorAll('a[href]')) {
    let url;
    try { url = new URL(link.getAttribute('href'), window.location.href); } catch { continue; }
    if (link.dataset?.emailRedirect === undefined && isExternalLink(url, blog)) {
      link.target = '_blank';
      link.relList.add('noopener', 'noreferrer');
    }
  }
}
document.addEventListener('astro:page-load', initializeExternalLinks);
initializeExternalLinks();
