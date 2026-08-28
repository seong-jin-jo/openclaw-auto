/*
STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer
PURPOSE: localhost v24를 실제 Chrome CDP로 전환하며 console, page, overflow를 감사한다.
SOURCES: v24 prototype | dashboard/src route inventory | gstack browse interaction workflow
*/
const host = process.env.CDP_HOST || "http://127.0.0.1:9333";
const pageUrl = process.env.PAGE_URL || "http://127.0.0.1:8899/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTarget() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`${host}/json/list`).then((response) => response.json());
      const target = targets.find((item) => item.type === "page");
      if (target) return target;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome DevTools target를 찾지 못했습니다.");
}

const target = await getTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const runtimeErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push({
      type: "exception",
      text: message.params.exceptionDetails.text,
      detail: message.params.exceptionDetails.exception?.description || "",
    });
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    runtimeErrors.push({
      type: "console",
      text: message.params.args.map((arg) => arg.value || arg.description || "").join(" "),
    });
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    runtimeErrors.push({ type: "log", text: message.params.entry.text });
  }
  if (message.method === "Page.javascriptDialogOpening") {
    send("Page.handleJavaScriptDialog", { accept: true }).catch((error) => {
      runtimeErrors.push({ type: "dialog", text: error.message });
    });
  }
});

function send(method, params = {}) {
  commandId += 1;
  const id = commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(detail);
  }
  return result.result.value;
}

await Promise.all([send("Runtime.enable"), send("Page.enable"), send("Log.enable")]);
await send("Page.navigate", { url: pageUrl });
await sleep(800);

const manifest = await evaluate("window.__V24_MANIFEST__");
const routes = await evaluate("window.__V19_MANIFEST__.destinations.map(function(item){return item.path;})");
const checks = [];
const discoveredActions = new Map();

async function check(name, expression) {
  const before = runtimeErrors.length;
  let evaluationError = null;
  try {
    await evaluate(expression);
  } catch (error) {
    evaluationError = error.message;
  }
  await sleep(80);
  const snapshot = await evaluate(`({
    rootChars:(document.getElementById('root')?.textContent||'').trim().length,
    rootChildren:document.getElementById('root')?.children.length||0,
    dialogs:document.querySelectorAll('[role="dialog"], .dialog').length,
    overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    path:window.__V24_TEST_API__?.getState().path,
    role:window.__V24_TEST_API__?.getState().role
  })`);
  checks.push({
    name,
    evaluationError,
    errors: runtimeErrors.slice(before),
    ...snapshot,
  });
}

async function collectActions(context) {
  const items = await evaluate(`Array.from(document.querySelectorAll('[data-action]')).map(function(el){return el.getAttribute('data-action');}).filter(Boolean)`);
  const state = await evaluate("JSON.parse(JSON.stringify(window.__V24_TEST_API__.getState()))");
  for (const action of items) {
    if (!discoveredActions.has(action)) discoveredActions.set(action, { context, state });
  }
}

for (const route of routes) {
  await check(`route:${route}`, `window.__V24_TEST_API__.go(${JSON.stringify(route)})`);
  await collectActions(`route:${route}`);
  await check(
    `route-click:${route}`,
    `window.__V24_TEST_API__.setRole('customer');(function(){var el=Array.from(document.querySelectorAll('[data-route]')).find(function(node){return node.getAttribute('data-route')===${JSON.stringify(route)}});if(!el)throw new Error('data-route 메뉴 없음: '+${JSON.stringify(route)});el.click();})()`,
  );
}

for (const tab of ["channels", "ai", "storage", "design", "notifications", "tokens", "keywords", "system"]) {
  await check(
    `settings:${tab}`,
    `window.__V24_TEST_API__.getState().settingsTab=${JSON.stringify(tab)};window.__V24_TEST_API__.go('/settings')`,
  );
  await check(
    `settings-click:${tab}`,
    `(function(){var el=document.querySelector('[data-settings-tab=${JSON.stringify(tab).slice(1,-1)}]');if(!el)throw new Error('settings tab 없음');el.click();})()`,
  );
  await collectActions(`settings:${tab}`);
}

