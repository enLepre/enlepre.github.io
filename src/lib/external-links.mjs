// Applies to both Markdown links and links written as HTML in Markdown.
export function externalLinks({ site }) {
  const origin = new URL(site).origin;
  return tree => {
    const visit = node => {
      if (node.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string') {
        let url;
        try { url = new URL(node.properties.href, site); } catch { /* Leave malformed links alone. */ }
        if (!('dataEmailRedirect' in node.properties) && url && ['http:', 'https:'].includes(url.protocol) && url.origin !== origin) {
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
