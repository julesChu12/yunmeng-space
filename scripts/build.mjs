import { readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { homePage, projectsPage, projectPage, journalPage, notePage, notFoundPage, escapeHtml } from '../src/templates.mjs';
import { socialPlatforms } from '../src/socials.mjs';
import { modernPage, modernSourcesPage } from '../src/modern.mjs';
import { deploymentHtml, normalizeBasePath } from './deployment-paths.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const dist = path.join(root, 'dist');
export const readJson = async (name) => JSON.parse(await readFile(path.join(root, 'content', `${name}.json`), 'utf8'));

export async function loadContent() {
  const [site, allProjects, notes, modern] = await Promise.all(['site', 'projects', 'notes', 'modern'].map(readJson));
  return { site, projects: allProjects.filter((project) => project.published), notes, modern };
}

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`缺少内容：${name}`);
}

export async function validateContent({ site, projects, notes }) {
  requireText(site.brand, 'site.brand');
  requireText(site.tagline, 'site.tagline');
  requireText(site.hero.image, 'site.hero.image');
  if (!Array.isArray(site.hero.notes) || !site.hero.notes.length) throw new Error('至少需要一条首页设计批注');
  if (site.siteUrl && !/^https?:\/\//.test(site.siteUrl)) throw new Error('siteUrl 必须是完整的 http(s) 地址');
  if (site.companyRegistered && !site.proposedCompanyName) throw new Error('展示已登记公司前请填写实际公司名称');
  const assets = new Set([site.hero.image, site.contact.qrImage].filter(Boolean));
  for (const collection of [projects, notes]) {
    const slugs = new Set();
    for (const item of collection) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || '')) throw new Error(`网址标识仅支持小写英文、数字和短横线：${item.slug}`);
      if (slugs.has(item.slug)) throw new Error(`网址标识重复：${item.slug}`);
      slugs.add(item.slug);
      requireText(item.title, `${item.slug}.title`);
      requireText(item.summary, `${item.slug}.summary`);
      if (!Array.isArray(item.sections) || !item.sections.length) throw new Error(`缺少正文：${item.slug}`);
      for (const section of item.sections) { requireText(section.title, `${item.slug}.section.title`); requireText(section.text, `${item.slug}.section.text`); }
      for (const image of [item.cover, item.image, ...(item.gallery || []).map((photo) => photo.src)].filter(Boolean)) assets.add(image);
    }
  }
  for (const project of projects) {
    if (!['concept', 'real'].includes(project.kind)) throw new Error(`案例性质必须为 concept 或 real：${project.slug}`);
    if (!Array.isArray(project.categories) || !project.categories.length) throw new Error(`缺少筛选分类：${project.slug}`);
    requireText(project.coverAlt, `${project.slug}.coverAlt`);
    requireText(project.imageCredit, `${project.slug}.imageCredit`);
    if (!Array.isArray(project.facts) || !Array.isArray(project.gallery)) throw new Error(`缺少 facts 或 gallery：${project.slug}`);
  }
  for (const note of site.hero.notes) {
    if (![note.x, note.y].every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) throw new Error(`批注坐标应在 0 到 100 之间：${note.id}`);
  }
  for (const image of assets) {
    if (!/^\/images\/[a-zA-Z0-9/_\-.]+$/.test(image) || image.includes('..')) throw new Error(`图片请放在 public/images，并使用 /images/ 开头的路径：${image}`);
    await stat(path.join(root, 'public', image)).catch(() => { throw new Error(`找不到图片：${image}`); });
  }
  for (const { key } of socialPlatforms) {
    if (!site.contact[key]) continue;
    let url;
    try { url = new URL(site.contact[key]); } catch { throw new Error(`社交账号链接必须是完整的 https 地址：${key}`); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`社交账号链接必须使用 https 且不包含登录凭据：${key}`);
  }
}

