import path from 'node:path';
import {
    escapeHtml,
    formatCategory,
    getTipEffectiveDate,
    renderRssHtml,
    toRfc822Date,
    wrapCdata,
    writeFileIfChanged
} from './tips-helpers.mjs';

/**
 * Generate RSS 2.0 Feed for Laravel Tips
 * Output: public/tips/feed.xml
 */
export function generateTipsRssFeed(tips, rootDir) {
    const feedOutPath = path.resolve(rootDir, 'public', 'tips', 'feed.xml');

    const lastBuildDate = toRfc822Date(new Date());

    const itemsXml = tips.map(tip => {
        const effectiveDate = getTipEffectiveDate(tip);
        const pubDate = toRfc822Date(effectiveDate);
        const tipUrl = `https://mrpunyapal.dev/tips/${tip.slug}`;
        const rssHtmlContent = renderRssHtml(tip.body || '');

        const categories = [tip.category, tip.subcategory, ...(tip.tags || [])]
            .filter(Boolean)
            .map(c => `<category>${escapeHtml(c)}</category>`)
            .join('\n            ');

        return `        <item>
            <title>${wrapCdata(tip.title)}</title>
            <link>${tipUrl}</link>
            <guid isPermaLink="true">${tipUrl}</guid>
            <pubDate>${pubDate}</pubDate>
            <description>${wrapCdata(tip.summary)}</description>
            <content:encoded>${wrapCdata(rssHtmlContent)}</content:encoded>
            <author>contact@mrpunyapal.dev (${escapeHtml(tip.author || 'Punyapal Shah')})</author>
            ${categories}
        </item>`;
    }).join('\n');

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Laravel Tips | Punyapal Shah</title>
        <link>https://mrpunyapal.dev/tips</link>
        <atom:link href="https://mrpunyapal.dev/tips/feed.xml" rel="self" type="application/rss+xml"/>
        <description>Curated bite-sized engineering tips for Laravel developers and the PHP ecosystem by Punyapal Shah.</description>
        <language>en-US</language>
        <lastBuildDate>${lastBuildDate}</lastBuildDate>
        <managingEditor>contact@mrpunyapal.dev (Punyapal Shah)</managingEditor>
        <webMaster>contact@mrpunyapal.dev (Punyapal Shah)</webMaster>
${itemsXml}
    </channel>
</rss>
`;

    writeFileIfChanged(feedOutPath, feedXml);
}
