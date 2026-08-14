import fs from 'node:fs';
import path from 'node:path';
import { toRfc822Date, wrapCdata } from './tips-helpers.mjs';

export function generateRssFeed(tips, publicDir) {
    const publicTipsDir = path.join(publicDir, 'tips');
    if (!fs.existsSync(publicTipsDir)) {
        fs.mkdirSync(publicTipsDir, { recursive: true });
    }

    const feedPathInPublic = path.join(publicTipsDir, 'feed.xml');

    const itemsXml = tips.map(tip => {
        const canonicalUrl = `https://mrpunyapal.dev/tips/${tip.slug}`;

        // Deduplicate categories, subcategory, and tags
        const categorySet = new Set();
        if (tip.category) categorySet.add(tip.category);
        if (tip.subcategory) categorySet.add(tip.subcategory);
        if (Array.isArray(tip.tags)) {
            tip.tags.forEach(t => categorySet.add(t));
        }
        const categoriesXml = Array.from(categorySet)
            .map(cat => `      <category>${wrapCdata(cat)}</category>`)
            .join('\n');

        const updatedXml = tip.updated
            ? `\n      <atom:updated>${toRfc822Date(tip.updated)}</atom:updated>`
            : '';

        return `    <item>
      <title>${wrapCdata(tip.title)}</title>
      <link>${canonicalUrl}</link>
      <guid isPermaLink="true">${canonicalUrl}</guid>
      <description>${wrapCdata(tip.summary)}</description>
      <content:encoded>${wrapCdata(tip.rssContent || tip.htmlContent)}</content:encoded>
      <pubDate>${toRfc822Date(tip.date)}</pubDate>${updatedXml}
      <dc:creator>${wrapCdata(tip.author)}</dc:creator>
${categoriesXml}
    </item>`;
    }).join('\n');

    let lastBuildDate = new Date().toUTCString();
    const latestTip = tips.length > 0 ? tips[0] : null;
    const feedPubDate = latestTip ? toRfc822Date(latestTip.updated || latestTip.date) : lastBuildDate;

    // Check if feed already exists in public/tips/feed.xml and if items are unchanged to prevent lastBuildDate churn on redeploys
    if (fs.existsSync(feedPathInPublic)) {
        try {
            const existingXml = fs.readFileSync(feedPathInPublic, 'utf-8');
            const existingItemsMatch = existingXml.match(/<atom:link[^>]*\/>\s*([\s\S]*?)\s*<\/channel>/);
            const existingItems = existingItemsMatch ? existingItemsMatch[1].trim() : '';

            if (existingItems && existingItems.replace(/\r\n/g, '\n').trim() === itemsXml.replace(/\r\n/g, '\n').trim()) {
                const dateMatch = existingXml.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/);
                if (dateMatch) {
                    lastBuildDate = dateMatch[1];
                }
            }
        } catch (e) {
            // Fallback to current date on parse error
        }
    }

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Laravel Tips | Punyapal Shah</title>
    <link>https://mrpunyapal.dev/tips</link>
    <description>Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.</description>
    <language>en-us</language>
    <copyright>Copyright (c) Punyapal Shah</copyright>
    <pubDate>${feedPubDate}</pubDate>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://mrpunyapal.dev/tips/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`;

    const cleanXml = rssXml.replace(/\r\n/g, '\n');
    fs.writeFileSync(feedPathInPublic, cleanXml, 'utf-8');
}
