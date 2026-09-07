# PANDEMIC EVOLUTION

## MASTER GAME, GAMEPLAY, WEB3 & ECONOMY SPECIFICATION — v1.1

**Status:** Master Design Specification (revista)
**Versão:** 1.2 — 2026-09-07
**Blockchain:** Solana
**Primary Currency:** USDC
**Platform:** Web
**Genre:** Global Strategy / Simulation / PvP / PvE / Web3
**Business Model:** Free-to-Play (sem wallet) + Web3 Economy com hold gate de 10k $PEVO
**Core Principle:** GAME FIRST → COMPETITION → RETENTION → WEB3 → ECONOMY

> **Nota v1.2:** o esboço económico do fundador foi integrado (token com hold gate, modos de stake PvE/PvP, distribuição de fees por 5 wallets, nomes de perfil animados) — detalhe em `ECONOMY-v1.0.md` e §60. A modelação económica fina (supply do token, RTP, parâmetros) permanece adiada. As decisões de game design da v1.1 mantêm-se.

---

## CHANGELOG v1.1 → v1.2

Integração do esboço económico do fundador (`ECONOMY-v1.0.md`):

| ID | Decisão fechada |
|----|-----------------|
| E1 | Conectar wallet exige **hold de 10.000 $PEVO**; sem hold, o jogo mostra o endereço do token para compra. Sem wallet conectada o jogo continua jogável em modos sem stake (§60.1). |
| E2 | Payouts PvE: modelo **híbrido** — pool RTP como base + reforço da W-REWARDS para eventos/seasons com orçamento (§60.2). |
| E3 | Referral: **W-REFERRAL recebe 10% dos fees**; o referenciador recebe 10% dos fees do referido; sem referenciador/não reclamado → W-TREASURY (§26, §27). |
| E4 | Distribuição dos fees: **Referral 10% · Rewards 30% · Treasury 25% · Reserve 20% · Marketing 15%** (§31). |

Outras alterações:

* princípio #12 ("USDC before proprietary token") **revogado** — token existe no launch com utilidades reais (§38);
* modos com stake detalhados em §60 (PvE stake, PvP stake, nomes de perfil animados);
* gates legais reforçados: stake é 18+ com geofencing; token com gate MiCA antes de venda primária;
* receita de venda primária de tokens e compras com tokens → W-TREASURY direto.

## CHANGELOG v1.0 → v1.1

### Contradições resolvidas

| # | Conflito v1.0 | Resolução | Onde |
|---|---------------|-----------|------|
| C1 | "Nunca apagar histórico económico" vs. GDPR | Ledger pseudónimo imutável; PII com retenção e apagável | §46 |
| C2 | Trophies negociáveis vs. reputação non-transferable | Classificação soulbound vs. comemorativo | §20 |
| C3 | Zero pay-to-win vs. assets negociáveis com efeito indefinido | Regra absoluta: assets Web3 nunca tocam no gameplay competitivo | §20, §36 |
| C4 | Pool de torneio vs. tabela de distribuição de receita | Contabilidades separadas: entradas = pass-through; fee = receita | §33 |
| C5 | "Receita elegível" de referral indefinida | Lista provisória definida (revisitada na modelação económica) | §26 |
| C6 | Tabela de receita não refletia o fallback referral→Treasury | Linha "Referral-or-Treasury" explícita | §31 |

### Secções novas

- §14 MODELO TEMPORAL E ESTRUTURA DA PARTIDA
- §15 CONDIÇÕES DE VITÓRIA E DERROTA
- §59 TRABALHO EM ABERTO

### Secções renumeradas

A numeração das secções foi ajustada; o conteúdo da v1.0 mantém-se, salvo marcação **[v1.1]** nas alterações.

---

## DECISION LOG v1.1

Decisões tomadas com base na revisão crítica (`REVIEW.md`). Todas marcadas como **reversíveis**, exceto onde indicado.

| ID | Tema | Decisão | Nota |
|----|------|---------|------|
| D1 | Modelo temporal | Simulação por **ticks simultâneos** (3 s/tick), com fila de ações | Base para sync, reconnect, anti-cheat, spectators |
| D2 | Vitória/derrota | Condições formais por modo | §15; números = parâmetros de balance |
| D3 | Duração de partida | PvP 15–25 min reais; PvE 10–30 min | Parâmetros de balance |
| D4 | Assets vs. gameplay | **Zero efeito de gameplay** de qualquer asset Web3 em modos competitivos | IRREVERSÍVEL (princípio) |
| D5 | Receita elegível (referral) | Lista provisória; revista na modelação económica | §26 |
| D6 | Wallet | **Embedded wallet** com custódia progressiva e exportação para self-custody | Gate jurídica antes da Phase 7 |
| D7 | Regiões | **Fictícias** (inspiradas em geografia real); 36 regiões no MVP | Reduz sensibilidade; liberdade de design |
| D8 | Verbos Humanity (EMBATE) | Esqueleto mínimo definido; one-pager completo em aberto | §15, §59 |
| D9 | Torneios | Entradas = **pass-through** para o pool; fee de organização publicada à entrada | §33 |
| D10 | Audit log vs. privacidade | Ledger pseudónimo imutável; PII separada com retenção | §46 |
| D11 | Roster de launch | **6 agentes base**; Nanovirus flag de revisão de nicho pós-dados | §4 |
| D12 | Prémios de season | **Sem USDC direto no launch**: cosmetics, trophies, assets, títulos | Revisitado na modelação económica |

---

# 1. VISÃO DO PRODUTO

Criar um jogo de estratégia e simulação global inspirado no conceito de Pandemic Simulator, mas com:

* gameplay original;
* sistema de evolução profundo;
* múltiplos agentes;
* PvE;
* PvP;
* modo assimétrico Agent vs Humanity;
* inteligência artificial adaptativa;
* mundo reativo;
* ranked;
* seasons;
* torneios;
* guilds;
* Web3;
* assets com histórico;
* marketplace;
* USDC;
* sistema de referral;
* Treasury;
* economia sustentável;
* zero pay-to-win.

O objetivo não é criar simplesmente um jogo "sobre vírus".

O objetivo é criar:

> **um jogo competitivo de evolução e estratégia global onde cada partida gera uma história diferente.**

---

# 2. PRINCÍPIO FUNDAMENTAL

A blockchain NÃO deve controlar o gameplay em tempo real.

## Game Layer

Responsável por:

* mapa;
* população;
* propagação;
* evolução;
* IA;
* eventos;
* PvP;
* matchmaking;
* ranking;
* simulação;
* combate;
* estado da partida.

## Web3 Layer

Responsável por:

* ownership;
* assets;
* trophies;
* marketplace;
* USDC;
* torneios;
* recompensas;
* achievements;
* referral;
* histórico verificável;
* Treasury.

Arquitetura:

GAME ENGINE
↓
BACKEND
↓
ECONOMIC ENGINE
↓
SOLANA

Nunca colocar cada ação do jogador na blockchain.

---

# 3. CORE GAME LOOP

