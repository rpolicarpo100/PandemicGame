# DEV CONSOLE — Documentação técnica

Dashboard do desenvolvedor para o **Pandemic Evolution** (vertical slice `game/`).
Tudo o que mostra é **medido em runtime** — nenhum número inventado.

## Acesso

| Rota | Descrição |
|---|---|
| `GET /dev` | Página do DEV CONSOLE (dashboard HTML) |
| `GET /api/dev/overview` | Todos os KPIs num JSON (refresh 4 s no UI) |
| `GET /api/dev/wallet` | Wallet do dev + saldo SOL real (mainnet, cache 120 s) |
| `GET /api/dev/code` | Métricas de código + dados do repo GitHub (cache 15 min) |
| `POST /api/dev/reset` | Repõe contadores a zero (requer `DEV_ADMIN_KEY`) |

- **`DEV_ACCESS_KEY`** (env, opcional): se definida, `/dev` e `/api/dev/*` exigem `?key=…` ou header `x-dev-key`.
- **`DEV_ADMIN_KEY`** (env, opcional): exigida no reset.
- **`DEV_WALLET`** (env, opcional): wallet mostrada; default `8biEDVUUh21injn4HXkmtRtmkiMzdtoeEXxKE5NLE4LH`.
- **`DEV_DATA_FILE`** (env, opcional): ficheiro de telemetria; default `${TMP}/pevo-dev-telemetry.json`.

## KPI — definições (todas reais)

**Económicos (in-game DNA)**
- `game.dnaSpent` — DNA gasto acumulado em evoluções (hook no `evolve`).
- `game.evolves` / `game.perNode` — nº de evoluções e top nós comprados.
- `ledger[]` — registo de cada partida: cenário, resultado (win/lose/abandoned), dia, `inf%`/`dead%`
  (vs. `WORLD_POP` de `data.js`), nós, builds, DNA final, duração wall-clock.
- `scenarioStats` — por cenário: escolhidos (`games`), semeados (`starts`), vitórias/derrotas, win rate.

**Utilizadores & tráfego** (privacidade: IPs anonimizados — último octeto a zero; UA truncado)
- `sse.active/peak` — sessões SSE agora e pico histórico (cada `/events` = 1 sessão de jogo).
- `sessionsToday/sessionsTotal`, `avgSec` — duração média.
- `views` — derivado dos contadores por rota (`/`, `/play`=hub, `/pve`, `/pvp`, `/dev`).
- `returningIps` — IPs anonimizados com ≥2 sessões.
- `rings` — atividade por minuto (última hora, 60 bins) para os sparklines.

**Código & operação**
- `http.total/ok/clientErr/serverErr`, `byPath`, `p50Ms/p95Ms` (amostra das últimas 400 respostas).
- `ops.loopAvgMs/loopMaxMs` — custo do ciclo de simulação (bucket 500 ms do servidor).
- `ops.mem.rssMb/heapMb`, uptime, `node` (versão runtime).
- `code.local` — LOC por ficheiro de `game/` calculado no arranque; `code.repo` — estrelas/forks/issues
  do GitHub via API pública (cache 15 min; degrada para `ok:false` sem quebrar o dashboard).

**Wallet do dev (Solana)**
- Endereço + saldo **SOL real** lido de `api.mainnet-beta.solana.com` (fallback `solana-rpc.publicnode.com`),
  timeout 6 s, cache 120 s. Sem contrato on-chain: o dashboard diz isso — a economia $PEVO é roadmap (Phase 7).

**Health score (0–100)** — composto com pesos explícitos:
`uptime 20% + qualidade 25% + performance 15% + tração 15% + economia 10% + segurança 15%`.
- qualidade = `100 − 5xx% × 50` · performance = baseado no p95 · tração = sessões e partidas ·
  economia = atividade de DNA · segurança = `DEV_ACCESS_KEY` definida (senão 30).
Fórmula no código (`healthScore()` em `game/lib/dev.js`).

## Auto-crítica (findings em runtime)

O servidor expõe no próprio `overview.findings` os limites conhecidos detetados:
single-world global, wallet sem contrato, persistência volátil, free-tier, ausência de chave de acesso.

## Persistência e honestidade dos dados

- Estado agregado é guardado num JSON (30 s + no SIGTERM) e reposto no arranque — **mas** em instâncias
  free do Render o armazenamento é volátil: redeploys limpam. Para histórico duradouro: `DEV_DATA_FILE`
  num volume persistente (plano pago) ou exportar para Postgres/analytics.
- `ledger` e `sessions` são capados (300/200) para não crescer sem limite.

## Ferramentas de QA (ver `qa/README.md`)

`node qa/run-all.mjs [--full] [--ui]` → smoke + concorrência + balance (+ e2e partida completa / UI Playwright).
