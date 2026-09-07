# PANDEMIC EVOLUTION — ECONOMY SKETCH v0.1

**Data:** 2026-09-07
**Status:** Esboço do fundador formalizado + propostas técnicas. **Aguarda decisões E1–E4** (fim do documento).
**Relação com a SPEC:** este esboço sobrepõe-se a várias decisões da SPEC v1.1 — após fechar E1–E4, a master spec será atualizada para v1.2.

---

## 1. O QUE MUDA FACE À SPEC v1.1

| Esboço | Conflito com v1.1 | Consequência |
|--------|-------------------|--------------|
| Token próprio desde já (hold 10k para entrar) | §36 "não lançar token no início"; "USDC before proprietary token" | O token passa a existir no launch, com utilidades reais. Exige enquadramento MiCA e decisão de emissão. |
| Hold de 10k para entrar | "Free-to-Play + Web3 optional" | Depende de **E1**: hold em todo o jogo, ou apenas nos modos com stake. |
| PvE aposta USDC → pontos → pagamento | Economia anterior era só fees/marketplace | Cria um modelo de skill-gaming com payouts; sustentabilidade exige RTP < 100% (**E2**). |
| PvP winner-takes-all com stake | Torneios eram pass-through com fee publicada | Mantém-se compatível: pot dos jogadores, fee para as wallets. Risco de win-trading sobe (dinheiro direto). |
| Referral 10% | v1.1: 5% da receita elegível | Depende de **E3** (interpretar 10% dos fees ou 10% da receita bruta). |
| Distribuição de fees por 5 wallets | v1.1 §31 (tabela de 7 destinos) | Nova tabela (**E4**) substitui §31. |

Mantém-se intactos: server-authoritative, devnet-first, audit log pseudónimo, zero pay-to-win (nada do que se compra altera gameplay competitivo), EconomicEngine isolado.

---

## 2. TOKEN DO JOGO (placeholder: $PEVO)

Utilidades iniciais:

1. **Acesso** — hold de 10.000 tokens (ver §3 e E1);
2. **Stake em PvP** — alternativa ao USDC nos pots (§5);
3. **Cosmetics** — nomes de perfil animados (§8); futuros sinks.

Por definir (fase de modelação):

* supply total, emissão e calendário;
* venda primária (USDC → Treasury) e preço inicial;
* vesting/locks da equipa;
* política de queima.

> **Gate legal:** um utility token lançado na UE entra no âmbito MiCA (obrigações de whitepaper, etc.). Advogados antes de qualquer venda. Devnet-first mantém-se.

---

## 3. ACESSO — HOLD DE 10.000 TOKENS

Regra: uma wallet com **≥ 10.000 $PEVO em custódia própria (hold, não burn)** desbloqueia o acesso.

Efeitos pretendidos:

* procura inicial do token;
* barreira anti-sybil (criar farms exige capital);
* compromisso do jogador.

Riscos conhecidos:

* **funil:** exigir compra/hold antes de experimentar o jogo mata aquisição; por isso a decisão **E1** propõe aplicar o hold apenas aos modos com stake, mantendo um modo gratuito;
* preço do token volátil → o custo real de entrada varia; considerar revisão periódica do número 10k.

---

## 4. MODO PvE COM STAKE (APUESTA → PONTOS → PAGAMENTO)

### Fluxo

```
JOGADOR
  │ stake X USDC (min/max por parâmetro)
  ▼
POOL PvE DO PERÍODO
  │
  ▼
PARTIDA (PvE, seed aleatória)
  │ ganha pontos conforme desempenho (§15.1)
  ▼
FIM DA PARTIDA
  payout = pontos × valor_do_ponto
```

### Sustentabilidade (proposta — decisão E2)

Modelo **RTP (return-to-player)**: os payouts saem exclusivamente das stakes cobradas.

```
total_payouts_do_período ≤ RTP × total_stakes_do_período
```