MAP
↓
CHOOSE AGENT
↓
START REGION
↓
SPREAD
↓
GENERATE DNA
↓
EVOLVE
↓
HUMANITY REACTS
↓
ADAPT
↓
SPECIALIZE
↓
SURVIVE / DOMINATE
↓
WIN / LOSE
↓
XP / MMR / ACHIEVEMENTS
↓
SEASON PROGRESSION
↓
OPTIONAL WEB3 REWARDS

---

# 4. AGENTES

O jogo terá 11 agentes no desenho inicial.

**[v1.1 — D11] Roster de launch:** 6 agentes base. O **NANOVIRUS** fica marcado para revisão de nicho (sobrepõe-se a Bioengineered/Synthetic): o simulador de balance AI-vs-AI decidirá, com dados, entre manter, fundir ou cortar, antes da Phase 3. Os Advanced Agents permanecem na Phase 5, conforme plano original.

## BASE AGENTS

### 1. VIRUS

Especialidade:

* velocidade;
* transmissão;
* mutação rápida.

Fraqueza:

* maior possibilidade de deteção.

Playstyle:

> agressivo / expansionista.

---

### 2. BACTERIA

Especialidade:

* resistência;
* sobrevivência;
* adaptação.

Fraqueza:

* crescimento inicial mais lento.

Playstyle:

> defensive / survivor.

---

### 3. FUNGUS

Especialidade:

* expansão global;
* ambiente;
* colonização.

Fraqueza:

* menor velocidade inicial.

Playstyle:

> expansion / territory control.

---

### 4. PARASITE

Especialidade:

* vetores;
* animais;
* transmissão indireta.

Fraqueza:

* dependência de determinadas condições.

Playstyle:

> indirect strategy.

---

### 5. PRION

Especialidade:

* stealth;
* incubação;
* baixa deteção.

Fraqueza:

* crescimento inicial lento.

Playstyle:

> stealth / assassination.

---

### 6. NANOVIRUS ⚠ flag de revisão (D11)

Especialidade:

* mutação;
* adaptação;
* tecnologia.

Fraqueza:

* elevado custo de evolução.

Playstyle:

> adaptive / technological.

---

# 5. ADVANCED AGENTS

## 7. BIOENGINEERED

Possui árvore parcialmente pré-configurada.

Características:

* flexibilidade;
* engenharia;
* especialização;
* híbridos.

Trade-off:

> maior flexibilidade = maior custo.

---

## 8. SUPERVIRUS

Extremamente poderoso.

Possui:

### INSTABILITY

Quanto mais poderosa a evolução:

* maior risco;
* maior custo;
* maior instabilidade.

Pode desbloquear mutações extraordinárias.

---

## 9. SYNTHETIC AGENT

Mistura:

BIOLOGY
+
TECHNOLOGY

Possui duas árvores:

* Biological;
* Synthetic.

E uma terceira árvore:

* Hybrid.

---

## 10. EVOLVED

Não possui árvore completamente fixa.

A árvore adapta-se às decisões do jogador.

Cada partida pode criar uma evolução diferente.

---

## 11. UNKNOWN AGENT

Possui:

* mecânicas parcialmente ocultas;
* árvore parcialmente desconhecida;
* capacidades que o jogador descobre;
* Humanity também precisa de descobrir as capacidades.

Objetivo:

> criar o agente mais imprevisível do jogo.

Nota **[v1.1]:** Unknown e Evolved só são ativados (Phase 5) quando existir tooling de balance com dados reais; são os agentes com maior risco de integridade competitiva.

---

# 6. SISTEMA DE EVOLUÇÃO

A evolução é o coração do jogo.

Nunca criar apenas:

> +10% transmissão.

Todas as evoluções devem possuir:

1. benefício;
2. custo;
3. desvantagem;
4. sinergias;
5. futuras possibilidades.

## 6.1 [v1.1] SCHEMA DO NÓ DE EVOLUÇÃO

Cada nó é **dados, não código**. Deliverable da Phase 0.

```yaml
evolution_node:
  id: string                 # ex.: "tr_airborne_2"
  tree: transmission|adaptation|lethality|mutation|stealth|specialization|ultimate
  tier: 1..5
  benefit:                   # efeitos positivos
    - { stat: transmission, op: mul, value: 0.25 }
  downside:                  # desvantagem obrigatória
    - { stat: detection, op: mul, value: 0.15 }
  cost: { dna: 120 }
  tags: [airborne, mobility, fast]     # usadas pelo rule engine (§8)
  prerequisites: [tr_airborne_1]
  synergies:
    - { requires_tags: [stealth], effect: { stat: detection, op: mul, value: -0.10 } }
  agent_gate: any | [virus, nanovirus] # nós exclusivos de agente
  event_hooks: []            # eventos que este nó desbloqueia (§9)
```

Regras:

* todo o nó tem pelo menos 1 downside não trivial;
* stats afetáveis são um conjunto fechado: transmission, detection, lethality, resistance, mutation_rate, stealth, mobility, cost_modifier, incubation, stability;
* mudanças de balance = mudanças de dados, sem deploy de lógica.

---

# 7. ÁRVORES

## TRANSMISSION

* Airborne
* Water
* Surface
* Vector
* Animal
* Human Contact
* Mobility

## ADAPTATION

* Heat
* Cold
* Humidity
* Dry
* Urban
* Rural
* Extreme Environment

## LETHALITY

* Organ Damage
* Respiratory
* Neurological
* Systemic
* Rapid Collapse

## MUTATION

* Mutation Rate
* Mutation Burst
* Adaptive Mutation
* Random Mutation
* Controlled Mutation

## STEALTH

* Asymptomatic
* Long Incubation
* Misdiagnosis
* Low Detection
* Hidden Spread

## SPECIALIZATION

Árvore específica do agente.

## ULTIMATE

Evolução de alto impacto.

---

# 8. EMERGENT BUILDS

Não criar centenas de builds manualmente.

As combinações devem gerar comportamentos diferentes.

Exemplo:

LONG INCUBATION
+
ASYMPTOMATIC
+
AIRBORNE
+
HIGH MOBILITY

=

SHADOW SPREAD

Outro:

SUPER TRANSMISSION
+
RAPID MUTATION
+
HIGH LETHALITY

=

GLOBAL COLLAPSE

Outro:

RESISTANCE
+
LOW DETECTION
+
CLIMATE ADAPTATION

=

IMMORTAL

Os nomes podem ser arquétipos internos.

## 8.1 [v1.1] RULE ENGINE

Builds emergentes são **detetadas automaticamente** por regras sobre as tags dos nós (§6.1), nunca curadas à mão:

```yaml
emergent_build:
  id: shadow_spread
  requires_tags: [long_incubation, asymptomatic, airborne, mobility]
  effect: { stat: detection, op: mul, value: -0.20 }
  hud: { name: "SHADOW SPREAD", icon: ... }
```

* o motor avalia o conjunto de nós ativos a cada evolução;
* builds desbloqueiam efeitos menores + cosméticos de HUD (identidade visual da build);
* a lista de builds é dados, extensível sem código.

---

# 9. EVOLUTION EVENTS

Durante a partida:

> apresentar 3 opções.

Exemplo:

### A

