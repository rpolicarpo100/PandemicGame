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

export async function jget(path, timeoutMs = 8000) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(BASE + path, { signal: ctl.signal });
    const txt = await r.text();
    let json = null;
    try { json = JSON.parse(txt); } catch (_) {}
    return { status: r.status, txt, json };
  } finally { clearTimeout(to); }
}
export async function jpost(path, body, timeoutMs = 8000) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: ctl.signal });
    const txt = await r.text();
    let json = null;
    try { json = JSON.parse(txt); } catch (_) {}
    return { status: r.status, txt, json };
  } finally { clearTimeout(to); }
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function readFirstSseFrame(timeoutMs = 6000) {
  // opens an SSE stream, returns first parsed frame object + close fn
  const ctl = new AbortController();
  const r = await fetch(BASE + '/events', { signal: ctl.signal });
  if (!r.ok || !r.body) return { frame: null, close: () => ctl.abort() };
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
  return { frame: await frameP, close: () => ctl.abort() };
}
