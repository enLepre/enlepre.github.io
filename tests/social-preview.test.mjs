import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { previewText, previewFilename, previewMetadata, aboutPreview } from '../src/lib/social-preview.mjs';
import { renderSocialPreview } from '../src/lib/render-social-preview.mjs';

test('sharing uses the exact note title and existing preview, including punctuation', () => {
  const data = { title: '... but I respect your time', preview: 'when content is free, attention becomes the currency' };
  assert.deepEqual(previewText(data), { title: data.title, subtitle: data.preview });
  assert.equal(previewText({ ...data, subtitle: '' }).subtitle, '');
  assert.equal(previewText({ ...data, subtitle: 'Explicit subtitle' }).subtitle, 'Explicit subtitle');
  assert.equal(previewText({ title: 'Title only' }).subtitle, '');
});

test('metadata uses absolute production URLs with the GitHub Pages base path', () => {
  const data = { title: 'A & B', preview: 'A < B — why?' };
  const metadata = previewMetadata(data, '/Personal-Blog/notes/example.html', 'https://enlepre.github.io', '/Personal-Blog/');
  assert.equal(metadata.url, 'https://enlepre.github.io/Personal-Blog/notes/example.html');
  assert.equal(metadata.image, `https://enlepre.github.io/Personal-Blog/social/${previewFilename(previewText(data))}`);
  assert.equal(metadata.alt, 'A & B — A < B — why?');
  assert.notEqual(previewFilename(previewText(data)), previewFilename(previewText({ ...data, preview: 'Changed' })));
});

test('renderer produces 1200 × 630 PNGs for title-only, long and special-character text', async () => {
  for (const text of [
    { title: 'Title only' },
    { title: '... but I respect your time', subtitle: 'when content is free, attention becomes the currency' },
    { title: 'A & B < C: “Chemistry”', subtitle: 'Fields, catalysis, and Zürich — scientific notes.' },
    { title: 'A longer scientific title about the role of electric fields in chemistry and catalysis', subtitle: 'An extended subtitle that should wrap across multiple lines while remaining completely visible inside the preview image.' },
  ]) {
    const image = await renderSocialPreview(text);
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = 1200, right = 0, top = 630, bottom = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        // The background is #f5f2ec. Count only clearly visible ink.
        if (data[offset] < 200) {
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
    }
    assert.ok(right > left, 'image contains visible text');
    assert.ok(left >= 88 && right <= 1112 && top >= 74 && bottom <= 556, 'all ink stays inside safe margins');
    assert.ok(Math.abs((left + right) / 2 - 600) < 24, 'text is horizontally centered');
    assert.ok(Math.abs((top + bottom) / 2 - 315) < 24, 'text is vertically centered');
  }
});

test('About sharing includes the page portrait and personal blog wording', async () => {
  const preview = aboutPreview({ title: 'About', portrait: '/assets/enrico-lepre.jpg' });
  assert.equal(preview.title, 'Enrico Lepre');
  assert.equal(preview.subtitle, 'Chemistry, Fields, and Catalysis');
  const metadata = previewMetadata(preview, '/about.html', 'https://enlepre.github.io');
  assert.equal(metadata.image, `https://enlepre.github.io/social/${previewFilename(preview)}`);
  const image = await renderSocialPreview(preview);
  const info = await sharp(image).metadata();
  assert.equal(info.width, 1200);
  assert.equal(info.height, 630);
  const stats = await sharp(image).extract({ left: 90, top: 90, width: 360, height: 450 }).stats();
  assert.ok(stats.channels.some(channel => channel.stdev > 20), 'left panel contains the portrait');
});
