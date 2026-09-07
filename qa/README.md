# QA HEADLESS — PANDEMIC EVOLUTION

Verificação automatizada **keyless** (sem chaves de API): Playwright + Chromium
headless-shell abrem o jogo num browser real, capturam erros de consola / rede,
jogam um fluxo real e tiram screenshots que podem ser inspecionados visualmente.

## Componentes

| Ficheiro | Função |
|---|---|
| `check.js` | runner QA: abre `/` e `/play`, captura `console.error/warning`, `pageerror`, `requestfailed`; valida fontes; joga (cenário RUSH → clique real no canvas em `xinmara` → 4× → evolução `t_air1`); grava screenshots em `shots/`; imprime estado via `window.__qa()` |
| `shots/` | screenshots PNG por passo (`home`, `game-briefing`, `game-region-select`, `crop-europe`, `game-running`, `game-evolved`) |
| `node_modules/.pw-browsers/` | Chromium headless-shell (excluído do snapshot por estar dentro de `node_modules/` — é regenerável, ver reinstalação abaixo) |

## Hooks de QA no jogo (`game/public/index.html`)

- `window.__qa()` → `{phase, day, scenario, canvas, regions, dna, infected, logCount, fonts}`
- `window.__qaClickRegion(id)` → dispara `mousemove`+`click` reais no canvas sobre a região (testa o caminho de input do jogador, não atalhos internos)

## Executar

Pré-requisito: servidor do jogo a correr em `http://localhost:3000`.

```bash
cd /home/user/qa
PLAYWRIGHT_BROWSERS_PATH=/home/user/qa/node_modules/.pw-browsers node check.js
```

Exit codes: `0` limpo · `1` pageerror/net-fail detetados · `2` falha de launch.

Para inspecionar visualmente: ler os PNG em `shots/` (o próprio agente deve
fazê-lo antes de declarar qualquer alteração de UI como concluída).

## Reinstalação do zero (browser não persiste no snapshot)

```bash
cd /home/user/qa
npm install playwright                                   # pacote (node_modules não persiste)
sudo -n npx playwright install-deps chromium           # libs de sistema (libnss3 etc.; 1× por máquina)
PLAYWRIGHT_BROWSERS_PATH=/home/user/qa/node_modules/.pw-browsers npx playwright install chromium
```

Só o **headless-shell** é usado (Playwright escolhe-o em modo headless), ~115 MB
de download; a instalação completa `install chromium` inclui também o chromium
full (~390 MB) que pode ser removido: `rm -rf node_modules/.pw-browsers/chromium-*`
(mantendo `chromium_headless_shell-*`).

## O que o QA já apanhou

- **2026-09-07** — mapa-múndi invisível: `world.js` declara `const WORLD_LAND`
  (binding lexical global, NÃO propriedade de `window`) e o draw verificava
  `window.WORLD_LAND` → continentes silenciados sem qualquer erro de consola.
  Corrigido para `typeof WORLD_LAND!=='undefined'`.
- **2026-09-07** — etiquetas sobrepostas no cluster europeu → anti-colisão
  (baixo→cima→afastadas) + linha de telemetria movida para fora dos labels de longitude.
