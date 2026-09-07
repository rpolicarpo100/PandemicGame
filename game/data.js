// PANDEMIC EVOLUTION — Vertical Slice data
// Regions are fictional (SPEC v1.2 §12.1). All pops in millions.

const R = (id, name, lon, lat, pop, density, climate, healthcare, science, economy, mobility, airport, port) =>
  ({ id, name, lon, lat, pop, density, climate, healthcare, science, economy, mobility, airport, port });

// Regiões fictícias colocadas sobre geografia real (inspiração: clima/demografia do mundo real).
const REGIONS = [
  // Cluster do norte (inspiração nórdica/báltica)
  R('norvhaven', 'Norvhaven',   10,  61,  32, 0.35, 'cold',      0.85, 0.80, 0.80, 0.60, true,  true),
  R('skeldmark', 'Skeldmark',   17,  60,  21, 0.30, 'cold',      0.80, 0.75, 0.70, 0.55, true,  false),
  R('ostreja',   'Ostreja',     25,  57,  44, 0.55, 'temperate', 0.82, 0.78, 0.75, 0.65, true,  true),
  R('kralen',    'Kralen',      31,  52,  58, 0.60, 'temperate', 0.78, 0.72, 0.70, 0.62, true,  false),
  R('vantia',    'Vantia',       2,  47,  39, 0.50, 'temperate', 0.80, 0.74, 0.72, 0.58, false, true),
  R('bremia',    'Brémia',      10,  51,  27, 0.45, 'temperate', 0.76, 0.70, 0.68, 0.55, false, true),
  // Cluster ocidental (inspiração americana)
  R('avelorn',   'Avelorn',    -77,  39, 118, 0.65, 'temperate', 0.88, 0.90, 0.90, 0.75, true,  true),
  R('calthera',  'Calthera',   -90,  40,  86, 0.60, 'temperate', 0.82, 0.80, 0.80, 0.70, true,  false),
  R('duscade',   'Duscade',   -102,  24,  41, 0.40, 'hot',       0.70, 0.65, 0.60, 0.55, false, true),
  R('solvane',   'Solvane',    -85,  31,  63, 0.55, 'hot',       0.72, 0.68, 0.66, 0.60, true,  false),
  R('meridia',   'Meridia',    -72,  19,  29, 0.35, 'hot',       0.60, 0.55, 0.50, 0.45, false, true),
  // Continente sul (inspiração sul-americana/africana)
  R('andavara',  'Andavara',   -74,   5,  74, 0.50, 'hot',       0.45, 0.40, 0.42, 0.50, true,  false),
  R('puermila',  'Puermila',   -52,  -6,  96, 0.55, 'humid',     0.40, 0.38, 0.36, 0.48, true,  true),
  R('sambrez',   'Sambrez',    -58, -16,  52, 0.45, 'humid',     0.42, 0.40, 0.38, 0.45, false, true),
  R('zambira',   'Zambira',      8,   9, 132, 0.60, 'hot',       0.38, 0.35, 0.34, 0.52, true,  false),
  R('kharo',     'Kharo',       20,  13,  68, 0.50, 'arid',      0.35, 0.32, 0.30, 0.40, false, false),
  R('nyala',     'Nyala',       22,  -4,  47, 0.40, 'humid',     0.33, 0.30, 0.30, 0.38, false, true),
  R('thulba',    'Thulba',      18, -24,  24, 0.30, 'arid',      0.30, 0.28, 0.26, 0.35, false, false),
  // Cintura árida (inspiração médio-oriente)
  R('qorazan',   'Qorazan',     53,  33,  55, 0.50, 'arid',      0.55, 0.50, 0.55, 0.58, true,  false),
  R('dreshar',   'Dreshar',     45,  24,  38, 0.45, 'arid',      0.52, 0.48, 0.46, 0.50, false, true),
  R('halumir',   'Halumir',     37,  31,  30, 0.40, 'arid',      0.48, 0.44, 0.42, 0.46, false, false),
  // Cluster oriental (inspiração asiática)
  R('xinmara',   'Xinmara',    116,  34, 220, 0.75, 'temperate', 0.70, 0.72, 0.75, 0.72, true,  true),
  R('kaolto',    'Kaalto',     105,  50,  96, 0.60, 'cold',      0.68, 0.70, 0.66, 0.60, true,  false),
  R('reigan',    'Reigan',     139,  36,  74, 0.70, 'temperate', 0.80, 0.85, 0.82, 0.70, true,  true),
  R('velharan',  'Velharan',    78,  22, 380, 0.85, 'hot',       0.55, 0.58, 0.56, 0.65, true,  false),
  R('orunesh',   'Orunesh',    105,  16, 150, 0.70, 'humid',     0.58, 0.55, 0.52, 0.60, true,  true),
  R('tamuraq',   'Tamuraq',    122,  14,  62, 0.55, 'hot',       0.50, 0.48, 0.45, 0.50, false, true),
  // Sudeste (inspiração indonésia/oceânia)
  R('malvira',   'Malvira',    110,  -7, 105, 0.65, 'humid',     0.48, 0.45, 0.44, 0.55, true,  false),
  R('chenbara',  'Chenbara',   143,  -6,  88, 0.60, 'humid',     0.45, 0.42, 0.40, 0.50, false, true),
  R('indova',    'Indova',     133, -14,  59, 0.50, 'hot',       0.42, 0.40, 0.38, 0.46, false, false),
  // Oceânia
  R('sorellia',  'Sorellia',   148, -33,  18, 0.40, 'temperate', 0.78, 0.75, 0.72, 0.60, true,  true),
  R('vanatoo',   'Vanatoo',    172, -41,   8, 0.30, 'humid',     0.60, 0.55, 0.52, 0.45, false, true),
  R('kirith',    'Kirith',     178, -17,   5, 0.25, 'hot',       0.55, 0.50, 0.48, 0.40, false, true),
  // Extras
  R('lumeria',   'Lumeria',     12,  43,  49, 0.50, 'temperate', 0.72, 0.68, 0.64, 0.58, true,  false),
  R('siborak',   'Siborak',     75,  62,  36, 0.25, 'cold',      0.60, 0.62, 0.58, 0.45, false, false),
  R('novyara',   'Novyara',     45,  58,  66, 0.50, 'cold',      0.65, 0.66, 0.62, 0.55, true,  false),
];