* RTP alvo: 85–90% (parâmetro); o resto é **rake** → distribuição de fees (§7);
* `valor_do_ponto` é calibrado por período (pari-mutuel) para respeitar o teto — nunca se paga mais do que se recebe;
* caps por partida e por conta/dia.

### Anti-farming (crítico em PvE)

PvE contra IA é explorável por padrão. Contramedidas obrigatórias:

* seed/cenário aleatório por partida (a IA nunca é memorizável);
* dificuldade escala com o desempenho do jogador;
* retornos decrescentes por sessão;
* cooldown entre stakes; idade mínima de conta;
* risk scoring + payouts pendentes (§10).

---

## 5. MODO PvP COM STAKE (WINNER-TAKES-ALL + FEE)

### Fluxo

```
JOGADOR 1 ── stake (USDC ou $PEVO) ──┐
JOGADOR 2 ── stake ──────────────────┤
...                                   ▼
                                  POT
                                   │
                        fee Z% (proposta: 5%) → WALLETS (§7)
                                   │
                          resto → vencedor(es)
```

* uma moeda por partida (pot em USDC **ou** em $PEVO, não misturado);
* 1v1 (EMBATE ou duelo): vencedor leva tudo;
* 2–6 jogadores: distribuição top-K publicada antes da inscrição (ex.: 60/30/10);
* stake é opcional: **ARENA (com stake) separado de RANKED (gratuito)** — o MMR/competitivo oficial mantém-se sem dinheiro em jogo, preservando integridade e evitando pay-to-rank.

### Risco principal

Perder = transferir valor diretamente para outro jogador → incentivo máximo a **win-trading, boosting e colusão**. Mitigações obrigatórias (além do §40 da SPEC):

* payouts pendentes com revisão acima de thresholds;
* heurísticas de qualidade de partida (duração, ações significativas, padrão de derrota);
* fingerprinting de dispositivo/IP; contas ligadas não podem partilhar pot.

---

## 6. FONTES DE FEES

| # | Fonte | Cálculo |
|---|-------|---------|
| 1 | Rake PvE | stakes − payouts (≈ 10–15% das stakes) |
| 2 | Fee PvP | Z% de cada pot (proposta 5%) |
| 3 | Marketplace | 5–10% por venda (SPEC §25) |
| 4 | Venda primária de tokens | → diretamente W-TREASURY (não passa pela distribuição) |
| 5 | Compras com tokens (nomes animados, etc.) | → W-TREASURY (proposta; queima como alternativa) |

As fontes 1–3 alimentam a distribuição por wallets (§7). As fontes 4–5 são receita direta do Treasury.

---

## 7. ARQUITETURA DE WALLETS E DISTRIBUIÇÃO DOS FEES

### As 5 wallets

| Wallet | Função | Segurança |
|--------|--------|-----------|
| **W-TREASURY** | operações, infra, desenvolvimento | multisig, timelocks, limites |
| **W-REFERRAL** | recebe a fatia de referral; paga referenciadores | hot wallet com teto + sweep |
| **W-REWARDS** | prémios competitivos, seasons, eventos | teto de gasto por período |
| **W-RESERVE** | risco, chargebacks, reversões de fraude, emergências | multisig, intocável sem política |
| **W-MARKETING** | growth, criadores, campanhas | teto mensal |

### Distribuição proposta dos fees (decisão E4)

| Wallet | % dos fees |
|--------|-----------:|
| W-REFERRAL | 10% |
| W-REWARDS | 30% |
| W-TREASURY | 25% |
| W-RESERVE | 20% |
| W-MARKETING | 15% |
| **Total** | **100%** |

Regra de referral: a fatia de 10% acumula em W-REFERRAL; quando um pagamento de referral é devido, sai desta wallet; **saldo não reclamado reverte periodicamente para W-TREASURY** (mesma lógica do §27 da SPEC).

### Operação

* distribuição automática por liquidação no EconomicEngine (batch), com opção de split on-chain;
* wallets operacionais = hot wallets com teto; excesso varrido para o multisig;
* toda a movimentação gera audit log (§46 SPEC v1.1) — imutável e pseudónimo.

