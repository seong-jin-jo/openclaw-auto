import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const port = process.env.V45_CDP_PORT || '9335';
const outputDir = new URL('./', import.meta.url);
const prototypeUrl = pathToFileURL(new URL('../openclaw-auto-4room-v45.html', import.meta.url).pathname).href;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
const consoleErrors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails.text || 'Runtime exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
  }
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(hash, width = 2200, height = 1200) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
  await send('Page.navigate', { url: `${prototypeUrl}?qa=${Date.now()}#${hash}` });
  await sleep(1400);
}

async function screenshot(name) {
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(new URL(name, outputDir), Buffer.from(shot.data, 'base64'));
}

await send('Page.enable');
await send('Runtime.enable');

const results = {
  generatedAt: new Date().toISOString(),
  prototype: prototypeUrl,
  captures: [],
  viewportChecks: {},
  cardSpace: {},
  selectionBoard: {},
  screenRuleScan: {},
  consoleErrors,
};

for (const target of [
  { vp: '390', id: 'v44-flow-390-light', file: 'openclaw-auto-v45-390.png' },
  { vp: '1024', id: 'v44-flow-create', file: 'openclaw-auto-v45-1024.png' },
  { vp: '1440', id: 'v44-flow-1440-dark', file: 'openclaw-auto-v45-1440.png' },
]) {
  await navigate(`${target.id},${target.vp},success,active`);
  results.viewportChecks[target.vp] = await evaluate(`(() => {
    const device = document.getElementById('device');
    const board = document.querySelector('.flow-board');
    const route = document.querySelector('.flow-route');
    const carry = document.querySelector('.flow-mobile-carry');
    return {
      title: document.title,
      viewport: window.VP,
      bridges: document.querySelectorAll('.flow-bridge').length,
      routeOverflow: route ? route.scrollWidth - route.clientWidth : null,
      boardOverflow: board ? board.scrollHeight - board.clientHeight : null,
      deviceWidth: device ? Math.round(device.getBoundingClientRect().width) : null,
      mobileCarryVisible: carry ? getComputedStyle(carry).display !== 'none' : false,
      header: (() => {
        const h = document.querySelector('.gnb');
        return h ? {
          height: Math.round(h.getBoundingClientRect().height),
          overflow: h.scrollWidth - h.clientWidth,
          wrap: getComputedStyle(h).flexWrap,
          learningBeforeCredit: h.textContent.indexOf('학습 정보') < h.textContent.indexOf('12,400'),
        } : null;
      })(),
    };
  })()`);
  await screenshot(target.file);
  results.captures.push(target.file);
}

results.screenRuleScan = await evaluate(`(() => {
  const original = { cur, VP, UT, ST };
  const forbidden = ['되짚어 보기', '가리킴 목록', '내 에이전시'];
  const layerCode = /(^|[^A-Za-z0-9])(S0|S1|U2|U3|U4|X4|L5|R6)([^A-Za-z0-9]|$)/;
  const issues = [];
  SCREENS.forEach((screen, index) => {
    cur = index;
    VP = screen.vp;
    UT = screen.ut;
    ST = screen.st;
    paint();
    const root = document.querySelector('#device .prototype, #device .operator-shell');
    const text = root ? root.innerText : '';
    const words = forbidden.filter(word => text.includes(word));
    const code = text.match(layerCode);
    if (words.length || code) issues.push({ id: screen.id, words, layerCode: code ? code[2] : null });
  });
  cur = original.cur;
  VP = original.VP;
  UT = original.UT;
  ST = original.ST;
  paint();
  return { checked: SCREENS.length, issues };
})()`);

await navigate('v44-flow-create,1024,success,active');
results.cardSpace.fill = await evaluate(`(() => {
  setCardSpace('fill');
  const cards = [...document.querySelectorAll('.flow-focus > .flow-card')];
  return {
    mode: document.body.dataset.cardSpace,
    pressed: document.querySelector('[data-card-space="fill"]').getAttribute('aria-pressed'),
    heights: cards.map(card => Math.round(card.getBoundingClientRect().height)),
  };
})()`);
await sleep(200);
await screenshot('openclaw-auto-v45-card-space-a-1024.png');
results.captures.push('openclaw-auto-v45-card-space-a-1024.png');

results.cardSpace.hug = await evaluate(`(() => {
  setCardSpace('hug');
  const cards = [...document.querySelectorAll('.flow-focus > .flow-card')];
  return {
    mode: document.body.dataset.cardSpace,
    pressed: document.querySelector('[data-card-space="hug"]').getAttribute('aria-pressed'),
    heights: cards.map(card => Math.round(card.getBoundingClientRect().height)),
    persisted: localStorage.getItem('openclaw-v45-card-space'),
  };
})()`);
await sleep(200);
await screenshot('openclaw-auto-v45-card-space-b-1024.png');
results.captures.push('openclaw-auto-v45-card-space-b-1024.png');

results.selectionBoard = await evaluate(`(async () => {
  resetSelection();
  openSelectionBoard();
  showScreen('v44-flow-create');
  addCurrentScreen();
  showScreen('v44-flow-edit');
  addCurrentScreen();
  const memo = document.getElementById('selection-memo');
  memo.value = '방 사이 전달물을 유지하고 카드 여백 B를 기준으로 비교';
  updateSelectionMemo(memo.value);
  await saveSelection();
  await new Promise(resolve => setTimeout(resolve, 600));
  const stored = JSON.parse(localStorage.getItem('openclaw-v45-screen-selection') || '{}');
  const prompt = document.getElementById('selection-prompt');
  return {
    open: document.getElementById('selection-board').classList.contains('open'),
    ariaHidden: document.getElementById('selection-board').getAttribute('aria-hidden'),
    selected: V45_SELECTION.slice(),
    previews: document.querySelectorAll('.selection-preview iframe').length,
    promptHasScreens: prompt && prompt.value.includes('생성실') && prompt.value.includes('편집실'),
    promptHasMemo: prompt && prompt.value.includes('방 사이 전달물'),
    promptHasCardSpace: prompt && prompt.value.includes('B 내용 높이'),
    storedIds: stored.ids,
    storedMemo: stored.memo,
    status: document.getElementById('selection-status').textContent,
  };
})()`, true);
await screenshot('openclaw-auto-v45-screen-selection.png');
results.captures.push('openclaw-auto-v45-screen-selection.png');

results.summary = {
  bridgeCountAllViewports: Object.values(results.viewportChecks).every(item => item.bridges === 3),
  noRouteOverflow: Object.values(results.viewportChecks).every(item => item.routeOverflow <= 0),
  cardModesPersist: results.cardSpace.fill.mode === 'fill' && results.cardSpace.hug.persisted === 'hug',
  selectionSaved: results.selectionBoard.selected.length === 2 && results.selectionBoard.previews === 2,
  promptComplete: Boolean(results.selectionBoard.promptHasScreens && results.selectionBoard.promptHasMemo && results.selectionBoard.promptHasCardSpace),
  screenRulesClean: results.screenRuleScan.issues.length === 0,
  noConsoleErrors: consoleErrors.length === 0,
};

await writeFile(new URL('qa-results.json', outputDir), `${JSON.stringify(results, null, 2)}\n`);
socket.close();
console.log(JSON.stringify(results.summary));