// ---------- EVOLUTION NODES ----------
// effect keys: trans, leth, stealth(+), cureResist(+), cross, dnaGain, costMod,
//              detectMod, dense, sparse, climate.<c>, incub(flag)

const N = (id, name, tree, cost, req, effects, tags, desc) =>
  ({ id, name, tree, cost, req, effects, tags, desc });

const NODES = [
  // TRANSMISSION
  N('t_air1',   'Airborne I',        'transmission', 60,  [],            [{k:'trans',mul:1.20},{k:'detectMod',mul:1.10}], ['airborne'], 'Aerossóis básicos. +20% transmissão, +10% deteção.'),
  N('t_air2',   'Airborne II',       'transmission', 110, ['t_air1'],    [{k:'trans',mul:1.25},{k:'detectMod',mul:1.15}], ['airborne','fast'], 'Aerossóis avançados. +25% transmissão, +15% deteção.'),
  N('t_water1', 'Waterborne',        'transmission', 55,  [],            [{k:'trans',mul:1.12},{k:'climate.humid',mul:1.15},{k:'detectMod',mul:1.05}], ['water'], 'Contamina hídrica. +12% transmissão, melhor em climas húmidos.'),
  N('t_surface1','Surface Persistence','transmission', 50, [],            [{k:'trans',mul:1.10},{k:'cureResist',add:0.10}], ['surface','resistance'], 'Sobrevive em superfícies. +10% transmissão, +10% resistência.'),
  N('t_vector1','Vector I',          'transmission', 60,  [],            [{k:'trans',mul:1.12},{k:'climate.hot',mul:1.15},{k:'detectMod',mul:1.05}], ['vector'], 'Insetos vetores. Melhor em climas quentes.'),
  N('t_animal1','Animal Reservoir',  'transmission', 65,  [],            [{k:'trans',mul:1.10},{k:'stealth',add:0.10}], ['animal','stealth'], 'Reservatório animal. +10% transmissão, +10% stealth.'),
  N('t_mob1',   'High Mobility',     'transmission', 90,  [],            [{k:'cross',mul:1.40},{k:'detectMod',mul:1.20}], ['mobility','fast'], 'Propagação entre regiões +40%, +20% deteção.'),
  N('t_contact1','Human Contact',    'transmission', 55,  [],            [{k:'trans',mul:1.12},{k:'dense',mul:1.15}], ['contact','urban'], 'Contacto próximo. Melhor em regiões densas.'),
  // ADAPTATION
  N('a_heat',   'Heat Resistance',   'adaptation', 40, [], [{k:'climate.hot',mul:1.35}], ['heat'], 'Climas quentes +30%.'),
  N('a_cold',   'Cold Resistance',   'adaptation', 40, [], [{k:'climate.cold',mul:1.40}], ['cold'], 'Climas frios +30%.'),
  N('a_dry',    'Dry Resistance',    'adaptation', 35, [], [{k:'climate.arid',mul:1.40}], ['dry'], 'Climas áridos +30%.'),
  N('a_humid',  'Humidity Thrive',   'adaptation', 35, [], [{k:'climate.humid',mul:1.30}], ['humid_adapt'], 'Climas húmidos +30%.'),
  N('a_urban',  'Urban Adaptation',  'adaptation', 50, [], [{k:'dense',mul:1.25}], ['urban'], 'Regiões densas +25%.'),
  N('a_rural',  'Rural Adaptation',  'adaptation', 50, [], [{k:'sparse',mul:1.30}], ['rural'], 'Regiões pouco densas +30%.'),
  N('a_extreme','Extreme Environment','adaptation', 95, [], [{k:'climate.hot',mul:1.10},{k:'climate.cold',mul:1.10},{k:'climate.arid',mul:1.10},{k:'climate.humid',mul:1.10}], ['extreme','resistance'], 'Todos os climas +10%.'),
  N('a_res1',   'Resistance I',      'adaptation', 60, [], [{k:'cureResist',add:0.20}], ['resistance'], 'Resiste 20% melhor a tratamentos.'),
  N('a_res2',   'Resistance II',     'adaptation', 120, ['a_res1'], [{k:'cureResist',add:0.25}], ['resistance'], 'Resiste +25% melhor a tratamentos.'),
  // LETHALITY
  N('l_resp',   'Respiratory Damage','lethality', 70, [], [{k:'leth',mul:1.35},{k:'trans',mul:1.08},{k:'detectMod',mul:1.15}], ['lethal','respiratory'], 'Tosse/sintomas visíveis. +letalidade, +transmissão, +deteção.'),
  N('l_organ',  'Organ Damage',      'lethality', 90, [], [{k:'leth',mul:1.50},{k:'detectMod',mul:1.10}], ['lethal'], 'Falência orgânica progressiva.'),
  N('l_neuro',  'Neurological',      'lethality', 100, [], [{k:'leth',mul:1.40},{k:'detectMod',mul:1.20}], ['lethal','neuro'], 'Danos neurológicos. Muito visível.'),
  N('l_systemic','Systemic Failure', 'lethality', 150, ['l_organ'], [{k:'leth',mul:1.60},{k:'detectMod',mul:1.25}], ['lethal','systemic'], 'Colapso sistémico.'),
  N('l_collapse','Rapid Collapse',   'lethality', 220, ['l_systemic'], [{k:'leth',mul:1.90},{k:'trans',mul:0.80},{k:'detectMod',mul:1.40}], ['lethal','collapse'], 'Morte rápida. Menos transmissão, muito visível.'),
  // MUTATION
  N('m_rate',   'Mutation Rate',     'mutation', 60, [], [{k:'trans',mul:1.06},{k:'dnaGain',mul:1.10}], ['mutation'], 'Deriva genética constante.'),
  N('m_burst',  'Mutation Burst',    'mutation', 80, [], [{k:'trans',mul:1.10},{k:'detectMod',mul:1.10}], ['mutation','burst'], 'Surto de mutações visíveis.'),
  N('m_adaptive','Adaptive Mutation','mutation', 90, [], [{k:'costMod',mul:0.90}], ['mutation','adaptive'], 'Evoluções 10% mais baratas.'),
  N('m_controlled','Controlled Mutation','mutation', 100, ['m_rate'], [{k:'costMod',mul:0.88},{k:'dnaGain',mul:1.12}], ['mutation','controlled'], 'Mutações dirigidas.'),
  // STEALTH
  N('s_asym',   'Asymptomatic',      'stealth', 70, [], [{k:'stealth',add:0.25},{k:'detectMod',mul:0.85}], ['stealth','asymptomatic'], 'Infeções sem sintomas.'),
  N('s_incub',  'Long Incubation',   'stealth', 75, [], [{k:'stealth',add:0.15},{k:'incub',add:1},{k:'detectMod',mul:0.90}], ['stealth','long_incubation'], 'Incubação longa. Deteção reduzida nos primeiros 60 dias.'),
  N('s_misdiag','Misdiagnosis',      'stealth', 85, [], [{k:'detectMod',mul:0.75}], ['stealth','misdiagnosis'], 'Casos confundidos com outras doenças.'),
  N('s_hidden', 'Hidden Spread',     'stealth', 95, [], [{k:'stealth',add:0.30},{k:'trans',mul:0.90}], ['stealth','hidden'], 'Propagação silenciosa, menos agressiva.'),
  N('s_lowdet', 'Low Detection',     'stealth', 65, [], [{k:'detectMod',mul:0.80}], ['stealth','low_detection'], 'Deteção laboratorial difícil.'),
  // SPECIALIZATION (Virus)
  N('sp_rapid', 'Rapid Replication', 'specialization', 100, [], [{k:'trans',mul:1.15},{k:'dnaGain',mul:1.15}], ['virus','fast'], 'Replicação viral acelerada.'),
  N('sp_capsid','Capsid Hardening',  'specialization', 80,  [], [{k:'cureResist',add:0.20},{k:'climate.temperate',mul:1.10}], ['virus','resistance'], 'Cápside resistente.'),
  N('sp_load',  'Viral Load',        'specialization', 110, [], [{k:'leth',mul:1.25},{k:'trans',mul:1.10},{k:'detectMod',mul:1.10}], ['virus','lethal'], 'Carga viral elevada.'),
  // ULTIMATE
  N('u_shadow', 'SHADOW PROTOCOL',   'ultimate', 260, ['s_asym','s_incub'], [{k:'stealth',add:0.25},{k:'trans',mul:1.10},{k:'detectMod',mul:0.70}], ['ultimate','stealth'], 'O agente torna-se quase indetetável.'),
  N('u_collapse','GLOBAL COLLAPSE',  'ultimate', 300, ['l_systemic'], [{k:'leth',mul:1.80},{k:'trans',mul:1.15},{k:'detectMod',mul:1.30}], ['ultimate','lethal','collapse'], 'Letalidade extrema à escala global.'),
  N('u_immortal','IMMORTAL STRAIN',  'ultimate', 280, ['a_res2'], [{k:'cureResist',add:0.30},{k:'detectMod',mul:0.85}], ['ultimate','resistance'], 'Praticamente impossível de tratar.'),
];

