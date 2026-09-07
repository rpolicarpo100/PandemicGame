// PANDEMIC EVOLUTION — Dev Console layer (telemetry + API).
// Zero dependencies. Runs inside the game server (server.js).
// Ethical by design: IPs are anonymized (last octet zeroed / hashed), no PII stored.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { REGIONS } = require('../data.js');            // world population (para % nos registos)
const WORLD_POP = REGIONS.reduce((s, r) => s + r.pop, 0);

const DEV_WALLET = process.env.DEV_WALLET || '8biEDVUUh21injn4HXkmtRtmkiMzdtoeEXxKE5NLE4LH';
const ACCESS_KEY = process.env.DEV_ACCESS_KEY || '';      // if set, /dev requires ?key=
const ADMIN_KEY = process.env.DEV_ADMIN_KEY || '';        // if set, POST /api/dev/reset requires it
const FILE = process.env.DEV_DATA_FILE || path.join(os.tmpdir(), 'pevo-dev-telemetry.json');

const MINUTE_BINS = 60;                                   // 60 x 1min = last hour ring

const S = {
  enabled: false,
  boot: Date.now(),
  game: { newGames: 0, seeds: 0, ended: 0, wins: 0, losses: 0, abandoned: 0,
          dnaSpent: 0, evolves: 0, eventChoices: 0, speedChanges: 0, perNode: {}, scenarios: {} },
  http: { total: 0, byPath: {}, ok: 0, clientErr: 0, serverErr: 0, timings: [] },
  sse: { connects: 0, disconnects: 0, active: 0, peakEver: 0, sessionsTotal: 0, sessionsToday: 0,
         sumSec: 0, todaySumSec: 0, ipCount: {}, todayIp: {} },
  views: { home: 0, play: 0 },
  ops: { ticks: 0, loopMsSum: 0, loopMsMax: 0, lastTickAt: 0 },
  sessions: [],   // recent, capped
  ledger: [],     // finished/abandoned games, capped
  rings: { http: new Array(MINUTE_BINS).fill(0), sse: new Array(MINUTE_BINS).fill(0),
           mark: Date.now(), lastHttp: 0, lastSse: 0 },
  wallet: null, walletFetchedAt: 0,
  repo: null, repoFetchedAt: 0,
  env: { region: process.env.REGION || '', rv: process.env.RENDER_INSTANCE_ID ? process.env.RENDER_INSTANCE_ID.slice(0, 8) : 'local' },
  _phase: () => null, _day: () => null,
};

let _minTimer = null, _saveTimer = null, _saveFail = false;

const save = () => {
  if (!S.enabled) return;
  try {
    const snap = JSON.stringify({
      v: 1, savedAt: Date.now(),
      game: S.game, http: { total: S.http.total, ok: S.http.ok, clientErr: S.http.clientErr, serverErr: S.http.serverErr },
      sse: { connects: S.sse.connects, disconnects: S.sse.disconnects, peakEver: S.sse.peakEver,
             sessionsTotal: S.sse.sessionsTotal, sessionsToday: S.sse.sessionsToday,
             sumSec: S.sse.sumSec, todaySumSec: S.sse.todaySumSec, ipCount: S.sse.ipCount, todayIp: S.sse.todayIp },
      views: S.views, ledger: S.ledger.slice(-120),
      boot: S.boot,
    });
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, snap);
    S._saveFail = false;
  } catch (_) { S._saveFail = true; }
};

const load = () => {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return;
    S.game = Object.assign(S.game, d.game);
    S.http = Object.assign(S.http, { total: 0, byPath: {}, ok: d.http.ok, clientErr: d.http.clientErr, serverErr: d.http.serverErr });
    S.sse = Object.assign(S.sse, d.sse);
    S.views = Object.assign(S.views, d.views);
    S.ledger = (d.ledger || []).slice(-300);
    // recompute session "today" relative to this boot date
    const now = new Date();
    const isToday = ts => { const x = new Date(ts); return x.getDate() === now.getDate() && x.getMonth() === now.getMonth(); };
    // sessions list itself is not persisted (privacy: keep only aggregates + game ledger)
  } catch (_) { /* first boot */ }
};

