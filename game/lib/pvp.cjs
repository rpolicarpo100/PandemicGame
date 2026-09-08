// PANDEMIC EVOLUTION — PvP room engine (Phase 3 / VIRUS mode, SPEC §15.2)
// 2–6 agentes no MESMO mundo. Cada agente tem a sua fração de infeção/mortos por região
// (infx/deadx) e evolui com os seus stats/DNA. A Humanity é UMA (reage aos totais).
// Vitória = maior score composto (nunca "quem matou mais"):
//   w1 infecção sustentável · w2 presença/controlo (first-infection) · w3 objetivos
//   w4 sobrevivência · w5 eficiência de evolução · w6 achievements estratégicos
// Fim: relógio · 1 agente vivo · humanidade extinta · todos erradicados.
// CommonJS, zero deps. O motor single-player (server.js) fica intocado.
'use strict';
const { REGIONS, NODES, BUILDS, AGENTS, EDGES } = require('../data.js');

const WORLD_POP = REGIONS.reduce((s, r) => s + r.pop, 0);
const TICK_MS = 2000, ERADIC_DAYS = 14, PVP_CLOCK = 300, PVP_MIN = 2, PVP_MAX = 6;
const CFG = {
  transBase: 0.05, crossMul: 0.8, seedIFrac: 0.0015, spreadMinF: 0.0008,
  seedToFrac: 0.0002, seedToMinF: 0.00002, detScale: 1.0, awareMul: 1.0,
  vaccineRate: 1.0, vaxMassRate: 1.0, zoonBase: 1.0,
};
const STAGE_THRESH = [0, 8, 20, 35, 50, 70, 85, 100];
const STAGE_NAMES = ['UNAWARE', 'MONITOR', 'ALERT', 'CRISIS', 'LOCKDOWN', 'CURFEW', 'VACCINE', 'EXTINCT'];

const CALM_NEWS = [
  A => `${A}: feira de aviação civil bate recorde de visitantes`,
  (A, B) => `${A} e ${B} assinam acordo comercial histórico`,
  A => `Turismo em máximos em ${A}; hotelaria esgotada`,
];
const MID_NEWS = [
  () => `OMS pede vigilância reforçada após casos atípicos`,
  A => `${A} reforça rastreio epidemiológico nos hospitais`,
  A => `Bolsa de ${A} cai após rumores de surto`,
];
const PANIC_NEWS = [
  A => `Hospitais de ${A} em rutura; camas esgotadas`,
  A => `${A} declara estado de emergência sanitária`,
  A => `Compras de pânico esgotam prateleiras em ${A}`,
];

// ---------- util ----------
const rmeta = id => REGIONS.find(r => r.id === id);
const CODE_ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // sem I/L/O/0/1
const randCode = () => Array.from({ length: 6 }, () => CODE_ALPH[Math.floor(Math.random() * CODE_ALPH.length)]).join('');

// ---------- stats de um agente (espelho de server.js) ----------
function baseStats() {
  return { trans: CFG.transBase, leth: 0.0032, stealth: 0, cureResist: 0, refuse: 0, zoon: 0, cross: 1.0,
    dnaGain: 1.0, costMod: 1.0, detectMod: 1.0, dense: 1.0, sparse: 1.0, incub: false,
    climate: { hot: 0.55, cold: 0.50, arid: 0.50, humid: 0.60, temperate: 0.75 } };
}
function applyEffects(stats, effects) {
  for (const e of effects || []) {
    if (e.k.startsWith('climate.')) {
      const c = e.k.split('.')[1];
      stats.climate[c] = (stats.climate[c] || 1) * (e.mul !== undefined ? e.mul : 1) + (e.add || 0);
    } else if (e.k === 'incub') stats.incub = true;
    else if (e.k === 'stealth' || e.k === 'cureResist' || e.k === 'refuse' || e.k === 'zoon') {
      const cap = { stealth: 0.80, cureResist: 0.75, refuse: 0.80, zoon: 1.0 }[e.k];
      stats[e.k] = Math.min(cap, stats[e.k] + (e.add || 0));
    } else if (e.mul !== undefined) stats[e.k] *= e.mul;
    else if (e.add !== undefined) stats[e.k] += e.add;
  }
}
function computeStats(ownedNodes, extraEffects, agentEffects) {
  const s = baseStats();
  applyEffects(s, agentEffects);
  for (const id of ownedNodes) { const n = NODES.find(x => x.id === id); if (n) applyEffects(s, n.effects); }
  applyEffects(s, extraEffects);
  return s;
}

