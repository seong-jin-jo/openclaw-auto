import fs from 'node:fs';

const tabs = await fetch('http://127.0.0.1:9222/json').then((response) => response.json());
const target = tabs.find((tab) => tab.type === 'page' && tab.url === 'about:blank') || tabs.find((tab) => tab.type === 'page');
if (!target) throw new Error('No browser page target found.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  requestId += 1;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}

await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await command('Page.enable');
await command('Page.navigate', {
  url: 'file:///Users/sj/OSMU-archive/video-experiments/02-entertainment/fictional-entertainment/index.html',
});
await new Promise((resolve) => setTimeout(resolve, 1000));
const metrics = await command('Runtime.evaluate', {
  expression: 'JSON.stringify({innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,toolbar:document.querySelector(".toolbar").getBoundingClientRect().toJSON()})',
  returnByValue: true,
});
console.log(metrics.result.value);
const shot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true });
fs.writeFileSync('/tmp/sports-ent-hub-mobile-cdp.png', Buffer.from(shot.data, 'base64'));
socket.close();
setTimeout(() => process.exit(0), 100);