// ---------- EMERGENT BUILDS (tag rule engine, SPEC §8.1) ----------
const BUILDS = [
  { id:'shadow_spread', name:'SHADOW SPREAD', all:['long_incubation','asymptomatic','airborne','mobility'],
    effects:[{k:'detectMod',mul:0.80},{k:'trans',mul:1.10}],
    desc:'Incubação longa + assintomático + aéreo + mobilidade. Espalha sem ser visto.' },
  { id:'global_collapse', name:'GLOBAL COLLAPSE', all:['lethal','collapse','mutation'],
    effects:[{k:'leth',mul:1.25},{k:'trans',mul:1.10}],
    desc:'Letalidade extrema + mutação rápida. Colapso à vista de todos.' },
  { id:'immortal', name:'IMMORTAL', all:['resistance','low_detection'], any:['heat','cold','dry','extreme'],
    effects:[{k:'cureResist',add:0.20},{k:'detectMod',mul:0.85}],
    desc:'Resistência + baixa deteção + adaptação climática. Nada o detém.' },
  { id:'vector_storm', name:'VECTOR STORM', all:['vector','airborne'],
    effects:[{k:'cross',mul:1.25}],
    desc:'Vetores + aerossóis. Tempestade de contágio entre regiões.' },
  { id:'silent_tide', name:'SILENT TIDE', all:['water','stealth'],
    effects:[{k:'climate.humid',mul:1.20},{k:'detectMod',mul:0.90}],
    desc:'Água + stealth. Maré invisível.' },
  { id:'urban_plague', name:'URBAN PLAGUE', all:['contact','urban'],
    effects:[{k:'dense',mul:1.30}],
    desc:'Contacto + adaptação urbana. As megacidades são o teu terreno.' },
];

