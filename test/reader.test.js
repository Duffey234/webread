// Adapted from the hosted service's app.test.js (x402-url-to-markdown): the same reader assertions, called directly on
// src/reader.js with a fake web instead of through the paid HTTP routes (which are not in this repo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Reader, FetchError } from '../src/reader.js';

const PAGE = `<!doctype html><html lang="en"><head><title>Hello Page</title><meta name="description" content="Desc"></head><body><nav><a href="/">Home</a></nav><main><h1>Hello</h1><p>World <a href="/a">link</a></p></main><footer>f</footer><script>x()</script></body></html>`;
const SITE = { 'https://site.example.org/robots.txt': { body: 'User-agent: *\nDisallow: /secret', headers: { 'content-type': 'text/plain' } }, 'https://site.example.org/page': { body: PAGE } };
function fakeWeb(pages) {
  const seen = [];
  const fetchImpl = async (url, init = {}) => {
    seen.push({ url, ua: init.headers?.['user-agent'] });
    const p = pages[url];
    if (!p) return new Response('not found', { status: 404 });
    return new Response(p.body ?? '', { status: p.status ?? 200, headers: p.headers ?? { 'content-type': 'text/html; charset=utf-8' } });
  };
  return { fetchImpl, seen };
}
const reader = (pages) => { const web = fakeWeb(pages); return { web, r: new Reader({ fetchImpl: web.fetchImpl, dns: false }) }; };
const codeOf = async (p) => { try { await p; return 'no error'; } catch (e) { assert.ok(e instanceof FetchError, String(e)); return e.code; } };

test('read: main content as Markdown with absolute links, robots allowed, robots-respecting UA used', async () => {
  const { r, web } = reader(SITE);
  const j = await r.read('https://site.example.org/page');
  assert.equal(j.title, 'Hello Page'); assert.match(j.markdown, /^# Hello\n\nWorld \[link\]\(https:\/\/site\.example\.org\/a\)$/); assert.equal(j.robots, 'allowed');
  assert.ok(web.seen.length >= 2 && web.seen.every((s) => /WebReadBot/.test(s.ua)));
});

test('failed reads: robots disallow, private IP, 404 upstream, binary, bad scheme', async () => {
  const { r } = reader({ ...SITE, 'https://site.example.org/img': { body: 'PNG', headers: { 'content-type': 'image/png' } } });
  const cases = [['https://site.example.org/secret', 'robots_disallowed'], ['http://10.0.0.1/', 'blocked_ip'], ['https://site.example.org/missing', 'upstream_status'], ['https://site.example.org/img', 'unsupported_content_type'], ['file:///etc/passwd', 'blocked_scheme']];
  for (const [u, code] of cases) assert.equal(await codeOf(r.read(u)), code, u);
});

test('robots.txt 5xx means disallow; 404 means allow', async () => {
  const { r } = reader({ 'https://down.example.org/robots.txt': { status: 503, body: '' }, 'https://down.example.org/p': { body: PAGE }, 'https://open.example.org/p': { body: PAGE } });
  assert.match(await codeOf(r.read('https://down.example.org/p')), /^robots_/);
  assert.equal((await r.read('https://open.example.org/p')).title, 'Hello Page');
});
