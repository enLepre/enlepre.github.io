export function aboutSections() {
  return (tree) => {
    const visit = (node) => {
      if (node.children) {
        const grouped = [];
        let section;
        for (const child of node.children) {
          if (child.type === 'element' && child.tagName === 'h2') {
            section = { type: 'element', tagName: 'section', properties: { className: ['item'] }, children: [child] };
            grouped.push(section);
          } else if (section) {
            if (section.children[0].children?.map(node => node.value || '').join('').trim().toLowerCase() === 'curriculum' && child.type === 'element' && child.tagName === 'p') {
              const first = child.children[0];
              const match = first?.type === 'text' && first.value.match(/^(\d{4}(?:[–-](?:\d{4}|present))?)\s+—\s+/);
              if (match) {
                child.properties = { ...child.properties, className: ['curriculum-entry'] };
                child.children = [
                  { type: 'element', tagName: 'span', properties: { className: ['curriculum-year'] }, children: [{ type: 'text', value: match[1] }] },
                  { type: 'text', value: ' ' },
                  { type: 'element', tagName: 'span', properties: { className: ['curriculum-description'] }, children: [{ ...first, value: first.value.slice(match[0].length) }, ...child.children.slice(1)] },
                ];
              }
            }
            section.children.push(child);
          }
          else grouped.push(child);
        }
        // Only group root Markdown blocks; leave nested content untouched.
        if (node.type === 'root') node.children = grouped;
      }
    };
    visit(tree);
  };
}
