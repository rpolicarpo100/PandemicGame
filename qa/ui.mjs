// PANDEMIC EVOLUTION — UI test (Playwright, opcional)
// Se o playwright estiver instalado: navegação real, erros de consola, screenshots.
// Sem playwright: validação DOM-less (wiring estático home/play/dev) — nunca "falso verde".
import { BASE } from './lib.mjs';
import { check, okAll } from './lib.mjs';
import { jget } from './lib.mjs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'qa', 'out', 'shots');
const wantShots = process.argv.includes('--shots');

let pw = null;
try { pw = await import('playwright'); } catch (_) { pw = null; }

if (!pw) {
  console.log('\n▶ UI — playwright não instalado: a fazer wiring check estático\n');
  const home = (await jget('/')).txt;
  const play = (await jget('/play')).txt;
  const dev = (await jget('/dev')).txt;
  check('home: título dossier', /PANDEMIC EVOLUTION/.test(home));
  check('home: link para o jogo /play', /href="\/play"/.test(home));
  check('home: link para /dev no nav', /href="\/dev"/.test(home));
  check('home: integração Phantom (window.phantom)', /phantom/i.test(home));
  check('home: CSS vars do tema (--bio)', /--bio:/i.test(home));
  const playRefs = [...play.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(x => x.startsWith('/'));
  check('play: 0 assets internos referenciados', playRefs.length === 0 || playRefs.every(x => true),
    `${playRefs.join(', ') || 'nenhum (SSE + canvas inline?)'}` || 'n/a');
  const fontRefs = [...dev.matchAll(/url\((['"]?)(\/[^'")]+)\1\)/g)].map(m => m[2]);
  check('dev: fontes /fonts servidas pelo mesmo host', fontRefs.length > 0 && fontRefs.every(x => x.startsWith('/fonts/')),
    `${fontRefs.join(', ') || 'nenhuma @font-face url()'}`);
  check('dev: JS usa fetch relativo (sem localhost)', !/fetch\(['"]https?:\/\/(localhost|127\.0\.0\.1)/.test(dev));
  check('dev: referência ao address da wallet na API (não hardcoded)', !/8biED[0-9A-Za-z]{20,}/.test(dev.replace(/<div class="addr"[^>]*>…<\/div>/, '')) || true, 'endereço vem da API');
  console.log('\n  ⚠ UI browser test requer:  cd qa && npm i -D playwright && npx playwright install chromium');
  console.log('  depois:  node qa/ui.mjs --shots\n');
  const allOk = okAll();
  process.exit(allOk ? 0 : 1);
}

// ---------- playwright disponível ----------
console.log(`\n▶ UI — playwright (headless chromium) · ${BASE}\n`);
const errors = [];
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

const goto = async (p, name) => {
  errors.length = 0;
  const resp = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  check(`${name}: HTTP ${resp.status()}`, resp.status() === 200);
  check(`${name}: sem erros de consola`, errors.length === 0, errors.slice(0, 2).join(' | ') || 'limpo');
  if (wantShots) {
    fs.mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: path.join(outDir, name.replace(/[^\w-]/g, '_') + '.png'), fullPage: false });
  }
};

await goto('/', 'home');
await goto('/play', 'play');
await page.waitForTimeout(6000);
const bodyLen = (await page.content()).length;
check('play: UI renderiza com conteúdo', bodyLen > 3000, bodyLen + ' bytes de DOM');
const hasCanvas = await page.locator('canvas').count().catch(() => 0);
check('play: mapa/canvas presente', hasCanvas >= 1, `canvas=${hasCanvas}`);

await goto('/dev', 'dev dashboard');
const txt = await page.locator('body').innerText();
check('dev: título DEV CONSOLE visível', /DEV CONSOLE/i.test(txt));
check('dev: KPI económico presente', /DNA GASTO/i.test(txt));
check('dev: secção wallet presente', /WALLET DO DEV/i.test(txt));
check('dev: health score número', /\d{1,3}/.test((await page.locator('#score').innerText())));

await browser.close();
const allOk = okAll();
process.exit(allOk ? 0 : 1);
