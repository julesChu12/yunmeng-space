import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { documentPage } from '../src/templates.mjs';
import { modernHomeRedirectPage } from '../src/modern.mjs';
import { canonicalUrl, isIndexablePage, jsonForScript } from '../src/seo.mjs';

const site = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
const render = (config = site, path = '/') => documentPage(config, { title: '测试页面', description: '测试页面说明', path, main: '<h1>测试页面</h1>' });

test('正式内容允许收录，错误页、来源页和旧地址保持不收录', () => {
  for (const path of ['/', '/projects/', '/journal/', '/journal/start-with-your-things/']) {
    assert.equal(isIndexablePage(site, path), true);
    assert.match(render(site, path), /content="index,follow,max-image-preview:large"/);
  }
  for (const path of ['/404.html', '/modern/', '/modern/sources/']) {
    assert.equal(isIndexablePage(site, path), false);
    assert.match(render(site, path), /content="noindex,follow"/);
  }
  const draft = { ...site, indexable: false };
  assert.equal(isIndexablePage(draft, '/'), false);
  assert.match(render(draft), /content="noindex,nofollow"/);
  assert.ok(!render(draft).includes('application/ld+json'));
});

test('规范网址统一到 HTTPS 主域名，旧地址指向首页，404 不设规范网址', () => {
  assert.equal(canonicalUrl(site, '/'), 'https://yunmengspace.com/');
  assert.equal(canonicalUrl(site, '/projects/'), 'https://yunmengspace.com/projects/');
  assert.equal(canonicalUrl(site, '/modern/'), 'https://yunmengspace.com/');
  assert.equal(canonicalUrl(site, '/404.html'), '');
  assert.match(modernHomeRedirectPage(site), /rel="canonical" href="https:\/\/yunmengspace\.com\/"/);
  assert.ok(!render(site, '/404.html').includes('rel="canonical"'));
});

test('品牌结构化数据只包含已知信息，空社媒和拟用公司名称不输出', () => {
  const html = render();
  const data = JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const website = data['@graph'].find((item) => item['@type'] === 'WebSite');
  const organization = data['@graph'].find((item) => item['@type'] === 'Organization');
  assert.equal(website.name, '云梦空间');
  assert.equal(website.url, 'https://yunmengspace.com/');
  assert.equal(organization.name, '云梦空间');
  assert.ok(!('sameAs' in organization));
  assert.ok(!('address' in organization));
  assert.ok(!('telephone' in organization));
  assert.ok(!html.includes(site.proposedCompanyName));
  assert.match(html, /property="og:image" content="https:\/\/yunmengspace\.com\/media\/modern\/tree-room-poster.jpg"/);
});

test('结构化数据正确转义脚本结束标签且保持 JSON 内容可还原', () => {
  const name = '云梦</script><script>alert(1)</script>';
  const encoded = jsonForScript({ name });
  assert.ok(!encoded.includes('<'));
  assert.equal(JSON.parse(encoded).name, name);
  const html = render({ ...site, brand: name });
  const data = JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data['@graph'].find((item) => item['@type'] === 'WebSite').name, name);
});

test('验证标签留空时不输出，填写后只在首页输出并转义', () => {
  const blank = { ...site, verification: { google: '', baidu: '' } };
  assert.ok(!render(blank).includes('google-site-verification'));
  assert.ok(!render(blank).includes('baidu-site-verification'));
  const config = { ...site, verification: { google: 'google-test', baidu: 'baidu-test"<value>' } };
  const html = render(config);
  assert.match(html, /name="google-site-verification" content="google-test"/);
  assert.match(html, /name="baidu-site-verification" content="baidu-test&quot;&lt;value&gt;"/);
  assert.ok(!render(config, '/projects/').includes('google-site-verification'));
});
