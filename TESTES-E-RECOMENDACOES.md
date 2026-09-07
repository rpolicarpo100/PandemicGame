# RELATÓRIO DE TESTES & RECOMENDAÇÕES — 2026-09-07

Cobertura da revisão "extinção": 130 partidas headless + QA 65/65 + validação
aritmética do score (90/90) + prova visual em browser real.

---

## 1. Metodologia

- **Sweep estatístico**: 90 partidas (10 reps × 3 cenários × 3 estratégias) + 40
  partidas de revalidação pós-afinação, via `--simtest` (bots headless do próprio
  servidor), 5 em paralelo.
- **Validação cruzada do score**: para cada partida, o score reportado pelo
  servidor foi recalculado a partir dos KPIs (fórmula independente) → **90/90
  coincidem (Δ≤2)** — a aritmética de pontuação está correta de ponta a ponta.
- **QA completo**: smoke 30/30 · concurrency 9/9 · balance 5/5 · e2e (partida
  real via HTTP, venceu por EXTINÇÃO ao dia 207) 9/9 · UI browser 12/12.
- **Casos-limite**: seed em cidades pequenas (Nuuk ~130k), mapa 179 pontos,
  velocidade 8×, eventos pendentes, overlay final.

## 2. Resultados (win rates — estado final)

| Cenário | dumb | cheap | smart | Observação |
|---|---|---|---|---|
| **silent** (relógio 400, humanidade distraída) | 0/10 | **9/10** (d201–301) | **9/10** (d142–202) | Escada boa; derrota única a ~88% mortos |
| **rush** (relógio 260, alerta) | 0/10 | 3/10 (d227–244) | **7/10** (d148–208) | Exige plano (não dá para "barato") |
| **iron** (relógio 400, preparada) | 0/10 | ~0/10 | 0/10 (máx ~86% eliminados) | **Teto quase impossível até p/ IA** |

- Derrotas por pouco (90–94,5% eliminados) são frequentes — o teste está tenso,
  mas justo: nas 10 reps de silent, só 2 agentes perderam, ambos à beira.
- Vitórias típicas: silent d150–230 · rush d150–210 (a 8× ≈ 40–60 s reais).
- dumb (sem evoluir) perde sempre, como esperado (controlo negativo).

### Pontuação (estado final)

| Estratégia | silent | rush | iron |
|---|---|---|---|
| dumb (inação) | ~3–10 | ~15 | ~30 (0 mortos, só dificuldade) |
| cheap | med 835 (390–846) | med ~500 (417–931) | ~100 |
| smart | med 845 (416–855) | med 941 (454–949) | med ~460 (34–540) |

Máximo observado: 949/1000 (smart rush). Vitórias rondam 823–949.

## 3. Problemas encontrados e corrigidos nesta ronda (validados)

1. **`eficiência` premiava a inação**: dumb, sem comprar nada, "pontuava"
   100–130 só por não gastar fenótipos. → `eficiência` passou a ser ponderada
   pela destruição (`× mortos%`): dumb desce para ~3–15; vitórias quase não
   mudam (validação 8 reps).
2. **Cauda final lenta**: várias partidas morriam no relógio com 90–94,5%
   (faltava 1–5% e a cura equilibrava a morte). → colapso dos cuidados mais
   agressivo (`1−1.04×mortos%`, piso 2%): menos derrotas por inércia, dias de
   vitória ligeiramente melhores em silent/rush.
3. **Iron inalcançável para qualquer bot** (0/30 nas afinações mais duras).
   Mesmo suavizado (deteção 1.45–1.60, tratamentos 1.15–1.25, DNA 50–60, fase
   letal aos 50%) o teto mecânico da IA fica ~86–89%: a vacina chega aos 100%
   ~d150 e os sobreviventes são curados. Estado final: iron quase impossível —
   ver Recomendação R1.
4. **Rótulo "EXTINÇÃO TOTAL ≥950" inalcançável** (máx observado 949). → limiares
   rebaixados (900/750/600/400/200).
