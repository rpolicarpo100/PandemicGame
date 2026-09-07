# PANDEMIC EVOLUTION — Vertical Slice (Phase 1)

Protótipo jogável do core game, para validar **fun** antes de investir em PvP/Web3 (gate da SPEC v1.2 §48).

## Rotas

* `/` — **homepage** futurista com connector Phantom (deteção real de `window.phantom.solana`; sem simulação de wallet) e cartões de modos PvE/PvP/EMBATE/Ranked
* `/play` — o jogo
* `/dev` — **DEV CONSOLE** (dashboard do dev: KPIs económicos/usuários/código, wallet real, auto-crítica) — ver `DEV-CONSOLE.md` na raiz

## Cenários PvE (variedade de modos dentro do PvE)

| Cenário | Relógio | Deteção | Consciência | DNA inicial |
|---------|--------:|--------:|------------:|------------:|
| SILENT DAWN | 400d | 0.8× | 0.7× | 60 |
| GLOBAL RUSH | 260d | 1.0× | 1.2× | 90 |
| IRON WORLD | 400d | 1.25× | 1.5× | 40 |

`STANDARD` (1.0× em tudo) existe apenas para o simulador de balance.

## Correr

```bash
node server.js            # http://localhost:3000 (zero dependências)
node server.js --simtest dumb|cheap|smart   # teste de balance headless
```

## O que está implementado

| SPEC | Implementação |
|------|---------------|
| §12 World simulation | 179 cidades REAIS (nomes verdadeiros) sobre **mapa-mundo real** (Natural Earth 110m); **população mundial = 8,2 mil M (valor real 2026)** — cada ponto = metrópole + hinterland; densidade, clima, healthcare, ciência, mobilidade, aeroportos/portos reais; grafo por **haversine**: land <1300km, sea <9000km (portos), air <13000km (aeroportos) → 13.426 rotas |
| §14 Modelo temporal | Ticks; **1 tick = 2 s = 1 dia de jogo**; velocidade 1×/2×/4×/8×/pausa; relógio de 400 dias (cenários: 260–400) |
| §15 Condições de vitória | **Vitória única: EXTINÇÃO — mortos ≥ 95% da humanidade.** Derrota: erradicação, vacina+contágio eliminado, ou relógio esgotado (a humanidade resistiu) |
| §6/§7 Evolução | **53 nós em 9 árvores** — as novas: SEQ.08 **VETORES & ZOONOSE** (stat `zoon`) e SEQ.09 **CAOS SOCIAL** (stat `refuse`); SEQ.06 renomeada **ESPECIALIZAÇÃO** com **1 nó exclusivo por agente** (só visível/comprável com o tipo ativo) |
| Agentes (novo) | **6 tipos de agente** escolhidos no briefing com perfis próprios + **nó de especialização exclusivo** (sp_bac/sp_vir/sp_fun/sp_pri/sp_nano/sp_bio); troca de agente só na fase setup; o agente fica registado no ledger (telemetria por tipo) |
| Táticas novas | `zoon` reacende surtos mesmo em contagem de erradicação (salto bem-sucedido reseta a erradicação); `refuse` + nó Distúrbios Civis **suspendem a vacinação** em cidades identificadas em colapso (>2% mortos). UI mostra badges de efeito nos nós e chips ativos de ZOONOSE/RECUSA/STEALTH |
| §8 Emergent builds | Rule engine de tags: 6 builds (SHADOW SPREAD, GLOBAL COLLAPSE, IMMORTAL, VECTOR STORM, SILENT TIDE, URBAN PLAGUE) |
| §9 Events | Evento de mutação a cada ~35–55 dias com 3 opções de trade-off |
| §10 DNA | Ganho por novas infeções, presença e descoberta de regiões; gasto em evoluções |
| §11 Humanity AI | Pipeline DETECTION → … → VACCINE; estágios por awareness; containment/tratamentos/fechos de rotas; **adaptação comportamental limitada** (controlo aeroportuário se o jogador abusa de rotas aéreas; investigação reforçada contra stealth) |
| World wire | **GLOBAL WIRE**: ticker de notícias vivo + aba REGISTO GLOBAL (notícias com fontes OMS/WIRE/PRESS/AVIA-CIV/IMO-WIRE/LAB-WIRE, ambientes por nível de alerta, marcos de mortos/infetados/vacina, fechos de rotas). Mapa com pontos **evidentes** (halo+contorno, vermelho pulsante ao infetar), veículos animados por rota (vermelhos quando a rota está contaminada), rótulos top-30 por população e lista de ligações por tipo na aba AMOSTRA |
| §39 Server authority | Toda a simulação no servidor (Node, zero deps); cliente só apresenta e envia intenções; estado por SSE |
| §14.3 Anti-softlock | Relógio limite + fade-out estocástico de surtos minúsculos |

