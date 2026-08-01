## Repository Overview

This repository contains the source code for the personal website, projects, talks, open source portfolio, resume, and downloadable PDF.

When making changes, prioritize consistency, maintainability, and factual accuracy.

---

## Core File Mapping

- **Website Pages**: `index.html`, `projects.html`, `opensource.html`, `speaking.html`, `resume.html`
- **Printable Resume Template**: `scripts/resume-print.html`
- **PDF Generation Script**: `scripts/generate-pdf.js`
- **Generated Assets**: `public/resume.pdf`
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

## Writing Guidelines

- Write concise, factual copy.
- Prefer engineering outcomes over technology lists.
- Avoid marketing language, buzzwords, and exaggerated claims.
- Do not invent achievements, responsibilities, or project details.
- Keep terminology consistent across the entire repository.
- When updating existing content, preserve its tone and writing style.

---

## Resume

The website is the canonical source of information.

Whenever experience, projects, talks, open source contributions, or community involvement change:

- Update the website.
- Update the printable resume (`scripts/resume-print.html`).
- Re-generate the downloadable PDF (`public/resume.pdf`).
- Keep wording consistent across all versions.

Avoid duplicating large amounts of website content inside the resume.

The resume should summarize.

The website should provide the details.

---

## Build & Verification Commands

- **PDF Generation**: `npm run build:pdf` (runs `node scripts/generate-pdf.js` to compile `scripts/resume-print.html` into `public/resume.pdf`).
- **Build Verification**: Ensure `npm run build:pdf` completes with exit code 0 whenever resume HTML templates or CSS styles are modified.

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

- Verify page metadata.
- Verify canonical URLs.
- Verify JSON-LD.
- Keep sitemap and robots.txt synchronized when necessary.

Do not add SEO content purely for keyword density.

Prefer clean, descriptive content.

---

## Internal Consistency

If information exists in multiple places, keep it synchronized.

Common locations include:

- Home (`index.html`)
- Projects (`projects.html`)
- Open Source (`opensource.html`)
- Talks (`speaking.html`)
- Resume (`resume.html`)
- Printable Resume (`scripts/resume-print.html`)
- Downloadable PDF (`public/resume.pdf`)
- LLM Text File (`public/llms.txt`)
- Structured Data & Metadata

Avoid conflicting descriptions across pages.

---

## Task Completion Checklist

Before marking a task as complete, verify:

- Factual accuracy has been preserved.
- Terminology remains consistent.
- Related pages have been updated where necessary.
- Internal links still work.
- Structured data remains valid (if modified).
- Metadata remains consistent (if modified).
- Responsive layout has not regressed (if modified).
- Print layout remains correct (if modified).
- Resume generation (`npm run build:pdf`) still works (if modified).
- No unnecessary dependencies were introduced.
- Existing coding style and project conventions were followed.

If a task affects multiple pages or generated assets, update every relevant location before considering the work complete.