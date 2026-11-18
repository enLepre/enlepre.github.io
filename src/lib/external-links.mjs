// Other projects on the same host are external to this blog too.
export function isExternalLink(url, blog) {
  const path = blog.pathname.replace(/\/$/, '');
  return ['http:', 'https:'].includes(url.protocol) &&
    (url.origin !== blog.origin || (url.pathname !== path && !url.pathname.startsWith(`${path}/`)));
}

// Applies to both Markdown links and links written as HTML in Markdown.
export function externalLinks({ site, base = '/' }) {
  const blog = new URL(base.replace(/\/?$/, '/'), site);
  return tree => {
    const visit = node => {
      if (node.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string') {
        let url;
        try { url = new URL(node.properties.href, blog); } catch { /* Leave malformed links alone. */ }
        const relative = !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(node.properties.href);
        if (!('dataEmailRedirect' in node.properties) && url && !relative && isExternalLink(url, blog)) {
          node.properties.target = '_blank';
          const existing = node.properties.rel || [];
          const tokens = Array.isArray(existing) ? existing : existing.split(/\s+/);
          node.properties.rel = [...new Set([...tokens, 'noopener', 'noreferrer'])];
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
