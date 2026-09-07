// PANDEMIC EVOLUTION — Vertical Slice (Phase 1)
// Server-authoritative simulation (SPEC v1.2 §39/§41). Zero dependencies.
// Run: node server.js          (HTTP on :3000)
//      node server.js --simtest (headless AI-vs-AI pacing test)

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { REGIONS, NODES, BUILDS, EVENTS, AGENTS } = require('./data.js');
const dev = require('./lib/dev.js');
const bot = require('./lib/bot.cjs');  // política única de compra (A4)

const PORT = process.env.PORT || 3000;
const TICK_MS = 2000;          // 1 tick = 1 in-game day (calibration parameter)
const CLOCK_LIMIT = 400;       // days (default; scenarios override)
// Objetivo (SPEC revisão): NÃO basta infetar — é preciso EXTINGUIR a humanidade.
// Vitória única: mortos >= EXTINCT_FRAC da população mundial (default 95%).
const EXTINCT_FRAC = parseFloat(process.env.EXTINCT_FRAC || '0.95');
const ERADIC_DAYS = 14;
// ---- calibration knobs (env-overridable; tuned against the real-city graph) ----
// All spread/detection magnitudes are now RELATIVE (fractions of city pop) so the
// simulation is scale-invariant for real cities (2.9M Lisboa … 37M Tóquio).
const CFG = {
  transBase:   parseFloat(process.env.TRANS_BASE   || '0.05'),  // per-day within-region growth base
  crossMul:    parseFloat(process.env.CROSS_MUL    || '0.8'),   // cross-region spread multiplier
  seedIFrac:   parseFloat(process.env.SEED_I_FRAC  || '0.0015'),// patient-zero = 0.15% of seeded city
  spreadMinF:  parseFloat(process.env.SPREAD_MIN_F || '0.0008'),// min infected fraction to attempt spread
  seedToFrac:  parseFloat(process.env.SEED_TO_FRAC || '0.0002'),// max seed = 0.02% of destination pop
  seedToMinF:  parseFloat(process.env.SEED_MIN_F   || '0.00002'),// min seed fraction of destination
  detScale:    parseFloat(process.env.DET_SCALE    || '1.0'),   // humanity detection responsiveness
  awareMul:    parseFloat(process.env.AWARE_MUL    || '1.2'),   // global awareness gain multiplier
  vaccineRate: parseFloat(process.env.VACCINE_RATE || '1.2'),   // vaccine R&D speed multiplier
  vaxMassRate: parseFloat(process.env.VAX_MASS_RATE|| '1.0'),   // mass vaccination speed multiplier
  zoonBase:    parseFloat(process.env.ZOON_BASE     || '0.0018'),// per-day zoonotic jump base (×zoon×frac×100)
};

// PvE scenario variants (variety inside PvE — SPEC §13)
const SCENARIOS = {
  silent: { id: 'silent', name: 'SILENT DAWN', tag: 'Espalha sem seres visto', diff: 1,
    clock: 400, awarenessMul: 0.70, detectMul: 0.80, startDna: 60, treatMul: 1.0,
    desc: 'A humanidade está distraída. Menos deteção e consciência — ideal para builds stealth.' },
  rush: { id: 'rush', name: 'GLOBAL RUSH', tag: 'Corrida contra o relógio', diff: 2,
    clock: 260, awarenessMul: 1.20, detectMul: 1.00, startDna: 90, treatMul: 1.0,
    desc: 'Relógio curto e humanidade alerta. Expansão agressiva obrigatória.' },
  iron: { id: 'iron', name: 'IRON WORLD', tag: 'A humanidade está preparada', diff: 3,
    clock: 400, awarenessMul: 1.60, detectMul: 1.60, startDna: 50, treatMul: 1.25,
    extinctFrac: 0.90, // A2 (decisão): barra própria 90% no IRON. Medido: bots smart 2/5 com
    // tetos 90-94% — sem isto (95% fixo) o iron é matematicamente imbatível: a cura+vacina
    // salvam sempre os últimos ~10-15%. Base/silent/rush mantêm EXTINÇÃO ≥95%.
    desc: 'Deteção rápida, tratamentos fortes, consciência acelerada. Só para especialistas.' },
  standard: { id: 'standard', name: 'STANDARD', tag: 'Calibração', diff: 2,
    clock: 400, awarenessMul: 1.00, detectMul: 1.00, startDna: 60, treatMul: 1.0,
    desc: 'Parâmetros base de calibração (usado pelo simulador de balance).' },
};

const STAGE_NAMES = ['UNAWARE','SUSPICION','INVESTIGATION','IDENTIFICATION','CONTAINMENT','TREATMENT','RESEARCH','VACCINE'];
const STAGE_THRESH = [0, 8, 20, 35, 52, 68, 84, 100];

const WORLD_POP = REGIONS.reduce((s, r) => s + r.pop, 0);

// ---------- graph (distâncias reais, haversine) ----------
function havKm(a, b) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const EDGES = [];
(function buildGraph() {
  for (let i = 0; i < REGIONS.length; i++) {
    for (let j = i + 1; j < REGIONS.length; j++) {
      const a = REGIONS[i], b = REGIONS[j], d = havKm(a, b);
      if (d < 1300) EDGES.push({ a: a.id, b: b.id, type: 'land', cap: 0.9 * (0.5 + (a.mobility + b.mobility) / 2) });
      else if (a.port && b.port && d < 9000) EDGES.push({ a: a.id, b: b.id, type: 'sea', cap: 0.6 });
      else if (a.airport && b.airport && d < 13000) EDGES.push({ a: a.id, b: b.id, type: 'air', cap: 0.85 });
    }
  }
  // connectivity guarantee
  const adj = {};
  REGIONS.forEach(r => adj[r.id] = []);
  EDGES.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
  const seen = new Set([REGIONS[0].id]); const q = [REGIONS[0].id];
  while (q.length) { const c = q.shift(); for (const n of adj[c]) if (!seen.has(n)) { seen.add(n); q.push(n); } }
  for (const r of REGIONS) if (!seen.has(r.id)) {
    let best = null, bd = 1e9;
    for (const o of REGIONS) if (seen.has(o.id)) { const d = havKm(r, o); if (d < bd) { bd = d; best = o; } }
    EDGES.push({ a: r.id, b: best.id, type: 'air', cap: 0.7 });
    adj[r.id].push(best.id); adj[best.id].push(r.id); seen.add(r.id);
    console.log(`[graph] added emergency air route ${r.id} -> ${best.id}`);
  }
})();