+40% transmissão
+25% deteção

### B

+20% stealth
-15% velocidade

### C

+25% resistência
+10% custo evolutivo

A escolha altera as possibilidades futuras.

---

# 10. DNA

DNA é a moeda interna do gameplay.

Obtida através de:

* infectar;
* espalhar;
* completar objetivos;
* descobrir regiões;
* eventos;
* decisões estratégicas.

DNA:

* não é USDC;
* não é token;
* não é transferível;
* não é negociável.

Serve exclusivamente para gameplay.

---

# 11. HUMANITY AI

Humanity nunca deve ser simplesmente:

> "vaccine progress bar".

Sistema:

DETECTION
↓
INVESTIGATION
↓
IDENTIFICATION
↓
THREAT ASSESSMENT
↓
REGIONAL PRIORITY
↓
CONTAINMENT
↓
TREATMENT
↓
ADVANCED RESEARCH
↓
VACCINE

A IA deve observar comportamento.

Exemplo:

Se o jogador utiliza aeroportos:

→ Humanity aumenta controlo aeroportuário.

Se o jogador usa stealth:

→ aumenta investigação.

Se o jogador muda estratégia:

→ Humanity adapta-se.

## 11.1 [v1.1] PERFIS FIXOS POR ESCALÃO (integridade competitiva)

Para que partidas ranked sejam comparáveis:

* a Humanity usa **perfis fixos por escalão de matchmaking** (curvas de agressividade, velocidade de investigação, orçamento);
* a adaptação comportamental acontece **apenas dentro de intervalos limitados** do perfil;
* os parâmetros da IA ficam registados em cada partida (auditáveis e analisáveis para balance).

## 11.2 [v1.1] DETECTION AGGRO (PvP multiagente)

Em partidas com 2–6 agentes, a Humanity aloca recursos proporcionalmente ao **threat score** de cada agente:

```
threat = f(detection_level, growth_rate, lethality, regions_affected)
```

* o agente mais visível/ameaçador recebe mais pressão;
* gerir a própria visibilidade (e empurrar atenção para os adversários) é skill explícita;
* nenhuma alocação é secreta para o servidor; cada agente vê o seu nível de pressão e sinais públicos da Humanity.

---

# 12. WORLD SIMULATION

MVP:

30–50 regiões estratégicas.

Cada região possui:

* população;
* densidade;
* clima;
* mobilidade;
* conectividade;
* healthcare;
* ciência;
* economia;
* aeroportos;
* portos;
* fronteiras.

Posteriormente:

50
→ 100
→ 250
→ 500+

A expansão só acontece se melhorar realmente o gameplay.

## 12.1 [v1.1 — D7] REGIÕES FICTÍCIAS

As regiões são **fictícias**, inspiradas em geografia/clima/demografia reais (nunca países reais com contagem de mortes). Benefícios:

* reduz sensibilidade temática e risco de plataformas/PR;
* liberdade de balance (ajustar população/conectividade sem "ofender" um país);
* o mundo pode mudar entre seasons sem discussão geopolítica.

## 12.2 [v1.1] GRAFO DE CONECTIVIDADE

O mundo é um grafo:

* nós = regiões;
* arestas = rotas (air / sea / land), cada uma com capacidade e tempo de travessia;
* a propagação entre regiões acontece através das rotas, ponderada por mobilidade e medidas da Humanity (fechos, rastreio);
* o grafo (36 regiões no MVP) é dados versionados por season.

---

# 13. GAME MODES

**[v1.2]:** cada modo pode ser jogado em variante gratuita ou com stake — os modos com stake (ARENA PvE/PvP) estão definidos em §60 e são separados do ranked oficial.

## PANDEMIA — PvE

Player vs AI.

Inclui:

* campanha;
* cenários;
* dificuldades;
* desafios;
* achievements.

---

## VIRUS — PvP

2–6 jogadores.

Todos competem no mesmo mundo.

Exemplo:

P1 Virus
P2 Bacteria
P3 Fungus
P4 Parasite
P5 Supervirus
P6 Unknown

Objetivo baseado em score.

Não usar simplesmente:

> quem matou mais pessoas ganha.

Score pode considerar:

* infected population;
* deaths;
* regions;
* objectives;
* survival;
* evolution efficiency;
* strategic achievements.

---

## EMBATE — 1v1

### Player A

Controla Agent.

### Player B

Controla Humanity.

Agent:

SPREAD
→ EVOLVE
→ SURVIVE

Humanity:

DETECT
→ INVESTIGATE
→ CONTAIN
→ TREAT
→ ELIMINATE

Sistema de informação assimétrica.

---

# 14. [v1.1 — D1/D3] MODELO TEMPORAL E ESTRUTURA DA PARTIDA

## 14.1 TICKS SIMULTÂNEOS

* a simulação avança em **ticks**; parâmetros iniciais: tick = 3 s reais = 2 horas de jogo;
* entre ticks, os jogadores colocam ações numa **fila** (evoluir, direcionar propagação, responder a eventos, alocar recursos);
* as ações resolvem-se determinísticamente no tick, no servidor;
* **PvE:** pausa permitida (single-player). **PvP/EMBATE:** sem pausa;
* cada partida guarda a sequência de ticks/snapshots (reconnect, audit, replay).

Implicações:

* reconnect = ressincronização por snapshot;
* spectators gratuitos;
* anti-cheat simplificado (o cliente nunca simula, apenas apresenta e envia intenções).

## 14.2 DURAÇÃO ALVO

| Modo | Duração real alvo | Relógio de jogo |
|------|-------------------|-----------------|
| VIRUS (PvP) | 15–25 min | 250–365 dias (parâmetro) |
| EMBATE (1v1) | 15–25 min | até 400 dias (parâmetro) |
| PANDEMIA (PvE) | 10–30 min por missão | varia por cenário |

## 14.3 ANTI-SOFTLOCK (ESCALADA)

Para impedir partidas estagnadas (ex.: dois agentes stealth infinitos):

* **GLOBAL ALERT:** após o dia X (parâmetro), a pressão global da Humanity cresce progressivamente;
* **objetivos periódicos** obrigam os agentes a agir (bónus de score; ignorá-los custa score);
* **decay de atividade:** agente sem eventos de crescimento durante N dias perde score por tick;
* o relógio de jogo é sempre limite duro — não existe partida infinita.

---

# 15. [v1.1 — D2] CONDIÇÕES DE VITÓRIA E DERROTA

Números concretos são **parâmetros de balance** (calibrados pelo simulador AI-vs-AI).

## 15.1 PANDEMIA (PvE)

**Vitória do Agent:**

* infeção global sustentável — infeção acumulada ≥ X% da população mundial com presença ativa em ≥ Y regiões, antes da erradicação; ou
* colapso — mortes ≥ Z% da população inicial antes da erradicação; ou
* objetivos específicos do cenário (campanha).

**Vitória da Humanity:**

* erradicação — 0 casos ativos durante N dias consecutivos após identificação; ou
* vacina concluída antes de o Agent atingir os seus thresholds.

## 15.2 VIRUS (PvP, 2–6 agentes + Humanity AI)

