/*
STAMP: created_at=2026-08-13 KST | model=claude-opus-4-8 | agent=product-designer
PURPOSE: 실제 Chrome(headless) + http.server 로 v24 전 route를 열어 console error / Runtime.exceptionThrown 을 route별로 수집한다.
SOURCES: v24 prototype | dashboard/src route inventory | Chrome DevTools Protocol
*/
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(here, "../openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html");
const html = readFileSync(htmlPath, "utf8");
const FILE = "openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html";
const PORT = 8899;

// derive routes from the manifest embedded in the HTML
const routes = [];
const gm = html.match(/var groups=(\[[\s\S]*?\]);\s*\n\s*var destinations=/);
// fallback: just scan for path:'/...'
const pathRe = /\{path:'([^']+)'/g; let m;
while ((m = pathRe.exec(html))) { if (!routes.includes(m[1])) routes.push(m[1]); }

const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9333", "--remote-debugging-address=127.0.0.1",
  "--user-data-dir=/tmp/v24-chrome-profile", "about:blank",
], { stdio: "ignore" });

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch("http://127.0.0.1:9333/json/version");
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("chrome CDP not ready");
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
let msgId = 0; const pending = new Map(); const listeners = [];
ws.addEventListener("message", (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  else listeners.forEach((fn) => fn(d));
});
await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((res) => pending.set(id, (d) => res(d.result || {})));
}

// attach to a page target
const t = await send("Target.createTarget", { url: "about:blank" });
const targetId = t.targetId;
const att = await send("Target.attachToTarget", { targetId, flatten: true });
const sessionId = att.sessionId;

let currentErrors = [];
listeners.push((d) => {
  if (d.sessionId !== sessionId) return;
  if (d.method === "Runtime.exceptionThrown") {
    const e = d.params.exceptionDetails;
    currentErrors.push("exception: " + (e.exception?.description || e.text));
  }
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") {
    currentErrors.push("console.error: " + d.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
  }
  if (d.method === "Log.entryAdded" && d.params.entry.level === "error") {
    currentErrors.push("log: " + d.params.entry.text);
  }
});
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId);
await send("Page.enable", {}, sessionId);

const viewports = [[390, 844], [1024, 768]];
const results = [];
// load the page once
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/${FILE}` }, sessionId);
await new Promise((r) => setTimeout(r, 600));
// extra screens driven by state, not in nav destinations
const stateScreens = [
  { name: "journey", js: "__V24_TEST_API__.go('/');__V24_TEST_API__.getState().view='journey';__V24_TEST_API__.rerender&&__V24_TEST_API__.rerender();" },
];
for (const path of routes) {
  for (const [w, h] of viewports) {
    currentErrors = [];
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }, sessionId);
    const { result } = await send("Runtime.evaluate", {
      expression: `(function(){try{window.__V24_TEST_API__.go(${JSON.stringify(path)});}catch(e){return JSON.stringify({err:String(e)});}var r=document.getElementById('root')||document.body;var sw=document.documentElement.scrollWidth,cw=document.documentElement.clientWidth;return JSON.stringify({rootChars:(r&&r.textContent||'').trim().length,overflow:sw-cw});})()`,
      returnByValue: true,
    }, sessionId);
    await new Promise((r) => setTimeout(r, 120));
    let meta = {}; try { meta = JSON.parse(result.value); } catch {}
    results.push({ path, viewport: `${w}x${h}`, errors: [...currentErrors], rootChars: meta.rootChars, overflowPx: meta.overflow, evalErr: meta.err || null });
  }
}
// role + screenState matrix on Home & Studio (real state screens)
const roles = ["customer", "operator"];
const screenStates = ["success", "loading", "empty", "error"];
for (const path of ["/", "/studio"]) {
  for (const role of roles) {
    for (const ss of screenStates) {
      currentErrors = [];
      const { result } = await send("Runtime.evaluate", {
        expression: `(function(){try{var a=window.__V24_TEST_API__;a.setRole(${JSON.stringify(role)});var s=a.getState();s.screenState=${JSON.stringify(ss)};a.go(${JSON.stringify(path)});}catch(e){return JSON.stringify({err:String(e)});}var r=document.getElementById('root')||document.body;return JSON.stringify({rootChars:(r&&r.textContent||'').trim().length});})()`,
        returnByValue: true,
      }, sessionId);
      await new Promise((r) => setTimeout(r, 100));
      let meta = {}; try { meta = JSON.parse(result.value); } catch {}
      results.push({ path: `${path} [${role}/${ss}]`, viewport: "390x844", errors: [...currentErrors], rootChars: meta.rootChars, evalErr: meta.err || null });
    }
  }
}

const failed = results.filter((r) => r.errors.length || (r.rootChars ?? 1) < 20 || (r.overflowPx ?? 0) > 2);
const out = {
  routeCount: routes.length,
  totalChecks: results.length,
  errorChecks: results.filter((r) => r.errors.length).length,
  overflowChecks: results.filter((r) => (r.overflowPx ?? 0) > 2).length,
  emptyRoots: results.filter((r) => (r.rootChars ?? 1) < 20).map((r) => r.path + "@" + r.viewport),
  failed,
  results,
};
console.log(JSON.stringify(out, null, 2));

ws.close(); chrome.kill(); server.close();
process.exit(0);
