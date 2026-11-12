// Covers author-written HTML links and any future links outside Markdown.
function initializeExternalLinks() {
  for (const link of document.querySelectorAll('a[href]')) {
    let url;
    try { url = new URL(link.getAttribute('href'), window.location.href); } catch { continue; }
    if (link.dataset?.emailRedirect === undefined && ['http:', 'https:'].includes(url.protocol) && url.origin !== window.location.origin) {
      link.target = '_blank';
      link.relList.add('noopener', 'noreferrer');
    }
  }
}
document.addEventListener('astro:page-load', initializeExternalLinks);
initializeExternalLinks();