// ---------- game state ----------
let G = null;
let AGENT_ID = 'bacteria';      // agente escolhido no briefing (persiste entre partidas)
dev.init({ phase: () => G && G.phase, day: () => G && G.day });

function baseStats() {
  return { trans: CFG.transBase, leth: 0.0032, stealth: 0, cureResist: 0, refuse: 0, zoon: 0, cross: 1.0, dnaGain: 1.0,
           costMod: 1.0, detectMod: 1.0, dense: 1.0, sparse: 1.0, incub: false,
           climate: { hot: 0.55, cold: 0.50, arid: 0.50, humid: 0.60, temperate: 0.75 } };
}

function applyEffects(stats, effects) {
  for (const e of effects) {
    if (e.k.startsWith('climate.')) {
      const c = e.k.split('.')[1];
      stats.climate[c] = (stats.climate[c] || 1) * (e.mul !== undefined ? e.mul : 1) + (e.add || 0);
    } else if (e.k === 'incub') {
      stats.incub = true;
    } else if (e.k === 'stealth' || e.k === 'cureResist' || e.k === 'refuse' || e.k === 'zoon') {
      const cap = { stealth: 0.80, cureResist: 0.75, refuse: 0.80, zoon: 1.0 }[e.k];
      stats[e.k] = Math.min(cap, stats[e.k] + (e.add || 0));
    } else if (e.mul !== undefined) {
      stats[e.k] *= e.mul;
    } else if (e.add !== undefined) {
      stats[e.k] += e.add;
    }
  }
}

function computeStats(ownedNodes, extraEffects, agentEffects) {
  const s = baseStats();
  if (agentEffects && agentEffects.length) applyEffects(s, agentEffects);
  for (const id of ownedNodes) {
    const n = NODES.find(x => x.id === id);
    if (n) applyEffects(s, n.effects);
  }
  if (extraEffects && extraEffects.length) applyEffects(s, extraEffects);
  return s;
}

function newGame(scenario) {
  const sc = scenario && SCENARIOS[scenario] ? SCENARIOS[scenario] : null;
  return {
    phase: 'setup', day: 0, speed: 1, acc: 0,
    scenario: sc ? sc.id : null, sc,
    dna: sc ? sc.startDna : 60, owned: [], extraFx: [], tags: new Set(),
    agent: AGENT_ID,
    stats: computeStats([], [], (AGENTS.find(a => a.id === AGENT_ID) || {}).effects),
    regions: REGIONS.map(r => ({ id: r.id, s: r.pop, i: 0, dead: 0, vaccinated: 0,
      detection: 0, detNews: 0, identified: false, treatment: 0, closures: { air: false, sea: false, land: false } })),
    awareness: 0, stage: 0, vaccine: 0, treatTech: 0,
    cumInf: 0, eradic: 0, startRegion: null,
    routeCounts: { air: 0, sea: 0, land: 0 },
    adapt: { airportScreening: false, boostInvestigation: false },
    pendingEvent: null, nextEventDay: 30 + Math.floor(Math.random() * 20),
    buildsTriggered: [], log: [], news: [], flags: {},
    nextAmbient: 4 + Math.floor(Math.random() * 5), result: null,
  };
}

function rstate(id) { return G.regions.find(r => r.id === id); }
function scMul(k, dflt) { return G.sc ? (G.sc[k] !== undefined ? G.sc[k] : dflt) : dflt; }
function rmeta(id) { return REGIONS.find(r => r.id === id); }
function log(msg, cls) {
  G.log.push({ day: G.day, msg, cls: cls || 'info' });
  if (G.log.length > 200) G.log.shift();
}
function news(src, msg, tone) {
  G.news.push({ day: G.day, src, msg, tone: tone || 'wire' });
  if (G.news.length > 90) G.news.shift();
}
function milestone(flag, cond, src, msg, tone) {
  if (!G.flags[flag] && cond) { G.flags[flag] = true; news(src, msg, tone); }
}

// ---------- world wire (notícias ambientes, dão vida ao mundo) ----------
const CALM_NEWS = [
  A => `${A}: feira de aviação civil bate recorde de visitantes`,
  (A, B) => `${A} e ${B} assinam acordo comercial histórico`,
  A => `Festival cultural em ${A} atrai multidões`,
  A => `Turismo em máximos em ${A}; hotelaria esgotada`,
  A => `Bolsa de ${A} fecha em máximos históricos`,
  A => `Novo terminal portuário inaugurado em ${A}`,
];
const MID_NEWS = [
  () => `OMS pede vigilância reforçada após casos atípicos`,
  A => `${A} reforça rastreio epidemiológico nos hospitais`,
  A => `Cientistas em ${A} sequenciam genoma ainda não catalogado`,
  A => `Bolsa de ${A} cai após rumores de surto`,
  A => `${A} recomenda evitar aglomerações`,
];
const PANIC_NEWS = [
  A => `Hospitais de ${A} em rutura; camas esgotadas`,
  A => `${A} declara estado de emergência sanitária`,
  A => `${A} fecha fronteiras por tempo indeterminado`,
  A => `Compras de pânico esgotam prateleiras em ${A}`,
  A => `Ensaios de vacina acelerados em ${A}`,
];

function climateFactor(stats, meta) {
  return Math.max(0.15, Math.min(1.4, stats.climate[meta.climate] || 0.5));
}

function containment(r) {
  if (!r.identified) {
    // global hygiene awareness once humanity is mobilized
    if (G.stage >= 6) return 0.15;
    if (G.stage >= 4) return 0.08;
    return 0;
  }
  let c = [0, 0.05, 0.12, 0.20, 0.45, 0.50, 0.55, 0.60][G.stage] || 0;
  c += r.treatment * 0.12;
  return Math.min(0.80, c);
}

function routeFactor(type, ra, rb) {
  let f = 1;
  if (type === 'air') {
    if (G.adapt.airportScreening) f *= 0.55;
    if (G.stage >= 4 && (ra.closures.air || rb.closures.air)) f *= 0.15;
  } else if (type === 'sea') {
    if (G.stage >= 5 && (ra.closures.sea || rb.closures.sea)) f *= 0.15;
  } else if (G.stage >= 6 && (ra.closures.land || rb.closures.land)) f *= 0.3;
  return f;
}

