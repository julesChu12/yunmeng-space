import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { sendFile } from './static-response.mjs';

test('视频响应支持 Range、尾段、HEAD 与无效区间', async () => {
  const filename = fileURLToPath(new URL('../public/media/modern/living-desktop.mp4', import.meta.url));
  const source = await readFile(filename);
  const server = http.createServer((req, res) => sendFile(req, res, filename, 200, 'video/mp4').catch(() => res.destroy()));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/video.mp4`;
  try {
    const full = await fetch(url);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('content-type'), 'video/mp4');
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), source);
    for (const [range, start, end] of [['bytes=0-127', 0, 127], ['bytes=-64', source.length - 64, source.length - 1], [`bytes=${source.length - 32}-`, source.length - 32, source.length - 1]]) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${source.length}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), source.subarray(start, end + 1));
    }
    const head = await fetch(url, { method: 'HEAD' });
    assert.equal(Number(head.headers.get('content-length')), source.length);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    for (const range of [`bytes=${source.length}-`, 'bytes=15-3', 'bytes=-0', 'bytes=0-2,8-10']) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 416);
      assert.equal(response.headers.get('content-range'), `bytes */${source.length}`);
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
