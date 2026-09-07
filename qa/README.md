# QA — Ferramentas de auto-teste (Pandemic Evolution)

Testes **reais** do servidor e do jogo. Zero dependências (exceto o opcional UI/Playwright).

## Requisitos

- Node ≥ 18
- Servidor local a correr com a porta por omissão dos testes:

```bash
cd game
PORT=4000 DEV_ADMIN_KEY=testadm node server.js
# ou: PORT=4000 node game/server.js (a partir da raiz)
```

## Correr tudo

```bash
QA_BASE=http://127.0.0.1:4000 node qa/run-all.mjs        # smoke + concorrência + balance
QA_BASE=http://127.0.0.1:4000 node qa/run-all.mjs --full  # + e2e (partida completa até ao fim, ~2-4 min)
QA_BASE=http://127.0.0.1:4000 node qa/run-all.mjs --ui    # + UI browser (Playwright)
```

Relatório gerado: `qa/out/QA-REPORT.md`. Exit code ≠ 0 quando há falhas.

## O que cada um cobre

| Script | O que valida |
|---|---|
| `smoke.mjs` | Matriz de endpoints (`/`, `/play`, `/world.js`, fonts, 404), `/state` com 36 regiões e 3 cenários, SSE entrega frame JSON, ações autoritativas (bad action / bad region / unknown node / newgame / seed / evolve), `/dev` + `/api/dev/overview` com schemas, latência média <50 ms, zero 5xx |
| `concurrency.mjs` | 5 sessões SSE simultâneas, contagem e pico na dev API, **prova do mundo partilhado** (limitação single-world documentada), fecho limpo das ligações, IPs anonimizados |
| `balance.mjs` | Corridas headless do próprio servidor (`node server.js --simtest dumb\|cheap\|smart` ×2): sem crashes, schema do output, bot "dumb" nunca vence, relógio respeitado. Win rates = sinal de balance (INFO), não falha |
| `e2e-game.mjs` | Partida **completa pelo protocolo HTTP real** (speed 4, bot simples, cenário por env `E2E_SCENARIO`): chega a `result`, e a telemetria regista no ledger com métricas plausíveis (inf% ≤150%) |
| `ui.mjs` | Playwright headless: home/play/dev sem erros de consola, canvas do mapa presente, conteúdo do dashboard (KPIs, wallet, score). `--shots` grava PNGs em `qa/out/shots/` |

## UI com Playwright (opcional)

```bash
cd qa
npm i -D playwright
npx playwright install chromium        # ou: npx playwright install --with-deps chromium
cd ..
node qa/ui.mjs --shots
```

Sem Playwright instalado, o `ui.mjs` degrada para um *wiring check* estático honesto
(links, CSS vars, fetch relativo — nunca dá falso verde).

## Notas de rigor

- Os testes **não falsificam** nada: o e2e joga a sério (dias de jogo reais, speed 4).
- O `concurrency.mjs` **espera** o comportamento single-world atual e regista-o como limitação
  conhecida — quando o refactor para salas existir, este teste passa a exigir isolamento.
- `qa/out/` e `game/data/` estão em `.gitignore`.