// ---------- one day tick ----------
function tick() {
  if (G.phase !== 'running' || G.pendingEvent) return;
  G.day++;
  const stats = G.stats;
  let totalNewI = 0, totalI = 0, totalDead = 0;

  // A2 — IRON WORLD: colapso da resposta humana (uma vez, aos 65% infetados).
  // A barra própria do iron é 90% (ver SCENARIOS.iron) — sem colapso era matematicamente
  // imbatível: cura+vacina salvavam sempre os últimos ~10-17% (tetos medidos 83-94%).
  if (G.scenario === 'iron' && !G.ironCollapse && G.cumInf >= 0.65 * WORLD_POP) {
    G.ironCollapse = true; G.ironCollapseDay = G.day;
    news('GLOBAL WIRE', 'COLAPSO — infraestrutura sanitária global em falência. Resta a morte.', 'panic');
    log('IRON WORLD: a resposta humanitária colapsou (dia ' + G.day + ')', 'humanity');
    for (const r of G.regions) { r.closures.air = false; r.closures.sea = false; r.closures.land = false; }
  }
  const ironCol = (G.scenario === 'iron' && G.ironCollapse) ? 1 : 0;

  // within-region dynamics
  for (const r of G.regions) {
    if (r.i <= 0) { r.i = 0; continue; }
    const meta = rmeta(r.id);
    const cf = climateFactor(stats, meta);
    const df = meta.density > 0.55 ? stats.dense : (meta.density < 0.3 ? stats.sparse : 1);
    const growth = stats.trans * cf * df * (1 - containment(r));
    let newI = Math.min(r.i * growth + Math.min(r.s, r.i * 0.005), r.s);
    const frac = meta.pop > 0 ? Math.min(1, r.i / meta.pop) : 0;
    // colapso sanitário: hospitais saturados aceleram a morte à medida que a
    // cidade (frac) e o mundo (cumFrac) ficam tomados — torna a EXTINÇÃO possível.
    const cumFrac = Math.min(1, (G.cumInf + newI) / WORLD_POP);
    const collapse = (1 + 1.0 * frac) * (1 + 2.0 * cumFrac);
    const effLeth = stats.leth * (1 - 0.35 * Math.min(1, G.treatTech + r.treatment)) * collapse;
    const deaths = Math.min(r.i * effLeth, r.i);
    // colapso dos cuidados: com a humanidade em agonia (muitos mortos), a cura
    // deixa de acompanhar — a morte torna-se irreversível nos estádios finais.
    const careCollapse = Math.max(0.02, 1 - 1.04 * (G.regions.reduce((z, x) => z + x.dead, 0) / WORLD_POP));
    const cureRate = (0.004 + 0.060 * r.treatment * scMul('treatMul', 1)) * (1 - stats.cureResist) * (1 - 0.45 * (stats.refuse || 0)) * careCollapse * (ironCol ? 0.30 : 1);
    const cured = Math.min(Math.max(r.i - deaths, 0) * cureRate, r.i - deaths);
    r.i = Math.max(0, r.i + newI - deaths - cured);
    if (r.i > 0 && r.s > 0 && r.i < r.s * 0.0004 && Math.random() < 0.10) r.i = 0; // outbreak fizzles out (fração da cidade)
    r.s = Math.max(0, r.s - newI);
    r.dead += deaths;
    G.cumInf += newI;
    totalNewI += newI; totalI += r.i; totalDead += r.dead;

    // detection — FRACTION-based (scale-invariant for real city sizes):
    // renormaliza cada cidade para a escala de uma "região de referência" (70M),
    // para que a deteção/identificação responda na mesma fração infetada
    const newFrac = meta.pop > 0 ? Math.min(frac, newI / meta.pop) : 0;
    const deadFrac = meta.pop > 0 ? Math.min(frac, deaths / meta.pop) : 0;
    const REF = 70; // M habitantes (região de referência ~ antiga escala)
    const iS = frac * REF, nS = newFrac * REF, dS = deadFrac * REF;
    let visibility = Math.max(0.05, 1 - stats.stealth) * stats.detectMod;
    if (stats.incub && G.day < 60) visibility *= 0.6;
    const detGain =
      (2.9 * Math.log10(1 + iS * 20) * (0.35 + meta.healthcare) +
       nS * 3.5 * (0.35 + meta.healthcare) +
       dS * 35) * visibility * scMul('detectMul', 1) * CFG.detScale + 0.08;
    r.detection += detGain * (G.adapt.boostInvestigation ? 1.25 : 1);
    if (r.detNews < 1 && r.detection >= 30) { r.detNews = 1; news('WIRE', `Urgências de ${meta.name} relatam síndrome respiratória atípica`, 'wire'); }
    if (r.detNews < 2 && r.detection >= 65) { r.detNews = 2; news('WIRE', `${meta.name}: hospitais sob pressão; autoridades negam surto`, 'wire'); }
    if (!r.identified && r.detection >= 100) {
      r.identified = true;
      log(`${meta.name} identificou o agente (${meta.pop.toFixed(0)}M hab.)`, 'humanity');
      news('OMS', `${meta.name} confirma agente patogénico não catalogado`, 'alert');
    }
  }

  // cross-region spread
  for (const e of EDGES) {
    for (const [srcId, dstId] of [[e.a, e.b], [e.b, e.a]]) {
      const ra = rstate(srcId), rb = rstate(dstId);
      const ma = rmeta(srcId), mb = rmeta(dstId);
      const srcFrac = ma.pop > 0 ? ra.i / ma.pop : 0;
      if (srcFrac < CFG.spreadMinF || rb.s <= 0) continue;
      let p = Math.min(0.5, e.cap * stats.cross * srcFrac * CFG.crossMul * routeFactor(e.type, ra, rb));
      if (Math.random() < p) {
        const seed = Math.min(rb.s * CFG.seedToFrac, Math.max(rb.s * CFG.seedToMinF, rb.s * srcFrac * 0.02));
        const wasClean = rb.i <= 0;
        rb.i += seed;
        G.cumInf += seed;
        rb.s = Math.max(0, rb.s - seed);   // sementes = novos infetados (consumem susceptíveis)
        G.routeCounts[e.type]++;
        if (wasClean) {
          log(`Propagação para ${mb.name} via rota ${e.type === 'air' ? 'aérea' : e.type === 'sea' ? 'marítima' : 'terrestre'}`, 'spread');
          if (Math.random() < 0.35) news('WIRE', `Relatos de síndrome desconhecida em ${mb.name}`, 'wire');
          G.dna += 4 * stats.dnaGain;
        }
      }
    }
  }

  // vetores zoonóticos (novo stat 'zoon'): mesmo com rotas fechadas, o agente salta
  // por reservatórios naturais — reacende surtos quando a humanidade se fecha.
  if ((stats.zoon || 0) > 0.001 && G.phase === 'running') {
    // em modo erradicação (contagem G.eradic) até reservatórios minúsculos podem reacender
    const minF = G.eradic > 0 ? 0.0002 : 0.002;
    const hosts = G.regions
      .map(r => ({ r, f: rmeta(r.id).pop > 0 ? r.i / rmeta(r.id).pop : 0 }))
      .filter(h => h.f > minF).sort((a, b) => b.f - a.f);
    const best = hosts[0];
    if (best) {
      const p = Math.min(0.5, CFG.zoonBase * (stats.zoon || 0) * best.f * 100);
      if (Math.random() < p) {
        const cands = G.regions.filter(x => x.s > 0.01);
        if (cands.length) {
          const dst = cands[Math.floor(Math.random() * cands.length)];
          const seed = Math.min(dst.s * CFG.seedToFrac, Math.max(dst.s * CFG.seedToMinF, dst.s * 0.00005));
          const wasClean = dst.i <= 0;
          dst.i += seed; G.cumInf += seed; dst.s = Math.max(0, dst.s - seed);
          if (wasClean) {
            G.eradic = 0;   // um salto zoonótico aborta a contagem de erradicação
            log(`Salto zoonótico para ${rmeta(dst.id).name} (reservatórios naturais)`, 'spread');
            news('OMS', `Casos isolados em ${rmeta(dst.id).name} sem ligação a rotas conhecidas — ronda de erradicação comprometida`, 'alert');
          }
        }
      }
    }
  }

  // DNA income
  G.dna += (totalNewI * 0.090 + 0.20) * stats.dnaGain;

  // marcos globais (wire) — em fração da população mundial (8,2 mil M)
  milestone('deadp1', totalDead >= 0.001 * WORLD_POP, 'GLOBAL WIRE', '0,1% da humanidade já morreu', 'panic');
  milestone('deadp10', totalDead >= 0.01 * WORLD_POP, 'GLOBAL WIRE', '1% da humanidade já morreu; luto global', 'panic');
  milestone('deadp100', totalDead >= 0.10 * WORLD_POP, 'GLOBAL WIRE', '10% da humanidade já morreu; crise civilizacional', 'panic');
  milestone('deadp25', totalDead >= 0.25 * WORLD_POP, 'GLOBAL WIRE', '25% da humanidade eliminada', 'panic');
  milestone('deadp50', totalDead >= 0.50 * WORLD_POP, 'GLOBAL WIRE', 'Metade da humanidade eliminada', 'panic');
  milestone('deadp75', totalDead >= 0.75 * WORLD_POP, 'GLOBAL WIRE', '75% da humanidade eliminada — agonia final', 'panic');
  milestone('cum25', G.cumInf >= 0.25 * WORLD_POP, 'GLOBAL WIRE', 'Um quarto da humanidade já foi infetada', 'panic');
  milestone('cum50', G.cumInf >= 0.50 * WORLD_POP, 'GLOBAL WIRE', 'Metade do mundo já contraiu o agente', 'panic');
  milestone('cum65', G.cumInf >= 0.65 * WORLD_POP, 'GLOBAL WIRE', 'PANDEMIA GLOBAL — dois terços infetados. Resta matar.', 'panic');
  milestone('cum85', G.cumInf >= 0.85 * WORLD_POP, 'GLOBAL WIRE', 'O contágio é total — agora só a morte decide.', 'panic');

  // Humanity AI pipeline
  const identified = G.regions.filter(r => r.identified);
  if (identified.length) {
    const idPop = identified.reduce((s, r) => s + rmeta(r.id).pop, 0);
    const avgSci = identified.reduce((s, r) => s + rmeta(r.id).science * rmeta(r.id).pop, 0) / idPop;
    G.awareness = Math.min(100, G.awareness + (0.35 + (idPop / WORLD_POP) * 3.8) * CFG.awareMul * (0.4 + avgSci) * scMul('awarenessMul', 1) * (G.adapt.boostInvestigation ? 1.15 : 1) * (1 - 0.30 * (stats.refuse || 0)));
  }
  let newStage = 0;
  for (let s = 1; s < STAGE_THRESH.length - 1; s++) if (G.awareness >= STAGE_THRESH[s]) newStage = s;
  if (G.vaccine >= 100) newStage = 7; // VACCINE stage = rollout begun
  if (newStage > G.stage) {
    G.stage = newStage;
    log(`Humanity: ${STAGE_NAMES[G.stage]}`, 'humanity');
    news('GLOBAL WIRE', `Nível de alerta mundial sobe para ${STAGE_NAMES[G.stage]}`, 'alert');
    if (G.stage >= 4) { for (const r of identified) r.closures.air = true; news('AVIA-CIV', 'Hubs internacionais suspendem voos de zonas identificadas', 'alert'); }
    if (G.stage >= 5) { for (const r of identified) r.closures.sea = true; news('IMO-WIRE', 'Portos restringem navios provenientes de zonas identificadas', 'alert'); }
    if (G.stage >= 6) { for (const r of identified) r.closures.land = true; news('LAB-WIRE', 'Consórcio científico global inicia corrida à vacina', 'alert'); }
    if (G.stage >= 7) news('GLOBAL WIRE', 'Vacinação em massa iniciada nos territórios identificados', 'alert');
  }
  if (G.stage >= 5) {
    G.treatTech = Math.min(1, G.treatTech + 0.015 * (ironCol ? 0.15 : 1));
    for (const r of G.regions) r.treatment = Math.min(1, G.treatTech * (0.3 + 0.7 * rmeta(r.id).healthcare) * (r.identified ? 1 : 0.4));
  }
  if (G.stage >= 6) {
    const avgSci = REGIONS.reduce((s, r) => s + r.science, 0) / REGIONS.length;
    const urgency = 1 + 2 * (G.cumInf / WORLD_POP);
    G.vaccine = Math.min(100, G.vaccine + 1.0 * CFG.vaccineRate * (0.4 + avgSci) * urgency * (G.vaccine >= 100 ? 1.3 : 1) * (ironCol ? 0.25 : 1));
    milestone('vax25', G.vaccine >= 25, 'LAB-WIRE', 'Candidatos a vacina entram em ensaios clínicos', 'good');
    milestone('vax50', G.vaccine >= 50, 'LAB-WIRE', 'Vacina: eficácia preliminar anunciada; produção em escala', 'good');
    milestone('vax75', G.vaccine >= 75, 'LAB-WIRE', 'Vacina aprovada em emergência; distribuição começa', 'good');
  }
  if (G.stage >= 7) {
    for (const r of G.regions) {
      const meta = rmeta(r.id);
      let rf = 1 - 0.85 * (stats.refuse || 0);
      // distúrbios civis: cidades identificadas em colapso (>2% mortos) suspendem a campanha
      if (G.owned.includes('c_dist') && r.identified && meta.pop > 0 && r.dead / meta.pop > 0.02) rf *= 0.25;
      const rate = r.s * 0.024 * CFG.vaxMassRate * (0.4 + meta.science) * rf;
      const v = Math.min(r.s, rate);
      r.vaccinated += v; r.s -= v;
    }
    milestone('civ_unrest', G.owned.includes('c_dist') && G.regions.some(r => r.identified && rmeta(r.id).pop > 0 && r.dead / rmeta(r.id).pop > 0.02),
      'PRESS', 'Distúrbios civis suspendem vacinação em zonas em colapso', 'panic');
  }

  // adaptive humanity (bounded, SPEC §11.1/§11.2)
  if (!G.adapt.airportScreening && G.routeCounts.air > 10 && G.day > 20) {
    G.adapt.airportScreening = true;
    log('Humanity reforçou o controlo aeroportuário', 'humanity');
    news('AVIA-CIV', 'Rastreio térmico obrigatório em aeroportos internacionais', 'alert');
  }
  if (!G.adapt.boostInvestigation && G.day > 50 && stats.stealth > 0.35 && G.awareness < 20) {
    G.adapt.boostInvestigation = true;
    log('Humanity lançou uma investigação epidemiológica global', 'humanity');
    news('OMS', 'Investigação epidemiológica global lançada', 'alert');
  }

  // notícias ambientes — o mundo vive mesmo sem o jogador
  if (G.day >= G.nextAmbient) {
    G.nextAmbient = G.day + 5 + Math.floor(Math.random() * 5);
    const A = rmeta(REGIONS[Math.floor(Math.random() * REGIONS.length)].id).name;
    const B = rmeta(REGIONS[Math.floor(Math.random() * REGIONS.length)].id).name;
    const pool = G.stage >= 5 ? PANIC_NEWS : G.stage >= 2 ? MID_NEWS : CALM_NEWS;
    const tpl = pool[Math.floor(Math.random() * pool.length)];
    news(['WIRE', 'PRESS', 'RÁDIO'][Math.floor(Math.random() * 3)], tpl(A, B), 'wire');
  }

  // events
  if (!G.pendingEvent && G.day >= G.nextEventDay) {
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    G.pendingEvent = ev;
    log(`Evento: ${ev.name}`, 'event');
  }

  // win / loss — o objetivo é EXTINGUIR a humanidade (mortos >= frac do cenário; iron: 95% + colapso A2)
  const extFrac = (SCENARIOS[G.scenario] && SCENARIOS[G.scenario].extinctFrac) || EXTINCT_FRAC;
  if (totalI <= 0 && G.day > 20) return endGame(false, 'O AGENTE MORREU — a humanidade sobreviveu intacta.');
  if (totalDead >= extFrac * WORLD_POP) return endGame(true, 'EXTINÇÃO — a humanidade foi extinta.');
  if (totalI < 1e-4 && G.day > 30 && identified.length > 0) {
    G.eradic++;
    if (G.eradic >= ERADIC_DAYS) return endGame(false, 'ERRADICAÇÃO — o agente foi eliminado.');
  } else G.eradic = 0;
  const clockLimit = scMul('clock', CLOCK_LIMIT);
  if (G.day >= clockLimit) {
    const deadPct = (100 * totalDead / WORLD_POP).toFixed(1);
    return endGame(false, `A HUMANIDADE RESISTIU — ${deadPct}% eliminados, insuficiente.`);
  }
}

