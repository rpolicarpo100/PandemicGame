# RECOMENDAÇÕES CRÍTICAS — 2026-09-07

Análise de produto/operação/segurança do estado atual (post agentes/árvores).
Ordenadas por impacto × probabilidade. Cada item indica o facto observado no
código, o risco concreto e a ação mínima recomendada.

---

## CRÍTICO

### C1 — "Multiplayer" sem salas: o mundo é um só para todos os visitantes
**Facto**: `server.js` tem um único `G` global; `concurrency.mjs` regista-o como
"EXPECTED (sem salas)". Qualquer pessoa que abra `/play` joga **o mesmo jogo em
que toda a gente está**. Consequências diretas:
- Um visitante pode clicar em "Novo briefing" e **destruir a partida de outro**.
- O jogo fica **em pausa para o mundo inteiro** enquanto um `pendingEvent`
  espera escolha de um único utilizador.
- Spam de `POST /action` (sem rate-limit nem autenticação) é um DoS trivial.
**Ação**: estado por sessão — mínimo viável: `G` por cookie/sessão (mapa
`games[sessionId]`), 1 linha de middleware; mantém o mundo único para o teu
próprio ecrã e abre caminho a "salas" com código. Esforço: **médio** (meio dia).

### C2 — Persistência efémera: toda a telemetria morre a cada deploy
**Facto**: `dev.js` guarda em `os.tmpdir()/pevo-dev-telemetry.json` (Render:
disco efémero, limpo a cada restart/deploy). O ledger (score, agente,
cenário) e os KPIs do `/dev` — a única fonte para calibrar com humanos —
**não sobrevivem** a um deploy. Neste momento a produção já perdeu o histórico
de todas as rondas anteriores.
**Ação**: mover o ficheiro para um volume persistente da Render (ou variável
`DEV_DATA_FILE` a apontar para disco) + dump periódico. Esforço: **baixo** (uma
variável + config), mas **desbloqueia toda a estratégia de dados** (R9).

### C3 — Chave privada de deploy dentro do workspace + auto-deploy cego
**Facto**: `/home/user/pandemicgame_deploy_key` (SSH do GitHub) vive na raiz do
workspace, que é persistido/sincronizado; o repositório `main` faz auto-deploy
na Render. Quem aceda ao workspace consegue **fazer push de código para
produção** (supply chain).
**Ação**: mover a chave para fora do workspace (ex.: segredo do ambiente de
deploy) e trocar o push por **Deploy Hook da Render com token** (não depende de
chave SSH no workspace). Esforço: **baixo**.

### C4 — `/dev` e `/api/*` públicos (accessKey=OFF) — sem segredo nenhum
**Facto**: o arranque imprime `accessKey=OFF (público)`; `/api/dev/overview`
devolve métricas de wallet/telemetria sem qualquer autenticação.
**Ação**: ativar `accessKey` antes de campanhas/público; hoje só é aceitável
porque o jogo é uma demo. Esforço: **baixo**.

---

## ALTO

### A1 — Crash = perda total (sem handlers, estado só em memória)
**Facto**: sem `uncaughtException`/`unhandledRejection`; um NaN ou erro num
tick derruba o processo e **o mundo inteiro desaparece** (Render reinicia com
`newGame()`).
**Ação**: handler de exceção que faça `endGame(false,'servidor')` + persistência
do estado (liga-se a C2); snapshot periódico do mundo para recuperação.
Esforço: **médio**.

### A2 — Iron continua sem vitória possível (decisão em aberto desde a R1)
**Facto**: 0/10 bots; teto mecânico ~86–89% (vacina aos 100% ~d150 + cura dos
sobreviventes). É conteúdo "premium" morto para 99% dos jogadores.
**Ação**: decidir — (a) barra própria ~90% no iron, (b) evento de degradação de
tratamentos no fim, ou (c) rotulá-lo "INFERNO". Sem decisão, não mexer mais no
pacing. Esforço: **baixo** qualquer das opções.

### A3 — Calibração exclusivamente por bots (sem humanos, amostras curtas)
**Facto**: QA de balance usa n=2 (ruído puro: 0%–80% indistinguíveis); não há
win rate humano por cenário/agente a alimentar o pacing.
**Ação**: n≥6 no `balance.mjs`; export do ledger (CSV/JSON) + mini-dashboard no
`/dev` (win rate, dias mediana, distribuição de score por cenário×agente).
Esforço: **médio** (o ledger já tem tudo desde o S4).

### A4 — Bot do e2e diverge do `SMART_PRIO` do servidor
**Facto**: o e2e tem política própria (prefs + letal aos 45%); o balance usa o
`--simtest`. Duas fontes de verdade → o CI pode passar com um bot que não
representa o balance.
**Ação**: exportar a política para `lib/bot.mjs` partilhado. Esforço: **baixo**.

---

## MÉDIO (retenção/UX)

### M1 — Score sem persistência local
**Facto**: o score existe no ecrã final e no ledger (volátil, C2), mas nada fica
no browser — zero motivação de "bater o meu recorde".
**Ação**: top-10 local (localStorage) com cenário/agente/dia/score + medalha do
rótulo. ~30 linhas. Esforço: **baixo**.

### M2 — O novo jogador não sabe que 65% NÃO é vitória
**Facto**: o wire anuncia PANDEMIA GLOBAL aos 65%, mas o HUD não muda de
objetivo; jogadores podem achar que venceram e abandonar.
**Ação**: ao marco de 65%, banner HUD "FASE 2 — agora elimina 95% da
humanidade" + contador de mortos a subir de tom. Esforço: **baixo**.

