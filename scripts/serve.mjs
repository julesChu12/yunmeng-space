import http from 'node:http';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sendFile } from './static-response.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const execute = promisify(execFile);

// 每次构建使用新进程，避免长期运行的服务缓存旧版页面模板。
async function buildFresh() {
  await execute(process.execPath, [path.join(root, 'scripts/build.mjs')], { cwd: root, timeout: 30000 });
}

const preview = process.argv.includes('--preview');
const port = Number(process.env.PORT || 4173);
await buildFresh();
const mime = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filename = path.resolve(dist, `.${requested}`);
    if (!filename.startsWith(`${dist}${path.sep}`) && filename !== dist) { res.writeHead(403); res.end(); return; }
    let code = 200;
    try {
      if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      await stat(filename);
    } catch { filename = path.join(dist, '404.html'); code = 404; }
    await sendFile(req, res, filename, code, mime[path.extname(filename)] || 'application/octet-stream');
  } catch { res.writeHead(400); res.end('请求地址无效'); }
});

await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
console.log(`Local: http://127.0.0.1:${port}`);
console.log(preview ? '预览模式。' : '内容、样式或脚本更新后会重新生成，刷新浏览器即可。');

if (!preview) {
  let timer;
  let pending = Promise.resolve();
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { pending = pending.then(async () => { try { await buildFresh(); console.log('页面已更新，请刷新浏览器。'); } catch (error) { console.error(`更新失败，保留上一版页面：${error.message}`); } }); }, 150);
  };
  for (const directory of ['content', 'src', 'public']) watch(path.join(root, directory), { recursive: true }, rebuild);
}