// ---- PONTUAÇÃO (0-1000) por jogo, com base nos KPIs do mesmo ----
// vitória(extinção) 350 · destruição(mortos%) 350 · contágio(infetados%) 100 ·
// rapidez 100 · eficiência(1 - fenótipos/40) 100  × multiplicador de dificuldade.
function scoreGame(win) {
  const clock = scMul('clock', CLOCK_LIMIT);
  const deadFrac = Math.min(1, G.regions.reduce((s, r) => s + r.dead, 0) / WORLD_POP);
  const cumFrac = Math.min(1, G.cumInf / WORLD_POP);
  const eff = Math.min(1, (G.owned.length + G.buildsTriggered.length) / 40);
  const parts = {
    extincao: win ? 350 : 0,
    destruicao: Math.round(350 * deadFrac),
    contagio: Math.round(100 * cumFrac),
    rapidez: win ? Math.round(100 * Math.max(0, 1 - G.day / clock)) : 0,
    eficiencia: Math.round(100 * deadFrac * (1 - eff)),
  };
  const diff = (G.scenario && SCENARIOS[G.scenario]) ? SCENARIOS[G.scenario].diff : 1;
  const mult = 1 + (diff - 1) * 0.15;
  const base = parts.extincao + parts.destruicao + parts.contagio + parts.rapidez + parts.eficiencia;
  const value = Math.round(Math.min(1000, base * mult));
  let label = 'SURTO CONTIDO';
  if (value >= 900) label = 'EXTINÇÃO TOTAL';
  else if (value >= 750) label = 'HOLOCAUSTO GLOBAL';
  else if (value >= 600) label = 'APOCALIPSE';
  else if (value >= 400) label = 'PANDEMIA GRAVE';
  else if (value >= 200) label = 'SURTO MUNDIAL';
  return { value, max: 1000, label, mult: Math.round(mult * 100) / 100, parts };
}

