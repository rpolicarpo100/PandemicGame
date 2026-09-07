# PANDEMIC EVOLUTION — Revisão Crítica da Master Spec

**Data:** 2026-09-07
**Documento analisado:** `pandemic-evolution/SPEC.md` (Master Spec, 55 secções)
**Âmbito da revisão:** Game design · Economia · Legal/Regulatório · Técnico · Operações
**Legenda de severidade:** 🔴 bloqueia · 🟠 alto · 🟡 médio

---

## Veredito curto

A visão é coerente e os princípios são invulgarmente corretos para um projeto Web3: game-first, server-authoritative, devnet-first, USDC antes de token próprio, referral de 1 nível sem MLM, audit log, Economic Engine isolado. Isto é um bom alicerce.

No entanto, a spec está ao nível de **manifesto/visão**, não de **design executável**. Faltam as decisões quantitativas e estruturais que separam a Phase 0 da Phase 1. Identifiquei:

- **6 contradições internas** a resolver;
- **~20 lacunas críticas** de game design e economia;
- **5 riscos legais** que devem ser triados antes das Phases 7–10;
- **12 perguntas** cuja resposta é pré-requisito para escrever código.

---

## 1. Avaliação geral

### O que está certo e deve ser mantido

1. **Separação Game Layer / Web3 Layer** e a regra "nunca pôr cada ação na blockchain".
2. **Server authoritative** como princípio de anti-cheat e de economia.
3. **DNA interno não transferível** — elimina o vetor clássico de farm-and-dump.
4. **USDC antes de token próprio**, e token só com necessidade económica real.
5. **Referral 1 nível com fallback para Treasury** — evita MLM e mantém o orçamento neutro.
6. **Devnet-first + definição de "done"** com testes — cultura de engenharia saudável.
7. **Proibição explícita de pay-to-win** como princípio absoluto.
8. **Roadmap faseado** com gameplay antes de economia.

### Risco estrutural global

O maior risco do projeto não é técnico nem económico: é **chegar à Phase 7+ sem ter validado que o jogo é divertido**. As Phases 1–2 validam isso, mas o documento dedica 60% do texto a economia/Web3 e quase nada ao design concreto do gameplay (condições de vitória, duração de partida, verbos do jogador, pacing de DNA). Recomendo reequilibrar o esforço: fechar primeiro o design núcleo (secção 3 deste documento) e só depois detalhar economia fina.

---

## 2. Contradições internas

| # | Secções | Problema | Resolução proposta |
|---|---------|----------|--------------------|
| **C1** | §44 vs. GDPR | "Nunca apagar histórico económico" colide com o direito ao apagamento (GDPR) se o histórico contiver dados pessoais. | O ledger deve ser **pseudónimo**: guardar transações, hashes e wallets públicas para sempre; guardar PII (nome, email, IP) com política de retenção e apagável. |
| **C2** | §18 vs. §20 | Trophies aparecem como categoria negociável no marketplace e, ao mesmo tempo, como reputação potencialmente non-transferable. | Classificar cada trophy: **soulbound** (prova de mérito: Season Champion, World Ender) vs. **comemorativo/cosmético** (negociável). Regra por defeito: tudo o que atesta mérito é soulbound. |
| **C3** | §34 vs. §18/§19 | Zero pay-to-win, mas Agents e Research Assets são negociáveis e o spec não define que efeito têm no jogo. Se um Unknown Agent "Legendary" conferir qualquer vantagem, comprar = comprar poder. | Regra absoluta: **nenhum asset Web3 desbloqueia ou altera gameplay em modos competitivos**. Valor = identidade, história, status. Se houver efeito, apenas estético. |
| **C4** | §31 vs. §29 | O exemplo do torneio (100 × 5 = pool 500) implica pass-through de 100% das entradas, mas a tabela de distribuição trata toda a receita como distribuível (20% Competitive Rewards, 25% Treasury, etc.). | Criar duas contabilidades separadas: **(a)** entradas de torneio = pass-through para o pool, com fee de organização explícita e publicada à entrada (ex.: 5,00 → 4,75 pool + 0,25 fee); **(b)** a fee e as receitas próprias alimentam a tabela §29. |
| **C5** | §24/§26 | O referral incide sobre "receita elegível", mas a lista de receitas elegíveis **não está definida em lado nenhum** — e o §26 diz que deve estar. | Definir já. Proposta: elegível = compras primárias de assets + fees de marketplace pagas pelo utilizador; não elegível = prémios, entradas de torneio (pass-through), transferências. |
| **C6** | §29 vs. §25 | A tabela soma 100% incluindo "Referral 5%", mas quando não há referenciador esse 5% vai para o Treasury — a tabela não reflete esta condicionalidade. | Menor: explicitar que a linha "Referral 5%" é "Referral-or-Treasury 5%" e que a tabela representa o modelo esperado com referral pleno. |