A partida termina quando:

1. o relógio de jogo expira; ou
2. resta apenas 1 agente ativo; ou
3. a Humanity erradica todos os agentes.

**Vitória = maior score composto** (nunca "quem matou mais"):

```
score = w1·infecção sustentável
      + w2·presença/controlo regional (incl. first-infection)
      + w3·objetivos completados
      + w4·dias de sobrevivência
      + w5·eficiência de evolução (efeito/DNA gasto)
      + w6·achievements estratégicos
```

* pesos `w1..w6` = parâmetros de balance públicos;
* agentes erradicados antes do fim mantêm o score acumulado (podem não ganhar, mas a partida continua justa);
* empates resolvidos por eficiência de evolução, depois por sobrevivência.

## 15.3 EMBATE (1v1 assimétrico)

**Vitória do Agent:**

* atingir o threshold de infeção/colapso antes do relógio; ou
* chegar ao fim do relógio com presença ativa acima do mínimo de sobrevivência endémica (parâmetro).

**Vitória da Humanity:**

* erradicação (0 casos ativos durante N dias consecutivos); ou
* relógio expira com o Agent abaixo do mínimo de sobrevivência endémica.

Sem empates: o relógio resolve sempre.

**Esqueleto dos verbos Humanity (D8 — detalhe em §59):**

* alocar orçamento de investigação (deteção / tratamento / vacina);
* medidas regionais (rastreio, fechos de rotas, quarentenas);
* campanhas públicas (reduzem transmissão, custam economia);
* recursos gerados por tick a partir da economia/ciência das regiões sob controlo;
* fog of war: a Humanity vê **sinais com ruído** (surtos, sintomas anómalos), não o estado real do agente; o Agent vê o seu **nível de pressão**, não a alocação da Humanity.

---

# 16. RANKED

MMR/ELO.

Ranks:

Bronze
Silver
Gold
Platinum
Diamond
Master
Legend

Nunca permitir comprar:

* MMR;
* vitória;
* evolução competitiva;
* vantagens permanentes.

**[v1.1]:** o modelo de rating para FFA (2–6 jogadores) usa Elo generalizado (ou equivalente), com instrumentação de win rate × agente × matchup ativa desde a primeira partida.

---

# 17. SEASONS

Seasons de aproximadamente 30 dias são uma opção inicial.

No final:

* rankings;
* estatísticas;
* achievements;
* trophies;
* recompensas;
* reset/rebalanceamento;
* novo meta.

Prémios:

* Best Player;
* Best Agent;
* Best Win Rate;
* Best Strategy;
* Most Dominant;
* Best Newcomer.

**[v1.1 — D12] Política de prémios de season no launch:** sem USDC direto. Prémios = cosmetics exclusivos, trophies soulbound, assets comemorativos, títulos. Revisitado na modelação económica (payouts em USDC aumentam pressão vendedora e exigem revisão antifraude reforçada).

---

# 18. WEB3 PHILOSOPHY

O Web3 deve seguir:

> PLAY → COMPETE → CONQUER → OWN → TRADE → REFER

Não:

> DEPOSIT → FARM → SELL → EXIT

A blockchain deve acrescentar valor ao jogo.

---

# 19. SOLANA

Solana será utilizada para:

* assets;
* ownership;
* USDC;
* trophies;
* marketplace;
* tournaments;
* achievements;
* eventualmente rewards.

Não usar blockchain para cada tick da simulação.

---

# 20. WEB3 ASSETS

Categorias:

### AGENTS

Agents especiais que podem possuir histórico.

### COSMETICS

* skins;
* effects;
* animations;
* banners;
* frames.

### TROPHIES

* World Ender;
* Season Champion;
* Ghost;
* Master Strategist;
* Survivor;
* Global Dominator.

### RESEARCH ASSETS

* Mutation Research;
* Synthetic Research;
* Ancient Research;
* Unknown Research.

Nenhum asset comprado pode fornecer vantagem competitiva injusta.

## 20.1 [v1.1 — C3/D4] REGRA ABSOLUTA DE EFEITO

> **Nenhum asset Web3 desbloqueia, modifica ou melhora gameplay em modos competitivos (ranked, torneios, EMBATE, PvP).**

* valor do asset = identidade, história, status, estética;
* se um asset tiver qualquer efeito, este é **apenas cosmético/visual**;
* Research Assets: o seu papel (cosmético vs. crafting sem efeito competitivo) será definido na fase de design de emissão (§59); até lá, não entram em produção.

## 20.2 [v1.1 — C2] CLASSIFICAÇÃO DE TROPHIES

| Classe | Transferível? | Exemplos |
|--------|---------------|----------|
| **Merit (soulbound)** | Não — atestam feito do jogador | Season Champion, World Ender, 100 Ranked Wins, Master of Stealth, Unknown Discoverer |
| **Commemorative (tradeable)** | Sim — objeto comemorativo/cosmético, não prova de mérito | variantes visuais de troféus, edições de evento |

Regra: tudo o que **prova mérito** é soulbound. Nada que seja tradeable pode ser apresentado como prova de feito.

---

# 21. LIVING ASSETS

Um dos principais diferenciais Web3.

Exemplo:

UNKNOWN AGENT #8291

Created:
Season 01

Games:
184

Wins:
137

Win Rate:
74.45%

Population Infected:
8.42B

Championships:
3

Specialization:
Shadow / Mutation / Synthetic

Rarity:
Legendary

O asset tem uma carreira.

O seu valor não depende apenas da imagem.

Depende de:

* histórico;
* achievements;
* raridade;
* identidade;
* utilização;
* resultados.

## 21.1 [v1.1] INTEGRIDADE DA CARREIRA (anti-inflação)

Uma carreira não pode ser fabricada para venda:

* estatísticas só contam em **matchmaking verificado** (server-authoritative);
* cada stat pública indica o contexto: modo, escalão, flag "ranked-verified";
* vitórias contra contas ligadas (mesmo dispositivo/IP/guild) são excluídas da carreira;
* a carreira fica off-chain (eventos assinados + hash de compromisso on-chain — ver §43/§46); nunca escrita na chain por partida.

---

# 22. REPUTAÇÃO ON-CHAIN

Achievements especiais podem tornar-se verificáveis.

Exemplo:

WORLD ENDER
FIRST SEASON CHAMPION
100 RANKED WINS
MASTER OF STEALTH
UNKNOWN DISCOVERER

Todos os achievements de mérito são **non-transferable** (soulbound), conforme §20.2.

Funcionam como reputação.

---

# 23. USDC

USDC será a principal unidade económica Web3.

Usos possíveis:

* marketplace;
* compras;
* determinados eventos;
* determinados torneios;
* assets;
* taxas.

USDC não deve controlar o gameplay.

**[v1.2]:** USDC é também a moeda de stake do PvE e alternativa no PvP (§60).

---

# 24. MARKETPLACE

Permitir negociar:

* agents;
* cosmetics;
* trophies (apenas classe Commemorative — §20.2);
* research assets;
* outros assets aprovados.

Fluxo:

SELLER
↓
LIST ASSET
↓
BUYER
↓
USDC
↓
ECONOMIC ENGINE
↓
DISTRIBUTION

---

# 25. MARKETPLACE FEES

A taxa definitiva deve ser determinada através de modelação económica.

Como ponto inicial de teste:

> 5–10% de fee total.

Nunca assumir que uma percentagem inicial é definitiva.

Testar:

* 5%;
* 7.5%;
* 10%.

Medir:

* volume;
* retenção;
* liquidez;
* Treasury;
* comportamento dos vendedores.

---

# 26. REFERRAL SYSTEM

Sistema de referência de 1 nível.

PLAYER A
↓
REFERRAL
↓
PLAYER B

Quando B gerar fees:

> A é pago a partir de W-REFERRAL.

## 26.1 [v1.2 — E3] MODELO DE REFERRAL

* **10% de todos os fees** do sistema vão para W-REFERRAL (§31);
* quando B tem referenciador A, **A recebe 10% dos fees gerados por B**, pagos de W-REFERRAL;
* se B não tiver referenciador, ou a recompensa não for reclamada, o valor fica em W-REFERRAL e **reverte periodicamente para W-TREASURY** (§27).

Fees que contam para referral:

* rake PvE (§60.2);
* fee PvP (§60.3);
* marketplace fees (§25).

Excluídos:

* venda primária de tokens;
* compras com tokens (nomes animados, etc.);
* prémios, transferências, entradas de torneio (pass-through);
* atividade marcada como suspeita pelo risk scoring.

Exemplo: B gera 10 USDC de fees → A recebe 1,00 USDC.

> Janela de atribuição: vitalícia, 1 nível. As regras antifraude mantêm-se (§28).

---

# 27. SEM REFERENCIADOR

**[v1.2]** Se B não possuir referenciador válido, a fatia de referral fica em W-REFERRAL e reverte periodicamente para W-TREASURY.

FEES DE B
↓
10% → W-REFERRAL
├── B tem referenciador → pago a A
└── Sem referenciador / não reclamado → W-TREASURY

---

# 28. REFERRAL RULES

Obrigatório:

* apenas 1 nível;
* sem MLM;
* sem auto-referral;
* referral associado à conta;
* proteção contra alteração abusiva;
* deteção antifraude;
* rewards pending;
* proteção contra chargebacks;
* possibilidade de cancelar recompensa fraudulenta.

Referral NÃO recebe percentagem sobre:

* prémios;
* ganhos de outros referrals;
* transferências pessoais;
* atividades não elegíveis.

A lista de receitas elegíveis está definida no §26.1.

---

# 29. TREASURY

O Treasury (W-TREASURY) recebe:

* 25% dos fees do sistema (§31);
* saldos de W-REFERRAL não reclamados / sem referenciador (§27);
* fees de organização de torneios (§33);
* venda primária de tokens (§38);
* compras com tokens (nomes animados, etc. — §60.4);
* outras receitas aprovadas.

Pode financiar:

* infraestrutura;
* desenvolvimento;
* segurança;
* marketing;
* prémios;
* eventos;
* community;
* reservas;
* liquidez operacional.

**[v1.1] Em aberto (§59):** governança — entidade legal detentora, composição do multisig, política de gastos e relatórios de transparência.

---

# 30. TREASURY SECURITY

Nunca utilizar uma wallet administrativa simples como Treasury de produção.

Usar arquitetura com:

* multisig;
* wallets separadas;
* limites;
* auditoria;
* logs;
* permissões;
* políticas;
* eventualmente timelocks.

Todas as operações críticas devem ser rastreáveis.

---

# 31. REVENUE DISTRIBUTION

**[v1.2 — E4]** Distribuição de **todos os fees** do sistema (rake PvE, fee PvP, marketplace fees) pelas 5 wallets:

| Wallet      | % dos fees | Função |
| ----------- | ---------: | ------ |
| W-REFERRAL  |        10% | paga referenciadores; sobras → W-TREASURY |
| W-REWARDS   |        30% | prémios competitivos, seasons, reforço de eventos PvE |
| W-TREASURY  |        25% | operações, infra, desenvolvimento |
| W-RESERVE   |        20% | risco, reversões, chargebacks |
| W-MARKETING |        15% | growth, campanhas, criadores |
| **Total**   |   **100%** | |

Fora desta distribuição (receita direta de W-TREASURY): venda primária de tokens e compras com tokens (§60.4).

Valores iniciais aprovados pelo fundador — revistos na modelação económica.

O pass-through de entradas de torneios (§33) continua fora desta tabela: apenas a fee de organização entra aqui.

---

# 32. EXEMPLO

**[v1.2]** Fees gerados pela atividade de B:

10 USDC

Distribuição (§31):

* 1,00 → W-REFERRAL (B tem referenciador A → A recebe 1,00)
* 3,00 → W-REWARDS
* 2,50 → W-TREASURY
* 2,00 → W-RESERVE
* 1,50 → W-MARKETING

Se B não tivesse referenciador, o 1,00 ficaria em W-REFERRAL e reverteria depois para W-TREASURY.

---

# 33. TOURNAMENTS

## FREE

Entrada:

0 USDC.

Prémios:

* XP;
* trophies;
* cosmetics;
* ranking;
* achievements.

---

## COMPETITIVE

Possível entrada económica.

**[v1.1 — C4/D9] Contabilidade separada (pass-through):**

```
ENTRADA DO JOGADOR
├── POOL (ex.: 95%)  → 100% redistribuído como prémios, distribuição publicada antes da inscrição
└── FEE DE ORGANIZAÇÃO (ex.: 5%) → receita normal (§31)
```

Exemplo conceptual:

100 jogadores × 5 USDC

→ Pool: 475 USDC (distribuição publicada)
→ Fee de organização: 25 USDC (receita §31)

A percentagem pool/fee é um parâmetro, publicado sempre antes da inscrição. Nunca misturar o pool com a tabela §31.

Não lançar esta funcionalidade em produção sem validação jurídica/regulatória aplicável (gate obrigatório — §48).

**[v1.2]:** os modos de stake (§60) coexistem com torneios; stake PvP não é torneio, mas usa o mesmo gate jurídico.

---

# 34. TOURNAMENT SECURITY

Obrigatório:

* server authoritative;
* anti-cheat;
* match validation;
* reconnect;
* timeout;
* dispute handling;
* result verification;
* payout verification.

Nunca pagar prémios apenas com base em dados enviados pelo cliente.

**[v1.1] Payouts com período pendente:** prémios com valor económico entram em estado `pending` e só assentam após verificação antifraude (win-trading, colusão, multi-conta) — ver §40.

---

# 35. GUILDS

Guilds podem possuir:

* identidade;
* ranking;
* missions;
* research;
* competitions;
* achievements;
* Treasury;
* tournaments.

Exemplo:

GENOME LAB

vs

SYNTHETIC ORDER

vs

SHADOW RESEARCH

**[v1.1] Em aberto (§59):** autorização de movimentação do Treasury de guild, destino dos fundos em caso de dissolução.

---

# 36. PAY-TO-WIN — PROIBIDO

Nunca vender:

+50% Transmission
+100% Lethality
+50% DNA
+Extra Health
+Permanent MMR
+Competitive Advantage

Comprar deve significar:

> ownership / customization / status / access

e não:

> vitória.

**[v1.1 — D4] Reforço:** a proibição estende-se explicitamente a assets Web3 (agents, research assets, trophies) — nenhum pode alterar gameplay competitivo, diretamente ou através de crafting (§20.1).

---

# 37. ECONOMIA INTERNA

### DNA

Gameplay.

### XP

Progressão.

### MMR

Competição.

### USDC

Economia Web3.

### Assets

Ownership.

### Trophies

Reputação.

Cada camada deve possuir função própria.

---

# 38. TOKEN PRÓPRIO

**[v1.2 — E1] Decisão do fundador:** o token próprio existe **desde o launch** (working name $PEVO), com utilidades reais:

1. **hold gate** — 10.000 tokens para conectar wallet (§60.1);
2. **moeda de stake** alternativa ao USDC no PvP (§60.3);
3. **token sink** — nomes de perfil animados (§60.4) e futuros sinks.

> O princípio antigo "USDC antes de token próprio" foi **revogado** (ver §52, princípio 12).

Por definir na modelação económica (antes de qualquer venda):

* supply total e emissão;
* venda primária (USDC → W-TREASURY) e preço;
* vesting/locks;
* política de queima;
* revisão do limiar 10k em função do preço do token.

Nunca criar token apenas para:

* especulação;
* financiar desenvolvimento;
* reward farming;
* marketing.

**Gate legal:** MiCA (utility token) — whitepaper e compliance antes de venda primária. Devnet-first.

---

# 39. TOKEN $PEVO (WORKING NAME)

Funções iniciais (v1.2): hold gate, stake PvP, sinks cosméticos (§38, §60).

Funções possíveis no futuro:

* ecosystem utility;
* crafting;
* determinadas taxas;
* guild utilities;
* eventos;
* governance limitada.

Oferta, distribuição, emissão e lançamento são definidos na modelação económica, após análise económica, jurídica (MiCA) e fiscal.

---

# 40. ANTI-FARMING

O sistema deve impedir que jogadores criem contas apenas para:

* referral farming;
* reward farming;
* marketplace manipulation;
* tournament abuse;
* wash trading.

Detetar:

* padrões de comportamento;
* múltiplas contas;
* transações suspeitas;
* matchmaking manipulation;
* volume artificial;
* auto-trading;
* wash trading.

Não bloquear jogadores legítimos automaticamente.

Utilizar sistema de risk scoring + revisão.

---

# 41. ANTI-CHEAT

O cliente nunca é autoridade.

Arquitetura:

CLIENT
↓
SERVER
↓
VALIDATION
↓
GAME STATE

O servidor controla:

* evolução;
* DNA;
* resultados;
* matchmaking;
* scores;
* recompensas.

## 41.1 [v1.1] FOG OF WAR = FILTRAGEM SERVER-SIDE

O servidor **filtra o estado enviado a cada cliente**:

* capacidades e árvore do Unknown Agent nunca são enviadas a oponentes/Humanity antes da descoberta;
* no EMBATE, o jogador Agent não recebe a alocação da Humanity; o jogador Humanity não recebe o estado real do agente;
* no PvP, DNA/planos dos oponentes nunca saem do servidor;
* princípio: o cliente só recebe o que o jogador pode legitimamente ver.

---

# 42. STACK TECNOLÓGICA

## Frontend

Next.js
TypeScript

## Game

Phaser

## Backend

Node.js

## Realtime

WebSockets

## Database

PostgreSQL

## Cache

Redis, quando necessário.

## Blockchain

Solana

## Smart Contracts

Anchor / framework Solana atualmente suportado.

## Wallet

Solana Wallet Adapter / solução equivalente atualmente suportada.

**[v1.1 — D6] Wallet de onboarding:** embedded wallet criada pelo próprio jogo (custódia progressiva), com exportação/migração para self-custody quando o jogador quiser. Jogadores sem wallet jogam na mesma (Web3 optional). Gate jurídica antes da Phase 7.

**[v1.2]:** a conexão de qualquer wallet está sujeita ao hold gate de 10.000 $PEVO (§60.1).

---

# 43. ARQUITETURA

```text
                 PLAYER
                   │
                   ▼
              NEXT.JS WEB
                   │
                   ▼
                PHASER
                   │
             WebSocket
                   │
                   ▼
          AUTHORITATIVE SERVER
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
    GAME AI     DATABASE    ECONOMY
       │           │           │
       └───────────┼───────────┘
                   │
                   ▼
              SOLANA LAYER
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
     USDC       ASSETS       TROPHIES
       │           │            │
       └───────────┼────────────┘
                   ▼
               TREASURY
```

## 43.1 [v1.1] LIVING ASSETS — ON-CHAIN vs OFF-CHAIN

* **on-chain:** ownership + ponteiro de metadata + hash (commitment) da carreira;
* **off-chain:** eventos de carreira assinados pelo servidor (PostgreSQL, append-only);
* nunca escrever estatísticas por partida na chain (custo/latência);
* usar compressed NFTs (cNFTs) para minting à escala; o minting é pago pelo jogo (relayer), nunca pelo jogador no onboarding.

---

# 44. DATABASE CONCEPTUAL

Principais entidades:

users
profiles
agents
agent_builds
matches
match_players
match_events **[v1.1]**
regions
evolution_nodes
evolution_choices
dna_transactions
rankings
seasons
achievements
trophies
assets
asset_career_events **[v1.1]**
marketplace_listings
marketplace_sales
referrals
referral_rewards
tournaments
tournament_players
pending_settlements **[v1.1]**
treasury_transactions
wallets
risk_events
audit_logs

---

# 45. ECONOMIC ENGINE

Criar um módulo separado:

```text
EconomicEngine
```

Responsável por:

* receitas;
* fees;
* referrals;
* Treasury;
* tournament allocations;
* marketplace;
* rewards;
* pending balances;
* settlements;
* fraud reversals.

Nunca espalhar regras económicas pelo código do jogo.

## 45.1 [v1.1] DISCIPLINA DE LEDGER

* escrita em **dupla entrada**, com **chaves de idempotência** em todas as operações;
* como a chain é imutável, erros/fraudes corrigem-se com **transações compensatórias** registadas — nunca edições;
* toda a operação económica é determinística e reproduzível a partir do log de eventos.

---

# 46. AUDIT LOG

Todas as operações económicas importantes devem gerar:

* timestamp;
* user;
* wallet;
* event;
* amount;
* currency;
* transaction;
* status;
* source;
* destination.

## 46.1 [v1.1 — C1/D10] LEDGER PSEUDÓNIMO E RETENÇÃO (GDPR)

"O histórico económico nunca se apaga" aplica-se ao **ledger pseudónimo**:

* **imutável e permanente:** eventos económicos referenciados por account id pseudónimo + wallet pública + hashes;
* **com retenção e apagável:** dados pessoais (nome, email, IP, dispositivo) — guardados em armazenamento separado, com prazos de retenção definidos e suporte de apagamento (GDPR);
* o apagamento de uma conta remove a PII; as entradas do ledger permanecem, referenciadas apenas por identificadores pseudónimos;
* base legal e política de retenção concretas = gate jurídica (§48 / §59).