function endGame(win, reason) {
  G.phase = 'ended';
  const regionsHit = G.regions.filter(r => r.i > 0 || r.dead > 0 || r.identified).length;
  const score = scoreGame(win);
  G.result = {
    win, reason, day: G.day,
    cumInf: G.cumInf, dead: G.regions.reduce((s, r) => s + r.dead, 0),
    regions: regionsHit, nodes: G.owned.length, builds: G.buildsTriggered.length,
    worldPop: WORLD_POP, stage: STAGE_NAMES[G.stage], vaccine: G.vaccine,
    extinctFrac: (SCENARIOS[G.scenario] && SCENARIOS[G.scenario].extinctFrac) || EXTINCT_FRAC,
    score,
  };
  log(`FIM: ${reason} — score ${score.value}/1000 (${score.label})`, win ? 'win' : 'lose');
  dev.onEndGame(G);
}

// ---------- actions ----------
function doAction(body) {
  if (!body || !body.type) return { error: 'bad action' };
  switch (body.type) {
    case 'agent': {
      if (G.phase !== 'setup') return { error: 'not in setup' };   // sem trocas a meio da partida
      const a = AGENTS.find(x => x.id === body.agent);
      if (!a) return { error: 'bad agent' };
      AGENT_ID = a.id;
      if (G) { G.agent = a.id; G.stats = computeStats(G.owned, G.extraFx, a.effects); }
      log(`Agente selecionado: ${a.icon} ${a.name}`, 'player');
      return { ok: true, agent: a.id };
    }
    case 'seed': {
      if (G.phase !== 'setup') return { error: 'not in setup' };
      if (!G.scenario) return { error: 'choose a scenario first' };
      if (!rstate(body.region)) return { error: 'bad region' };
      G.startRegion = body.region;
      G.startedAt = Date.now();
      const sm = rmeta(body.region);
      const p0 = Math.min(sm.pop, Math.max(sm.pop * 0.0002, sm.pop * CFG.seedIFrac));
      rstate(body.region).i = p0; G.cumInf += p0;
      G.phase = 'running';
      log(`Paciente zero em ${rmeta(body.region).name}.`, 'player');
      dev.onSeed(G);
      dev.onSeedScenario(G.scenario);
      return { ok: true };
    }
    case 'evolve': {
      if (G.phase !== 'running') return { error: 'not running' };
      const n = NODES.find(x => x.id === body.node);
      if (!n) return { error: 'unknown node' };
      if (n.agentOnly && n.agentOnly !== G.agent) return { error: 'agent exclusive' };
      if (G.owned.includes(n.id)) return { error: 'already owned' };
      if (!n.req.every(r => G.owned.includes(r))) return { error: 'prerequisite missing' };
      const cost = Math.round(n.cost * G.stats.costMod);
      if (G.dna < cost) return { error: 'not enough DNA' };
      G.dna -= cost;
      G.owned.push(n.id);
      n.tags.forEach(t => G.tags.add(t));
      dev.onEvolve(G, n.id, cost);
      // emergent builds
      for (const b of BUILDS) {
        if (G.buildsTriggered.includes(b.id)) continue;
        if (b.all.every(t => G.tags.has(t)) && (!b.any || b.any.some(t => G.tags.has(t)))) {
          G.buildsTriggered.push(b.id);
          G.extraFx.push(...b.effects);
          log(`EMERGENT BUILD: ${b.name} — ${b.desc}`, 'build');
        }
      }
      G.stats = computeStats(G.owned, G.extraFx, (AGENTS.find(a => a.id === G.agent) || {}).effects);
      log(`Evolução: ${n.name} (-${cost} DNA)`, 'player');
      return { ok: true, dna: G.dna };
    }
    case 'eventChoice': {
      if (!G.pendingEvent) return { error: 'no event' };
      const opt = G.pendingEvent.options[body.option];
      if (!opt) return { error: 'bad option' };
      G.extraFx.push(...opt.effects);
      G.stats = computeStats(G.owned, G.extraFx, (AGENTS.find(a => a.id === G.agent) || {}).effects);
      log(`Evento ${G.pendingEvent.name}: ${opt.label} (${opt.desc})`, 'event');
      G.pendingEvent = null;
      G.nextEventDay = G.day + 35 + Math.floor(Math.random() * 20);
      dev.onEventChoice();
      return { ok: true };
    }
    case 'speed': {
      G.speed = [0, 1, 2, 4, 8].includes(body.value) ? body.value : G.speed;
      return { ok: true, speed: G.speed };
    }
    case 'newgame': {
      const sc = body.scenario && SCENARIOS[body.scenario] ? body.scenario : null;
      dev.onNewGame(G, sc);
      G = newGame(sc);
      return { ok: true, scenario: G.scenario };
    }
    default: return { error: 'unknown type' };
  }
}