// ---------- estado ----------
const ROOMS = new Map();   // code -> room

function newWorld() {
  return {
    regions: REGIONS.map(r => ({ id: r.id, s: r.pop, vacc: 0, detection: 0, detNews: 0,
      identified: false, treatment: 0, closures: { air: false, sea: false, land: false },
      infx: {}, deadx: {} })),
    awareness: 0, stage: 0, vaccine: 0, treatTech: 0,
    adapt: { airportScreening: false, boostInvestigation: false },
    firstBy: {}, flags: {}, news: [], nextAmbient: 4 + Math.floor(Math.random() * 5),
  };
}
const CALLSIGNS = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET', 'KILO', 'LIMA'];
function callsign(key) {
  let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CALLSIGNS[h % CALLSIGNS.length];
}
function newPlayer(key, agent) {
  const a = agent ? (AGENTS.find(x => x.id === agent) || null) : null;
  return {
    key, agent: a ? a.id : null, icon: a ? a.icon : '▣', name: a ? a.name : ('OPERADOR ' + callsign(key)),
    dna: 60, owned: [], extraFx: [], tags: new Set(), buildsTriggered: [],
    stats: a ? computeStats([], [], a.effects) : baseStats(),
    startRegion: null, cumInf: 0, deadTotal: 0, regionHit: new Set(), firstCount: 0,
    routeCounts: { air: 0, sea: 0, land: 0 },
    alive: true, eradic: 0, ready: false, host: false, feats: 0, dayAlive: 0,
  };
}
function freshRoom(code, hostKey) {
  const room = { code, phase: 'lobby', day: 0, speed: 1, acc: 0, hostKey,
    players: new Map(), world: newWorld(), result: null, startedAt: 0,
    createdAt: Date.now(), lastAt: Date.now(), sseVer: 0 };
  ROOMS.set(code, room);
  return room;
}
function playerTot(room, key, f) {  // soma da fração do agente sobre todas as regiões
  let t = 0;
  for (const r of room.world.regions) { const v = r[f][key]; if (v) t += v; }
  return t;
}
const totI = room => room.world.regions.reduce((s, r) => { let x = 0; for (const k in r.infx) x += r.infx[k]; return s + x; }, 0);
const totDead = room => room.world.regions.reduce((s, r) => { let x = 0; for (const k in r.deadx) x += r.deadx[k]; return s + x; }, 0);

// ---------- física por região (por agente) ----------
function climateFactor(stats, meta) { return Math.max(0.15, Math.min(1.4, stats.climate[meta.climate] || 0.5)); }
function containment(world, r) {
  if (!r.identified) { if (world.stage >= 6) return 0.15; if (world.stage >= 4) return 0.08; return 0; }
  let c = [0, 0.05, 0.12, 0.20, 0.45, 0.50, 0.55, 0.60][world.stage] || 0;
  c += r.treatment * 0.12;
  return Math.min(0.80, c);
}
function routeFactor(world, type, ra, rb) {
  let f = 1;
  if (type === 'air') {
    if (world.adapt.airportScreening) f *= 0.55;
    if (world.stage >= 4 && (ra.closures.air || rb.closures.air)) f *= 0.15;
  } else if (type === 'sea') {
    if (world.stage >= 5 && (ra.closures.sea || rb.closures.sea)) f *= 0.15;
  } else if (type === 'land') {
    if (world.stage >= 6 && (ra.closures.land || rb.closures.land)) f *= 0.3;
  }
  return f;
}
const rpush = (room, msg) => { room.world.news.push({ day: room.day, msg }); if (room.world.news.length > 90) room.world.news.shift(); };