---

# 47. DEVNET FIRST

Toda a integração Solana começa em:

> DEVNET

Nunca começar diretamente em mainnet.

Testar:

* wallets;
* assets;
* USDC;
* marketplace;
* rewards;
* referral;
* Treasury;
* tournament settlement.

Só avançar para mainnet após:

* testes;
* auditoria;
* segurança;
* validação económica;
* validação jurídica;
* load testing.

---

# 48. FASES DE DESENVOLVIMENTO

**[v1.1] Track paralelo — LEGAL:** triagem jurídica (torneios pagos, custódia/embedded wallet, MiCA, GDPR/idade-alvo) corre em paralelo desde já; é gate das Phases 7, 8 e 10.

## PHASE 0 — GDD

Definir completamente:

* rules;
* agents;
* map;
* evolution;
* scoring;
* AI;
* economy.

Sem blockchain.

**Entregues na v1.1:** decision log, condições de vitória, modelo temporal, schema do nó de evolução, lista provisória de receita elegível.

---

## PHASE 1 — CORE GAME

Implementar:

* map;
* population;
* spread;
* DNA;
* evolution;
* Humanity AI;
* win/loss.

**Gate de saída [v1.1] — VERTICAL SLICE:** PvE com 1 agente (Virus), ~30–36 regiões, Humanity AI v1 (máquina de estados), ~40 nós de evolução + rule engine de tags, partida de ~20 minutos, **validada com 10–20 jogadores reais** antes de avançar.

Inclui: **simulador AI-vs-AI** (partidas automáticas para balance) — ferramenta da Phase 1, não da Phase 6.

---

## PHASE 2 — PVE

Implementar:

* campaign;
* scenarios;
* difficulty;
* challenges.

---

## PHASE 3 — PVP

Implementar:

* 2–6 players;
* lobby;
* matchmaking;
* server authority;
* reconnect;
* synchronization;
* anti-cheat.

**[v1.1]:** incluir micro-load tests neste ponto (não adiar load testing para a Phase 13).

---

## PHASE 4 — EMBATE

Implementar:

Agent vs Humanity.

Pré-requisito **[v1.1]:** one-pager completo dos verbos Humanity (§59).

---

## PHASE 5 — ADVANCED AGENTS

Ativar:

Bioengineered
Supervirus
Synthetic
Evolved
Unknown

Depois de validar balanceamento (com dados do simulador AI-vs-AI e de partidas reais).

---

## PHASE 6 — RANKED

Implementar:

MMR
Ranks
Seasons
Leaderboards

---

## PHASE 7 — SOLANA

Implementar:

wallet;
ownership;
trophies;
achievements;
assets.

**Gate [v1.1]:** decisão de custódia (D6) validada juridicamente; devnet obrigatório (§47). **[v1.2]:** inclui a emissão do token $PEVO (hold gate) — gate MiCA antes de qualquer venda primária; modos de stake só após gate jurídico (§60.5).

---

## PHASE 8 — MARKETPLACE

Implementar:

listings;
purchases;
USDC;
fees;
settlement.

---

## PHASE 9 — REFERRAL

Implementar:

codes;
attribution;
5%;
Treasury fallback;
anti-fraud.

---

## PHASE 10 — TOURNAMENTS

Primeiro:

free tournaments.

Depois:

economic tournaments, somente após validação (incluindo parecer jurídico por mercado — gate obrigatório).

---

## PHASE 11 — GUILDS

Implementar:

guilds;
research;
competition;
guild ranking.

---

## PHASE 12 — LIVING ASSETS

Implementar:

career;
history;
dynamic metadata;
achievements.

Arquitetura: §43.1 (ownership + commitment on-chain; carreira off-chain assinada).

---

## PHASE 13 — SCALE

Load testing.

Target conceptual:

1k
→ 10k
→ 100k+

Não assumir capacidade antes de medir.

---

# 49. MÉTRICAS PRINCIPAIS

Medir:

### Gameplay

* DAU;
* MAU;
* session length;
* matches/day;
* matches/player;
* completion rate.

### Retention

* D1;
* D7;
* D30.

### Competitive

* ranked matches;
* rematches;
* MMR distribution;
* win-rate per agent.

### Economy

* USDC volume;
* marketplace volume;
* average transaction;
* Treasury;
* referral cost;
* reward ratio.

### Web3

* wallets connected;
* active wallets;
* assets held;
* assets traded.

---

# 50. BALANCEAMENTO

Nenhum agente pode dominar consistentemente.

Monitorizar:

* win rate;
* pick rate;
* matchup;
* average game duration;
* evolution popularity;
* region advantage;
* strategy dominance.

Target inicial:

> nenhum agente deve apresentar vantagem estrutural não intencional.

Balanceamento deve ser baseado em dados reais.

**[v1.1]:** a instrumentação existe desde a primeira partida jogada; o simulador AI-vs-AI (Phase 1) corre milhares de partidas por mudança de parâmetros e produz relatórios de win rate × agente × build emergente.

---

# 51. MONETIZAÇÃO

Prioridade:

1. Cosmetics
2. Premium customization
3. Web3 assets
4. Marketplace fees
5. Events
6. Tournaments
7. Optional premium features
8. Outros produtos aprovados

Nunca depender de:

> pay-to-win.

---

# 52. PRINCÍPIOS ABSOLUTOS

O projeto deve obedecer:

### 1.

100% funcional.

### 2.

Zero APIs inventadas.

### 3.

Zero dados fictícios apresentados como reais.

### 4.

Zero blockchain simulation apresentada como blockchain real.

### 5.

Zero pay-to-win.

### 6.

Zero MLM.

### 7.

Zero reward farming deliberado.

### 8.

Server authoritative.

### 9.

Security by design.

### 10.

Game first.

### 11.

Web3 optional.

### 12.

**[v1.2 — substituído]** ~~USDC before proprietary token~~ → Token com utilidade real e gate jurídica antes de qualquer venda.

### 13.

Devnet before mainnet.

### 14.

Test before deploy.

### 15.

Measure before scaling.

### 16. [v1.1]

Assets Web3 com zero efeito em gameplay competitivo.

### 17. [v1.1]

Privacidade e minimização de dados by design (ledger pseudónimo).

### 18. [v1.2]

Modos com stake: 18+, geofencing por jurisdição e parecer jurídico antes de produção.

---

# 53. REGRA DE REALIDADE

O projeto nunca deve afirmar:

> "está pronto"

sem:

* build;
* tests;
* integration tests;
* security checks;
* gameplay tests;
* load tests;
* blockchain transaction verification;
* database verification;
* deployment verification.

---

# 54. DEFINIÇÃO DE "DONE"

Uma feature só é considerada concluída quando:

```text
CODE
↓
BUILD
↓
UNIT TEST
↓
INTEGRATION TEST
↓
E2E TEST
↓
SECURITY TEST
↓
PERFORMANCE TEST
↓
REAL ENVIRONMENT TEST
↓
DOCUMENTATION
↓
ACCEPTANCE
```

