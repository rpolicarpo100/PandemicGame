# ROADMAP — PANDEMIC EVOLUTION

Atualizado: 2026-09-08 · Alinhado com a SPEC v1.2 (fases) e o estado real do código e da operação.

## Estado atual (vertical slice)

**O jogo está jogável em produção** (`https://pandemic-game-fc1f.onrender.com`), com:
mundo por sessão, 6 agentes, 9 árvores genéticas (53 nós), 3 cenários PvE, Humanity AI
adaptativa, score 0–1000 com top-10 local, medalhas por desempenho, dev console com
telemetria/win-rate e QA automático (CI a cada push) — e, desde a **rev 1.4**, o
**modo VIRUS (PvP 2–6 operadores)** em `/pvp` com salas, lobby e score composto (§15.2).

---

## Fases (fonte: SPEC v1.2 — PHASE 0 a 12)

### PHASE 0–1 · Design + Core game — ✅ entregue
- GDD, world real (179 regiões, 13.426 rotas), simulação server-authoritative zero-deps.
- **Vertical slice validado**: gate da Phase 1 ("10–20 jogadores") **cumprido por QA de bots
  + CI** (a SPEC pedia validação com jogadores reais — playtest aberto continua a ser o
  próximo passo de produto).
- Infra da fase: sessões por cookie (C1), snapshot crash-safe (A1), dev console autenticado
  (C4), telemetria configurável (C2), bot único de balance (A4), QA 101/101 + GitHub Actions.

### PHASE 2 · PvE — 🟡 em curso (cenários ✅ · campanha ⬜)
- Cenários **Silent Dawn / Global Rush / Iron World** jogáveis e calibrados:
  - Silent/rush: objetivo ≥95%; iron: barra própria **90%** + colapso da resposta humana
    aos 65% infetados (decisão A2 — bots vencem ~2/8; é suposto ser raro).
- **Próximo**: campanha PvE por capítulos (estado, escolhas, desbloqueios).

### PHASE 3 · Virus PvP — ✅ entregue (v0; SPEC §15.2)
- Motor multi-agente novo (`game/lib/pvp.cjs`, zero deps) **isolado do PvE** (que não regrediu:
  QA 101/101 verde no mesmo commit).
- 2–6 operadores no **mesmo mundo** (179 regiões/13.426 rotas): frações `infx`/`deadx` por
  jogador em cada região, stats/DNA/owned próprios, Humanity única a reagir aos totais.
- Salas com código (6 chars sem I/L/O/0/1) · lobby com agente único + região de origem única +
  READY · início e relógio (0/1/2/4/8×) só pelo anfitrião · fim por relógio 300 dias, 1 vivo,
  extinção humana ou erradicação total.
- **Score composto 1000 pts** (nunca “quem matou mais”): infecção 200 · presença/first-infection
  250 · objetivos 100 · sobrevivência 150 · eficiência de evolução 200 · achievements 100;
  empates por eficiência → sobrevivência; erradicados mantêm o score; ranking no ecrã.
- UI `/pvp` (lobby → jogo → ranking), SSE por sala com payload lite, QA de bots headless 2/3/4/6
  jogadores + fluxo HTTP + browser 3 jogadores + fim real por relógio.
- ⚠️ **Salas em memória** (reinício do servidor fecha-as) — snapshot de salas é o próximo passo
  natural junto com o disco persistente.
- **Phase 4 — Embate (1v1 assimétrico)**: informado pelo `refuse`/zoonose/`civil_unrest` já
  implementados (táticas anti-Humanity) — 🔵 futuro.
- **Phase 5 — Advanced Agents**: Unknown/Evolved — ativados com tooling de balance com dados
  reais (SPEC v1.1-D11; NANOVIRUS revisto) — 🔵 futuro.
- **Phase 6 — Ranked**: MMR + seasons de 30 dias, sem dinheiro na competição — 🔵 futuro.

### PHASE 7 · Solana — 🟡 em curso (wallet ✅ · token ⬜)
- Wallet Phantom real na home (leitura on-chain mainnet) e dev console com saldo SOL real.
- Contrato **$PEVO não emitido**: devnet primeiro; gate jurídica (D6) antes do mainnet.
- Hold gate: 10.000 $PEVO (ECONOMY-v1.0) — economia desenhada, não ativa.

### PHASE 8–12 · Web3 — 🔵 futuro (sem data; dependem da validação do gameplay)
- 8 Marketplace · 9 Referral (1 nível, sem MLM) · 10 Tournaments · 11 Guilds · 12 Living Assets.

---

## Operação & qualidade (vivo)

| Item | Estado |
|---|---|
| Deploy | Auto-deploy Render no push ao `main` (CI obrigatório a correr antes) |
| Autenticação dev | `DEV_ACCESS_KEY`/`DEV_ADMIN_KEY` fixas **ativas em produção** |
| Persistência | ⚠️ falta disco persistente no Render (telemetria/mundos perdem-se no redeploy) |
| Alertas | `DEV_WEBHOOK_URL` opcional (boot/5xx/crash) — por configurar |
| CI | GitHub Actions: smoke+concurrency+balance+agents+e2e a cada push (~45 s, verde) |
| QA local | `cd qa && npm i && npx playwright install chromium && node qa/run-all.mjs --full --ui` (PvE) · `node qa/pvp-http.mjs && node qa/pvp-ui.mjs && node qa/pvp-end.mjs` (PvP) |

## Próximos passos sugeridos (por prioridade)

1. **Playtest aberto** (gate formal da Phase 1) com o dev console a medir win rate humano
   por cenário — é a alavanca R9 que guia a próxima calibração (o PvP precisa de jogadores
   reais para afinar pacing do relógio e pesos do score).
2. **Disco persistente** na Render (1 clique no dashboard) + `DEV_DATA_FILE`/`SAVE_FILE`
   (fecha também a ⚠️ de salas PvP em memória).
3. Campanha PvE (Phase 2) — primeiro conteúdo a sério depois do playtest.
4. Embate (Phase 4) e teste social do VIRUS (convites, 2–6 na mesma sala).