// ---------- tick de UM dia ----------
function tickRoom(room) {
  const W = room.world;
  W.regions.forEach(r => { r._totI = 0; r._totD = 0; for (const k in r.infx) r._totI += r.infx[k]; for (const k in r.deadx) r._totD += r.deadx[k]; });
  const cumTotal = [...room.players.values()].reduce((s, p) => s + p.cumInf, 0);
  const deadTotal = W.regions.reduce((s, r) => s + (r._totD || 0), 0);
  const cumFracTot = Math.min(1, cumTotal / WORLD_POP);

  // -------- por agente (fração própria) --------
  for (const p of [...room.players.values()]) {
    if (!p.alive) continue;
    const st = p.stats;
    let newICase = 0, deadCase = 0;
    const mine = r => r.infx[p.key] || 0;

    // crescimento/morte/cura por região
    for (const r of W.regions) {
      const meta = rmeta(r.id);
      const iA = mine(r);
      if (iA <= 0) continue;
      if (r.s <= 0) { delete r.infx[p.key]; continue; }
      const frac = Math.min(1, iA / meta.pop);
      const cf = climateFactor(st, meta);
      const df = meta.density > 0.55 ? st.dense : (meta.density < 0.3 ? st.sparse : 1);
      const growth = st.trans * cf * df * (1 - containment(W, r));
      const newI = Math.min(r.s, iA * growth + Math.min(r.s, iA * 0.005));
      // colapso sanitário baseado nos TOTAIS (mundo partilhado)
      const fracTot = Math.min(1, (r._totI || 0) / meta.pop);
      const collapse = (1 + 1.0 * fracTot) * (1 + 2.0 * cumFracTot);
      const effLeth = st.leth * (1 - 0.35 * Math.min(1, W.treatTech + r.treatment)) * collapse;
      const deaths = Math.min(iA * effLeth, iA);
      const careCollapse = Math.max(0.02, 1 - 1.04 * (deadTotal / WORLD_POP));
      const cureRate = (0.004 + 0.060 * r.treatment) * (1 - st.cureResist) * (1 - 0.45 * st.refuse) * careCollapse;
      const cured = Math.min(Math.max(iA - deaths, 0) * cureRate, iA - deaths);
      r.infx[p.key] = Math.max(0, iA + newI - deaths - cured);
      if (r.infx[p.key] <= 0) delete r.infx[p.key];
      if (r.infx[p.key] > 0 && r.s > 0 && r.infx[p.key] < r.s * 0.0004 && Math.random() < 0.10) delete r.infx[p.key]; // fizzle
      r.s = Math.max(0, r.s - newI);
      r.deadx[p.key] = (r.deadx[p.key] || 0) + deaths;
      if (!r.deadx[p.key]) delete r.deadx[p.key];
      p.cumInf += newI; p.deadTotal += deaths;
      newICase += newI; deadCase += deaths;
    }

    // -------- propagação cross-region --------
    for (const e of EDGES) {
      for (const [srcId, dstId] of [[e.a, e.b], [e.b, e.a]]) {
        const ra = W.regions.find(r => r.id === srcId), rb = W.regions.find(r => r.id === dstId);
        const iS = ra.infx[p.key] || 0;
        const srcFrac = iS / (rmeta(srcId).pop || 1);
        if (srcFrac < CFG.spreadMinF || rb.s <= 0) continue;
        let prob = Math.min(0.5, e.cap * st.cross * srcFrac * CFG.crossMul * routeFactor(W, e.type, ra, rb));
        if (Math.random() < prob) {
          const metaDst = rmeta(dstId);
          const seed = Math.min(rb.s * CFG.seedToFrac, Math.max(rb.s * CFG.seedToMinF, rb.s * srcFrac * 0.02));
          const firstGlobal = !(rb.infx && Object.keys(rb.infx).length);
          const firstMine = !rb.infx[p.key];
          rb.infx[p.key] = (rb.infx[p.key] || 0) + seed;
          rb.s = Math.max(0, rb.s - seed);
          p.cumInf += seed; p.routeCounts[e.type]++;
          if (firstGlobal) { if (W.firstBy[dstId] === undefined) W.firstBy[dstId] = p.key; p.firstCount++; }
          if (firstMine) {
            p.regionHit.add(dstId);
            if (firstGlobal) { p.dna += 4 * st.dnaGain; rpush(room, `Surto em ${metaDst.name} — novo território aberto`); }
          }
        }
      }
    }

    // -------- salto zoonótico (só se o agente tem o trait) --------
    if ((st.zoon || 0) > 0.001) {
      const minF = p.eradic > 0 ? 0.0002 : 0.002;
      const hosts = W.regions
        .map(r => ({ r, f: (r.infx[p.key] || 0) / (rmeta(r.id).pop || 1) }))
        .filter(h => h.f > minF).sort((a, b) => b.f - a.f);
      const best = hosts[0];
      if (best && Math.random() < Math.min(0.5, CFG.zoonBase * st.zoon * best.f * 100)) {
        const cands = W.regions.filter(x => x.s > 0.01);
        if (cands.length) {
          const dst = cands[Math.floor(Math.random() * cands.length)];
          const seed = Math.min(dst.s * CFG.seedToFrac, Math.max(dst.s * CFG.seedToMinF, dst.s * 0.00005));
          const firstGlobal = !Object.keys(dst.infx).length;
          dst.infx[p.key] = (dst.infx[p.key] || 0) + seed;
          dst.s = Math.max(0, dst.s - seed);
          p.cumInf += seed; p.eradic = 0;
          if (firstGlobal) { if (W.firstBy[dst.id] === undefined) W.firstBy[dst.id] = p.key; p.firstCount++; }
          if (!p.regionHit.has(dst.id)) { p.regionHit.add(dst.id); if (firstGlobal) p.dna += 4 * st.dnaGain; }
          rpush(room, `Salto zoonótico para ${rmeta(dst.id).name} — origem desconhecida`);
        }
      }
    }

    // -------- DNA income diário + erradicação individual --------
    p.dna += (newICase * 0.090 + 0.20) * st.dnaGain;
    const myTotI = playerTot(room, p.key, 'infx');
    if (myTotI <= 0) {
      p.eradic++;
      if (p.eradic >= ERADIC_DAYS && p.alive) {
        p.alive = false;
        rpush(room, `${p.icon} ${p.name}: agente erradicado pela Humanidade (dia ${room.day})`);
      }
    } else p.eradic = 0;
    if (p.alive) p.dayAlive++;
  }

  // -------- deteção global (o mundo vê o total; stealth de cada agente pondera) --------
  detectHumanity(room);

  // -------- Humanity (UMA, reage aos totais) --------
  const identified = W.regions.filter(r => r.identified);
  if (identified.length) {
    const idPop = identified.reduce((s, r) => s + rmeta(r.id).pop, 0);
    const avgSci = identified.reduce((s, r) => s + rmeta(r.id).science * rmeta(r.id).pop, 0) / idPop;
    W.awareness = Math.min(100, W.awareness + (0.35 + (idPop / WORLD_POP) * 3.8) * CFG.awareMul * (0.4 + avgSci));
  }
  let newStage = 0;
  for (let s = 1; s < STAGE_THRESH.length - 1; s++) if (W.awareness >= STAGE_THRESH[s]) newStage = s;
  if (W.vaccine >= 100) newStage = 7;
  if (newStage > W.stage) {
    W.stage = newStage;
    if (W.stage >= 4) for (const r of identified) r.closures.air = true;
    if (W.stage >= 5) for (const r of identified) r.closures.sea = true;
    if (W.stage >= 6) for (const r of identified) r.closures.land = true;
    rpush(room, `Nível de alerta mundial sobe para ${STAGE_NAMES[W.stage]}`);
  }
  if (W.stage >= 5) { W.treatTech = Math.min(1, W.treatTech + 0.015); for (const r of W.regions) r.treatment = Math.min(1, W.treatTech * (0.3 + 0.7 * rmeta(r.id).healthcare) * (r.identified ? 1 : 0.4)); }
  if (W.stage >= 6) {
    const urgency = 1 + 2 * (cumTotal / WORLD_POP);
    W.vaccine = Math.min(100, W.vaccine + CFG.vaccineRate * (0.4 + REGIONS.reduce((s2, r) => s2 + r.science, 0) / REGIONS.length) * urgency * (W.vaccine >= 100 ? 1.3 : 1));
  }
  if (W.stage >= 7) {
    for (const r of W.regions) {
      const meta = rmeta(r.id);
      const rate = r.s * 0.024 * CFG.vaxMassRate * (0.4 + meta.science);
      const v = Math.min(r.s, rate);
      r.vacc += v; r.s -= v;
    }
  }
  // notícias ambientes
  if (room.day >= W.nextAmbient) {
    W.nextAmbient = room.day + 5 + Math.floor(Math.random() * 5);
    const A = rmeta(REGIONS[Math.floor(Math.random() * REGIONS.length)].id).name;
    const B = rmeta(REGIONS[Math.floor(Math.random() * REGIONS.length)].id).name;
    const pool = W.stage >= 5 ? PANIC_NEWS : W.stage >= 2 ? MID_NEWS : CALM_NEWS;
    const tpl = pool[Math.floor(Math.random() * pool.length)];
    rpush(room, tpl(A, B));
  }
  return room.day;
}

