import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { previewFilename, previewText, aboutPreview } from '../../lib/social-preview.mjs';
import { renderSocialPreview } from '../../lib/render-social-preview.mjs';

export async function getStaticPaths() {
  const collections = await Promise.all([
    getCollection('pages'), getCollection('sections'),
    getCollection('notes'), getCollection('research'), getCollection('tools'),
  ]);
  const images = new Map(collections.flat().map(entry => {
    const text = entry.collection === 'sections' && entry.id === 'about'
      ? aboutPreview(entry.data) : previewText(entry.data);
    return [previewFilename(text).replace(/\.png$/, ''), text];
  }));
  return [...images].map(([image, text]) => ({ params: { image }, props: { text } }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderSocialPreview(props.text);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