export async function build({ basePath = process.env.DEPLOY_BASE_PATH || '' } = {}) {
  basePath = normalizeBasePath(basePath);
  const content = await loadContent();
  await validateContent(content);
  const { site, projects, notes, modern } = content;
  await validateModern(modern);
  const pages = new Map([
    ['index.html', homePage(site, projects, notes)],
    ['projects/index.html', projectsPage(site, projects)],
    ['journal/index.html', journalPage(site, notes)],
    ['404.html', notFoundPage(site)],
    ['modern/index.html', modernPage(site, modern)],
    ['modern/sources/index.html', modernSourcesPage(site, modern)]
  ]);
  projects.forEach((project, index) => pages.set(`projects/${project.slug}/index.html`, projectPage(site, project, projects.length > 1 ? projects[(index + 1) % projects.length] : null)));
  notes.forEach((note, index) => pages.set(`journal/${note.slug}/index.html`, notePage(site, note, notes.length > 1 ? notes[(index + 1) % notes.length] : null)));
  await mkdir(dist, { recursive: true });
  for (const [filename, html] of pages) {
    const target = path.join(dist, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, deploymentHtml(html, basePath));
  }
  await cp(path.join(root, 'public'), dist, { recursive: true });
  await Promise.all([
    cp(path.join(root, 'src/styles.css'), path.join(dist, 'styles.css')),
    cp(path.join(root, 'src/client.js'), path.join(dist, 'app.js')),
    cp(path.join(root, 'src/modern.css'), path.join(dist, 'modern.css')),
    cp(path.join(root, 'src/modern.js'), path.join(dist, 'modern.js')),
    writeFile(path.join(dist, 'robots.txt'), site.indexable && site.siteUrl ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site.siteUrl).href}\n` : 'User-agent: *\nDisallow: /\n')
  ]);
  const urls = [...pages.keys()].filter((name) => name !== '404.html').map((name) => `/${name.replace(/index\.html$/, '')}`);
  const sitemap = site.siteUrl && site.indexable ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeHtml(new URL(url, site.siteUrl).href)}</loc></url>`).join('')}</urlset>` : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
  await writeFile(path.join(dist, 'sitemap.xml'), sitemap);
  return { pages: [...pages.keys()], content, basePath };
}

async function validateModern(content) {
  for (const key of ['scenes', 'spaces', 'details', 'sources']) {
    if (!Array.isArray(content[key]) || !content[key].length) throw new Error(`影像版缺少内容：${key}`);
    const ids = content[key].map((item) => item.id);
    if (new Set(ids).size !== ids.length || ids.some((id) => !/^[a-z0-9-]+$/.test(id || ''))) throw new Error(`影像版标识无效或重复：${key}`);
  }
  const sourceIds = new Set(content.sources.map((item) => item.id));
  for (const item of [...content.scenes, ...content.spaces]) if (!sourceIds.has(item.sourceId)) throw new Error(`影像版素材缺少来源：${item.id}`);
  const assets = new Set();
  for (const item of [...content.scenes, ...content.spaces, ...content.details]) {
    for (const key of ['image', 'desktop', 'mobile', 'poster', 'mobilePoster']) if (item[key]) assets.add(item[key]);
  }
  for (const asset of assets) {
    if (/^https:\/\/assets\.yunmengspace\.com\/media\/modern\/[a-z0-9-]+\.mp4$/.test(asset)) continue;
    if (!/^\/media\/[a-zA-Z0-9/_\-.]+$/.test(asset) || asset.includes('..')) throw new Error(`影像版资源请放在 public/media：${asset}`);
    await stat(path.join(root, 'public', asset)).catch(() => { throw new Error(`影像版资源不存在：${asset}`); });
  }
  for (const source of content.sources) for (const key of ['page', 'licenseUrl']) {
    const url = new URL(source[key]);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`素材来源应为 HTTPS 公开地址：${source.id}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`已生成 ${result.pages.length} 个静态页面：${dist}`);
}