---

## 3. Lacunas de Game Design

### 🔴 G1 — Condições de vitória/derrota indefinidas
O core loop termina em "WIN / LOSE", mas o spec nunca define o que é ganhar. Infectar X% da população antes da vacina? Atingir score? Ser o último agente vivo? Sobreviver N dias? Cada opção muda tudo (pacing, AI, PvP, softlocks). **Sem isto não há jogo.** Proposta: definir formalmente por modo, com condições primárias e de timeout.

### 🔴 G2 — Modelo temporal: real-time vs. tick/turnos
A decisão técnica e de design mais impactante do projeto não está tomada. Para multiplayer autoritativo com 2–6 jogadores, reconnect, spectators e anti-cheat, **recomendo simulação baseada em ticks simultâneos** (ex.: tick a cada 2–4 s, com fila de ações dos jogadores). Vantagens: sincronização trivial, reconnect por snapshot, adilidade, replay/audit fáceis. Real-time contínuo num mundo partilhado é ordens de grandeza mais difícil e não acrescenta fun proporcional.

### 🟠 G3 — Duração de sessão alvo inexistente
Quanto dura uma partida — 10, 25 ou 45 minutos? Isto determina pacing de DNA, frequência de evolution events, matchmaking e retenção (D1/D7/D30 são métricas-chave no §47 mas não há mecânicas de retenção desenhadas para as atingir).

### 🟠 G4 — EMBATE sem design do lado Humanity
O modo assimétrico 1v1 tem Phase 4 reservada mas zero design: quais são os verbos do jogador Humanity (investir em investigação? fechar fronteiras? triagem regional? propaganda?), que recursos gere, como funciona o fog of war, como se equilibra 50/50 ao longo do tempo. É o modo mais difícil de equilibrar e precisa de um one-pager próprio antes de qualquer implementação.

### 🟠 G5 — Dinâmicas PvP não tratadas: softlock, colusão, "aggro" da IA
- Dois agentes stealth podem esconder-se indefinidamente → é preciso **mecânica de escalada** (objetivos obrigatórios, decaimento, eventos de pressão, relógio de fim de jogo).
- Em FFA com 6 jogadores existem alianças tácitas e focus de um líder → aceitar como feature ou mitigar? Decidir.
- Quem é que a Humanity AI persegue num PvP multiagente? Se perseguir sempre o líder, vira ferramenta de manipulação entre jogadores; se for neutra, ignora o jogo. Proposta: tornar o **"detection aggro"** um pilar explícito — a Humanity reage ao agente mais visível/ameaçador, e gerir essa atenção é parte da skill.

### 🟠 G6 — IA adaptativa vs. comparabilidade competitiva
Se a Humanity se adapta ao comportamento do jogador, duas partidas ranked nunca são equivalentes — e MMR exige comparabilidade. Proposta: perfis de IA fixos por escalão de matchmaking, com adaptação apenas dentro de intervalos limitados; parâmetros da IA registados em cada partida (auditável e analisável para balance).

### 🟡 G7 — Roster com nichos sobrepostos
Nanovirus, Bioengineered e Synthetic ocupam o mesmo espaço temático ("tecnologia/engenharia/mutação controlada"). Proposta: reduzir no launch (fundir ou cortar Nanovirus) e reintroduzir quando houver tooling de balance. 11 agentes é marketing bom e balance caro.

### 🟡 G8 — Emergent builds exigem um rule engine, não curadoria
"SHADOW SPREAD = Long Incubation + Asymptomatic + Airborne + High Mobility" implica um sistema de **tags + regras de combinação com thresholds**, detetado automaticamente. Sem isso, as builds emergentes serão curadas manualmente para sempre e o §8 não escala. Isto é um deliverable técnico da Phase 0: o schema do nó de evolução (benefício, custo, desvantagem, tags, sinergias, pré-requisitos).

### 🟡 G9 — FTUE e retenção fora das seasons
Não há desenho de onboarding, primeira sessão, missões diárias ou loops curtos. Retenção puramente sazonal aposta numa profundidade competitiva que ainda não existe.

### 🟡 G10 — Regiões reais ou fictícias + grafo de conectividade
Contar mortes por país real é risco de PR e de plataformas; regiões fictícias reduzem sensibilidade e dão liberdade de design. Falta também definir o **modelo de grafo** (ligações aéreas/marítimas/fronteiriças) — a propagação vive dele.

---

## 4. Lacunas de Economia

### 🔴 E1 — Falta o modelo sink/source do USDC (a pergunta central)
O spec descreve distribuição de receita mas não descreve **porque é que alguém gasta o primeiro USDC, e quem compra o que os vencedores vendem**.

