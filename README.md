# Enrico Lepre — Personal Blog

Static Astro website, published at https://enlepre.github.io/.

## Homepage

The homepage shows the title and landscape from `src/content/pages/home.md` on a single screen. The [animated homepage archive](https://github.com/enLepre/IdeasToStore) includes the career map, scroll effects, assets and tests.

## Development commands

Use Node.js 24 or newer. Run `corepack enable` and `pnpm install --frozen-lockfile`, then `pnpm run dev`.
Run `pnpm test` and `pnpm run build` before publishing. `pnpm run preview` previews the production build.

## Edit content

- `src/content/pages/home.md`: Home title, separate `menuTitle`, image, footer, and hierarchy.
- `src/content/research/*.md`: research entries.
- `src/content/notes/*.md`: all notes and longer pieces, with optional `status`.
- `src/content/sections/*.md`: section titles and introductions; `about.md` also contains the biography and contact text.

Every page Markdown file requires a positive integer `level` in its YAML frontmatter. Use `level: 1` for Home, `level: 2` for sections, and `level: 3` for articles. A larger destination level slides upward; a smaller destination level slides downward, including when using browser history between section and article pages. Equal levels retain the router’s normal direction. Change these numbers to customize hierarchy; URLs do not determine the animation.

Each page also supports `reading: true` or `reading: false`. All current level 3 articles use `reading: true`; Home and sections use `false`. This setting is independent of `level`, so you can change either later. On section and article pages, the rhombus and footer appear at the top, fade away after scrolling more than 48 pixels, and reappear when you return to the top area. Hidden controls cannot receive clicks or keyboard focus. A page opened or restored partway down starts with the controls hidden.

Use standard YAML `level: 3` (one colon), not `level:: 3`.

Each dated entry has `title` and `date` (YYYY-MM-DD) in its YAML frontmatter, followed by its Markdown body. Research and Notes are automatically sorted newest first. Equal dates use the optional `order` number (smaller first), then the filename as a stable tie-breaker. Articles without `order` come after numbered articles on the same date. Individual Notes end with a right-aligned signature: `Enrico` above the publication date, formatted as `February 16th, 2024`. The date comes from the note's frontmatter and is formatted in UTC so it stays consistent across time zones. Research pages and section lists do not display dates.

Use a `preview` field in the frontmatter to control the short description shown on the homepage and section lists:

```yaml
---
title: "Current work"
level: 3
reading: true
date: 2026-10-05
preview: "Exploring electric fields at material and electrolyte interfaces."
---
```

Write the full article below the closing `---`. Lists display only the title, preview and optional note status; clicking the title opens the full Markdown article. Preview text is plain text, not Markdown or HTML. If `preview` is missing or blank, no description is shown; the article body is never used as a fallback. For a longer sentence, YAML's `preview: >-` folded style can span multiple lines.

Section files supply each section’s title, optional `lead`, and hierarchy. Write Markdown below their frontmatter to add content above the article list; About displays its complete Markdown biography and contact text. Home keeps the name and image by default; its Markdown body is empty and can be filled if you want additional text. Home’s `image` path starts with `/assets/`, and `imageAlt` controls its accessible description.

The existing placeholders all use 2026-10-05, the day they were first committed; they are not new publications. Replace these dates when publishing real content. About uses level-two headings to separate its blocks.

On section and article pages, a top-left rhombus rotates into a square on hover or focus; clicking or activating it expands the square into the navigation panel. Navigation uses the Markdown `level` values: increasing slides upward, decreasing slides downward (section → article). Same-level navigation follows the router’s normal direction, including browser Back/Forward. The footer stays stationary. Reduced-motion preferences disable the page animation. The original `.html` section and article URLs are preserved. Shared styling lives in `src/styles/global.css`.

## Automatic publications

The Publications section (`publications.html`, level 2) displays all public works from Enrico Lepre's ORCID record, `0000-0003-4252-3056`. Its title and introduction are in `src/content/sections/publications.md`. It is independent of Research; the former `research/publications.html` and `research/02-publications.html` URLs redirect to it.

`src/data/publication-sync.json` selects the ORCID record. `pnpm sync:publications` fetches the public works and their details, selects ORCID's preferred record in each group, deduplicates DOIs, and saves newest-first titles, authors, journals, years and links to `src/data/publications.json`. Works without DOIs, journal names, authors or dates remain included using the available metadata. Only public ORCID works can be shown; add missing publications to your ORCID record and make them public. This is not a Google Scholar mirror.

The Pages workflow refreshes on every push to `main`, on a manual run, and each Monday at 06:17 UTC. A complete successful refresh replaces the saved list, so edits, removals and visibility changes in ORCID are reflected. Tests and the production build run before the updated cache is committed and published. Workflow-token commits do not trigger another push run. The workflow requires permission to write repository contents.

If ORCID fails or sends incomplete data, the saved list is preserved and the blog can still deploy using that cache. A first sync without any cached works must succeed. Ordinary `pnpm run build` is offline and uses the saved list. Changing the ORCID also requires replacing its cache to avoid showing another person's works.

## Link previews

Every build generates a minimal 1200 × 630 PNG for the homepage, sections, notes, and research articles. The images contain only the exact title and subtitle on the site's warm paper background. PNG text uses bundled Libre Baskerville, a portable serif alternative to Georgia; the website's typography is unchanged. Generation runs locally during the build and does not call an image service.

For notes and research, the existing `preview` text supplies the subtitle. Sections use `lead`, then `preview` if the lead is empty. An optional `subtitle` frontmatter field overrides these defaults on any page, including Home; `subtitle: ""` deliberately produces a title-only image. No subtitle is invented when all these fields are absent. Long text wraps and reduces in size rather than being shortened.

The shared layout adds Open Graph and Twitter/X metadata with absolute image and canonical URLs, including the GitHub Pages base path. Updating the wording changes the generated image URL. Sharing platforms control their surrounding card layout, cropping, and caching, so an existing shared link may take time to refresh.

## Publish

Every push to `main` runs `.github/workflows/pages.yml`: install from the lockfile, test, build Astro, upload only `dist`, deploy to GitHub Pages. A manual workflow run is also supported. The existing branch-based Pages configuration is supported: the Astro deployment waits for any legacy build of the same commit to finish before publishing, preventing it from overwriting the built site. Switching Pages to **GitHub Actions** removes that redundant legacy build.

## Individual article pages

Every Markdown entry in Research and Notes generates its own URL:
`/<collection>/<filename-without-md>.html`.
Click its title from the section page to read it separately.
The section Markdown files have their existing `research.html`, `notes.html`,
and `about.html` pages. The navigation links to them. The former Essays section
and its articles redirect to Notes and the corresponding Note articles, preserving existing links.
Paragraph spacing and justification are shared between previews and full articles.

## Content templates and filenames

Each content folder (`pages`, `sections`, `research`, `notes`) contains a `template.md` with fields and writing examples specific to that folder. The content loaders explicitly exclude these template files: they never become pages, menu entries, or list entries. For a new article, copy the appropriate template to a descriptive filename, replace its sample fields, and write below the frontmatter. For Home or an existing section, use the template as a guide when editing its existing file; additional sections or standalone pages need routes.

Numeric filename prefixes have been removed. Their tie-breaking order is stored in each article’s `order` field. The optional `legacySlug` field preserves a previous URL through a redirect (for example `01-first-note` redirects to `first-note.html`); keep it on the renamed article and omit it on new articles. Current site links use the clean filenames.

External web links in Markdown (including HTML links) and the publication list open in a new browser tab or window. Internal links retain normal page navigation. No extra Markdown properties are required for this behavior.

The About page uses `portrait` and `portraitAlt` in `src/content/sections/about.md` to display a photograph beside the title at the top-right. Its current local image (`public/assets/enrico-lepre.jpg`) is the supplied `IMG_1544.JPG`; removing `portrait` restores the text-only heading.

The home image uses `public/assets/landscape-highres.png` (1575 × 999), enhanced with the built-in image tool from the original 560 × 355 drawing. Prompt: improve resolution and clarity while preserving the mountain silhouettes, river, sparse pen strokes, white background, composition, and handwritten “Same questions, a wider landscape.” note.

The homepage landscape and About portrait use `OptimizedImage.astro` to generate responsive WebP images during the build, using Sharp. The original assets and Markdown paths remain editable; browsers choose an image size appropriate for the screen. Menu/footer visibility updates only when crossing the 48-pixel scroll threshold.
