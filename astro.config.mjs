import { defineConfig } from 'astro/config';
import { aboutSections } from './src/lib/about-sections.mjs';
import { externalLinks } from './src/lib/external-links.mjs';
// GitHub Actions supplies the repository name, so both project and root sites work.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'enlepre.github.io';
const base = repository.toLowerCase() === 'enlepre.github.io' ? '' : `/${repository}`;
export default defineConfig({ site: 'https://enlepre.github.io', base: base || '/', output: 'static', redirects: {
  '/essays': `${base}/notes.html`,
  '/essays/good-song': `${base}/notes/good-song.html`,
  '/essays/mistakes': `${base}/notes/mistakes.html`,
  '/research/publications': `${base}/publications.html`,
  '/research/02-publications': `${base}/publications.html`,
}, markdown: { rehypePlugins: [aboutSections, [externalLinks, { site: 'https://enlepre.github.io', base: '/Personal-Blog' }]] }, build: { format: 'file' } });
