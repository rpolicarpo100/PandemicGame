# PANDEMIC EVOLUTION

## MASTER GAME, GAMEPLAY, WEB3 & ECONOMY SPECIFICATION

**Status:** Master Design Specification
**Blockchain:** Solana
**Primary Currency:** USDC
**Platform:** Web
**Genre:** Global Strategy / Simulation / PvP / PvE / Web3
**Business Model:** Free-to-Play + Optional Web3
**Core Principle:** GAME FIRST → COMPETITION → RETENTION → WEB3 → ECONOMY

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

O jogo terá 11 agentes desde o desenho inicial.

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

### 6. NANOVIRUS

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

---

# 13. GAME MODES

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

# 14. RANKED

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

---

# 15. SEASONS

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

---

# 16. WEB3 PHILOSOPHY

O Web3 deve seguir:

> PLAY → COMPETE → CONQUER → OWN → TRADE → REFER

Não:

> DEPOSIT → FARM → SELL → EXIT

A blockchain deve acrescentar valor ao jogo.

---

# 17. SOLANA

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

# 18. WEB3 ASSETS

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

---

# 19. LIVING ASSETS

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

---

# 20. REPUTAÇÃO ON-CHAIN

Achievements especiais podem tornar-se verificáveis.

Exemplo:

WORLD ENDER
FIRST SEASON CHAMPION
100 RANKED WINS
MASTER OF STEALTH
UNKNOWN DISCOVERER

Alguns podem ser non-transferable.

Funcionam como reputação.

---

# 21. USDC

USDC será a principal unidade económica Web3.

Usos possíveis:

* marketplace;
* compras;
* determinados eventos;
* determinados torneios;
* assets;
* taxas.

USDC não deve controlar o gameplay.

---

# 22. MARKETPLACE

Permitir negociar:

* agents;
* cosmetics;
* trophies;
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

# 23. MARKETPLACE FEES

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

# 24. REFERRAL SYSTEM

Sistema de referência de 1 nível.

PLAYER A
↓
REFERRAL
↓
PLAYER B

Quando B gerar receita elegível:

> A recebe 5%.

Exemplo:

B gera:

100 USDC

↓

5 USDC → A

95 USDC → distribuição económica normal

---

# 25. SEM REFERENCIADOR

Se B não possuir referenciador válido:

5%

→ TREASURY.

Portanto:

REVENUE
↓
REFERRAL ALLOCATION
├── Referral exists → 5% REFERRER
└── No referral → 5% TREASURY

---

# 26. REFERRAL RULES

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

A lista de receitas elegíveis deve estar definida no sistema económico.

---

# 27. TREASURY

O Treasury recebe:

* marketplace fees;
* receitas;
* 5% de referral sem referenciador;
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

---

# 28. TREASURY SECURITY

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

# 29. REVENUE DISTRIBUTION

Modelo inicial para modelação:

| Destino                      |        % |
| ---------------------------- | -------: |
| Referral                     |       5% |
| Competitive Rewards          |      20% |
| Treasury                     |      25% |
| Development / Infrastructure |      20% |
| Ecosystem / Community        |      15% |
| Marketing / Growth           |      10% |
| Reserve / Risk               |       5% |
| **Total**                    | **100%** |

IMPORTANTE:

Esta tabela é um modelo inicial.

Antes do lançamento deve existir uma simulação económica real com diferentes volumes.

---

# 30. EXEMPLO

Receita elegível:

100 USDC

Referral:

5 USDC

Restante:

95 USDC

A distribuição final deve respeitar o modelo económico definido pelo sistema.

Se não existir referral:

5 USDC adicionais para Treasury.

---

# 31. TOURNAMENTS

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

Exemplo conceptual:

100 jogadores × 5 USDC

Pool:

500 USDC

A distribuição deverá ser definida previamente.

Não lançar esta funcionalidade em produção sem validação jurídica/regulatória aplicável.

---

# 32. TOURNAMENT SECURITY

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

---

# 33. GUILDS

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

---

# 34. PAY-TO-WIN — PROIBIDO

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

---

# 35. ECONOMIA INTERNA

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

# 36. TOKEN PRÓPRIO

NÃO lançar token próprio no início.

Primeiro:

GAME
↓
PLAYERS
↓
RETENTION
↓
PVP
↓
SEASONS
↓
WEB3
↓
MARKETPLACE
↓
TRACTION
↓
TOKEN?

Só criar token se existir uma necessidade económica real.

Nunca criar token apenas para:

* especulação;
* financiar desenvolvimento;
* reward farming;
* marketing.

---

# 37. FUTURO TOKEN

Se no futuro existir:

$PEVO

ou outro nome original.

Possíveis funções:

* ecosystem utility;
* crafting;
* determinadas taxas;
* guild utilities;
* eventos;
* governance limitada.

Oferta, distribuição, emissão e eventual lançamento devem ser definidos apenas após análise económica, jurídica e fiscal.

---

# 38. ANTI-FARMING

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

# 39. ANTI-CHEAT

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

---

# 40. STACK TECNOLÓGICA

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

---

# 41. ARQUITETURA

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

---

# 42. DATABASE CONCEPTUAL

Principais entidades:

users
profiles
agents
agent_builds
matches
match_players
regions
evolution_nodes
evolution_choices
dna_transactions
rankings
seasons
achievements
trophies
assets
marketplace_listings
marketplace_sales
referrals
referral_rewards
tournaments
tournament_players
treasury_transactions
wallets
risk_events
audit_logs

---

# 43. ECONOMIC ENGINE

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

---

# 44. AUDIT LOG

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

Nunca apagar histórico económico.

---

# 45. DEVNET FIRST

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

# 46. FASES DE DESENVOLVIMENTO

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

---

## PHASE 4 — EMBATE

Implementar:

Agent vs Humanity.

---

## PHASE 5 — ADVANCED AGENTS

Ativar:

Bioengineered
Supervirus
Synthetic
Evolved
Unknown

Depois de validar balanceamento.

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

economic tournaments, somente após validação.

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

---

## PHASE 13 — SCALE

Load testing.

Target conceptual:

1k
→ 10k
→ 100k+

Não assumir capacidade antes de medir.

---

# 47. MÉTRICAS PRINCIPAIS

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

# 48. BALANCEAMENTO

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

---

# 49. MONETIZAÇÃO

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

# 50. PRINCÍPIOS ABSOLUTOS

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

USDC before proprietary token.

### 13.

Devnet before mainnet.

### 14.

Test before deploy.

### 15.

Measure before scaling.

---

# 51. REGRA DE REALIDADE

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

# 52. DEFINIÇÃO DE "DONE"

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

# 53. PRODUTO FINAL

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

cria competição.

### GUILDS

criam comunidade.

### LIVING ASSETS

criam história.

---

# 54. VISÃO ECONÓMICA FINAL

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

# 55. PRINCÍPIO FINAL

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

## TAGLINE CONCEPTUAL

> **EVOLVE. ADAPT. DOMINATE. OWN YOUR LEGACY.**

O objetivo não é criar simplesmente outro jogo Web3.

É criar um **jogo de estratégia global que consegue funcionar sem Web3 e que fica melhor quando o jogador decide utilizá-lo.**