5. **Contabilidade `cumInf`**: paciente zero e sementes não consumiam
   susceptíveis → inf% podia passar de 100%. Corrigido (sementes `r.s -= seed`).
6. **N=5 dava ruído**: células iguais oscilavam 1/5–5/5. → QA de balance agora
   deve ler as tabelas de 10 reps; ver R5.

## 4. Recomendações

### R1 — Iron: decidir o papel do cenário (decisão de design)
Dados: mesmo suavizado, o melhor bot atinge ~89% e 0/10 vitórias; a mecânica
(vacina aos 100% ~d150 + cura dos sobreviventes) impõe um teto duro.
Opções: **(a)** aceitar como "Inferno — para humanos perfeitos" e rotular no UI
("VITÓRIA QUASE IMPOSSÍVEL"); **(b)** barra própria p/ iron (ex.: 90%) — 1 linha
no `endGame`; **(c)** dar ao agente um evento "colapso da cadeia de frio" que
degrade tratamentos no fim. Recomendo **(a)** agora + telemetria real (R9) para
decidir depois — sem dados de humanos, afinar às cegas é lotaria.

### R2 — Derrotas por pouco (90–94%): manter a tensão
É bom jogo (quase-vitórias motivam re-tentar). Só monitorizar: se a taxa de
derrotas entre 90–94% subir acima de ~30% dos jogos de agentes, aliviar a cauda
(piso do colapso de cuidados 2%→1%) em vez de mexer na barra dos 95%.

### R3 — Recordes e medalhas (diversão barata, alto retorno)
O score já existe no ecrã final e no ledger. Falta persistência no browser
(localStorage: melhor score + cenário/dia) e medalhas por rótulo
(EXTINÇÃO TOTAL / HOLOCAUSTO GLOBAL...). Motiva re-jogabilidade; ~30 linhas.

### R4 — Bot do e2e deve espelhar o SMART_PRIO do servidor
O e2e tem política própria (prefs + letal aos 45%). As duas já convergem, mas o
e2e perde partidas que o `--simtest smart` ganha. Centralizar a política num
módulo partilhado evita deriva CI-vs-balance.

### R5 — Subir reps do QA de balance (2 → 6+) e mostrar score
Com N=2 o teste nem distingue 0% de 80%. Custo é baixo (cada sim ~1 s).
Incluir o score no output do balance para o CI apanhar regressões de score.

### R6 — Rótulo de dificuldade de arranque (qualidade de vida)
Sementes em cidades pequenas (Nuuk, Adelaide) são muito mais duras — sugerir no
tooltip da seleção ("hub global: +propagação") em vez de exigir conhecimento.

### R7 — Apresentar o objetivo de forma progressiva
O chip "EXTINÇÃO ≥95%" aparece sempre; durante a fase 1 o jogador novo pode não
perceber que 65% NÃO vence. Sugestão: ao atingir PANDEMIA GLOBAL (65%),
notificação "FASE 2 — agora elimina 95% da humanidade" (o wire já anuncia;
falta destaque no HUD). Pequeno, clareza grande.

### R8 — Desempenho
179 nós × 13 426 rotas: tick ≈ 1–2 ms; servidor a 8× ≈ 4 dias/s sem carga;
136 veículos no canvas sem erros. Sem ação necessária; re-medir se subir para
>250 cidades.

### R9 — Telemetria humana (a alavanca mais importante)
O ledger do dev console já regista partidas reais com score/cenário. Próximo
passo: dashboard de **win rate humano por cenário** (dias/mediana, distribuição
de scores). É isto que deve guiar a próxima calibração — especialmente iron e
o limiar dos 95%.

## 5. Resumo executivo

- O objetivo "extinguir" funciona e está bem calibrado em **silent/rush**
  (agente bom ganha 70–90%, agente mau perde, derrotas por pouco).
- O score 0–1000 é consistente (90/90 validados), justo (inação ≈ 0) e
  distingue bem os desempenhos.
- **Iron precisa de uma decisão de produto** (R1) — é o único ponto em aberto
  real; tudo o resto são melhorias de polimento (R3, R6, R7) e de processo
  (R4, R5, R9).
