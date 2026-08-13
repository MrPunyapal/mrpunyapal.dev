## Repository Overview

This repository contains the source code for the personal website, projects, talks, open source portfolio, developer tips platform, resume, and downloadable PDF.

When making changes, prioritize consistency, maintainability, and factual accuracy.

---

## Core File Mapping

- **Website Pages**: `index.html`, `services.html`, `projects.html`, `opensource.html`, `tips.html`, `tips/<slug>.html`, `talks.html`, `resume.html`
- **Tips Content Submodule**: `content/tips/` (Tracked submodule repository `MrPunyapal/tips` containing Markdown files)
- **Tips Static Generator**: `scripts/build-tips.mjs` (Main orchestrator importing modular submodules from `scripts/tips/` for static HTML, search index, RSS 2.0 feed, and sitemap)
- **Search Index**: `public/tips-search-index.json`
- **Tips RSS 2.0 Feed**: `public/tips/feed.xml`
- **Printable Resume Template**: `scripts/resume-print.html`
- **PDF Generation Script**: `scripts/generate-pdf.js`
- **Generated Assets**: `public/resume.pdf`
- **Site Index & Crawler Config**: `public/sitemap.xml`, `public/robots.txt`
- **LLM Context File**: `public/llms.txt`

---

## General Guidelines

- Keep the website minimal, fast, and content-focused.
- Prefer simple solutions over additional dependencies.
- Preserve accessibility and responsive behavior.
- Avoid unnecessary JavaScript and CSS complexity.
- Follow the existing project structure and coding style.
- Do not introduce new libraries unless they provide clear long-term value.

---

## Accessibility & HTML5 Semantics

When creating or modifying HTML markup across pages:

- **Dates & Date Ranges**: Use standard HTML5 `<time datetime="...">` tags for all dates, years, and date ranges.
- **Interactive Elements**: All interactive controls (links, buttons, icon-only actions, or repeated call-to-action text) must include explicit, contextually unique `aria-label` attributes that describe their specific target or action for assistive technologies.
- **Decorative Elements**: Apply `aria-hidden="true"` to all non-semantic visual decor, decorative SVGs (including layout crosshairs, corner markers, card dot patterns, decorative icons), and visual cursors so assistive technologies ignore them and automated audit tools (Lighthouse/PageSpeed) do not flag them for text contrast.
- **Color Contrast**: Ensure all text, headings, badges, and interactive states maintain WCAG AA compliant contrast ratios (at least 4.5:1 ratio against backgrounds). Prefer `text-slate-500` or darker over `text-slate-400` for light-mode text/headings, and use `-700` text shades (e.g. `bg-red-50 text-red-700`) for light-mode badges to ensure compliance.
- **Semantic Structure**: Prefer standard HTML5 structural elements (`<time>`, `<header>`, `<footer>`, `<main>`, `<nav>`, `<article>`, `<section>`) and maintain a logical, sequential heading hierarchy (`<h1>` through `<h3>`).

---

## Writing Guidelines

- Write concise, factual copy.
- Prefer engineering outcomes over technology lists.
- Avoid marketing language, buzzwords, and exaggerated claims.
- Do not invent achievements, responsibilities, or project details.
- Keep terminology consistent across the entire repository.
- When updating existing content, preserve its tone and writing style.

---

## Tips Platform & Architecture

The developer tips platform (`tips.html` and `tips/<slug>.html`) is statically generated from Markdown files maintained in the `content/tips/` submodule:

- **Content Location**: Markdown files live in `content/tips/content/*.md` with YAML frontmatter:
  ```yaml
  ---
  category: "Laravel" # Laravel, Pest PHP, PHP, JavaScript, TypeScript, Git
  tags: ["Laravel", "Eloquent"]
  date: "YYYY-MM-DD"
  author: "Punyapal Shah"
  author_url: "https://x.com/MrPunyapal"
  ---
  ```
- **Modular Build Architecture**: `scripts/build-tips.mjs` orchestrates imports from dedicated submodules in `scripts/tips/`:
  - `scripts/tips/tips-helpers.mjs`: Formatting helpers (`formatDate`, `toRfc822Date`, `wrapCdata`, `slugify`, `extractSummary`, `escapeHtml`), `marked` renderer config with `highlight.js`, CSS grid styles, and icon SVG sprite.
  - `scripts/tips/tips-hub.mjs`: Generates main archive page `tips.html`.
  - `scripts/tips/tips-single.mjs`: Generates individual tip pages `tips/<slug>.html`.
  - `scripts/tips/tips-rss.mjs`: Generates RSS 2.0 feed `public/tips/feed.xml`.
  - `scripts/tips/tips-sitemap.mjs`: Generates `public/sitemap.xml`.