---

## 8. NOMES DE PERFIL ANIMADOS (PRIMEIRO TOKEN SINK)

* o jogador compra um **nome de perfil animado** por **X $PEVO** (parâmetro; ex.: 500);
* efeito **apenas visual** (identidade/status) — princípio D4 intacto;
* destino dos tokens: **W-TREASURY** por defeito (alternativa: queima parcial para pressão deflacionária — decidir na modelação);
* raridade/edições podem criar colecionismo sem tocar no gameplay.

---

## 9. FLUXO CONSOLIDADO

```
                    ┌────────────────────────────┐
                    │        JOGADORES           │
                    └──────────────┬─────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   PvE STAKE                  PvP STAKE               COMPRAS/TOKENS
  (USDC X → pontos)        (USDC ou $PEVO pot)      (primária + sinks)
        │                          │                          │
   payout ≤ RTP×stakes       vencedor leva pot          ┌─────┴─────┐
        │                    (menos fee Z%)             │           │
     RAKE ──────────────┐          │              W-TREASURY    (queima
        │               │          │              direto        opcional)
        └───────────────┤          │
                        ▼          ▼
                  ┌─────────────────────┐
                  │   FEES (rake+Z%+mkp)│
                  └──────────┬──────────┘
                             │
       ┌──────────┬──────────┼──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼
   W-REFERRAL W-REWARDS W-TREASURY W-RESERVE W-MARKETING
      10%        30%        25%        20%        15%
       │          │
       ▼          ▼
  referenciadores  prémios/seasons
  (ou → Treasury)
```

---

## 10. GATES OBRIGATÓRIOS (NÃO NEGOCIÁVEIS)

1. **Legal:** PvE com stake→payout e PvP winner-takes-all são, em várias jurisdições, qualificáveis como jogo/aposta (mesmo com skill). **Parecer jurídico por mercado antes de produção**; lançamento por jurisdição (geofencing), nunca global de dia 1.
2. **Idade:** modos com stake são **18+** com verificação; o resto do jogo segue a classificação definida (SPEC §59).
3. **Sustentabilidade:** RTP < 100% sempre; payouts PvE saem apenas do pool; nunca financiar payouts com Treasury fora de eventos orçamentados (E2).
4. **Antifraude:** hold + idade de conta + risk scoring + payouts pendentes + revisão manual acima de thresholds.
5. **MiCA:** token utility → obrigações de whitepaper e compliance antes de venda primária.
6. **Devnet-first:** toda a infraestrutura de wallets/splits testada em devnet (SPEC §47).

---

## 11. DECISÕES NECESSÁRIAS

| ID | Pergunta | Estado |
|----|----------|--------|
| **E1** | Hold de 10k aplica-se a todo o jogo ou apenas aos modos com stake? | ⏳ |
| **E2** | Payouts PvE: pool RTP (recomendado), wallet Rewards, ou híbrido? | ⏳ |
| **E3** | Referral 10%: 10% dos fees, ou 10% da receita bruta elegível? | ⏳ |
| **E4** | Aprovar a distribuição 10/30/25/20/15 ou ajustar? | ⏳ |

---

## 12. PARÂMETROS EM ABERTO (fase de modelação)

| Parâmetro | Valor proposto | Nota |
|-----------|----------------|------|
| Hold mínimo | 10.000 $PEVO | rever com o preço do token |
| Stake PvE min/max | por definir | com caps por conta/dia |
| RTP alvo PvE | 85–90% | rake = fee |
| Fee PvP | 5% do pot | testar 3–7% |
| Fee marketplace | 5–10% | SPEC §25 |
| Preço nome animado | ex.: 500 $PEVO | por raridade |
| Distribuição top-K PvP | ex.: 60/30/10 | publicada antes da partida |

---

*Fim do Economy Sketch v0.1 — aguarda E1–E4 para passar a v1.0 e atualizar a master spec para v1.2.*
