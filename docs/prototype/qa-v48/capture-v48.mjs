import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const port = process.env.V48_CDP_PORT || '9336';
const outputDir = new URL('./', import.meta.url);
const prototypeUrl = pathToFileURL(new URL('../openclaw-auto-4room-v48.html', import.meta.url).pathname).href;
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

async function navigate(hash, width = 2200, height = 1200, embed = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
  await send('Page.navigate', { url: `${prototypeUrl}?qa=${Date.now()}${embed ? '&embed=1' : ''}#${hash}` });
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
  sidebar: {},
  displayDuplicateScan: {},
  screenRuleScan: {},
  benchmarkPanel: {},
  consoleErrors,
};

for (const target of [
  { vp: '390', id: 'v44-flow-390-light', file: 'openclaw-auto-v48-390.png', width: 390, height: 812 },
  { vp: '1024', id: 'v44-flow-create', file: 'openclaw-auto-v48-1024.png', width: 1024, height: 820 },
  { vp: '1440', id: 'v44-flow-1440-dark', file: 'openclaw-auto-v48-1440.png', width: 1440, height: 900 },
]) {
  await navigate(`${target.id},${target.vp},success,active`, target.width, target.height, true);
  results.viewportChecks[target.vp] = await evaluate(`(() => {
    const device = document.getElementById('device');
    const prototype = document.querySelector('#device .prototype');
    const board = document.querySelector('.flow-board');
    const transfer = document.querySelector('.flow-transfer');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const chat = document.querySelector('.chat-dock');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.querySelector('.chat-input');
    const firstChoice = document.querySelector('.chat-body .ask-opt');
    const workarea = document.querySelector('.workarea');
    const bodyText = content ? content.innerText : '';
    const tracked = [...document.querySelectorAll('.flow-now-main b,.flow-transfer-card b,.flow-art-visual strong,.flow-card-head b,.flow-card-head span,.flow-chip,.flow-nextbox strong,.flow-loop b')];
    function lineCounts(el) {
      const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) || el.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return [];
      const text = node.textContent;
      const lines = new Map();
      for (let i = 0; i < text.length; i += 1) {
        if (/\\s/.test(text[i])) continue;
        const range = document.createRange();
        range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        const top = Math.round(rect.top);
        lines.set(top, (lines.get(top) || '') + text[i]);
      }
      return [...lines.values()].map(line => line.length);
    }
    const textLayout = tracked.map(el => ({ text: el.textContent.trim(), lines: lineCounts(el), width: Math.round(el.getBoundingClientRect().width) }));
    const badCharacterWraps = textLayout.filter(item => item.text.length >= 4 && item.lines.length >= 2 && item.lines.some(count => count <= 2));
    const chipClips = [...document.querySelectorAll('.flow-chip')].filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => el.textContent.trim());
    const flowOverflow = [...document.querySelectorAll('.flow-card,.flow-bundle,.flow-nextbox,.flow-loop')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => ({ className: el.className, overflow: el.scrollWidth - el.clientWidth }));
    const isVisible = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const hasOwnText = el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const sub12Text = prototype ? [...prototype.querySelectorAll('*')]
      .filter(el => isVisible(el) && hasOwnText(el) && Number.parseFloat(getComputedStyle(el).fontSize) < 12)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' ? el.className : '',
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 72),
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
      })) : [];
    const controls = prototype ? [...prototype.querySelectorAll('button,input,select,textarea,[role="tab"]')]
      .filter(isVisible)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' ? el.className : '',
        text: (el.textContent || el.getAttribute('aria-label') || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 72),
        width: Math.round(el.getBoundingClientRect().width * 10) / 10,
        height: Math.round(el.getBoundingClientRect().height * 10) / 10,
      })) : [];
    const hasActiveTransition = style => style.transitionDuration.split(',').some(value => {
      const duration = Number.parseFloat(value);
      return value.trim().endsWith('ms') ? duration > 0 : duration > 0;
    });
    const allTransitions = prototype ? [...prototype.querySelectorAll('*')]
      .filter(el => {
        const style = getComputedStyle(el);
        return isVisible(el) && hasActiveTransition(style) && style.transitionProperty.split(',').map(value => value.trim()).includes('all');
      })
      .map(el => ({ tag: el.tagName.toLowerCase(), className: typeof el.className === 'string' ? el.className : '' })) : [];
    const choiceVisibility = (() => {
      if (!chatBody || !firstChoice) return null;
      const bodyRect = chatBody.getBoundingClientRect();
      const choiceRect = firstChoice.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(bodyRect.bottom, choiceRect.bottom) - Math.max(bodyRect.top, choiceRect.top));
      return Number((visibleHeight / choiceRect.height).toFixed(3));
    })();
    const inputChoiceOverlap = (() => {
      if (!chatInput || !chatBody) return null;
      const inputRect = chatInput.getBoundingClientRect();
      const bodyRect = chatBody.getBoundingClientRect();
      return [...document.querySelectorAll('.chat-body .ask-opt')].filter(isVisible).some(option => {
        const optionRect = option.getBoundingClientRect();
        const visibleOption = {
          left: Math.max(bodyRect.left, optionRect.left),
          right: Math.min(bodyRect.right, optionRect.right),
          top: Math.max(bodyRect.top, optionRect.top),
          bottom: Math.min(bodyRect.bottom, optionRect.bottom),
        };
        return visibleOption.right > visibleOption.left && visibleOption.bottom > visibleOption.top &&
          Math.max(0, Math.min(inputRect.right, visibleOption.right) - Math.max(inputRect.left, visibleOption.left)) > 0 &&
          Math.max(0, Math.min(inputRect.bottom, visibleOption.bottom) - Math.max(inputRect.top, visibleOption.top)) > 0;
      });
    })();
    return {
      title: document.title,
      viewport: window.VP,
      transferOverflow: transfer ? transfer.scrollWidth - transfer.clientWidth : null,
      boardOverflow: board ? board.scrollHeight - board.clientHeight : null,
      prototypeOverflow: prototype ? prototype.scrollWidth - prototype.clientWidth : null,
      deviceWidth: device ? Math.round(device.getBoundingClientRect().width) : null,
      sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null,
      chatPersistent: chat ? chat.dataset.chatDock === 'persistent' && getComputedStyle(chat).display !== 'none' : false,
      chatWidth: chat ? Math.round(chat.getBoundingClientRect().width) : null,
      workareaWidth: workarea ? Math.round(workarea.getBoundingClientRect().width) : null,
      chatRatio: chat && workarea ? Number((chat.getBoundingClientRect().width / workarea.getBoundingClientRect().width).toFixed(3)) : null,
      contentWidth: content ? Math.round(content.getBoundingClientRect().width) : null,
      chatBelowContent: chat && content ? Math.round(chat.getBoundingClientRect().top) >= Math.round(content.getBoundingClientRect().bottom) : null,
      chatBodyClientHeight: chatBody ? chatBody.clientHeight : null,
      chatBodyScrollHeight: chatBody ? chatBody.scrollHeight : null,
      chatRect: chat ? { top: Math.round(chat.getBoundingClientRect().top), bottom: Math.round(chat.getBoundingClientRect().bottom), height: Math.round(chat.getBoundingClientRect().height) } : null,
      chatBodyRect: chatBody ? { top: Math.round(chatBody.getBoundingClientRect().top), bottom: Math.round(chatBody.getBoundingClientRect().bottom), height: Math.round(chatBody.getBoundingClientRect().height) } : null,
      chatInputRect: chatInput ? { top: Math.round(chatInput.getBoundingClientRect().top), bottom: Math.round(chatInput.getBoundingClientRect().bottom), height: Math.round(chatInput.getBoundingClientRect().height) } : null,
      firstChoiceVisibility: choiceVisibility,
      inputChoiceOverlap,
      sub12TextCount: sub12Text.length,
      sub12Text,
      visibleControlCount: controls.length,
      touchUnder44: controls.filter(control => control.height < 44),
      transitionAllCount: allTransitions.length,
      transitionAll: allTransitions,
      duplicateRoomLabels: ['생성실','편집실','발행실','성과실'].filter(label => bodyText.includes(label)),
      badCharacterWraps,
      chipClips,
      flowOverflow,
      textLayout,
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

await navigate('v44-flow-create,1024,success,active');
results.sidebar.expanded = await evaluate(`(() => {
  let root = document.querySelector('.prototype');
  const contentBefore = Math.round(document.querySelector('.content').getBoundingClientRect().width);
  if (root.classList.contains('sidebar-collapsed')) document.querySelector('[data-action="sidebar-toggle"]').click();
  root = document.querySelector('.prototype');
  const side = root.querySelector('.sidebar');
  return { collapsed: root.classList.contains('sidebar-collapsed'), width: Math.round(side.getBoundingClientRect().width), contentBefore, contentAfter: Math.round(document.querySelector('.content').getBoundingClientRect().width), label: document.querySelector('[data-action="sidebar-toggle"]').getAttribute('aria-label') };
})()`);
results.sidebar.collapsed = await evaluate(`(() => {
  document.querySelector('[data-action="sidebar-toggle"]').click();
  const root = document.querySelector('.prototype');
  const side = root.querySelector('.sidebar');
  return { collapsed: root.classList.contains('sidebar-collapsed'), width: Math.round(side.getBoundingClientRect().width), contentWidth: Math.round(document.querySelector('.content').getBoundingClientRect().width), label: document.querySelector('[data-action="sidebar-toggle"]').getAttribute('aria-label') };
})()`);
await sleep(200);
await screenshot('openclaw-auto-v48-1024-sidebar-collapsed.png');
results.captures.push('openclaw-auto-v48-1024-sidebar-collapsed.png');

await navigate('v44-flow-create,1440,success,active');
results.sidebar.persistedDesktop = await evaluate(`(() => {
  localStorage.removeItem('openclaw-v47-sidebar-collapsed');
  const root = document.querySelector('.prototype');
  if (root.classList.contains('sidebar-collapsed')) document.querySelector('[data-action="sidebar-toggle"]').click();
  document.querySelector('[data-action="sidebar-toggle"]').click();
  return { collapsed: document.querySelector('.prototype').classList.contains('sidebar-collapsed'), persisted: localStorage.getItem('openclaw-v47-sidebar-collapsed') };
})()`);

results.displayDuplicateScan = await evaluate(`(() => {
  const original = { cur, VP, UT, ST };
  const labels = ['생성실','편집실','발행실','성과실'];
  const issues = [];
  SCREENS.forEach((screen, index) => {
    if (!screen.id.startsWith('v44-flow-')) return;
    cur = index; VP = screen.vp; UT = screen.ut; ST = screen.st; paint();
    const content = document.querySelector('.prototype[data-display="true"] .content');
    const text = content ? content.innerText : '';
    const found = labels.filter(label => text.includes(label));
    if (found.length) issues.push({ id: screen.id, found });
  });
  cur = original.cur; VP = original.VP; UT = original.UT; ST = original.ST; paint();
  return { checked: SCREENS.filter(screen => screen.id.startsWith('v44-flow-')).length, issues };
})()`);

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
  if (typeof setCardSpace !== 'function') return { mode: null, pressed: null, heights: [], error: 'setCardSpace unavailable' };
  setCardSpace('fill');
  const cards = [...document.querySelectorAll('.flow-focus > .flow-card')];
  const control = document.querySelector('[data-card-space="fill"]');
  return {
    mode: document.body.dataset.cardSpace,
    pressed: control ? control.getAttribute('aria-pressed') : null,
    heights: cards.map(card => Math.round(card.getBoundingClientRect().height)),
  };
})()`);
await sleep(200);
await screenshot('openclaw-auto-v48-card-space-a-1024.png');
results.captures.push('openclaw-auto-v48-card-space-a-1024.png');

results.cardSpace.hug = await evaluate(`(() => {
  if (typeof setCardSpace !== 'function') return { mode: null, pressed: null, heights: [], persisted: null, error: 'setCardSpace unavailable' };
  setCardSpace('hug');
  const cards = [...document.querySelectorAll('.flow-focus > .flow-card')];
  const control = document.querySelector('[data-card-space="hug"]');
  return {
    mode: document.body.dataset.cardSpace,
    pressed: control ? control.getAttribute('aria-pressed') : null,
    heights: cards.map(card => Math.round(card.getBoundingClientRect().height)),
    persisted: localStorage.getItem('openclaw-v45-card-space'),
  };
})()`);
await sleep(200);
await screenshot('openclaw-auto-v48-card-space-b-1024.png');
results.captures.push('openclaw-auto-v48-card-space-b-1024.png');

results.selectionBoard = await evaluate(`(() => ({
  openControl: Boolean(document.querySelector('.selection-open')),
  board: Boolean(document.getElementById('selection-board')),
  addFunction: typeof addCurrentScreen === 'function',
  saveFunction: typeof saveSelection === 'function',
  previewFunction: typeof renderSelectionBoard === 'function',
  storageKeyPresent: document.documentElement.innerHTML.includes('openclaw-v45-screen-selection'),
}))()`);

await navigate('v44-flow-create,1024,success,active', 2200, 1200, false);
results.benchmarkPanel = await evaluate(`(() => {
  const panel = document.querySelector('.sc-v47-bench');
  return { visible: Boolean(panel && getComputedStyle(panel).display !== 'none'), links: panel ? [...panel.querySelectorAll('a')].map(a => a.href) : [], text: panel ? panel.innerText : '' };
})()`);
await screenshot('openclaw-auto-v48-benchmark-panel.png');
results.captures.push('openclaw-auto-v48-benchmark-panel.png');

results.summary = {
  noTransferOverflow: Object.values(results.viewportChecks).every(item => item.transferOverflow <= 0),
  noBoardOverflow: Object.values(results.viewportChecks).every(item => item.boardOverflow <= 0),
  persistentChatAllViewports: Object.values(results.viewportChecks).every(item => item.chatPersistent),
  responsiveChatPlacement: results.viewportChecks['390'].chatBelowContent === true && results.viewportChecks['1024'].chatBelowContent === false && results.viewportChecks['1440'].chatBelowContent === false,
  chatRatioAt1024: results.viewportChecks['1024'].chatRatio <= 0.31,
  noCharacterWraps: Object.values(results.viewportChecks).every(item => item.badCharacterWraps.length === 0),
  noChipClips: Object.values(results.viewportChecks).every(item => item.chipClips.length === 0),
  noFlowHorizontalOverflow: Object.values(results.viewportChecks).every(item => item.flowOverflow.length === 0),
  noDuplicateRoomLabels: results.displayDuplicateScan.issues.length === 0,
  sidebarToggleWorks: results.sidebar.expanded.width === 224 && results.sidebar.collapsed.width === 56 && results.sidebar.expanded.contentBefore === results.sidebar.expanded.contentAfter,
  sidebarDesktopPersists: results.sidebar.persistedDesktop.collapsed === true && results.sidebar.persistedDesktop.persisted === 'true',
  cardModesPersist: results.cardSpace.fill.mode === 'fill' && results.cardSpace.hug.persisted === 'hug',
  selectionFeaturePreserved: Object.values(results.selectionBoard).every(Boolean),
  benchmarkPanelComplete: results.benchmarkPanel.visible && results.benchmarkPanel.links.length >= 6,
  screenRulesClean: results.screenRuleScan.issues.length === 0,
  sub12TextZero: Object.values(results.viewportChecks).every(item => item.sub12TextCount === 0),
  mobileChatBodyAtLeast120: results.viewportChecks['390'].chatBodyClientHeight >= 120,
  mobileFirstChoiceFullyVisible: results.viewportChecks['390'].firstChoiceVisibility === 1,
  mobileInputChoiceNoOverlap: results.viewportChecks['390'].inputChoiceOverlap === false,
  mobileTouchTargetsAtLeast44: results.viewportChecks['390'].touchUnder44.length === 0,
  noTransitionAll: Object.values(results.viewportChecks).every(item => item.transitionAllCount === 0),
  noConsoleErrors: consoleErrors.length === 0,
};

await writeFile(new URL('qa-results.json', outputDir), `${JSON.stringify(results, null, 2)}\n`);
socket.close();
console.log(JSON.stringify(results.summary));