## Como se joga

1. Clica numa região para iniciar o surto (clima, densidade e rotas importam).
2. Ganha DNA com a propagação e compra evoluções (aba EVOLUÇÃO).
3. Vigia a consciência global e a vacina; gere a tua visibilidade.
4. Objetivo: **infetar não basta — EXTINGUE a humanidade**: satura o contágio (PANDEMIA GLOBAL aos 65% é só um marco) e depois liga a **cadeia letal** (árvore lethality → GLOBAL COLLAPSE) antes que a vacina/cura te travem. Pontuação final 0–1000 por KPIs (ver abaixo).

## Balance (simulador AI vs EXTINÇÃO — 10 reps/célula, 2026-09-07)

| Cenário | dumb | cheap | smart |
|---------|------|-------|-------|
| silent (400d, humanidade distraída) | 0/10 | **9/10** (d201–301) | **9/10** (d142–202) |
| rush (260d, alerta) | 0/10 | 3/10 (d227–244) | **7/10** (d148–208) |
| iron (400d, preparada) | 0/10 | ~0/10 | ~0/10 (máx ~86% eliminados) |

Estratégia vencedora: **expandir até ~45% da humanidade infetada e só então ligar a cadeia letal** (l_resp→l_organ→l_systemic→GLOBAL COLLAPSE + Viral Load). Colapso sanitário (hospitais saturados; cura degradada `1−1.04×mortos%`, piso 2%) decide a fase final; derrotas por pouco (90–94% eliminados) são frequentes. iron é calibrado como **teto quase impossível para IA (~86% máx.)** — reservado a humanos com timing perfeito (ver TESTES-E-RECOMENDACOES.md, R1).

## Pontuação por jogo (0–1000, KPIs do próprio jogo)

`vitória(EXTINÇÃO) 350` + `destruição: 350×mortos%` + `contágio: 100×infetados%` + `rapidez: 100×(1−dia/relógio) se vitória` + `eficiência: 100×(1−fenótipos/40)`, multiplicado por dificuldade (`1+(diff−1)×0.15`; iron ×1.30). Rótulos: 950+ EXTINÇÃO TOTAL · 800+ HOLOCAUSTO GLOBAL · 650+ APOCALIPSE · 450+ PANDEMIA GRAVE · 250+ SURTO MUNDIAL · <250 SURTO CONTIDO. O breakdown aparece no ecrã final e fica no ledger da dev console.

## Desvios e notas

* **Tick = 1 dia** (não 2h): para sessões de 5–12 min reais no protótipo; a granularidade horária da spec é parâmetro de balance a revisitar.
* **Canvas puro em vez de Phaser**: o ambiente de preview não tem rede para CDNs; Phaser entra no repo de produção.
* **1 agente (VIRUS)**, PvE only — PvP/EMBATE/Web3 ficam para as phases seguintes.
* O simtest headless é a primeira versão do simulador AI-vs-AI exigido pela SPEC §50.

## Ficheiros

* `server.js` — servidor autoritativo (sim + HTTP/SSE + cenários + simtest)
* `data.js` — regiões (lon/lat), nós de evolução, builds, eventos (dados, não código)
* `public/world.js` — linhas de costa Natural Earth 110m (125 polígonos, domínio público)
* `public/home.html` — homepage + connector Phantom
* `public/index.html` — cliente do jogo (mapa-mundo, CSS/JS inline, rAF, zero dependências)
* `public/fonts/` — tipografia embutida (Big Shoulders Stencil + IBM Plex Mono, OFL)