// ---------- EVOLUTION EVENTS (SPEC §9) ----------
const EVENTS = [
  { id:'ev_surge', name:'Mutation Surge', desc:'Uma vaga de mutações instabiliza o genoma. Escolhe o caminho:',
    options:[
      { label:'Agressiva', desc:'+40% transmissão, +25% deteção', effects:[{k:'trans',mul:1.40},{k:'detectMod',mul:1.25}] },
      { label:'Silenciosa', desc:'+20% stealth, -15% transmissão', effects:[{k:'stealth',add:0.20},{k:'trans',mul:0.85}] },
      { label:'Resistente', desc:'+25% resistência, +10% custo evolutivo', effects:[{k:'cureResist',add:0.25},{k:'costMod',mul:1.10}] },
    ]},
  { id:'ev_host', name:'Host Jump', desc:'O agente encontra uma nova via de expansão:',
    options:[
      { label:'Rotas globais', desc:'+50% propagação entre regiões, +20% deteção', effects:[{k:'cross',mul:1.50},{k:'detectMod',mul:1.20}] },
      { label:'Clima extremo', desc:'+25% em climas frios e quentes', effects:[{k:'climate.cold',mul:1.25},{k:'climate.hot',mul:1.25}] },
      { label:'Eficiência', desc:'+30% ganho de DNA, -20% letalidade', effects:[{k:'dnaGain',mul:1.30},{k:'leth',mul:0.80}] },
    ]},
  { id:'ev_immune', name:'Immune Pressure', desc:'Os sistemas imunitários começam a reconhecer o agente:',
    options:[
      { label:'Evasão total', desc:'+30% resistência a tratamentos', effects:[{k:'cureResist',add:0.30}] },
      { label:'Disfarce', desc:'-30% deteção, -10% transmissão', effects:[{k:'detectMod',mul:0.70},{k:'trans',mul:0.90}] },
      { label:'Contra-ataque', desc:'+30% letalidade, +30% deteção', effects:[{k:'leth',mul:1.30},{k:'detectMod',mul:1.30}] },
    ]},
];

module.exports = { REGIONS, NODES, BUILDS, EVENTS };
