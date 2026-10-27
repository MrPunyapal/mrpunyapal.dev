import path from 'node:path';
import {
    escapeHtml,
    formatCategory,
    getTipEffectiveDate,
    renderRssHtml,
    toRfc822Date,
    wrapCdata,
    writeFileIfChanged
} from '../content-helpers.mjs';

/**
 * Generate RSS 2.0 Feed for Blog
 * Output: public/blog/feed.xml
 */
export function generateBlogRssFeed(posts, rootDir) {
    const feedOutPath = path.resolve(rootDir, 'public', 'blog', 'feed.xml');

    const latestPostDate = posts.reduce((max, p) => {
        const d = getTipEffectiveDate(p);
        return d > max ? d : max;
    }, '');
    const lastBuildDate = toRfc822Date(latestPostDate || new Date());

    const itemsXml = posts.map(post => {
        const effectiveDate = getTipEffectiveDate(post);
        const pubDate = toRfc822Date(effectiveDate);
        const postUrl = `https://mrpunyapal.dev/blog/${post.slug}`;
        const rssHtmlContent = renderRssHtml(post.body || '');

        const categories = [post.category, post.subcategory, ...(post.tags || [])]
            .filter(Boolean)
            .map(c => `<category>${escapeHtml(c)}</category>`)
            .join('\n            ');

        return `        <item>
            <title>${wrapCdata(post.title)}</title>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <pubDate>${pubDate}</pubDate>
            <description>${wrapCdata(post.summary)}</description>
            <content:encoded>${wrapCdata(rssHtmlContent)}</content:encoded>
            <author>contact@mrpunyapal.dev (${escapeHtml(post.author || 'Punyapal Shah')})</author>
            ${categories}
        </item>`;
    }).join('\n');

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Blog | Punyapal Shah</title>
        <link>https://mrpunyapal.dev/blog</link>
        <atom:link href="https://mrpunyapal.dev/blog/feed.xml" rel="self" type="application/rss+xml"/>
        <description>Articles, tutorials, and engineering guides for Laravel, PHP, Git, and modern web development by Punyapal Shah.</description>
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
