import test from 'node:test';
import assert from 'node:assert/strict';
import { deploymentHtml, normalizeBasePath } from './deployment-paths.mjs';

test('项目站前缀同时覆盖 HTML、响应式封面与客户端视频配置', () => {
  const fixture = '<a href="/modern/#spaces">空间</a><a href="#main">跳过</a><a href="https://example.com/">外链</a><img src="/images/home.jpg" srcset="/images/small.jpg 640w, /images/large.jpg 1280w"><video poster="/media/cover.jpg"></video><button data-lightbox="/images/full.jpg"></button><script type="application/json" id="modern-data">{"scenes":[{"desktop":"/media/desktop.mp4","mobile":"/media/mobile.mp4","source":"https://example.com/"}],"text":"文字"}</script>';
  const output = deploymentHtml(fixture, '/yunmeng-space');
  assert.ok(output.includes('href="/yunmeng-space/modern/#spaces"'));
  assert.ok(output.includes('srcset="/yunmeng-space/images/small.jpg 640w, /yunmeng-space/images/large.jpg 1280w"'));
  assert.ok(output.includes('poster="/yunmeng-space/media/cover.jpg"'));
  assert.ok(output.includes('data-lightbox="/yunmeng-space/images/full.jpg"'));
  const data = JSON.parse(output.match(/<script[^>]*>(.*?)<\/script>/)[1]);
  assert.equal(data.scenes[0].desktop, '/yunmeng-space/media/desktop.mp4');
  assert.equal(data.scenes[0].mobile, '/yunmeng-space/media/mobile.mp4');
  assert.equal(data.scenes[0].source, 'https://example.com/');
  assert.ok(output.includes('href="#main"'));
  assert.equal(deploymentHtml(fixture, ''), fixture);
});

test('部署路径拒绝路径穿越、协议和查询字符', () => {
  assert.equal(normalizeBasePath('/yunmeng-space/'), '/yunmeng-space');
  assert.equal(normalizeBasePath('/'), '');
  for (const value of ['../site', '/foo/../site', 'https://example.com', 'site?x=1', 'site#fragment']) assert.throws(() => normalizeBasePath(value));
});

test('GitHub Pages 子目录发布保留 R2 视频的完整域名和版本路径', () => {
  const desktop = 'https://assets.yunmengspace.com/media/modern/tree-room-desktop-00bbf8cd5eb66933.mp4';
  const mobile = 'https://assets.yunmengspace.com/media/modern/tree-room-mobile-985697077affbcf3.mp4';
  const fixture = `<script type="application/json" id="modern-data">${JSON.stringify({ scenes: [{ desktop, mobile, poster: '/media/modern/tree-room-poster.jpg' }] })}</script>`;
  const output = deploymentHtml(fixture, '/yunmeng-space');
  const scene = JSON.parse(output.match(/<script[^>]*>(.*?)<\/script>/)[1]).scenes[0];
  assert.equal(scene.desktop, desktop);
  assert.equal(scene.mobile, mobile);
  assert.equal(scene.poster, '/yunmeng-space/media/modern/tree-room-poster.jpg');
});