// ---------- state export ----------
function publicState() {
  return {
    phase: G.phase, day: G.day, speed: G.speed,
    dna: Math.floor(G.dna), owned: G.owned, tags: [...G.tags],
    builds: G.buildsTriggered,
    world: {
      pop: WORLD_POP,
      infected: G.regions.reduce((s, r) => s + r.i, 0),
      cumInf: G.cumInf,
      dead: G.regions.reduce((s, r) => s + r.dead, 0),
    },
    humanity: {
      awareness: G.awareness, stage: G.stage, stageName: STAGE_NAMES[G.stage],
      vaccine: G.vaccine, identified: G.regions.filter(r => r.identified).length,
      adapt: G.adapt,
    },
    regions: G.regions.map(r => {
      const m = rmeta(r.id);
      return { id: r.id, name: m.name, lon: m.lon, lat: m.lat, pop: m.pop, density: m.density,
        climate: m.climate, healthcare: m.healthcare, science: m.science,
        airport: m.airport, port: m.port,
        i: r.i, s: r.s, dead: r.dead, detection: Math.min(100, r.detection),
        identified: r.identified, treatment: r.treatment, vaccinated: r.vaccinated };
    }),
    player: { costMod: G.stats.costMod, stealth: Math.round(G.stats.stealth * 100) / 100,
              zoon: Math.round(G.stats.zoon * 100) / 100, refuse: Math.round(G.stats.refuse * 100) / 100,
              detectMod: Math.round(G.stats.detectMod * 100) / 100, leth: Math.round(G.stats.leth * 10000) / 100,
              startRegion: G.startRegion },
    pendingEvent: G.pendingEvent ? {
      id: G.pendingEvent.id, name: G.pendingEvent.name, desc: G.pendingEvent.desc,
      options: G.pendingEvent.options.map(o => ({ label: o.label, desc: o.desc })),
    } : null,
    log: G.log.slice(-60),
    news: G.news.slice(-50),
    result: G.result,
    scenario: G.scenario,
    agent: (AGENTS.find(a => a.id === G.agent) || AGENTS[0]).id,
    scenarios: Object.values(SCENARIOS).filter(x => x.id !== 'standard'),
    meta: { nodes: NODES.filter(n => !n.agentOnly || n.agentOnly === G.agent), edges: EDGES, agents: AGENTS.map(a => ({ id: a.id, name: a.name, icon: a.icon, tag: a.tag, desc: a.desc })), stageNames: STAGE_NAMES,
            clockLimit: scMul('clock', CLOCK_LIMIT),
            extinctFrac: (SCENARIOS[G.scenario] && SCENARIOS[G.scenario].extinctFrac) || EXTINCT_FRAC, tickMs: TICK_MS },
  };
}

