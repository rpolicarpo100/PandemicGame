# PANDEMIC EVOLUTION — ECONOMY v1.0

**Data:** 2026-09-07
**Status:** Decisões E1–E4 fechadas. Parâmetros finos adiados para a fase de modelação económica.
**Base:** esboço do fundador (arquivado em `ECONOMY-v0.1.md`).

---

## 1. RESUMO DAS DECISÕES

| ID | Decisão fechada |
|----|-----------------|
| **E1** | Conectar a wallet exige **hold de 10.000 tokens** do jogo. Sem hold, o jogo mostra o **endereço do token** para o jogador comprar. Jogar **sem wallet conectada continua possível** (modos sem stake — game first). |
| **E2** | Payouts PvE: modelo **híbrido** — pool RTP como base + reforço da W-REWARDS para eventos/seasons com orçamento. |
| **E3** | Referral: **W-REFERRAL recebe 10% dos fees**; o referenciador recebe **10% dos fees gerados pelo seu referido**; sem referenciador/não reclamado → W-TREASURY. |
| **E4** | Distribuição dos fees: **Referral 10% · Rewards 30% · Treasury 25% · Reserve 20% · Marketing 15%**. |

> ⚠️ **Interpretação de E1 a confirmar:** a exigência de hold aplica-se à **conexão da wallet** (e portanto a toda a economia/stake). Sem wallet, o jogo permanece jogável em modos gratuitos, preservando o funil e o princípio "game first". Se a intenção for bloquear **todo** o jogo sem hold, dizê-lo — isso muda o modelo Free-to-Play.

---

## 2. TOKEN DO JOGO (working name: $PEVO)

Utilidades (confirmadas):

1. **Hold gate** — 10.000 tokens para conectar wallet (§3);
2. **Stake em PvP** — alternativa ao USDC (§5);
3. **Token sink** — nomes de perfil animados (§7); futuros sinks por definir.

Por definir na modelação (antes de qualquer venda):

* supply total, emissão e calendário;
* venda primária (USDC → W-TREASURY) e preço inicial;
* vesting/locks da equipa;
* política de queima;
* revisão do limiar 10k em função do preço.

**Gate legal:** utility token na UE → MiCA (whitepaper e obrigações de compliance) antes de venda primária. Devnet-first.

---

## 3. WALLET CONNECTION GATE (E1)

```
JOGADOR QUER CONECTAR WALLET
        │
        ▼
HOLD ≥ 10.000 $PEVO?
├── SIM  → wallet conectada → stake modes + marketplace + Web3
└── NÃO  → UI mostra o ENDEREÇO DO TOKEN (contrato/mercado) para compra
           → jogador adquire tokens → revalida hold → conecta
```

* hold = manter tokens na wallet (não é burn, não é stake);
* todos os modos com stake e o marketplace exigem wallet conectada → ficam indiretamente sujeitos ao hold;
* sem wallet: modos gratuitos sem stake (PvE e PvP casual/ranked gratuito).

---

## 4. PvE COM STAKE (E2 — HÍBRIDO)

### Fluxo

```
JOGADOR
  │ stake X USDC (min/max por parâmetro)
  ▼
POOL PvE DO PERÍODO
  │
  ▼
PARTIDA (seed aleatória, dificuldade adaptativa)
  │ ganha pontos conforme desempenho
  ▼
FIM DA PARTIDA
  payout = pontos × valor_do_ponto
```

### Modelo híbrido

* **Base — pool RTP:** os payouts saem exclusivamente das stakes cobradas;

```
total_payouts_do_período ≤ RTP × total_stakes_do_período     (RTP alvo: 85–90%)
```

* `valor_do_ponto` calibrado por período para respeitar o teto — **nunca se paga mais do que se recebe**;
* o rake (stakes − payouts) é **fee** e entra na distribuição §6;
* **Reforço — W-REWARDS:** apenas em eventos/seasons, com orçamento aprovado previamente, pode complementar prémios (ex.: bónus de temporada, leaderboards). Nunca cobre deficits estruturais do pool.

### Anti-farming (obrigatório)

* seed/cenário aleatório por partida (IA nunca memorizável);
* dificuldade escala com o desempenho;
* retornos decrescentes por sessão;
* cooldowns entre stakes; idade mínima de conta + hold gate;
* risk scoring + payouts pendentes + revisão manual acima de thresholds.

---

## 5. PvP COM STAKE

```
JOGADOR 1 ── stake ──┐
JOGADOR 2 ── stake ──┤   (cada um aposta o que quiser, dentro dos limites)
...                  ▼
                    POT (USDC ou $PEVO — uma moeda por partida)
                     │
          fee Z% (proposta 5%) → distribuição §6
                     │
            resto → vencedor(es)
```

* 1v1: vencedor leva tudo; 2–6 jogadores: distribuição top-K **publicada antes da inscrição** (ex.: 60/30/10);
* pot em USDC **ou** $PEVO, nunca misturado na mesma partida;
* **ARENA (com stake) separada de RANKED (gratuito):** o MMR oficial não envolve dinheiro; stake é um modo paralelo.

### Risco principal: win-trading

Perder = transferir valor diretamente para outro jogador. Mitigações obrigatórias:

* payouts pendentes com revisão acima de thresholds;
* heurísticas de qualidade de partida (duração, ações significativas, padrão de derrota);
* fingerprinting de dispositivo/IP; contas ligadas não partilham pot;
* 18+ nos modos com stake.

---

## 6. FEES E AS 5 WALLETS (E4 — aprovado)

### Fontes de fees

| # | Fonte | Cálculo |
|---|-------|---------|
| 1 | Rake PvE | stakes − payouts (≈ 10–15% das stakes, via RTP) |
| 2 | Fee PvP | Z% de cada pot (proposta 5%) |
| 3 | Marketplace | 5–10% por venda |

Receita **direta** de W-TREASURY (fora da distribuição): venda primária de tokens; compras com tokens (nomes animados, etc.).

### Distribuição

| Wallet | % dos fees | Função | Segurança |
|--------|-----------:|--------|-----------|
| **W-REFERRAL** | 10% | paga referenciadores (E3); sobras → W-TREASURY | hot wallet com teto + sweep |
| **W-REWARDS** | 30% | prémios competitivos, seasons, reforço de eventos PvE | teto de gasto por período |
| **W-TREASURY** | 25% | operações, infra, desenvolvimento | multisig + timelocks |
| **W-RESERVE** | 20% | risco, reversões, chargebacks | multisig, intocável sem política |
| **W-MARKETING** | 15% | growth, campanhas, criadores | teto mensal |

### Referral (E3)

```
FEES GERADOS POR B
        │
     10% → W-REFERRAL
        ├── B tem referenciador A → A recebe 10% dos fees de B
        └── sem referenciador / não reclamado → reverte para W-TREASURY
```

* 1 nível, sem MLM, sem auto-referral (regras da SPEC mantêm-se);
* a fatia W-REFERRAL é conta de passagem + almofada; saldos não reclamados revertem periodicamente para W-TREASURY.

### Operação

* liquidação em batch no EconomicEngine (dupla entrada, idempotência), com split on-chain opcional;
* wallets operacionais = hot wallets com teto; excesso varrido para multisig;
* toda a movimentação gera audit log imutável e pseudónimo.

---

## 7. NOMES DE PERFIL ANIMADOS (primeiro token sink)

* compra por **X $PEVO** (parâmetro; ex.: 500) — efeito **apenas visual** (zero pay-to-win intacto);
* tokens → **W-TREASURY** por defeito; queima (total ou parcial) como alternativa na modelação;
* raridades/edições podem criar colecionismo sem tocar no gameplay.

---

## 8. FLUXO CONSOLIDADO

```
                    ┌────────────────────────────┐
                    │        JOGADORES           │
                    └──────────────┬─────────────┘
                                   │
              hold ≥ 10k $PEVO para conectar wallet (E1)
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   PvE STAKE                  PvP STAKE               COMPRAS/TOKENS
  (USDC X → pontos)       (USDC ou $PEVO → pot)     (primária + sinks)
        │                          │                          │
  payout ≤ RTP×stakes      vencedor leva o pot          ┌─────┴─────┐
  (+ reforço W-REWARDS)      (menos fee Z%)             │           │
        │                          │              W-TREASURY   (queima
     RAKE ─────────────┬───────────┘              direto     opcional)
                       ▼
              FEES (rake + fee PvP + marketplace)
                       │
     ┌──────────┬──────┴────┬──────────┬──────────┐
     ▼          ▼           ▼          ▼          ▼
 W-REFERRAL W-REWARDS W-TREASURY W-RESERVE W-MARKETING
    10%        30%        25%        20%        15%
     │          │
     ▼          ▼
 referenciadores prémios/seasons/reforços PvE
 (ou → Treasury)
```

---

## 9. GATES OBRIGATÓRIOS

1. **Legal:** stake→payout e winner-takes-all são qualificáveis como jogo/aposta em várias jurisdições. Parecer por mercado **antes** de produção; lançamento com geofencing, nunca global de dia 1.
2. **Idade:** modos com stake **18+** com verificação.
3. **Sustentabilidade:** RTP < 100% sempre; payouts PvE saem do pool; W-REWARDS só reforça eventos orçamentados.
4. **Antifraude:** hold + idade de conta + risk scoring + payouts pendentes + revisão manual.
5. **MiCA:** token utility → whitepaper/compliance antes de venda primária.
6. **Devnet-first:** wallets, splits, token e USDC testados em devnet.

---

## 10. PARÂMETROS PARA A MODELAÇÃO

| Parâmetro | Valor proposto | Nota |
|-----------|----------------|------|
| Hold mínimo | 10.000 $PEVO | rever com o preço do token |
| Stake PvE min/max | por definir | caps por conta/dia |
| RTP alvo PvE | 85–90% | rake = fee |
| Fee PvP | 5% do pot | testar 3–7% |
| Fee marketplace | 5–10% | manter testes 5/7.5/10 |
| Distribuição top-K PvP | ex.: 60/30/10 | publicada antes da partida |
| Preço nome animado | ex.: 500 $PEVO | por raridade |
| Supply/emissão do token | por definir | MiCA gate |

---

*Fim da Economy v1.0 — decisões E1–E4 fechadas; próxima etapa: modelação económica com cenários ou vertical slice do jogo.*
