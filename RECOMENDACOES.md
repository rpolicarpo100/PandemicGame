# RECOMENDAÇÕES — revisão crítica (2026-09-07)

Baseado em **medição real** desta sessão (QA completo: 53/53 checks em smoke+concorrência+balance, e2e de partida completa jogada pelo protocolo HTTP até ao fim, UI browser headless 12/12 sem erros de consola). Nada aqui é opinião sem dado.

## 0 · Estado verificado (evidências)

| Métrica | Valor medido |
|---|---|
| Requisições/sessão de QA | 151 HTTP · 19 sessões SSE · pico 5 simultâneas |
| Latência p95 `/state` | 1,4 ms (local) · 0 erros 5xx |
| Partida e2e real | WIN · dia 187 · inf 65,8% · 95 s wall-clock (speed 4) |
| Bot balance (2 corridas cada) | smart 1/2 · cheap 1/2 · dumb 0/2 |
| Wallet dev (mainnet) | saldo SOL real lido da blockchain (RPC mainnet-beta) |
| Código | 2 593 linhas em `game/`, 0 dependências |

## 1 · CRÍTICO — resolver antes de playtest com 10–20 jogadores

**P0.1 — O servidor tem UM único mundo global.**
`G` é um estado único partilhado por **todas** as ligações: qualquer jogador que faça `newgame`
destrói o jogo de todos os outros (provado no QA `concurrency.mjs` com 2+ sessões).
Implicações: sem economia por jogador, sem PvP possível, telemetria "por jogador" é ambígua.
**Proposta:** refactor para *salas*: `G` por sessão SSE (id de sala no handshake `/events?room=…`
ou criada no `newgame`), com 1 simulação por sala. É a mudança estrutural mais importante do projeto.

**P0.2 — Balance pós-"aperto v2" parece demasiado duro para bots básicos.**
Nas corridas, os bots com estratégia ganham ~metade das vezes e o "dumb" **nunca** vence —
todos os jogos sem vitória acabam em "A HUMANIDADE RESISTIU" com vacina a 100%.
Compara com o README (cheap ~38%, smart ~60%): amostra pequena, mas há sinais de que o
relógio+resposta humana esmaga builds lentas. **Proposta:** antes do playtest aberto, fazer
matriz de calibração com o `qa/balance.mjs` (aumentar corridas para ≥5/estratégia) e suavizar
a curva de deteção nos dias 60–120; validar com jogadores reais a seguir.

**P0.3 — Sem rate-limit nem autenticação em `/action`.**
Qualquer cliente pode spammar `newgame`/`evolve` e resetar o mundo (ver P0.1) ou forçar ticks.
**Proposta:** limite simples por IP (ex.: 20 ações/10 s → 429) assim que existirem salas.

## 2 · DEV CONSOLE — próximos passos (P1)

- **Proteger `/dev` em produção**: definir `DEV_ACCESS_KEY` no Render (hoje está público).
- **Persistência real**: hoje a telemetria vive em memória + `/tmp` (volátil em redeploy).
  Com histórico a sério: `DEV_DATA_FILE` em volume ou exportar agregados para Postgres grátis do Render.
- **Alertas**: webhook/slack quando `5xx > 0`, quando o health score cai > 20 pontos, ou
  quando `sse.peak` atinge limites (sinal de playtest a começar).
- **MAIS KPI com valor** (fase 2): retenção D1/D7 (precisa de identificador persistente —
  cookie anónimo, nunca wallet), funil home→/play→seed→win, e distribuição de duração de partida
  (hoje: só média).
- **Crítica honesta que mantenho**: o health score com peso `segurança=30/100` quando não há
  `DEV_ACCESS_KEY` faz o score parecer baixo de propósito — é intencional (incentivo a proteger);
  documentado no código.

## 3 · Qualidade & segurança (P1/P2)

- Zero dependências é uma fortaleza — manter enquanto for possível; se crescer, pin versions e usa `npm ci`.
- Adicionar `package.json` em `game/` (mesmo sem deps) para o build do Render deixar de depender
  do workaround `npm install || true` — e para fixar a versão de Node (engines).
- Testes: promover `qa/run-all.mjs` para CI (GitHub Actions) a cada push — custo ~0, valor alto.
- Considerar remover o `user-agent` do registo de sessões (privacidade) ou truncá-lo a 60 chars.

## 4 · Visão (onde isto vai parar)

1. **Agora:** fix de salas (P0.1) → playtest 10–20 jogadores a sério, com o dev console ao lado
   (o dashboard já mostra sessões ao vivo, partidas, balance e wallet em tempo real).
2. **Phase 2 (SPEC v1.2):** campanha PvE; o DEV CONSOLE ganha KPI de campanha (progresso por capítulo).
3. **Web3 (Phase 7):** quando o contrato $PEVO existir em devnet, o painel da wallet passa de
   "saldo SOL real" para carteira do jogo: `$PEVO` detidos, stake, hold-gate 10k — os KPI económicos
   de DNA de hoje são o embrião do painel da economia tokenizada de amanhã.
4. **Visionário mas barato:** ligar o `health score` ao uptime do Render (ping externo) e abrir
   `/api/dev/overview` (com chave) a um "war-room" partilhado com a equipa.

## 5 · Para desbloquear deploy

As alterações estão prontas localmente mas **ainda não foram para o GitHub** (sem chave de escrita
no repo — a deploy key criada nunca foi adicionada em
`Settings → Deploy keys` do repositório). Depois de adicionada com "Allow write access", faço
commit + push e o Render auto-deploya; confirmo `/dev` live.
