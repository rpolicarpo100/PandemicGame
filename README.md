# PANDEMIC EVOLUTION — Documentos do Projeto

| Ficheiro | Conteúdo | Estado |
|----------|----------|--------|
| `SPEC-v1.2.md` | **Master Specification atual** — v1.1 + integração da economia (hold gate 10k, stake modes, 5 wallets, nomes animados) | ✅ Ativa |
| `SPEC-v1.1.md` | Master spec com contradições resolvidas + decisões D1–D12 | 📁 Arquivo |
| `SPEC-v1.0.md` | Master Specification original (arquivo) | 📁 Arquivo |
| `SPEC.md` | Cópia da v1.0 (mantida para referência) | 📁 Arquivo |
| `REVIEW.md` | Revisão crítica da v1.0: 6 contradições, ~20 lacunas, 5 riscos legais, 12 perguntas | ✅ Concluída |
| `ECONOMY-v1.0.md` | **Economia v1.0** — decisões E1–E4 fechadas (hold gate 10k, stake PvE/PvP, 5 wallets, nomes animados) | ✅ Ativa |
| `ECONOMY-v0.1.md` | Rascunho inicial da economia | 📁 Arquivo |
| `ROADMAP.md` | **Roadmap consolidado** — fases SPEC 0–12 × estado real (código + operação), próximos passos | ✅ Ativo |
| `../qa/` | **QA headless keyless** (fora desta pasta): Playwright + Chromium, screenshots, erros de consola, fluxo jogado — ver `../qa/README.md` | ✅ Ativo |

## Estado atual (2026-09-08)

- **Vertical slice em produção e jogável** (rev 1.4): 179 regiões reais, 6 agentes, 9 árvores
  (53 nós), 3 cenários PvE, Humanity AI adaptativa, score + top-10 local + medalhas,
  **modo VIRUS PvP 2–6 operadores em `/pvp`** (salas com código, lobby, score composto §15.2),
  dev console autenticado (`DEV_ACCESS_KEY` fixa ativa), CI verde a cada push. Ver
  `game/README.md`, `ROADMAP.md` e `RECOMENDACOES-CRITICAS.md`.
- **Operação**: deploy automático na Render; falta apenas o disco persistente (1 clique no
  dashboard) para telemetria/mundos/salas sobreviverem a deploys — ver `DEPLOY-RENDER.md` (local, com chaves).
- **Próximo passo:** playtest aberto (gate formal da Phase 1) com win rate humano por cenário
  no `/dev`; campanha PvE (Phase 2); teste social do VIRUS (Phase 3) com 2–6 na mesma sala.