// ---------- fim + score composto (SPEC §15.2) ----------
const W1 = 200, W2 = 250, W3 = 100, W4 = 150, W5 = 200, W6 = 100;   // pesos públicos = 1000
function finalScore(room, p) {
  const cumFrac = Math.min(1, p.cumInf / WORLD_POP);
  const regionsTouched = p.regionHit.size / REGIONS.length;
  const firstFrac = Math.min(1, p.firstCount / REGIONS.length);
  // objetivos/feats: marco de primeiro (10/50/100 regiões), builds 3/5/7, sobreviver >200d
  let feats = 0;
  if (p.firstCount >= 10) feats++; if (p.firstCount >= 50) feats++; if (p.firstCount >= 100) feats++;
  if (p.buildsTriggered.length >= 3) feats++; if (p.buildsTriggered.length >= 5) feats++; if (p.buildsTriggered.length >= 7) feats++;
  if (p.dayAlive >= 200) feats++;
  const parts = {
    infecao: Math.round(W1 * cumFrac),
    presenca: Math.round(W2 * (0.5 * regionsTouched + 0.5 * firstFrac)),
    objetivos: Math.round(W3 * Math.min(1, feats / 6)),
    sobrevivencia: Math.round(W4 * (p.alive ? 1 : p.dayAlive / PVP_CLOCK)),
    eficiencia: Math.round(W5 * Math.min(1, (p.deadTotal / WORLD_POP) * 60) * (1 - Math.min(0.8, (p.owned.length + p.buildsTriggered.length) / 45))),
    achievements: Math.round(W6 * Math.min(1, p.buildsTriggered.length / 6)),
  };
  const value = parts.infecao + parts.presenca + parts.objetivos + parts.sobrevivencia + parts.eficiencia + parts.achievements;
  return { value, parts };
}
function endRoom(room, reason) {
  room.phase = 'ended';
  room.endedAt = Date.now();
  room.lastAt = room.endedAt;
  room.sseVer++;
  const players = [...room.players.values()].map(p => ({ ...finalScore(room, p), p }));
  players.sort((a, b) => b.value - a.value || b.parts.eficiencia - a.parts.eficiencia || b.parts.sobrevivencia - a.parts.sobrevivencia);
  room.result = {
    reason, day: room.day, ranking: players.map(x => ({
      key: x.p.key, agent: x.p.agent, icon: x.p.icon, name: x.p.name,
      score: x.value, parts: x.parts, alive: x.p.alive,
      cumPct: +(100 * x.p.cumInf / WORLD_POP).toFixed(1), deadPct: +(100 * x.p.deadTotal / WORLD_POP).toFixed(1),
      nodes: x.p.owned.length, builds: x.p.buildsTriggered.length,
    })),
  };
  const w = room.result.ranking[0];
  rpush(room, `PARTIDA TERMINADA — vencedor: ${w.icon} ${w.name} (${w.score} pts)`);
}

