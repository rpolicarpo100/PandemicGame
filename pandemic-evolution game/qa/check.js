// QA headless do Pandemic Evolution — screenshots + erros de consola + fluxo jogado
// Uso: PLAYWRIGHT_BROWSERS_PATH=/home/user/qa/.browsers node check.js [baseUrl]
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const issues = [];

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') issues.push(`[console.${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', e => issues.push('[pageerror] ' + e.message));
  page.on('requestfailed', r => issues.push('[net-fail] ' + r.url() + ' — ' + ((r.failure() || {}).errorText || '?')));

  // 1. homepage
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'home.png'), fullPage: true });
  const homeFonts = await page.evaluate(() => ({
    display: document.fonts.check('800 60px Display'),
    mono: document.fonts.check('400 12px Mono'),
  }));

  // 2. arena — ecrã de briefing (setup)
  await page.goto(BASE + '/play', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'game-briefing.png') });

  // 3. escolher cenário GLOBAL RUSH (via ação real do jogo)
  const scen = await page.evaluate(() => window.action({ type: 'newgame', scenario: 'rush' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'game-region-select.png') });
  await page.screenshot({ path: path.join(OUT, 'crop-europe.png'), clip: { x: 440, y: 260, width: 260, height: 160 } });

  // 4. clique REAL no canvas para semear o surto (xinmara)
  const clicked = await page.evaluate(() => window.__qaClickRegion('xinmara'));
  await page.evaluate(() => window.action({ type: 'speed', value: 4 }));
  await page.waitForTimeout(16000); // ~32 dias de jogo a 4× (wire ganha vida)
  const mid1 = await page.evaluate(() => window.__qa());
  await page.screenshot({ path: path.join(OUT, 'game-running.png') });

  // wire + registo global + ligações da região
  await page.evaluate(() => window.__qaClickRegion('xinmara')); // seleciona amostra
  await page.click('.tabs button[data-t="reg"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'game-region-conns.png') });
  await page.click('.tabs button[data-t="log"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'game-wire-log.png') });
  await page.click('.tabs button[data-t="evo"]');

  // 5. comprar uma evolução real (Airborne I, 60 DNA)
  const evo = await page.evaluate(() => window.action({ type: 'evolve', node: 't_air1' }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'game-evolved.png') });

  const state = await page.evaluate(() => window.__qa());
  await browser.close();

  console.log(JSON.stringify({
    homeFonts,
    scenarioAction: scen,
    canvasClickSeed: clicked,
    evolveAction: evo,
    mid1,
    final: state,
    issues,
    screenshots: fs.readdirSync(OUT),
  }, null, 2));

  const fatal = issues.filter(i => i.startsWith('[pageerror]') || i.startsWith('[net-fail]'));
  process.exit(fatal.length ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
