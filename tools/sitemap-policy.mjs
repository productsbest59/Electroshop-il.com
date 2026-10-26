// Only public, indexable canonical HTML documents belong in the sitemap.
export function isIndexableStaticPage(file, html, origin) {
  if (/(?:^|[-/])admin(?:[-.]|$)/i.test(file)) return false;
  const tags = name => [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(match =>
    Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(attr => [attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? ''])));
  if (tags('meta').some(tag => /^(robots|googlebot)$/i.test(tag.name || '') && /\bnoindex\b/i.test(tag.content || ''))) return false;
  const address = new URL(file === 'index.html' ? '/' : '/' + file, origin).href;
  for (const link of tags('link').filter(tag => /(?:^|\s)canonical(?:\s|$)/i.test(tag.rel || ''))) {
    try { if (!link.href || new URL(link.href.replaceAll('&amp;', '&'), address).href !== address) return false; }
    catch { return false; }
  }
  return true;
}