// ---------- API de sala ----------
const api = {
  TICK_MS, PVP_CLOCK, PVP_MIN, PVP_MAX,
  create(hostKey) {
    let code;
    do { code = randCode(); } while (ROOMS.has(code));
    const room = freshRoom(code, hostKey);
    room.players.set(hostKey, newPlayer(hostKey, null));
    return room;
  },
  join(room, key) {
    if (room.players.has(key)) return { ok: true };
    if (room.phase !== 'lobby') return { error: 'sala já começou' };
    if (room.players.size >= PVP_MAX) return { error: 'sala cheia (máx 6)' };
    room.players.set(key, newPlayer(key, null));
    room.lastAt = Date.now(); room.sseVer++;
    return { ok: true };
  },
  leave(room, key) {
    room.players.delete(key);
    if (room.players.size === 0) { ROOMS.delete(room.code); return true; }
    if (room.hostKey === key) { const next = [...room.players.keys()][0]; room.hostKey = next; room.players.get(next).host = true; }
    room.lastAt = Date.now(); room.sseVer++;
    return false;
  },
  byCode: code => ROOMS.get(code) || null,
  count: () => ROOMS.size,
  // --- ações de jogador (lobby) ---
  act(room, key, body) {
    const p = room.players.get(key);
    if (!p) return { error: 'não estás na sala' };
    switch (body.type) {
      case 'agent': {
        if (room.phase !== 'lobby') return { error: 'sala já começou' };
        const a = AGENTS.find(x => x.id === body.agent);
        if (!a) return { error: 'bad agent' };
        for (const q of room.players.values()) if (q !== p && q.agent === a.id) return { error: 'agente já escolhido por outro operador' };
        const prev = AGENTS.find(x => x.id === p.agent);
        p.agent = a.id; p.icon = a.icon; p.name = a.name;
        p.stats = computeStats(p.owned, p.extraFx, a.effects);
        if (prev && prev.id !== a.id) { p.owned = []; p.extraFx = []; p.tags = new Set(); p.buildsTriggered = []; p.dna = 60; p.stats = computeStats([], [], a.effects); }
        p.ready = false;
        room.lastAt = Date.now(); room.sseVer++;
        return { ok: true, agent: a.id };
      }
      case 'seed': {
        if (room.phase !== 'lobby') return { error: 'sala já começou' };
        if (!p.agent) return { error: 'escolhe primeiro um agente' };
        const r = REGIONS.find(x => x.id === body.region);
        if (!r) return { error: 'bad region' };
        for (const q of room.players.values()) if (q !== p && q.startRegion === r.id) return { error: 'região já escolhida por outro operador' };
        p.startRegion = r.id;
        p.ready = false;
        room.lastAt = Date.now(); room.sseVer++;
        return { ok: true };
      }
      case 'ready': {
        if (room.phase !== 'lobby') return { error: 'sala já começou' };
        if (!p.agent || !p.startRegion) return { error: 'falta agente ou região' };
        p.ready = !p.ready;
        room.lastAt = Date.now(); room.sseVer++;
        return { ok: true, ready: p.ready };
      }
      case 'start': {
        if (key !== room.hostKey) return { error: 'só o anfitrião inicia' };
        if (room.phase !== 'lobby') return { error: 'sala já começou' };
        const pl = [...room.players.values()];
        if (pl.length < PVP_MIN) return { error: `precisas de pelo menos ${PVP_MIN} operadores` };
        if (pl.some(q => !q.agent)) return { error: 'há operadores sem agente' };
        if (pl.some(q => !q.startRegion)) return { error: 'há operadores sem região de origem' };
        if (pl.some(q => !q.ready)) return { error: 'há operadores sem READY' };
        if (new Set(pl.map(q => q.agent)).size !== pl.length) return { error: 'agentes duplicados — escolhe de novo' };
        room.phase = 'running';
        room.startedAt = Date.now();
        for (const q of pl) {
          q.host = q.key === room.hostKey;
          const sm = rmeta(q.startRegion);
          const r = room.world.regions.find(x => x.id === q.startRegion);
          const p0 = Math.min(sm.pop, Math.max(sm.pop * 0.0002, sm.pop * CFG.seedIFrac));
          r.infx[q.key] = p0; q.cumInf += p0; q.regionHit.add(q.startRegion);
          room.world.firstBy[q.startRegion] = q.key; q.firstCount++;
        }
        room.lastAt = Date.now(); room.sseVer++;
        rpush(room, `OPERAÇÃO VIRUS INICIADA — ${pl.length} agentes no terreno (relógio ${PVP_CLOCK} dias)`);
        return { ok: true };
      }
      case 'speed': {
        if (key !== room.hostKey) return { error: 'só o anfitrião controla o relógio' };
        room.speed = [0, 1, 2, 4, 8].includes(body.value) ? body.value : room.speed;
        room.lastAt = Date.now(); room.sseVer++;
        return { ok: true, speed: room.speed };
      }
      case 'evolve': {
        if (room.phase !== 'running') return { error: 'not running' };
        if (!p.alive) return { error: 'agente erradicado — és observador' };
        const n = NODES.find(x => x.id === body.node);
        if (!n) return { error: 'unknown node' };
        if (n.agentOnly && n.agentOnly !== p.agent) return { error: 'agent exclusive' };
        if (p.owned.includes(n.id)) return { error: 'already owned' };
        if (!n.req.every(r => p.owned.includes(r))) return { error: 'prerequisite missing' };
        const cost = Math.round(n.cost * p.stats.costMod);
        if (p.dna < cost) return { error: 'not enough DNA' };
        p.dna -= cost; p.owned.push(n.id);
        n.tags.forEach(t => p.tags.add(t));
        for (const b of BUILDS) {
          if (p.buildsTriggered.includes(b.id)) continue;
          if (b.all.every(t => p.tags.has(t)) && (!b.any || b.any.some(t => p.tags.has(t)))) {
            p.buildsTriggered.push(b.id); p.extraFx.push(...b.effects);
            rpush(room, `${p.icon} ${p.name} ativou EMERGENT BUILD: ${b.name}`);
          }
        }
        p.stats = computeStats(p.owned, p.extraFx, (AGENTS.find(a => a.id === p.agent) || {}).effects);
        room.sseVer++;
        return { ok: true, dna: p.dna };
      }
      default: return { error: 'unknown pvp action' };
    }
  },
  // avança salas em execução (chamado pelo intervalo do servidor, dt em ms)
  advance(dtMs) {
    const now = Date.now();
    for (const room of ROOMS.values()) {
      if (room.phase === 'running') {
        room.acc += dtMs * room.speed;
        while (room.acc >= TICK_MS) {
          room.acc -= TICK_MS;
          room.day++;
          tickRoom(room);
          room.lastAt = now; room.sseVer++;
          const players = [...room.players.values()];
          const aliveN = players.filter(p => p.alive).length;
          const deadTotal = totDead(room);
          const reason = checkEnd(room, aliveN, deadTotal);
          if (reason) { endRoom(room, reason); break; }
        }
      } else if (room.phase === 'lobby' && now - room.lastAt > 6 * 3600e3) {
        ROOMS.delete(room.code);
      } else if (room.phase === 'ended' && now - (room.endedAt || room.createdAt) > 3600e3) {
        ROOMS.delete(room.code);
      }
    }
  },
};