---

# 55. PRODUTO FINAL

O objetivo final é:

## PANDEMIC EVOLUTION

Um jogo onde:

### GAMEPLAY

é profundo.

### EVOLUTION

é emergente.

### PvP

é competitivo.

### AI

é adaptativa.

### WORLD

é reativo.

### SEASONS

mantêm o jogo vivo.

### WEB3

oferece ownership.

### USDC

permite economia real.

### MARKETPLACE

permite comércio.

### REFERRAL

cria crescimento orgânico.

### TREASURY

financia o ecossistema.

### TOURNAMENTS

criam competição.

### GUILDS

criam comunidade.

### LIVING ASSETS

criam história.

---

# 56. VISÃO ECONÓMICA FINAL

```text
                 PLAYERS
                    │
          ┌─────────┴─────────┐
          │                   │
       GAMEPLAY            REFERRAL
          │                   │
       DNA / XP             5%
          │                   │
       RANKED              REFERRER
          │                   │
       SEASONS               │
          │                   │
       ACHIEVEMENTS           │
          │                   │
          └─────────┬─────────┘
                    │
                  WEB3
                    │
          ┌─────────┼─────────┐
          │         │         │
        ASSETS    USDC    TROPHIES
          │         │         │
          └─────────┼─────────┘
                    │
               MARKETPLACE
                    │
                 FEES
                    │
                TREASURY
          ┌─────────┼──────────┐
          │         │          │
       REWARDS   DEVELOPMENT  EVENTS
          │         │          │
          └─────────┼──────────┘
                    │
               MORE PLAYERS
                    │
                    ▼
              MORE COMPETITION
                    │
                    ▼
                MORE VALUE
```

---

# 57. PRINCÍPIO FINAL

A economia deve servir o jogo.

O jogo não deve existir apenas para alimentar a economia.

A ordem de prioridade é:

**1. FUN — o jogo tem de ser divertido.**

**2. SKILL — o resultado depende do jogador.**

**3. RETENTION — o jogador quer voltar.**

**4. COMPETITION — existe motivo para melhorar.**

**5. COMMUNITY — existem jogadores para enfrentar.**

**6. WEB3 — existe ownership real.**

**7. ECONOMY — existe comércio sustentável.**

**8. TOKEN — apenas se realmente fizer sentido.**

---

# 58. TAGLINE CONCEPTUAL

> **EVOLVE. ADAPT. DOMINATE. OWN YOUR LEGACY.**

O objetivo não é criar simplesmente outro jogo Web3.

É criar um **jogo de estratégia global que consegue funcionar sem Web3 e que fica melhor quando o jogador decide utilizá-lo.**

---

# 59. [v1.1] TRABALHO EM ABERTO

Itens explicitamente adiados, por prioridade:

### Modelação económica (adiado por decisão do projeto)

* cenários de simulação (conservador / base / otimista) com premissas de DAU, % pagadores, ARPU, ticket médio, velocidade de troca;
* **token $PEVO:** supply, emissão, preço de venda primária, vesting, política de queima;
* **hold gate:** rever o limiar 10k em função do preço do token;
* **PvE stake:** stake min/max, RTP alvo (85–90%), valor do ponto, caps por conta/dia;
* **PvP stake:** fee definitiva (proposta 5%), distribuições top-K;
* fee definitiva do marketplace (5% / 7.5% / 10%);
* dinâmica fina da W-REFERRAL na modelação (E3);
* preço e raridades dos nomes animados; destino dos tokens (Treasury vs. queima);
* design de emissão de assets: mercado primário, drops, papel dos Research Assets (crafting?), royalties secundárias;
* modelo sink/source completo (spenders / earners / traders);
* fórmula do reward ratio;
* orçamento da W-REWARDS para reforços de payout em eventos.

### Game design

* one-pager completo dos verbos Humanity no EMBATE (D8);
* FTUE / onboarding e primeira sessão;
* loops de retenção fora das seasons (missões, progressão diária);
* calibração dos parâmetros de vitória/derrota (§15) via simulador AI-vs-AI;
* decisão Nanovirus (manter / fundir / cortar) com dados de balance (D11);
* design de escalada/anti-softlock em detalhe (§14.3).

### Legal / operações

* parecer por mercado sobre torneios pagos (gate Phase 10);
* enquadramento dos modos de stake (aposta/skill-gaming) por jurisdição, com geofencing (§60.5);
* enquadramento da embedded wallet / custódia (gate Phase 7);
* análise MiCA para assets e eventual token futuro;
* política de retenção de dados e base legal concretas (§46.1);
* idade-alvo e age-gate;
* governança do Treasury (entidade, multisig, transparência — §29);
* regras de Treasury de guild e dissolução (§35);
* tratamento fiscal de rewards para jogadores (disclosure).

---

# 60. [v1.2] ECONOMIA DE STAKE

Detalhe completo em `ECONOMY-v1.0.md`. Resumo normativo:

## 60.1 WALLET CONNECTION GATE (E1)

* conectar wallet exige **hold ≥ 10.000 $PEVO** na wallet do jogador;
* sem hold suficiente, o jogo apresenta o **endereço do token** (contrato/mercado) para compra;
* sem wallet conectada o jogo mantém-se jogável em modos **sem stake** (game first);
* todos os modos com stake e o marketplace exigem wallet conectada → ficam indiretamente sujeitos ao hold.

## 60.2 PvE COM STAKE (E2 — híbrido)

* jogador entra com stake X em USDC (min/max por parâmetro);
* ganha pontos durante a partida; no fim, `payout = pontos × valor_do_ponto`;
* **base:** pool RTP — payouts saem das stakes cobradas, com RTP alvo (85–90%); o rake resultante é fee (§31);
* **reforço:** W-REWARDS pode complementar payouts apenas em eventos/seasons, com orçamento aprovado previamente; nunca cobre deficits estruturais;
* anti-farming obrigatório: seed aleatória por partida, dificuldade adaptativa, retornos decrescentes, cooldowns, idade de conta, risk scoring, payouts pendentes.

## 60.3 PvP COM STAKE

* pot por partida em USDC **ou** $PEVO (uma moeda por partida); cada jogador aposta o que quiser dentro dos limites;
* fee (proposta 5%) → distribuição §31; vencedor(es) levam o resto (distribuição top-K publicada antes da partida);
* **ARENA (com stake) é separada de RANKED (gratuito)** — o MMR oficial não envolve dinheiro;
* win-trading = transferência direta de valor: payouts pendentes + revisão + fingerprinting obrigatórios.

## 60.4 NOMES DE PERFIL ANIMADOS

* comprados por X $PEVO (parâmetro; ex.: 500); efeito **apenas visual** (princípio D4 intacto);
* tokens → W-TREASURY por defeito (queima como alternativa na modelação).

## 60.5 GATES

* modos com stake: **18+**, parecer jurídico por mercado, geofencing;
* token: MiCA antes de venda primária;
* devnet-first para toda a infraestrutura de wallets/splits.

---

*Fim da Master Specification v1.2.*