// ---------- sim test (headless bots, balance pacing) — decisões via lib/bot.cjs (A4) ----------
function simTest(strategy) {
  strategy = strategy || process.argv[3] || 'cheap';
  const scenIdx = process.argv.indexOf('--scenario');
  const scen = scenIdx > -1 ? process.argv[scenIdx + 1] : 'standard';
  G = newGame(SCENARIOS[scen] ? scen : 'standard');
  if (process.env.SIM_AGENT && AGENTS.find(x => x.id === process.env.SIM_AGENT)) doAction({ type: 'agent', agent: process.env.SIM_AGENT });
  let region;
  if (strategy === 'smart') {
    region = bot.seedPick(REGIONS);
  } else {
    region = REGIONS[Math.floor(Math.random() * REGIONS.length)].id;
  }
  doAction({ type: 'seed', region });
  let days = 0;
  const loopCap = (SCENARIOS[G.scenario] && SCENARIOS[G.scenario].clock || CLOCK_LIMIT) + 5;
  while (G.phase === 'running' && days < loopCap) {
    if (G.pendingEvent) doAction({ type: 'eventChoice', option: strategy === 'smart' ? 0 : Math.floor(Math.random() * 3) });
    const nid = bot.decide(strategy, {
      owned: new Set(G.owned), dna: G.dna, cumInf: G.cumInf, worldPop: WORLD_POP,
      costMod: G.stats.costMod,
      nodes: NODES.filter(n => !n.agentOnly || n.agentOnly === G.agent), // como o meta.nodes do jogo
      scenario: G.scenario,
    });
    if (nid) doAction({ type: 'evolve', node: nid });
    tick();
    days++;
    if (process.env.SIM_DEBUG && (days % 25 === 0 || G.phase !== 'running')) {
      const deadP = 100 * G.regions.reduce((z,x)=>z+x.dead,0) / WORLD_POP;
      const sr = G.regions.find(x=>x.id===G.startRegion);
      const top = G.regions.slice().sort((a,b)=>b.i-a.i)[0];
      const topM = top ? rmeta(top.id) : null;
      console.log('DBG|' + JSON.stringify({ day: G.day, deadPct: +deadP.toFixed(2), cumPct: +(100*G.cumInf/WORLD_POP).toFixed(1), infPct: +(100*(G.regions.reduce((s,x)=>s+x.i,0))/WORLD_POP).toFixed(1), nId: G.regions.filter(x=>x.identified).length, awareness: +G.awareness.toFixed(0), stage: G.stage, vaccine: +G.vaccine.toFixed(0), dna: +G.dna.toFixed(0), seedDet: sr ? +sr.detection.toFixed(0) : null, seedIFracPct: sr ? +(100*sr.i/(rmeta(sr.id)||{pop:1}).pop).toFixed(2) : null, topI: top ? +top.i.toFixed(3)+'M' : null, topDet: top ? +top.detection.toFixed(0) : null, topName: topM ? topM.name : null }));
    }
  }
  const r = G.result || { win: null, reason: 'timeout/crash', day: days };
  console.log(JSON.stringify({
    strategy, start: G.startRegion,
    result: r.reason, win: r.win, day: r.day,
    cumInfPct: +(100 * (r.cumInf || 0) / WORLD_POP).toFixed(2),
    deadPct: +(100 * (r.dead || 0) / WORLD_POP).toFixed(2),
    regions: r.regions, nodes: r.nodes, builds: r.builds, stage: r.stage, vaccine: +(r.vaccine || 0).toFixed(1),
    score: r.score ? r.score.value : null,
  }));
}

if (process.argv.includes('--simtest') && require.main === module) { simTest(); process.exit(0); }

// ---------- HTTP server ----------
// C1 — SESSÕES: cada visitante tem o seu próprio mundo (cookie pev_sid ou ?sid=).
// O motor continua a usar o global G (scratch); cada handler liga G ao jogo da sessão.
const crypto = require('crypto');
const SESS = new Map();                 // sid -> { id, agent, game, lastSeen, sse:Set, acts:[] }
const SESS_MAX = 96;
const SAVE_FILE = process.env.SAVE_FILE || path.join(os.tmpdir(), 'pevo-world-save.json');
let _lastSave = 0;

function sidOf(url, req) {
  const q = url.searchParams.get('sid');
  if (q && /^[A-Za-z0-9_-]{4,64}$/.test(q)) return 'q_' + q;
  const c = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('pev_sid='));
  if (c) { const v = c.slice(8); if (v) return v; }
  return null;
}
function ensureSession(url, req, res) {
  let sid = sidOf(url, req);
  if (sid && SESS.has(sid)) { const s = SESS.get(sid); s.lastSeen = Date.now(); return s; }
  sid = sid || 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const s = { id: sid, agent: AGENT_ID, game: null, lastSeen: Date.now(), sse: new Set(), acts: [] };
  SESS.set(sid, s);
  if (SESS.size > SESS_MAX) {
    let old = null;
    for (const x of SESS.values()) if (!x.sse.size && (!old || x.lastSeen < old.lastSeen)) old = x;
    if (old) SESS.delete(old.id);
  }
  try { res.setHeader('Set-Cookie', `pev_sid=${sid}; Path=/; Max-Age=604800; SameSite=Lax`); } catch (_) {}
  return s;
}
function freshGame(agent, scenario) { AGENT_ID = agent; return newGame(scenario); }
function bindSessionGame(s) {
  if (!s.game) s.game = freshGame(s.agent, null);   // primeira visita: mundo próprio, agente da sessão
  G = s.game;
}
function ssePush(s) {
  if (!s.game || !s.sse || !s.sse.size) return;
  G = s.game;
  const data = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const res of s.sse) { try { res.write(data); } catch (_) {} }
}
function eachClient(fn) { for (const s of SESS.values()) for (const res of (s.sse || [])) { try { fn(res); } catch (_) {} } }