function sweepAbandoned(now) {
  for (const room of ROOMS.values()) {
    if (room.phase === 'running' && now - room.lastAt > 24 * 3600e3) ROOMS.delete(room.code);
  }
}

function checkEnd(room, aliveN, deadTotal) {
  if (aliveN === 0) return 'todos os agentes foram erradicados pela Humanidade';
  if (aliveN === 1) return 'resta apenas um agente ativo';
  if (deadTotal >= 0.95 * WORLD_POP) return 'a humanidade foi extinta';
  if (room.day >= PVP_CLOCK) return 'relógio esgotado — a humanidade resistiu';
  return null;
}

// ---------- deteção global (humanidade vê o mundo; stealth pondera) ----------
function detectHumanity(room) {   // chamado no tickRoom
  const W = room.world;
  const REF = 70;
  for (const r of W.regions) {
    const meta = rmeta(r.id);
    let gain = 0;
    const pop = meta.pop || 1;
    for (const p of room.players.values()) {
      const iA = r.infx[p.key] || 0, dA = r.deadx[p.key] || 0;
      if (iA <= 0 && dA <= 0) continue;
      const fracA = Math.min(1, iA / pop);
      const activeS = fracA * REF;                 // fração ativa do agente, escala de referência
      const deadS = Math.min(1, dA / pop) * REF;   // mortos do agente na região
      let vis = Math.max(0.05, 1 - p.stats.stealth) * p.stats.detectMod;
      if (p.stats.incub && room.day < 60) vis *= 0.6;
      gain += (2.9 * Math.log10(1 + activeS * 20) * (0.35 + meta.healthcare) + deadS * 35) * vis * CFG.detScale;
    }
    if (gain > 0) {
      r.detection += gain;
      if (r.detNews < 1 && r.detection >= 30) { r.detNews = 1; rpush(room, `Urgências de ${meta.name} relatam síndrome respiratória atípica`); }
      if (r.detNews < 2 && r.detection >= 65) { r.detNews = 2; rpush(room, `${meta.name}: hospitais sob pressão; autoridades negam surto`); }
      if (!r.identified && r.detection >= 100) {
        r.identified = true;
        rpush(room, `${meta.name} identificou o agente (${meta.pop.toFixed(0)}M hab.)`);
      }
    }
  }
}