### M3 — Fleet/densidade sem regra por ecrã pequeno
**Facto**: 320 veículos fixos; em ecrãs pequenos (telemóvel) o mapa fica
carregado. **Ação**: `buildFleet` escalar por `min(cv.width,900)` (medido:
60 fps a 1500px — há folga). Esforço: **baixo**.

---

## Resumo executivo

| # | Tema | Risco | Esforço |
|---|------|-------|---------|
| C1 | Salas/sessões | Griefing + pausas globais + DoS | Médio |
| C2 | Persistência (/tmp) | Perda total de telemetria e histórico | Baixo |
| C3 | Chave no workspace | Supply chain | Baixo |
| C4 | API pública | Exposição de métricas | Baixo |
| A1 | Crash = perda do mundo | Fiabilidade | Médio |
| A2 | Iron sem vitória | Conteúdo morto | Baixo |
| A3 | Balance só de bots | Pacing errado p/ humanos | Médio |
| A4 | Dois bots divergentes | CI enganador | Baixo |

**Ordem sugerida**: C2 → C3/C4 (5 min cada) → C1 → A1/A3. C2 e C3 são quase
gratuitos e protegem o que já está construído; C1 é a decisão de produto mais
estrutural (single-player por sessão vs salas) e deve ser tomada **antes** de
crescer o público.

---

## Feito nesta ronda (pedido "mais tráfego")
- Frota 136 → **320 veículos** (105 aéreos / 75 marítimos / 140 terrestres),
  priorizando as rotas de maior tráfego (soma de populações).
- **Rastos de movimento** (linha esbatida na direção) — o trânsito lê-se com
  direção; vermelho continua = rota contaminada.
- Medido em browser real: **60,9 fps** a 1500×950 (folga para M3).

---

## ESTADO — ronda "faz todas" (implementado a 2026-09-07)

Todas as recomendações C1–C4 / A1–A4 / M1–M3 implementadas, com QA verde
(75/75 headless+UI + 15/15 UI extra) e produção atualizada.

| # | Ação | Implementação | Evidência |
|---|------|---------------|-----------|
| C1 | Mundos por sessão | `SESS` map por cookie `pev_sid`/`?sid=` em `server.js`; rate-limit 60 act/10s por sessão; evicção LRU (96); bot do `simTest` continua headless sem sessões | `qa/concurrency.mjs` reescrito: 12/12 (5 SSE isoladas, B/C não afetam A, `?sid=` coerente) |
| C2 | Telemetria sobrevive a deploy | `DEV_DATA_FILE`/`SAVE_FILE` por env (caminho persistente na Render, a definir no painel); snapshot de mundos + telemetria periodicamente | docs em `game/README.md`; export CSV |
| C3 | Chave fora do workspace | chave movida para `~/.ssh/` (600) + `.gitignore` `pandemicgame_deploy_key*` e `.ssh/`; push continua a funcionar | `git ls-remote` OK |
| C4 | `/dev` e `/api/*` autenticados | `DEV_ACCESS_KEY`/`DEV_ADMIN_KEY`; em Render sem env gera chave efémera e imprime no log | prod `/api/dev/*` → 401 sem chave |
| A1 | Crash-safe | handlers `uncaughtException`/`unhandledRejection` + snapshot ≤15 s e no exit; `restoreWorld()` ao arranque | log de boot "restauradas N sessões" |
| A2 | Iron decidido | barra própria **≥90%** + evento de **colapso** aos 65% infetados (cura ×0.30, vacina ×0.25, fechos anulados); base/silent/rush mantêm ≥95% | bots smart iron **2/8 vitórias** (d182/d236); antes 0/10, tetos 83–94% |
| A3 | Balance com mais reps + dashboard | `balance.mjs`: dumb2/cheap4/smart4 (+3 iron info); export `/api/dev/export` (CSV do ledger) | balance 7/7; pacing mantido (smart standard 3/4, cheap 2/4) |
| A4 | Bot único | `game/lib/bot.cjs` (SMART_PRIO/LETH/seed) usado por `server.js --simtest`, `qa/e2e-game.mjs` e `qa/agents.mjs` | silent smart d191/835 ≈ medição anterior |
| M1 | Top-10 local | localStorage `pevo.top10` + painel no fim com ★ NOVO RECORDE | UI: entries gravadas, persistente entre rondas |
| M2 | Banner FASE 2 | aos 65% de infetados: banner "FASE 2 — OBJETIVO FINAL: EXTINÇÃO ≥X%" (9 s), reset no novo briefing | UI: visto e screenshot `phase2_banner.png` |
| M3 | Frota por ecrã | frota escala com `min(cv.width,900)/900` (0.55–1.0) | UI: 320 (largo) → 176 (700px); 60,9 fps mantido |

### Notas de operação (Render, ação manual de 2 min)

1. No painel da Render define `DEV_ACCESS_KEY` (e `DEV_ADMIN_KEY`) com valor
   fixo — até lá o servidor gera uma efémera e imprime-a no log.
2. (Opcional) `DEV_DATA_FILE`/`SAVE_FILE` para um disco persistente
   (ex.: `/var/data/…`) — sem isso a telemetria/mundos resetam no redeploy.
3. (Opcional) Substituir a chave SSH por Deploy Hook da Render + segredo GitHub,
   e remover `~/.ssh/pandemicgame_deploy_key` do ambiente.
