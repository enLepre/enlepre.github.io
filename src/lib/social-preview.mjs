import { createHash } from 'node:crypto';

// Keep the same source text for the image and the page's sharing metadata.
export function previewText(data) {
  return {
    title: data.title,
    subtitle: data.subtitle ?? (data.lead || data.preview || ''),
    ...(data.portrait ? { portrait: data.portrait } : {}),
  };
}

export function aboutPreview(data) {
  return { title: 'Enrico Lepre', subtitle: 'Chemistry, Fields, and Catalysis', portrait: data.portrait };
}

export function previewFilename(text) {
  // A new URL when the wording changes helps platforms refresh cached images.
  const hash = createHash('sha256').update(JSON.stringify(text)).digest('hex').slice(0, 16);
  return `${hash}.png`;
}

export function previewMetadata(data, pageUrl, site, base = '') {
  const text = previewText(data);
  return {
    ...text,
    url: new URL(pageUrl, site).href,
    image: new URL(`${base.replace(/\/$/, '')}/social/${previewFilename(text)}`, site).href,
    alt: text.subtitle ? `${text.title} — ${text.subtitle}` : text.title,
  };
}