- Cosméticos em estratégia global têm procura historicamente fraca (vs. shooters/MOBAs). Os drivers de procura têm de ser outros: identidade de guild, living assets, passes de torneio, personalização premium — todos já no spec, mas sem desenho de desejo/escassez.
- Se 20% da receita paga rewards competitivos em USDC, os melhores jogadores tornam-se **vendedores líquidos**. Quem compra? Se a resposta for "especuladores", o sistema cai exatamente no ciclo que o §16 proíbe (DEPOSIT → FARM → SELL → EXIT).

Proposta: modelar explicitamente 3 perfis (spenders, earners, traders) e definir a restrição orçamental trimestral: **receita primária + fees ≥ payouts competitivos + referrals**.

### 🟠 E2 — "Competitive Rewards 20%" é ambíguo e paga sem revisão
É custo financiado por receita (prémios de season) ou inclui pools de torneios? (Ver C4.) Além disso: payouts em USDC devem passar por **período pendente + revisão antifraude** antes de assentar (win-trading, boosting — ver T4).

### 🟠 E3 — Emissão de assets (mercado primário) indefinida
Como entram novos assets em circulação? Drops sazonais? Crafting? Os "Research Assets" sugerem consumíveis/crafting — a ser verdade é um excelente sink, mas precisa de regras. Sem emissão controlada não há oferta inicial, âncora de preço, nem bootstrap de liquidez do marketplace. Também por definir: royalties secundários, duração de listings, quem paga o minting (recomendação: o jogo paga, via relayer).

### 🟠 E4 — Living Assets são inflacionáveis antes da venda
Uma carreira pode ser fabricada: comprar um asset, dar-lhe 137 vitórias contra alts/farm, vender como "Legendary 74% WR". Contramedidas: estatísticas só contam em matchmaking verificado; flag "ranked-verified" nas stats; a página do asset mostra contexto (qualidade dos oponentes, modo).

### 🟡 E5 — Detalhes de referral por fechar
Janela vitalícia ou 12 meses? Aplica-se a vendas primárias? Há cap por referenciador? 5% vitalício é aceitável, mas deve ser decisão deliberada e modelada (é um custo perpétuo sobre margem).

### 🟡 E6 — Governança do Treasury
Quem detém as chaves do multisig? Que entidade legal? Há relatórios de transparência? Limites de gastos operacionais? O §28 fala de segurança técnica mas não de governança.

### 🟡 E7 — Simulação económica sem parâmetros
O spec exige "simulação económica real antes do lançamento" mas não define inputs: DAU alvo, % pagadores, ARPU, ticket médio, velocidade de troca de assets, cenários de fee. Proposta: três cenários (conservador/base/otimista) com premissas explícitas e testes de stress (quebra de volume 80%).

### 🟡 E8 — Métrica "reward ratio" mencionada mas não definida
Definir fórmula (ex.: payouts competitivos ÷ receita bruta) e target.

---

## 5. Riscos Legais / Regulatórios (prioridade EU/PT)

### 🔴 L1 — Torneios pagos podem ser qualificados como jogo de azar
Entry fee + prémio é o esquema clássico de gambling; o argumento "é skill" mitiga mas **não isenta universalmente**. Em Portugal continental a exploração de jogos é reservada/regulada (SRIJ); UE, UK e vários estados dos EUA têm testes próprios. Proposta: parecer jurídico por mercado **antes** de desenhar torneios pagos em detalhe; o modo seguro é torneios free com prize pool patrocinado pelo Treasury/parceiros.

### 🔴 L2 — Custódia de USDC/assets define o enquadramento legal
Se o jogo guardar as wallets dos jogadores (custodial), pode cair em regimes de prestador de serviços de ativos virtuais (licenciamento, AML/KYC). Se for 100% self-custody, o onboarding Web3 torna-se um muro para jogadores normais. Proposta: modelo híbrido — **embedded wallet** criada no onboarding, com exportação/migração para self-custody quando o jogador quiser — validado juridicamente antes da Phase 7.

### 🟠 L3 — MiCA
NFTs verdadeiramente únicos e não fungíveis estão fora do âmbito, mas séries grandes, ativos fungíveis entre si ou fracionalização podem entrar. Um futuro $PEVO entra quase certamente. A análise deve acompanhar as Phases 7–12.

### 🟠 L4 — Living Assets ≈ risco de valor mobiliário
Comunicar assets com "carreira", "raridade" e "valor" próximo de expectativa de retorno pode caracterizar produto de investimento (Howey e equivalentes UE). Contramedidas: nunca comunicar valorização esperada, sem buybacks, termos claros de bem digital de entretenimento.

