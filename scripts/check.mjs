import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { build, dist } from './build.mjs';

// 检查生成结果，重点防止内容替换后出现图片丢失、断链或错误发布。
const { pages, content, basePath } = await build();
const htmlByPath = new Map(await Promise.all(pages.map(async (name) => [name, await readFile(path.join(dist, name), 'utf8')])));
assert.match(htmlByPath.get('index.html'), /id="hero-film"/, '首页应使用影像版');
assert.match(htmlByPath.get('index.html'), /id="modern-data"/, '首页应包含 R2 视频配置');
assert.match(htmlByPath.get('modern/index.html'), /http-equiv="refresh"/, '旧影像地址应跳转到首页');
let references = 0;
for (const [name, html] of htmlByPath) {
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name} 应有且仅有一个主标题`);
  assert.match(html, /<html lang="zh-CN">/, `${name} 缺少页面语言`);
  assert.match(html, /name="viewport"/, `${name} 缺少移动端声明`);
  assert.ok(!/[—–]/.test(html), `${name} 存在不符合视觉规范的破折号`);
  if (!content.site.indexable || !content.site.siteUrl) assert.match(html, /content="noindex,nofollow"/, `${name} 草稿应关闭搜索收录`);
  if (!content.site.companyRegistered) assert.ok(!html.includes(content.site.proposedCompanyName), `${name} 不应把拟用公司名展示为已登记主体`);
  for (const match of html.matchAll(/<img\b[^>]*>/g)) assert.match(match[0], /\balt="[^"]*"/, `${name} 图片缺少说明`);
  for (const [, attribute, raw] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (!raw.startsWith('/') && !raw.startsWith('#')) continue;
    references++;
    const url = new URL(raw.replaceAll('&amp;', '&'), `https://test.invalid${basePath}/${name}`);
    assert.ok(!basePath || url.pathname.startsWith(`${basePath}/`), `${name} 资源缺少部署路径前缀：${raw}`);
    let file = url.pathname.slice(basePath.length).replace(/^\//, '');
    if (!file || file.endsWith('/')) file += 'index.html';
    await stat(path.join(dist, file)).catch(() => { throw new Error(`${name} 断链：${attribute}=${raw}`); });
    if (url.hash && file.endsWith('.html')) {
      const target = htmlByPath.get(file) || await readFile(path.join(dist, file), 'utf8');
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${name} 锚点不存在：${raw}`);
    }
  }
}
console.log(`检查通过：${pages.length} 个页面，${references} 处本地链接与资源引用。`);
console.log('内容结构、图片文件、主标题、锚点、预览收录设置及拟用主体显示检查通过。');

const css = await readFile(path.join(dist, 'styles.css'), 'utf8');
const tokenBlocks = [...css.matchAll(/:root\s*\{([^}]+)\}/g)];
function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map((channel) => parseInt(channel, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
tokenBlocks.forEach(([, block], index) => {
  const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[a-f0-9]{6})/gi)].map(([, name, value]) => [name, value]));
  for (const [foreground, background] of [['text', 'bg'], ['muted', 'bg'], ['muted', 'surface'], ['accent', 'bg'], ['on-accent', 'accent']]) {
    const ratio = contrast(tokens[foreground], tokens[background]);
    assert.ok(ratio >= 4.5, `${index === 0 ? '浅色' : '深色'} ${foreground}/${background} 对比度不足：${ratio.toFixed(2)}`);
  }
});
console.log('浅色与深色的正文、辅助文字和主按钮颜色对比度均达到 4.5:1。');