// ---------- A1: snapshot do mundo (crash-safe, C2-ready) ----------
function snapshotWorld() {
  try {
    const out = { t: Date.now(), v: 1, sessions: [] };
    for (const s of SESS.values()) {
      if (!s.game) continue;
      out.sessions.push({ id: s.id, agent: s.agent,
        g: JSON.parse(JSON.stringify(s.game, (k, v) => (k === 'tags' && v instanceof Set) ? [...v] : v)) });
    }
    if (!out.sessions.length) return;
    fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
    fs.writeFileSync(SAVE_FILE, JSON.stringify(out));
  } catch (_) {}
}
function maybeSave(force) {
  const now = Date.now();
  if (force || now - _lastSave > 15000) { _lastSave = now; snapshotWorld(); }
}
function restoreWorld() {
  try {
    const raw = fs.readFileSync(SAVE_FILE, 'utf8');
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return;
    let n = 0;
    for (const e of (d.sessions || [])) {
      if (!e || !e.g || SESS.has(e.id) || SESS.size >= SESS_MAX) continue;
      const g = newGame(SCENARIOS[e.g.scenario] ? e.g.scenario : null);
      Object.assign(g, e.g);
      g.tags = new Set(Array.isArray(e.g.tags) ? e.g.tags : []);
      g.sc = (e.g.scenario && SCENARIOS[e.g.scenario]) || null;
      SESS.set(e.id, { id: e.id, agent: e.agent || 'bacteria', game: g, lastSeen: Date.now(), sse: new Set(), acts: [] });
      n++;
    }
    if (n) console.log(`[world] restauradas ${n} sessões de ${SAVE_FILE}`);
  } catch (_) { console.log('[world] sem snapshot anterior'); }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  dev.countReq(req, res, url);

  if (req.method === 'GET' && url.pathname === '/dev') {
    if (!dev.authOk(req, url)) { res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('401 — DEV_ACCESS_KEY necessário (?key=…)'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'dev.html')));
  }
  if (url.pathname.startsWith('/api/dev')) {
    dev.apiRoute(req, res, url).catch(err => {
      try { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String(err && err.message || err) })); } catch (_) {}
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/world.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'world.js')));
  }
  if (req.method === 'GET' && url.pathname.startsWith('/fonts/')) {
    const name = path.basename(url.pathname);
    try {
      res.writeHead(200, { 'Content-Type': 'font/woff2', 'Cache-Control': 'public, max-age=86400' });
      return res.end(fs.readFileSync(path.join(__dirname, 'public', 'fonts', name)));
    } catch (_) { res.writeHead(404); return res.end(); }
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/home')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'home.html')));
  }
  if (req.method === 'GET' && url.pathname === '/play') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
  }

  const s = ensureSession(url, req, res);
  if (req.method === 'GET' && url.pathname === '/state') {
    bindSessionGame(s);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(publicState()));
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    bindSessionGame(s);
    s.sse.add(res);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify(publicState())}\n\n`);
    dev.sseOpen(req, res);
    req.on('close', () => { s.sse.delete(res); });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/action') {
    // rate limit leve por sessão (anti-DoS)
    const now = Date.now();
    s.acts = s.acts.filter(t => now - t < 10000);
    if (s.acts.length > 60) { res.writeHead(429, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'rate limited' })); }
    s.acts.push(now);
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const b = JSON.parse(body || '{}');
        let out;
        if (b.type === 'newgame') {
          const sc = b.scenario && SCENARIOS[b.scenario] ? b.scenario : null;
          const old = s.game;
          if (old) dev.onNewGame(old, sc);
          s.game = freshGame(s.agent, sc);
          G = s.game;
          out = { ok: true, scenario: G.scenario };
        } else {
          if (!s.game) bindSessionGame(s);
          G = s.game;
          out = doAction(b);
          if (out && out.ok && b.type === 'agent') s.agent = b.agent;
        }
        ssePush(s);
        maybeSave(false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad request' }));
      }
    });
    return;
  }
  res.writeHead(404); res.end('not found');
});

G = newGame();

if (require.main === module) {
  dev.start();
  restoreWorld();
  setInterval(() => {
    for (const s of SESS.values()) {
      const g = s.game;
      if (!g) continue;
      G = g;
      if (g.phase === 'running' && !g.pendingEvent) {
        g.acc += 500 * g.speed;
        const t0 = Date.now();
        let ran = false;
        while (g.acc >= TICK_MS) { tick(); ran = true; g.acc -= TICK_MS; if (g.phase !== 'running') break; }
        if (ran) { dev.loopMs(Date.now() - t0); dev.tickMark(); }
      }
      ssePush(s);
    }
    maybeSave(false);
  }, 500);
  setInterval(() => { eachClient(res => { try { res.write(': hb\n\n'); } catch (_) {} }); }, 15000);

  // A1 — crash: snapshot imediato antes de morrer (Render reinicia e restaura)
  process.on('uncaughtException', err => {
    console.error('[fatal]', err && err.stack || err);
    try { snapshotWorld(); } catch (_) {}
    process.exit(1);
  });
  process.on('unhandledRejection', err => { console.error('[unhandledRejection]', err && (err.stack || err.message || err)); });
  process.once('SIGTERM', () => { maybeSave(true); dev.save(); process.exit(0); });
  process.once('SIGINT', () => { maybeSave(true); dev.save(); process.exit(0); });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Pandemic Evolution vertical slice on http://0.0.0.0:${PORT}`);
  });
}

module.exports = { newGame, doAction, tick, publicState, simTest, getGame: () => G, setGame: g => { G = g; }, sessions: SESS };