### 🟠 L5 — GDPR + menores (ver C1)
O referral armazena relações entre contas (dados pessoais). Wallets + temas pandémicos + eventuais payouts em dinheiro implicam definir fasquia etária (16+/18+) e age-gate real; KYC para levantamentos é incompatível com menores. Decidir a idade-alvo cedo — afeta onboarding, monetização e Web3.

---

## 6. Riscos Técnicos

### 🔴 T1 — Modelo de sincronização multiplayer indefinido
Depende de G2. Com ticks simultâneos: snapshot por tick, fila de ações, reconnect por ressincronização de snapshot, spectators gratuitos. O estado (≈50 regiões × 6 agentes × atributos) é pequeno — o problema é o modelo, não a escala.

### 🟠 T2 — Fog of war exige filtragem server-side
O servidor nunca pode enviar o estado completo ao cliente: capacidades do Unknown Agent, investigação da Humanity no EMBATE, DNA/planos dos oponentes no PvP. Filtragem por visibilidade é um requisito de arquitetura, não um pormenor.

### 🟠 T3 — Living Assets: nunca meter a carreira on-chain
Escrever estatísticas por partida on-chain é caro e lento. Arquitetura correta: **on-chain = ownership + ponteiro para metadata + hash (commitment) da carreira; off-chain = base de dados com eventos assinados**. Usar compressed NFTs (cNFTs) para custo de minting viável à escala.

### 🟠 T4 — Win-trading e boosting quando há USDC à saída
O EMBATE 1v1 é o vetor ideal: duas contas fazem match, uma desiste. Contramedidas em camadas: fingerprinting de dispositivo/IP, heurísticas de qualidade da partida (duração, ações significativas, padrão de rendimento), período pendente em rewards, revisão manual acima de thresholds.

### 🟡 T5 — Economic Engine: dupla entrada + idempotência
O ledger interno deve ser de dupla entrada com chaves de idempotência; como a chain é imutável, erros corrigem-se com **transações compensatórias** registadas, nunca edições. Isto dá substância ao §43/§44.

### 🟡 T6 — Rating FFA e instrumentação de balance
ELO para 2–6 jogadores exige modelo próprio (Elo generalizado/TrueSkill-like). E a instrumentação de win rate × agente × matchup (§48) deve existir desde a primeira partida jogada, não na Phase 6.

### 🟡 T7 — Simulação CPU-bound em Node.js
Aceitável até 10k concorrentes com particionamento por match-process; mas os load tests da Phase 13 não devem ser deixados para o fim — micro-load tests na Phase 3 evitam surpresas de arquitetura.

---

## 7. As 12 perguntas a fechar antes da Phase 1

1. Simulação em tempo real ou em ticks simultâneos? *(recomendação: ticks, 2–4 s)*
2. Quais são as condições de vitória/derrota formais, por modo?
3. Qual a duração alvo de uma partida PvP? *(recomendação: 15–25 min)*
4. Algum asset Web3 confere gameplay? *(recomendação: não, nunca — C3)*
5. Qual é a lista fechada de receita elegível para referral?
6. Modelo de wallet: embedded custodial com exportação vs. self-custody pura?
7. Regiões reais ou fictícias?
8. Quais são os verbos e recursos do lado Humanity no EMBATE?
9. Entradas de torneio: pass-through de 100% ou com fee publicada à entrada?
10. Audit log: o que fica para sempre (hashes/transações pseudónimas) vs. o que tem retenção limitada (PII)?
11. Roster de launch: 6 agentes base ou 5 (cortando/fundindo Nanovirus)?
12. Prémios de season: USDC, assets, ou só cosméticos/trophies? *(implicações legais e de pressão vendedora)*

---

## 8. Próximos passos recomendados

1. **SPEC v1.1** — resolver as 6 contradições e responder às 12 perguntas (posso gerar o draft com as recomendações acima já incorporadas).
2. **Vertical slice antes da Phase 1 completa:** PvE com 1 agente (Virus), ~30 regiões, Humanity AI v1 em máquina de estados, árvore com ~40 nós + rule engine de tags, partida de ~20 minutos. Objetivo: validar fun com 10–20 jogadores reais antes de investir em PvP ou Web3.
3. **One-pager económico** com dupla entrada: três fluxos exemplo (compra primária com referral; venda no marketplace com e sem referenciador; torneio com fee publicada) mostrando os lançamentos contabilísticos completos.
4. **Triagem jurídica** (torneios pagos + custódia) antes de detalhar Phases 8–10.
5. **Tooling de balance:** simulador automático de partidas AI-vs-AI — pré-requisito para equilibrar o roster (G7) e condição para alguma vez ativar Unknown/Evolved.

---

*Esta revisão não invalida a spec — valida a direção e identifica o que falta para a tornar executável. O documento continua a ser uma base acima da média para um projeto Web3: o trabalho agora é transformá-lo de manifesto em design.*
