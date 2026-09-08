// QA PvP fim-de-jogo real: 2 jogadores, ×8 até ao relógio (dia 300) — valida ranking/score no ecrã
import { chromium } from 'playwright';
import { BASE as B } from './lib.mjs';
let fails = 0;
const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? ' | ' + x : '')); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const mk = async tag => {
  const p = await (await browser.newContext()).newPage();
  p.on('pageerror', e => console.log('[' + tag + '] pageerror', e.message));
  return p;
};
const A = await mk('A'), Bp = await mk('B');
for (const p of [A, Bp]) await p.goto(B + '/pvp');
await A.click('#btnCreate');
await A.waitForFunction(() => /^[A-Z2-9]{6}$/.test(document.getElementById('roomCode').textContent));
const code = await A.textContent('#roomCode');
await Bp.fill('#joinCode', code); await Bp.click('#btnJoin');
await A.waitForFunction(() => document.getElementById('lbCount').textContent === '2');

// agentes + origens + ready
const pick = async (p, tag, agentIdx) => {
  await p.waitForSelector('#agChips .ag-chip:not(.taken):not(.sel)');
  await p.locator('#agChips .ag-chip:not(.taken):not(.sel)').nth(agentIdx % 4).click();
  await p.waitForFunction(() => !!document.querySelector('#agChips .ag-chip.sel'));
  await p.waitForSelector('#seedSel');
  const val = await p.evaluate(() => document.getElementById('seedSel').options[Math.floor(Math.random() * 120) + 20].value);
  await p.selectOption('#seedSel', val);
  await p.waitForFunction(() => document.getElementById('seedStatus').textContent.includes('origem escolhida'));
  await p.waitForFunction(() => !document.getElementById('btnReady').disabled);
  await p.click('#btnReady');
};
await pick(A, 'A', 0); await pick(Bp, 'B', 1);
await sleep(800);
await A.waitForFunction(() => !document.getElementById('hostStart').disabled, null, { timeout: 8000 });
await A.click('#hostStart');
await A.waitForSelector('#sc-game.on');
await A.click('.speedbtn[title="velocidade ×8"]');
console.log('...a acelerar até ao relógio (300 dias ≈ 75 s)...');
// aguardar fim: max ~150 s
await A.waitForSelector('#sc-end.on', { timeout: 150000 });
ok('A: ecrã de fim visível', true);
await Bp.waitForSelector('#sc-end.on', { timeout: 30000 });
ok('B: ecrã de fim visível também', true);

const reason = await A.textContent('#endReason');
ok('razão do fim presente', /DIA \d+/.test(reason), reason);
const rows = await A.locator('#endRank .rankrow').count();
ok('ranking com 2 jogadores', rows === 2, 'n=' + rows);
const w0 = await A.locator('#endRank .rankrow').first().innerText();
ok('vencedor com pontos', /\/1000 PTS/.test(w0));
const winTag = await A.locator('#endRank .rankrow.win').count();
ok('medalha 🥇 no 1º', winTag === 1);
const partsN = await A.locator('#endParts .part').count();
ok('6 partes de score', partsN === 6, 'n=' + partsN);
const scoreTxt = await A.locator('#endRank .rankrow').first().locator('.pts').innerText();
const score = parseInt(scoreTxt);
ok('score válido 0-1000', score > 0 && score <= 1000, 'score=' + score);
// igual em B
const bReason = await Bp.textContent('#endReason');
ok('B vê a mesma razão/fim', bReason === reason, bReason.slice(0, 60));
await A.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/pvp_end_A.png' });

// sair da sala terminada
await A.click('#btnAfter'); await A.waitForSelector('#sc-home.on');
await Bp.click('#btnAfter'); await Bp.waitForSelector('#sc-home.on');
ok('volta ao início', true);
console.log(fails ? '\nPVP END QA: ' + fails + ' FAIL' : '\nPVP END QA: ALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
