// 页面和站点地图共用收录规则，避免辅助页面进入搜索结果。
const excludedPaths = new Set(['/404.html', '/modern/', '/modern/sources/']);

export function isIndexablePage(site, path) {
  return site.indexable === true && Boolean(site.siteUrl) && !excludedPaths.has(path);
}

export function canonicalUrl(site, path) {
  if (!site.siteUrl || path === '/404.html') return '';
  return new URL(path === '/modern/' ? '/' : path, site.siteUrl).href;
}

export function pageStructuredData(site, { path, title, description, image }) {
  if (!isIndexablePage(site, path)) return null;
  const home = new URL('/', site.siteUrl).href;
  const url = canonicalUrl(site, path);
  const graph = [{
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'zh-CN',
    isPartOf: { '@id': `${home}#website` },
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: new URL(image, home).href } } : {})
  }];
  if (path === '/') {
    graph.push({
      '@type': 'WebSite', '@id': `${home}#website`,
      url: home, name: site.brand, inLanguage: 'zh-CN',
      publisher: { '@id': `${home}#organization` }
    });
    const sameAs = ['xiaohongshuUrl', 'douyinUrl', 'bilibiliUrl', 'weiboUrl'].map((key) => site.contact[key]).filter(Boolean);
    graph.push({
      '@type': 'Organization', '@id': `${home}#organization`,
      name: site.brand, url: home, description: site.description,
      ...(sameAs.length ? { sameAs } : {})
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