- **Zero Client-Side Overhead**: Code syntax highlighting is pre-rendered at build time, ensuring 0 KB client JS overhead and instant first paint.
- **Submodule Workflow**: When modifying tip markdown files or adding new tips, commit changes inside the `content/tips/` repository, then update the submodule pointer in the main repository.

---

## Resume

The website is the canonical source of information.

Whenever experience, projects, talks, open source contributions, or community involvement change:

- Update the website.
- Update the printable resume (`scripts/resume-print.html`) if resume content is affected.
- Re-generate the downloadable PDF (`public/resume.pdf`) ONLY when resume files or printable templates change.
- Keep wording consistent across all versions.

Avoid duplicating large amounts of website content inside the resume.

The resume should summarize.

The website should provide the details.

---

## Build & Verification Commands

- **Development Server**: `npm run dev` (Vite dev server with automatic tip regeneration plugin and hot-reload).
- **Tips Generation**: `npm run build:tips` (Compiles `content/tips` into `tips.html`, `tips/<slug>.html`, search index, and updates sitemap).
- **Production Build**: `npm run build` (Compiles tips, bundles assets, and outputs production static site to `dist/`).
- **PDF Generation**: `npm run build:pdf` (runs `node scripts/generate-pdf.js` to compile `scripts/resume-print.html` into `public/resume.pdf`).
- **Generation Condition**: Run `npm run build:pdf` ONLY when resume-related files (`scripts/resume-print.html`, `scripts/generate-pdf.js`, or resume-specific styles/content) are modified. Do not generate or rebuild the PDF for unrelated website changes (such as homepage tweaks, navigation, talks, or styling changes on other pages).
- **Build Verification**: Ensure `npm run build` completes with exit code 0 on all website updates.

---

## Projects

Every project description should answer:

1. What problem was solved?
2. What engineering work was completed?
3. What outcome was achieved?

Avoid descriptions that only list technologies.

Technologies should support the description rather than become the description.

---

## Open Source

When updating open source content:

- Use current package names.
- Keep descriptions concise.
- Avoid unnecessary historical storytelling unless specifically requested.
- Maintain consistent wording across all pages.

---

## Talks

When adding or updating talks:

- Keep titles consistent everywhere.
- Verify event names.
- Verify recording links.
- Update structured data if required.

---

## SEO & Structured Data

Whenever pages are modified:

- Verify page metadata (`<title>`, `<meta name="description">`, `<meta name="author">`).
- Verify canonical URLs.
- Verify OpenGraph (`og:type`, `og:title`, `og:description`, `og:image`) and Twitter Card metadata.
- Verify JSON-LD Schema (`TechArticle`, `ProfilePage`, `BreadcrumbList`, etc.).
- Keep `sitemap.xml`, `robots.txt`, and `llms.txt` synchronized.

Do not add SEO content purely for keyword density.

Prefer clean, descriptive content.

---

## Internal Consistency

If information exists in multiple places, keep it synchronized.

Common locations include:

- Home (`index.html`)
- Projects (`projects.html`)
- Open Source (`opensource.html`)
- Tips (`tips.html` and `tips/<slug>.html`)
- Talks (`talks.html`)
- Resume (`resume.html`)
- Printable Resume (`scripts/resume-print.html`)
- Downloadable PDF (`public/resume.pdf`)
- LLM Text File (`public/llms.txt`)
- Sitemap (`public/sitemap.xml`)
- Structured Data & Metadata

Avoid conflicting descriptions across pages.

---

## Task Completion Checklist

Before marking a task as complete, verify:

- Factual accuracy has been preserved.
- Terminology remains consistent.
- Related pages have been updated where necessary.
- Internal links still work.
- HTML5 semantic elements (`<time>`, etc.) are correctly used.
- Accessibility standards (ARIA labels, `aria-hidden` on visual decor, WCAG AA contrast) are maintained.
- Structured data remains valid (if modified).
- Metadata remains consistent (if modified).
- Responsive layout has not regressed (if modified).
- Print layout remains correct (if modified).
- No unnecessary dependencies were introduced.
- Existing coding style and project conventions were followed.

If a task affects multiple pages or generated assets, update every relevant location before considering the work complete.