// ---------- helpers ----------
const anonIp = ip => {
  if (!ip) return 'unknown';
  let v = String(ip).replace(/^::ffff:/, '');
  if (v.includes('.')) return v.split('.').slice(0, 3).join('.') + '.0';
  return 'h:' + crypto.createHash('sha1').update(v).digest('hex').slice(0, 12);
};
const clientIp = req => {
  const xff = req.headers['x-forwarded-for'];
  if (xff) { const f = String(xff).split(',')[0].trim(); if (f) return f; }
  return req.socket && req.socket.remoteAddress;
};
const clientUa = req => {
  const ua = req.headers['user-agent'] || '';
  if (ua.includes('HeadlessChrome') || ua.includes('PhantomJS')) return 'headless-browser';
  if (ua.includes('curl')) return 'curl';
  if (ua.includes('node')) return 'node';
  return ua.length > 110 ? ua.slice(0, 110) + '…' : (ua || '—');
};
const pct = (a, b) => (b > 0 ? +(100 * a / b).toFixed(1) : 0);
const dateKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ---------- hooks called from server.js ----------
function onSeed(G) { if (!S.enabled) return; S.game.seeds++; }
function onEvolve(G, nodeId, cost) { if (!S.enabled) return; S.game.evolves++; S.game.dnaSpent += cost; S.game.perNode[nodeId] = (S.game.perNode[nodeId] || 0) + 1; }
function onEventChoice() { if (S.enabled) S.game.eventChoices++; }
function onNewGame(G, newSc) {
  if (!S.enabled) return;
  // close previous play session, if one was running and never finished
  if (G && G.startRegion && G.phase === 'running') recordGame(G, 'abandoned');
  S.game.newGames++;
  if (newSc) { const e = S.game.scenarios[newSc] || (S.game.scenarios[newSc] = { games: 0, wins: 0, losses: 0 }); e.games++; }
}
function onSeedScenario(scId) {
  // count starts per scenario only once at seed (players who actually play)
  if (!S.enabled || !scId) return;
  const e = S.game.scenarios[scId] || (S.game.scenarios[scId] = { games: 0, wins: 0, losses: 0 });
  if (!e.starts) e.starts = 0; e.starts++;
}
function onEndGame(G) {
  if (!S.enabled || !G || !G.result) return;
  recordGame(G, G.result.win ? 'win' : 'lose');
}
function recordGame(G, kind) {
  const sc = G.scenario || null;
  const pop = WORLD_POP || 1;
  const rec = {
    t: Date.now(), kind, scenario: sc,
    day: G.day || 0,
    infPct: +((100 * (G.cumInf || 0)) / pop).toFixed(2),
    deadPct: +((100 * (G.regions ? G.regions.reduce((s, r) => s + (r.dead || 0), 0) : 0)) / pop).toFixed(2),
    nodes: G.owned ? G.owned.length : 0, builds: G.buildsTriggered ? G.buildsTriggered.length : 0,
    dna: Math.floor(G.dna || 0), stage: G.stage || 0,
    sec: G.startedAt ? Math.round((Date.now() - G.startedAt) / 1000) : null,
    start: G.startRegion || null,
    win: kind === 'win', reason: (G.result && G.result.reason) || kind,
    score: (G.result && G.result.score && G.result.score.value) || 0,
    agent: G.agent || null,
  };
  S.ledger.push(rec);
  if (S.ledger.length > 300) S.ledger.shift();
  S.game.ended++;
  if (kind === 'win') { S.game.wins++; if (sc && S.game.scenarios[sc]) S.game.scenarios[sc].wins++; }
  if (kind === 'lose') { S.game.losses++; if (sc && S.game.scenarios[sc]) S.game.scenarios[sc].losses++; }
  if (kind === 'abandoned') S.game.abandoned++;
}

