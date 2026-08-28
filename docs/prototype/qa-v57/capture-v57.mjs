import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const port = process.env.V57_CDP_PORT || '9357';
const outputDir = new URL('./', import.meta.url);
const prototypeUrl = pathToFileURL(new URL('../openclaw-auto-4room-v57.html', import.meta.url).pathname).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((res, rej) => { socket.addEventListener('open', res, { once: true }); socket.addEventListener('error', rej, { once: true }); });
let seq = 0; const pending = new Map(); const consoleErrors = [];
socket.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); return; }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text || String(m.params.exceptionDetails.exception?.description || 'exception'));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map(a => a.value || a.description || '').join(' '));
});
function send(method, params = {}) { const id = ++seq; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
}
await send('Page.enable'); await send('Runtime.enable');

async function shot(name) {
  const s = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(new URL(name, outputDir), Buffer.from(s.data, 'base64'));
}
async function load(vp, w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false, screenWidth: w, screenHeight: h });
  await send('Page.navigate', { url: `${prototypeUrl}?${EMBED ? 'embed=1&' : ''}qa=${Date.now()}` });
  await sleep(1500);
  await evaluate(`setVP('${vp}')`);
  await sleep(400);
}
// 프레임 안 넘침 계측 (가로 · 세로 둘 다 · R145)
const OVERFLOW = `(() => {
  const out=[];
  const proto=document.querySelector('#device .prototype');
  if(!proto) return {error:'no prototype'};
  const panes=[document.querySelector('#device .frame'),...document.querySelectorAll('#device .workarea,#device .content')].filter(Boolean);
  panes.forEach(p=>out.push({sel:p.className,x:p.scrollWidth-p.clientWidth,y:p.scrollHeight-p.clientHeight}));
  const wide=[...proto.querySelectorAll('*')].filter(el=>{
    const s=getComputedStyle(el);
    if(s.overflowX==='auto'||s.overflowX==='scroll') return false;
    return el.scrollWidth>el.clientWidth+1;
  }).map(el=>({cls:(typeof el.className==='string'?el.className:''),over:el.scrollWidth-el.clientWidth})).slice(0,8);
  return {panes:out, unexpectedWide:wide};
})()`;

let EMBED = true;
const results = { generatedAt: new Date().toISOString(), prototype: prototypeUrl, checks: {}, consoleErrors };
const plan = [
  // [파일, 뷰포트, w, h, 준비 JS]
  ['v57-sidebar-rooms-1440.png','1440',1440,900,`__v26.apply({path:'/room/create'})`],
  ['v57-sidebar-rooms-1024.png','1024',1024,860,`__v26.apply({path:'/room/create'})`],
  ['v57-sidebar-rooms-1024-open.png','1024',1024,860,`__v26.apply({path:'/room/create',sidebarViewportExpanded:true})`],
  ['v57-channel-connect-1440.png','1440',1440,900,`__v26.apply({path:'/channels/instagram',platformTab:'settings'})`],
  ['v57-channel-connect-notconnected-1440.png','1440',1440,900,`__v26.apply({path:'/channels/facebook',platformTab:'settings'})`],
  ['v57-publish-1440.png','1440',1440,900,`__v26.apply({path:'/room/publish',pubDepth:'preview',v57Edit:''})`],
  ['v57-publish-drawer-1440.png','1440',1440,900,`__v26.apply({path:'/room/publish',pubDepth:'preview',v57Edit:'threads'})`],
  ['v57-publish-run-1440.png','1440',1440,900,`__v26.apply({path:'/room/publish',pubDepth:'preview',v56PubSt:{threads:'done',x:'done',instagram:'failed',facebook:'doing'}})`],
  ['v57-publish-1024.png','1024',1024,860,`__v26.apply({path:'/room/publish',pubDepth:'preview',v57Edit:''})`],
  ['v57-publish-390.png','390',390,812,`__v26.apply({path:'/room/publish',pubDepth:'preview',v57Edit:''})`],
  ['v57-edit-1440.png','1440',1440,900,`__v26.apply({path:'/room/edit'})`],
  ['v57-first-gate-390.png','390',390,812,`showScreen('v56-first-gate')`],
  ['v57-first-gate-1440.png','1440',1440,900,`showScreen('v56-first-gate')`],
  ['v57-perf-1440.png','1440',1440,900,`__v26.apply({path:'/room/perf'})`],
];
// 검수 셸(허브) 전체 · 우측 변경점 패널이 보이는 화면
EMBED = false;
for (const [file, w, h, prep] of [
  ['v57-hub-sidebar-rooms.png', 1680, 1050, `showScreen('v57-sidebar-rooms')`],
  ['v57-hub-publish.png', 1680, 1050, `showScreen('v57-publish')`],
]) {
  await load('1440', w, h);
  await evaluate(prep);
  await sleep(800);
  await shot(file);
  process.stdout.write(`captured ${file}\n`);
}
EMBED = true;
for (const [file, vp, w, h, prep] of plan) {
  await load(vp, w, h);
  await evaluate(prep);
  await sleep(700);
  results.checks[file] = await evaluate(OVERFLOW);
  await shot(file);
  process.stdout.write(`captured ${file}\n`);
}
results.consoleErrors = consoleErrors;
await writeFile(new URL('v57-qa.json', outputDir), JSON.stringify(results, null, 2));
console.log('console errors:', consoleErrors.length);
socket.close();
