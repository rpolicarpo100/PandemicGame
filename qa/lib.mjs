// PANDEMIC EVOLUTION — QA helpers (zero deps, node >= 18)
export const BASE = process.env.QA_BASE || 'http://127.0.0.1:4000';

export const results = [];
export function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail: String(detail) });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}
export function okAll() {
  const fails = results.filter(r => !r.ok).length;
  console.log(`\n  ${results.length - fails}/${results.length} checks OK\n`);
  return fails === 0;
}
export function reportLines() { return results; }

// ---------- cookie jar: cada "jogador" de QA é um browser com as suas cookies ----------
// (sessões C1: pev_sid — sem jar, cada pedido seria um jogador novo)
function makeJar() {
  let cookie = null;
  const api = async (method, path, body, timeoutMs = 8000) => {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), timeoutMs);
    const headers = {};
    if (cookie) headers.cookie = cookie;
    if (body !== undefined) headers['content-type'] = 'application/json';
    try {
      const r = await fetch(BASE + path, { method, headers,
        body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal, redirect: 'manual' });
      const txt = await r.text();
      const sc = r.headers.get('set-cookie');
      if (sc) cookie = sc.split(';')[0];
      let json = null;
      try { json = JSON.parse(txt); } catch (_) {}
      return { status: r.status, txt, json };
    } finally { clearTimeout(to); }
  };
  return {
    get: p => api('GET', p),
    post: (p, b) => api('POST', p, b),
    get cookie() { return cookie; },
  };
}
const _defaultJar = makeJar();
export const jget = (p, t) => _defaultJar.get(p, t);
export const jpost = (p, b, t) => _defaultJar.post(p, b, t);
export const fresh = makeJar;          // novo "browser" (sessão independente)
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function readFirstSseFrame(jar = null, timeoutMs = 6000) {
  // opens an SSE stream, returns first parsed frame object + close fn
  // compat: chamada antiga readFirstSseFrame(timeoutMs)
  if (typeof jar === 'number') { timeoutMs = jar; jar = null; }
  const j = jar || _defaultJar;
  const ctl = new AbortController();
  const headers = j.cookie ? { cookie: j.cookie } : {};
  const r = await fetch(BASE + '/events', { signal: ctl.signal, headers });
  let sc = r.headers.get('set-cookie');
  if (!r.ok || !r.body) return { frame: null, close: () => ctl.abort(), jar: j };
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const frameP = (async () => {
    const to = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const m = buf.match(/data: (.+)\n\n/);
        if (m) return JSON.parse(m[1]);
      }
      return null;
    } finally { clearTimeout(to); }
  })();
  return { frame: await frameP, close: () => ctl.abort(), jar: j };
}