// ---------- HTTP counters (wrapped in server.js) ----------
function countReq(req, res, url) {
  if (!S.enabled) return;
  S.http.total++;
  const p = url.pathname || '/';
  S.http.byPath[p] = (S.http.byPath[p] || 0) + 1;
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    S.http.timings.push(ms);
    if (S.http.timings.length > 400) S.http.timings.shift();
    if (res.statusCode < 400) S.http.ok++;
    else if (res.statusCode < 500) S.http.clientErr++;
    else S.http.serverErr++;
  });
}

// ---------- SSE session tracking ----------
const live = new Map(); // res -> {ip,ua,t0}
function sseOpen(req, res) {
  if (!S.enabled) return;
  const ip = clientIp(req);
  const ipA = anonIp(ip);
  S.sse.connects++;
  S.sse.active++;
  S.sse.sessionsTotal++;
  S.sse.ipCount[ipA] = (S.sse.ipCount[ipA] || 0) + 1;
  const dk = dateKey(Date.now());
  if (dk === dateKey(S.boot)) {
    S.sse.sessionsToday++;
    S.sse.todayIp[ipA] = (S.sse.todayIp[ipA] || 0) + 1;
  }
  if (S.sse.active > S.sse.peakEver) S.sse.peakEver = S.sse.active;
  live.set(res, { ip: ipA, ua: clientUa(req), t0: Date.now() });
  req.on('close', () => {
    const s = live.get(res);
    if (!s) return;
    live.delete(res);
    S.sse.active = Math.max(0, S.sse.active - 1);
    S.sse.disconnects++;
    const sec = Math.round((Date.now() - s.t0) / 1000);
    S.sse.sumSec += sec;
    if (dateKey(s.t0) === dateKey(Date.now())) S.sse.todaySumSec += sec;
    S.sessions.unshift({ t0: s.t0, sec, ip: s.ip, ua: s.ua });
    if (S.sessions.length > 200) S.sessions.pop();
  });
}

// ---------- wallet (real on-chain balance, cached) ----------
const RPC_MAIN = 'https://api.mainnet-beta.solana.com';
const RPC_FALLBACK = 'https://solana-rpc.publicnode.com';
function rpcBalance(rpc) {
  return new Promise(resolve => {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 6000);
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [DEV_WALLET] });
    fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: ctl.signal })
      .then(r => r.json())
      .then(j => { clearTimeout(to); resolve(j && j.result && typeof j.result.value === 'number' ? j.result.value : null); })
      .catch(() => { clearTimeout(to); resolve(null); });
  });
}
async function refreshWallet() {
  let lamports = await rpcBalance(RPC_MAIN);
  let source = 'mainnet-beta';
  if (lamports === null) { lamports = await rpcBalance(RPC_FALLBACK); source = 'publicnode'; }
  const bal = lamports === null ? null : +(lamports / 1e9).toFixed(9);
  S.wallet = { address: DEV_WALLET, balanceSol: bal, source: bal === null ? null : source,
               fetchedAt: Date.now(), lamports };
  S.walletFetchedAt = Date.now();
  return S.wallet;
}
async function getWallet(force) {
  if (!S.wallet || force || Date.now() - S.walletFetchedAt > 120000) {
    try { await refreshWallet(); } catch (_) { if (!S.wallet) S.wallet = { address: DEV_WALLET, balanceSol: null, source: null, fetchedAt: 0, lamports: null }; }
  }
  return S.wallet;
}

// ---------- GitHub repo (public API, cached) ----------
async function getRepo() {
  if (S.repo && Date.now() - S.repoFetchedAt < 900000) return S.repo;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch('https://api.github.com/repos/rpolicarpo100/PandemicGame', {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'pevo-dev-console' }, signal: ctl.signal });
    clearTimeout(to);
    if (r.ok) {
      const j = await r.json();
      S.repo = { ok: true, stars: j.stargazers_count, forks: j.forks_count, issues: j.open_issues_count,
                 pushedAt: j.pushed_at, sizeKb: j.size, license: (j.license || {}).spdx_id || null,
                 fetchedAt: Date.now() };
    } else S.repo = { ok: false, err: 'http_' + r.status, fetchedAt: Date.now() };
  } catch (_) { S.repo = { ok: false, err: 'net', fetchedAt: Date.now() }; }
  S.repoFetchedAt = Date.now();
  return S.repo;
}

