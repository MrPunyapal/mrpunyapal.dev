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
- **Semantic Structure**: Prefer standard HTML5 structural elements (`<time>`, `<header>`, `<footer>`, `<main>`, `<nav>`, `<article>`, `<section>`) and maintain a logical, sequentially-descending heading hierarchy (`<h1>` -> `<h2>` -> `<h3>` without skipping levels).

---

## Writing Guidelines

- Write concise, factual copy.
- Prefer engineering outcomes over technology lists.
- Avoid marketing language, buzzwords, and exaggerated claims.
- Do not invent achievements, responsibilities, or project details.
- Keep terminology consistent across the entire repository.
- When updating existing content, preserve its tone and writing style.

---

## Performance & Core Web Vitals

When maintaining or building interactive components and assets:

- **Font Delivery**: Load Google Fonts using `<link rel="stylesheet">` with `display=swap` and preconnect links in `<head>`. Avoid `@import` rules in CSS files to prevent blocking network waterfalls or 404 font errors.
- **Layout Shift (CLS)**: Images (`<img>`) must maintain explicit `width` and `height` attributes alongside matching CSS aspect ratios (`aspect-square` / `aspect-ratio: 1 / 1`) to reserve intrinsic space and prevent mobile layout shifts.
- **Interaction & Main-Thread Responsiveness (INP)**: Dynamic JavaScript animations or recurring loops must be scheduled via `requestAnimationFrame`, pause when off-screen via `IntersectionObserver`, and yield main-thread execution on user interactions (`touchstart` / `pointerdown`) to keep INP under 16ms.

---

## Tips Platform & Architecture

The developer tips platform (`tips.html` and `tips/<slug>.html`) is statically generated from Markdown files maintained in the `content/tips/` submodule:

- **Content Location**: Markdown files live in `content/tips/content/*.md` with YAML frontmatter:
  ```yaml
  ---
  category: "Laravel" # Laravel, Pest PHP, PHP, JavaScript, TypeScript, Git
  tags: ["Laravel", "Eloquent"]
  date: "YYYY-MM-DD" # or created_at: "YYYY-MM-DD"
  updated: "YYYY-MM-DD" # optional: updated_at / updated / last_updated
  author: "Punyapal Shah"
  author_url: "https://x.com/MrPunyapal"
  ---
  ```
- **Date Model & Resolution**:
  - Each tip has a creation date (`created_at` or `date`) and an optional update date (`updated_at`, `updated`, or `last_updated`).
  - Effective publication date is centrally computed as `effectiveDate = updated_at ?? created_at` via `getTipEffectiveDate()` in `scripts/tips/tips-helpers.mjs`.
  - **Sorting & Listings**: Tips index (`tips.html`), RSS `<pubDate>`, and sitemap `<lastmod>` sort and display based on `effectiveDate` so updated tips appear first.
  - **Individual Tip Pages**: Displays `Updated <date>` when `updated_at` exists; displays `<date>` without prefix when unchanged.
  - **Structured Data & SEO**: Preserves original `datePublished` as `created_at` across JSON-LD `TechArticle` and OpenGraph `article:published_time`, and adds `dateModified` / `article:modified_time` only when `updated_at` is present.
- **Modular Build Architecture**: `scripts/build-tips.mjs` orchestrates imports from dedicated submodules in `scripts/tips/`:
  - `scripts/tips/tips-helpers.mjs`: Centralized date helpers (`getTipEffectiveDate`, `normalizeDateStr`), formatting helpers (`formatDate`, `toRfc822Date`, `wrapCdata`, `slugify`, `extractSummary`, `escapeHtml`), `marked` renderer config with `highlight.js`, CSS grid styles, and icon SVG sprite.
  - `scripts/tips/tips-hub.mjs`: Generates main archive page `tips.html` with title `Laravel Tips | Punyapal Shah`.
  - `scripts/tips/tips-single.mjs`: Generates individual tip pages `tips/<slug>.html`.
  - `scripts/tips/tips-rss.mjs`: Generates RSS 2.0 feed `public/tips/feed.xml` with channel title `Laravel Tips | Punyapal Shah`.
  - `scripts/tips/tips-sitemap.mjs`: Generates `public/sitemap.xml`.
- **Feed & Alternate Links**: Ensure `<link rel="alternate" type="application/rss+xml">` in `tips.html` and `tips/<slug>.html` consistently matches the channel title `Laravel Tips | Punyapal Shah`.
- **Zero Client-Side Overhead**: Code syntax highlighting is pre-rendered at build time, ensuring 0 KB client JS overhead and instant first paint.
- **Submodule Workflow**: When modifying tip markdown files or adding new tips, commit changes inside the `content/tips/` repository, then update the submodule pointer in the main repository.

---

## Analytics & Environment Isolation

When maintaining event tracking and client-side scripts:

- **Local & Development Isolation**: All analytics or event tracking functions (`trackEvent` in `src/app.js`) must check `window.location.hostname` and immediately exit on `localhost`, `127.0.0.1`, `0.0.0.0`, `*.local`, and `*.test` domains to prevent local/testing traffic from contaminating production measurement.
- **No Duplicate Scripts**: Avoid loading tracking scripts or tag managers multiple times or on unintended pages.
- **Privacy & Performance**: Do not collect personal information or introduce heavy third-party client trackers without explicit need.

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

- **Title Tags**: Keep titles concise, descriptive, and natural without repetitive keyword stuffing:
  - Home: `Punyapal Shah | Laravel Engineer & Open Source Maintainer`
  - Services: `Services & Sponsorships | Punyapal Shah`
  - Projects: `Projects | Punyapal Shah`
  - Open Source: `Open Source | Punyapal Shah`
  - Tips Index: `Laravel Tips | Punyapal Shah`
  - Individual Tips: `<Tip Title> - <Category Suffix> | Punyapal Shah`
  - Talks: `Talks | Punyapal Shah`
  - Resume: `Resume | Punyapal Shah`
- **Metadata**: Verify page metadata (`<meta name="description">`, `<meta name="author">`) is clear, unique, and factual.
- **Canonical URLs**: Verify canonical URLs are absolute (`https://mrpunyapal.dev/...`), non-duplicate, without trailing slash (except root `/`), and placed in `<head>`.
- **Open Graph & Twitter Cards**: Verify each page has complete `og:type`, `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image`. Match Open Graph / Twitter titles with the page title format.
- **JSON-LD Schema**:
  - `index.html` is the canonical `ProfilePage` on the domain; its `mainEntity` must embed the full `Person` object directly inline.
  - Category and list pages (`projects.html`, `opensource.html`, `talks.html`, `tips.html`) must use `@type: "CollectionPage"`.
  - `services.html` separates distinct offerings into clean `OfferCatalog` objects under `mainEntity` (`services#catalog` for Laravel Engineering, `services#sponsorships` for Sponsorships & Partnerships, and `services#consultations` for 1:1 Consultations).
  - Tip pages (`tips/<slug>.html`) must include `@type: "TechArticle"` and `@type: "BreadcrumbList"`.
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