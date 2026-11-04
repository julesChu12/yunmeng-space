// GitHub 项目站位于仓库子目录；只在构建输出中添加前缀，本地资源配置保持不变。
export function normalizeBasePath(value = '') {
  const segments = value.split('/').filter(Boolean);
  if (segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment) || ['.', '..'].includes(segment))) throw new Error('部署路径只支持普通目录名');
  return segments.length ? `/${segments.join('/')}` : '';
}

export function deploymentHtml(html, basePath) {
  if (!basePath) return html;
  const prefix = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? `${basePath}${value}` : value;
  const visit = (value) => Array.isArray(value) ? value.map(visit) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)])) : prefix(value);
  return html
    .replace(/\b(href|src|poster|data-lightbox)="(\/(?!\/)[^"]*)"/g, (_, attribute, value) => `${attribute}="${prefix(value)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (_, value) => `srcset="${value.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (_, separator, url) => `${separator}${prefix(url)}`)}"`)
    .replace(/(<script\b[^>]*type="application\/json"[^>]*>)([\s\S]*?)(<\/script>)/g, (_, open, json, close) => `${open}${JSON.stringify(visit(JSON.parse(json))).replace(/</g, '\\u003c')}${close}`);
}