// ---------- local code metrics ----------
function codeMetrics() {
  const dir = path.join(__dirname, '..');
  const files = ['server.js', 'data.js', 'public/world.js', 'public/home.html', 'public/index.html', 'public/dev.html', 'lib/dev.js'];
  const loc = {};
  let total = 0, bytes = 0;
  for (const f of files) {
    try {
      const txt = fs.readFileSync(path.join(dir, f), 'utf8');
      const n = txt.split('\n').length;
      loc[f] = n; total += n; bytes += Buffer.byteLength(txt);
    } catch (_) { loc[f] = null; }
  }
  return { files: Object.keys(loc).length, loc, totalLines: total, kb: +(bytes / 1024).toFixed(1), deps: 0 };
}

// ---------- findings / self-critique ----------
function findings() {
  const f = [];
  if (S.sse.peakEver > 1) f.push('single-world: o servidor tem UM estado de jogo global — todas as sessões ativas partilham o mesmo mundo e o mesmo DNA (confirmado: pico de ' + S.sse.peakEver + ' sessões simultâneas). Multiplayer por jogador requer refactor para mundos por sessão.');
  f.push('no-contract: a wallet é só leitura pública — o contrato $PEVO ainda não existe (roadmap Phase 7). O saldo SOL exibido é o saldo real da conta no mainnet.');
  f.push(S._diskNote || 'persistence: ficheiro de telemetria em ' + FILE + ' (volátil entre redeploys — usar DEV_DATA_FILE para volume persistente).');
  f.push('free-tier: instância free — sleep após ~15 min sem tráfego; primeira visita após sleep pode demorar 30-60 s.');
  if (ACCESS_KEY) f.push('access: /dev protegido por DEV_ACCESS_KEY.');
  else f.push('access: /dev SEM chave de acesso (DEV_ACCESS_KEY não definido) — público. Define a env var para restringir.');
  return f;
}

// ---------- aggregated overview ----------
function overview(phaseInfo) {
  const timings = S.http.timings.slice().sort((a, b) => a - b);
  const p = (q) => timings.length ? +(timings[Math.min(timings.length - 1, Math.floor(q * timings.length))]).toFixed(2) : null;
  const avg = timings.length ? +(timings.reduce((a, b) => a + b, 0) / timings.length).toFixed(2) : null;
  const mem = process.memoryUsage();
  const now = Date.now();
  const dayGames = S.ledger.filter(g => dateKey(g.t) === dateKey(now));
  const scenarioStats = {};
  for (const [k, v] of Object.entries(S.game.scenarios)) {
    if (!v.games && !v.starts) continue;
    scenarioStats[k] = { games: v.games || 0, starts: v.starts || 0, wins: v.wins || 0, losses: v.losses || 0,
                         winRate: +((100 * (v.wins || 0)) / Math.max(1, (v.wins || 0) + (v.losses || 0))).toFixed(1) };
  }
  const returning = Object.values(S.sse.ipCount).filter(n => n >= 2).length;
  const views = { home: (S.http.byPath['/'] || 0) + (S.http.byPath['/home'] || 0),
                  play: S.http.byPath['/play'] || 0, dev: S.http.byPath['/dev'] || 0 };
  const score = healthScore(now);
  return {
    ok: true, t: now, boot: S.boot, uptimeSec: Math.round((now - S.boot) / 1000),
    env: S.env, node: process.version,
    phase: phaseInfo,
    views,
    http: { total: S.http.total, byPath: S.http.byPath, ok: S.http.ok, clientErr: S.http.clientErr,
            serverErr: S.http.serverErr, avgMs: avg, p50Ms: p(0.50), p95Ms: p(0.95), lastErrAt: S.http.lastErrAt || null },
    sse: { active: S.sse.active, connects: S.sse.connects, disconnects: S.sse.disconnects, peak: S.sse.peakEver,
           sessionsToday: S.sse.sessionsToday, sessionsTotal: S.sse.sessionsTotal,
           avgSecToday: S.sse.sessionsToday ? +(S.sse.todaySumSec / S.sse.sessionsToday).toFixed(0) : null,
           avgSec: S.sse.sessionsTotal ? +(S.sse.sumSec / S.sse.sessionsTotal).toFixed(0) : null,
           returningIps: returning },
    game: { ...S.game, scenarioStats, gamesToday: dayGames.filter(g => g.kind !== 'abandoned').length, abandonedToday: dayGames.filter(g => g.kind === 'abandoned').length },
    ops: { ticks: S.ops.ticks, loopAvgMs: S.ops.ticks ? +(S.ops.loopMsSum / Math.max(1, S.ops.ticks)).toFixed(2) : null,
           loopMaxMs: +S.ops.loopMsMax.toFixed(2), lastTickAt: S.ops.lastTickAt,
           mem: { rssMb: +(mem.rss / 1048576).toFixed(1), heapMb: +(mem.heapUsed / 1048576).toFixed(1) } },
    rings: { http: S.rings.http.slice(), sse: S.rings.sse.slice() },
    ledger: S.ledger.slice(-15).reverse(),
    sessions: S.sessions.slice(0, 12),
    wallet: S.wallet ? { address: S.wallet.address, balanceSol: S.wallet.balanceSol, source: S.wallet.source, fetchedAt: S.wallet.fetchedAt } : null,
    code: { repo: S.repo, local: codeMetrics(), deps: 0 },
    score,
    findings: findings(),
    access: { keyRequired: !!ACCESS_KEY },
  };
}

