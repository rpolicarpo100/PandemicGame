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
| `../qa/` | **QA headless keyless** (fora desta pasta): Playwright + Chromium, screenshots, erros de consola, fluxo jogado — ver `../qa/README.md` | ✅ Ativo |

## Estado atual (2026-09-07)

- **Economia:** decisões E1–E4 fechadas; modelação fina adiada (ver §59 da SPEC v1.2).
- **Vertical slice Phase 1: jogável** em `game/` — PvE com VIRUS, 36 regiões fictícias, 37 nós de evolução, Humanity AI adaptativa, servidor autoritativo. Ver `game/README.md`.
- **QA keyless ativo:** o projeto tem browser headless próprio (`/home/user/qa`) — cada alteração de UI é verificada por screenshot + consola antes de ser dada como concluída. Já apanhou 2 bugs visuais invisíveis por curl (mapa-múndi silenciado, labels sobrepostos).
- **Próximo passo:** validar fun com 10–20 jogadores reais; depois Phase 2 (PvE campaign) ou calibração de parâmetros.
