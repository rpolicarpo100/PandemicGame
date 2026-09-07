// PANDEMIC EVOLUTION — bot partilhado (A4)
// Única fonte da política de compra dos bots de teste/balance:
//  - game/server.js --simtest (balance, agents, e2e headless)
//  - qa/e2e-game.mjs (partida real via HTTP)
//  - qa/agents.mjs (corridas por agente)
// CommonJS (.cjs) para poder ser require() pelo server (CJS) e importado pelos QA (.mjs).
// Funções puras: recebem o estado (via argumentos) e devolvem um id de nó ou null.

// prioridade de expansão (barata -> cara); ordem calibrada nas rondas de balance
const SMART_PRIO = ['t_mob1','a_heat','a_cold','t_air1','s_incub','s_asym','m_rate','a_humid','a_dry',
  'a_urban','sp_rapid','s_lowdet','t_air2','t_contact1','t_water1','m_adaptive','a_extreme','m_controlled',
  't_animal1','t_vector1','a_rural','c_buzz','v_aves','c_dist','v_livestock','c_neg','v_insetos','v_master','c_anarchy'];

// cadeia letal (objetivo EXTINÇÃO) — ordem por retorno letalidade/custo
const LETH_PRIO = ['l_resp', 'l_organ', 'l_systemic', 'u_collapse', 'sp_load', 'l_collapse', 'l_neuro'];

// que fração da humanidade infetada dispara a fase letal
const lethPhaseAt = scenario => (scenario === 'iron' ? 0.50 : 0.45);
// margem de segurança sobre o custo (com mod. de custo do agente)
const buf = (cost, costMod) => Math.round(cost * (costMod || 1)) + 10;

const affordable = (n, owned, dna, cm) =>
  n && !owned.has(n.id) && n.req.every(r => owned.has(r)) && dna >= buf(n.cost, cm);

// estratégia 'smart' (usada em simtest + e2e): expansão barata; aos X% infetados vira a cadeia letal.
// opts: { owned:Set, dna, cumInf, worldPop, costMod, nodes (lista já filtrada p/ agente), scenario }
function smart(opts) {
  const { owned, dna, nodes } = opts;
  const cm = opts.costMod || 1;
  const cumF = (opts.worldPop > 0) ? (opts.cumInf || 0) / opts.worldPop : 0;
  const find = ids => ids.find(id => {
    const n = nodes.find(x => x.id === id);
    return affordable(n, owned, dna, cm);
  });
  if (cumF >= lethPhaseAt(opts.scenario)) {
    const l = find(LETH_PRIO);
    if (l) return l;
  }
  const p = find(SMART_PRIO);
  if (p) return p;
  const cheap = nodes.filter(x => !owned.has(x.id) && x.req.every(r => owned.has(r)))
    .sort((a, b) => a.cost - b.cost)[0];
  if (cheap && dna >= buf(cheap.cost, cm) + 5) return cheap.id;
  return null;
}

// estratégia 'cheap': compra sempre o nó disponível mais barato
function cheap(opts) {
  const { owned, dna, nodes } = opts;
  const cm = opts.costMod || 1;
  const a = nodes.filter(x => !owned.has(x.id) && x.req.every(r => owned.has(r)))
    .sort((a, b) => a.cost - b.cost)[0];
  if (a && dna >= buf(a.cost, cm) + 5) return a.id;
  return null;
}

// estratégia 'dumb': nunca compra nada
const dumb = () => null;

const decide = (strategy, opts) => {
  if (strategy === 'smart') return smart(opts);
  if (strategy === 'cheap') return cheap(opts);
  return null;
};

// decisão de seed da 'smart': grande cidade temperada/húmida com aeroporto (aleatório top-3)
function seedPick(regions, rand = Math.random) {
  const cands = regions.filter(r => (r.climate === 'temperate' || r.climate === 'humid') && r.airport)
    .sort((a, b) => b.pop - a.pop);
  const top = Math.min(3, cands.length);
  return top ? cands[Math.floor(rand() * top)].id : null;
}

module.exports = { SMART_PRIO, LETH_PRIO, decide, smart, cheap, dumb, seedPick, lethPhaseAt };