// composite health score — honest formula, documented in DEV-CONSOLE.md
function healthScore(now) {
  const up = (now - S.boot) / 1000;
  const uptime = Math.min(100, up / 3600 * 5);                      // full marks after 20h
  const err = S.http.total ? (S.http.serverErr / S.http.total) * 100 : 0;
  const quality = Math.max(0, 100 - err * 50);                       // each 1% 5xx = -50
  const perf = (() => { const t = S.http.timings.slice().sort((a, b) => a - b); if (!t.length) return 100; const m = t[Math.min(t.length - 1, Math.floor(0.95 * t.length))]; return Math.max(0, 100 - m / 20); })();
  const traction = Math.min(100, S.sse.sessionsTotal * 4 + S.game.ended * 6);
  const economy = S.game.dnaSpent > 0 ? Math.min(100, 30 + S.game.dnaSpent / 50) : 0;
  const sec = !!ACCESS_KEY ? 100 : 30;
  const w = { uptime: .20, quality: .25, perf: .15, traction: .15, economy: .10, sec: .15 };
  const s = uptime * w.uptime + quality * w.quality + perf * w.perf + traction * w.traction + economy * w.economy + sec * w.sec;
  return { value: Math.round(s), parts: { uptime: +uptime.toFixed(1), quality: +quality.toFixed(1), perf: +perf.toFixed(1),
           traction: +traction.toFixed(1), economy: +economy.toFixed(1), sec: +sec.toFixed(1) } };
}

// ---------- auth ----------
function okKey(req, url, envKey) {
  if (!envKey) return true;
  const k = url.searchParams.get('key') || req.headers['x-dev-key'] || '';
  return k === envKey;
}
function authOk(req, url) { return okKey(req, url, ACCESS_KEY); }

