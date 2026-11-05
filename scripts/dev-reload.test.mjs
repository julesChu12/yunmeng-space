import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

test('开发服务必须载入修改后的模板，而不是复用旧模块', { timeout: 45000 }, async () => {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const fixture = await mkdtemp(path.join(tmpdir(), 'yunmeng-dev-reload-'));
  // 只改隔离副本，避免验收测试影响用户正在编辑的源文件。
  await Promise.all(['scripts', 'src', 'content', 'public'].map((name) => cp(path.join(source, name), path.join(fixture, name), { recursive: true })));
  console.log('隔离副本已准备完成。');
  const reservation = net.createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: fixture, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  try {
    for (let i = 0; !output.includes('Local:'); i++) {
      assert.ok(i < 100 && child.exitCode === null, `开发服务未启动：${output}`);
      await delay(50);
    }
    const url = `http://127.0.0.1:${port}/`;
    console.log(`测试服务已启动：${url}`);
    const original = await (await fetch(url, { signal: AbortSignal.timeout(2000) })).text();
    assert.ok(original.includes('从一个空间开始'));
    const filename = path.join(fixture, 'src/modern.mjs');
    const marker = '模板实时更新验收标记';
    await writeFile(filename, (await readFile(filename, 'utf8')).replace('从一个空间开始', marker));
    console.log('模板已修改，检查服务是否载入新内容。');
    for (let i = 0; i < 60; i++) {
      await delay(100);
      const html = await (await fetch(url, { signal: AbortSignal.timeout(2000) })).text();
      if (html.includes(marker)) return;
    }
    assert.fail(`修改模板后，页面仍使用旧内容。服务输出：${output}`);
  } finally {
    child.kill('SIGTERM');
  }
});