// ---------- estado público POR JOGADOR (contrato da UI single) ----------
function stateFor(room, key) {
  const p = room.players.get(key) || null;
  const players = [...room.players.values()];
  const common = {
    phase: room.phase, day: room.day, speed: room.speed,
    pvp: { code: room.code, you: key, host: room.hostKey === key,
            players: players.map(q => ({ key: q.key, agent: q.agent, icon: q.icon, name: q.name,
              ready: q.ready, seed: q.startRegion, host: q.host === true || q.key === room.hostKey, alive: q.alive })) },
    world: { pop: WORLD_POP },
    humanity: { awareness: room.world.awareness, stage: room.world.stage, stageName: STAGE_NAMES[room.world.stage],
                vaccine: room.world.vaccine,
                identified: room.world.regions.filter(r => r.identified).length },
    news: room.world.news.slice(-50),
    result: room.result || null,
    scenario: 'pvp',
  };
  if (room.phase === 'lobby') {
    common.owned = []; common.tags = []; common.dna = p ? p.dna : 60;
    common.meta = { nodes: [], edges: [], agents: AGENTS.map(a => ({ id: a.id, name: a.name, icon: a.icon, tag: a.tag, desc: a.desc })) };
    common.regions = room.world.regions.map(r => ({ id: r.id, name: rmeta(r.id).name, lon: rmeta(r.id).lon, lat: rmeta(r.id).lat,
      pop: rmeta(r.id).pop, climate: rmeta(r.id).climate, airport: rmeta(r.id).airport, port: rmeta(r.id).port,
      i: 0, dead: 0, s: r.s, detection: r.detection, identified: r.identified,
      seedBy: room.world.firstBy[r.id] === key }));
    return common;
  }
  if (!p) return { ...common, phase: 'ended', result: room.result || { reason: 'sala terminou' } };
  const mine = k => {
    let t = 0; for (const r of room.world.regions) { const v = r[k][key]; if (v) t += v; } return t;
  };
  common.owned = p.owned; common.tags = [...p.tags]; common.dna = Math.floor(p.dna);
  common.builds = p.buildsTriggered;
  common.alive = p.alive;
  common.world.cumInf = p.cumInf;
  common.world.infected = mine('infx');
  common.world.dead = p.deadTotal;
  common.player = { costMod: p.stats.costMod, stealth: Math.round(p.stats.stealth * 100) / 100,
    zoon: Math.round(p.stats.zoon * 100) / 100, refuse: Math.round(p.stats.refuse * 100) / 100,
    detectMod: Math.round(p.stats.detectMod * 100) / 100, leth: Math.round(p.stats.leth * 10000) / 100,
    startRegion: p.startRegion };
  common.pendingEvent = null;
  common.agent = p.agent;
  common.log = [];
  common.meta = {
    nodes: NODES.filter(n => !n.agentOnly || n.agentOnly === p.agent),
    edges: EDGES,
    agents: AGENTS.map(a => ({ id: a.id, name: a.name, icon: a.icon, tag: a.tag, desc: a.desc })),
    stageNames: STAGE_NAMES, clockLimit: PVP_CLOCK, extinctFrac: 1, tickMs: TICK_MS, pvp: true,
  };
  common.regions = room.world.regions.map(r => {
    const m = rmeta(r.id);
    return { id: r.id, name: m.name, lon: m.lon, lat: m.lat, pop: m.pop, density: m.density,
      climate: m.climate, healthcare: m.healthcare, science: m.science,
      airport: m.airport, port: m.port,
      i: r.infx[key] || 0, s: r.s, dead: r.deadx[key] || 0,
      detection: Math.min(100, r.detection), identified: r.identified,
      treatment: r.treatment, vaccinated: r.vacc };
  });
  return common;
}

module.exports = { api, stateFor, ROOMS, tickRoom, detectHumanity, totI, totDead, WORLD_POP, finalScore, endRoom, sweepAbandoned };