// ---------- api routes (called from server.js; responds for every /api/dev/* path) ----------
async function apiRoute(req, res, url) {
  const p = url.pathname;
  if (!authOk(req, url)) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'unauthorized', hint: 'DEV_ACCESS_KEY required (?key=…)' })); }

  if (req.method === 'GET' && p === '/api/dev/overview') {
    const w = await getWallet(false);
    const repo = await getRepo();
    const out = overview({ phase: S._phase(), day: S._day() });
    out.wallet = w; out.code.repo = repo;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(out));
  }
  if (req.method === 'GET' && p === '/api/dev/wallet') {
    const w = await getWallet(false);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
    return res.end(JSON.stringify(w));
  }
  if (req.method === 'GET' && p === '/api/dev/code') {
    const repo = await getRepo();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
    return res.end(JSON.stringify({ repo, local: codeMetrics(), deps: 0, node: process.version }));
  }
  if (req.method === 'POST' && p === '/api/dev/reset') {
    if (!ADMIN_KEY) { res.writeHead(403, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'DEV_ADMIN_KEY não definido no servidor' })); }
    if (!okKey(req, url, ADMIN_KEY)) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'bad admin key' })); }
    S.game = { newGames: 0, seeds: 0, ended: 0, wins: 0, losses: 0, abandoned: 0, dnaSpent: 0, evolves: 0, eventChoices: 0, speedChanges: 0, perNode: {}, scenarios: {} };
    S.http = { total: 0, byPath: {}, ok: 0, clientErr: 0, serverErr: 0, timings: [] };
    S.views = { home: 0, play: 0 };
    S.sse = { ...S.sse, connects: 0, disconnects: 0, sessionsTotal: 0, sessionsToday: 0, sumSec: 0, todaySumSec: 0, ipCount: {}, todayIp: {} };
    S.ledger = [];
    S.rings.http.fill(0); S.rings.sse.fill(0);
    save();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ error: 'unknown dev api', path: p }));
}

// ---------- ring buffer (per-minute activity, last hour) ----------
function minuteTick() {
  const now = Date.now();
  // fill gaps (server paused / slept)
  let gaps = Math.floor((now - S.rings.mark) / 60000);
  gaps = Math.max(0, Math.min(MINUTE_BINS - 1, gaps));
  for (let i = 0; i < gaps; i++) S.rings.http.push(0), S.rings.sse.push(0);
  while (S.rings.http.length > MINUTE_BINS) S.rings.http.shift(), S.rings.sse.shift();
  const dh = S.http.total - S.rings.lastHttp, ds = S.sse.active - S.rings.lastSse;
  if (gaps === 0) { S.rings.http[S.rings.http.length - 1] += Math.max(0, dh); S.rings.sse[S.rings.sse.length - 1] += Math.max(0, ds); }
  else { S.rings.http.push(Math.max(0, dh)); S.rings.sse.push(Math.max(0, ds)); }
  while (S.rings.http.length > MINUTE_BINS) S.rings.http.shift(), S.rings.sse.shift();
  S.rings.lastHttp = S.http.total; S.rings.lastSse = S.sse.active;
  S.rings.mark = now;
}

function loopMs(ms) { if (!S.enabled) return; S.ops.loopMsSum += ms; S.ops.ticks++; if (ms > S.ops.loopMsMax) S.ops.loopMsMax = ms; }
function tickMark() { S.ops.lastTickAt = Date.now(); }

function start() {
  S.enabled = true;
  load();
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ boot: Date.now(), v: 1 }));
    S._diskNote = 'persistence: ficheiro de telemetria em ' + FILE + ' (volátil entre redeploys — usar DEV_DATA_FILE para volume persistente).';
  } catch (_) { S._diskNote = 'persistence: disco indisponível — métricas só em memória.'; }
  save();
  _minTimer = setInterval(minuteTick, 60000).unref();
  _saveTimer = setInterval(save, 30000).unref();
  // warm wallet + repo once (no await; dashboard will read cache)
  getWallet(false).catch(() => {});
  getRepo().catch(() => {});
  const booted = new Date();
  console.log(`[dev] console on /dev · wallet ${DEV_WALLET.slice(0, 4)}…${DEV_WALLET.slice(-4)} · accessKey=${ACCESS_KEY ? 'set' : 'OFF (público)'} · data=${FILE}`);
}

function stop() { S.enabled = false; if (_minTimer) clearInterval(_minTimer); if (_saveTimer) clearInterval(_saveTimer); save(); }

module.exports = {
  init: (gi) => { S._phase = (gi && gi.phase) || S._phase; S._day = (gi && gi.day) || S._day; },
  start, stop, save,
  countReq, sseOpen, apiRoute, loopMs, tickMark, authOk,
  onSeed, onEvolve, onEventChoice, onNewGame, onEndGame, onSeedScenario,
  _state: () => S,
};