for (const [route, tabs] of [
  ["/channels/threads", ["queue", "analytics", "growth", "popular", "settings"]],
  ["/channels/instagram", ["queue", "editor", "settings"]],
]) {
  for (const tab of tabs) {
    await check(
      `channel-tab:${route}:${tab}`,
      `window.__V24_TEST_API__.getState().platformTab=${JSON.stringify(tab)};window.__V24_TEST_API__.go(${JSON.stringify(route)})`,
    );
    await check(
      `channel-tab-click:${route}:${tab}`,
      `(function(){var el=document.querySelector('[data-platform-tab=${JSON.stringify(tab).slice(1,-1)}]');if(!el)throw new Error('channel tab 없음');el.click();})()`,
    );
    await collectActions(`channel-tab:${route}:${tab}`);
  }
}

for (const step of [1, 2, 3, 4, 7, 11, 14]) {
  await check(`journey:${step}`, `window.__V24_TEST_API__.setJourneyStep(${step})`);
  await collectActions(`journey:${step}`);
}

await check(
  "onboarding",
  "window.__V24_TEST_API__.getState().onboardingOpen=true;window.__V24_TEST_API__.render()",
);
await collectActions("onboarding");
await check(
  "connect",
  "window.__V24_TEST_API__.getState().connectOpen=true;window.__V24_TEST_API__.render()",
);
await collectActions("connect");
await check("operator", "window.__V24_TEST_API__.setRole('operator')");
await collectActions("operator");
await check("operator-role-click:customer", "document.querySelector('[data-role-switch=customer]').click()")
await check("operator-role-click:operator", "document.querySelector('[data-role-switch=operator]').click()")
await collectActions("operator-click");

for (const screenState of ["success", "loading", "empty", "error", "partial", "permission", "uncertain", "repair"]) {
  await check(
    `home-state:${screenState}`,
    `window.__V24_TEST_API__.setRole('customer');window.__V24_TEST_API__.go('/');window.__V24_TEST_API__.setScreenState(${JSON.stringify(screenState)})`,
  );
  await check(
    `studio-state:${screenState}`,
    `window.__V24_TEST_API__.go('/studio');window.__V24_TEST_API__.setScreenState(${JSON.stringify(screenState)})`,
  );
}

for (const [action, source] of discoveredActions) {
  await check(
    `action-click:${action}`,
    `Object.assign(window.__V24_TEST_API__.getState(),${JSON.stringify(source.state)});window.__V24_TEST_API__.render();(function(){var el=Array.from(document.querySelectorAll('[data-action]')).find(function(node){return node.getAttribute('data-action')===${JSON.stringify(action)}});if(!el)throw new Error('data-action 컨트롤 없음: '+${JSON.stringify(action)});el.click();})()`,
  );
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1024, height: 900 },
  { width: 390, height: 844 },
]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width === 390,
  });
  for (const route of routes) {
    await check(`viewport:${viewport.width}:${route}`, `window.__V24_TEST_API__.setRole('customer');window.__V24_TEST_API__.go(${JSON.stringify(route)})`);
  }
}

const failed = checks.filter(
  (item) => item.evaluationError || item.errors.length || item.rootChars === 0 || item.rootChildren === 0 || item.overflowX,
);
process.stdout.write(
  JSON.stringify(
    {
      manifest,
      routeCount: routes.length,
      checkCount: checks.length,
      runtimeErrorCount: runtimeErrors.length,
      discoveredActionCount: discoveredActions.size,
      failed,
      checks,
    },
    null,
    2,
  ),
);
socket.close();
if (failed.length) process.exitCode = 1;

// MODEL: gpt-codex/gpt-5.6
// SKILLS_USED: gstack browse interaction workflow를 실제 Chrome 감사 설계에 사용
// SKILLS_SKIPPED: 없음. 실행 가능 여부는 호출 환경의 localhost와 CDP 권한에 달려 있다
