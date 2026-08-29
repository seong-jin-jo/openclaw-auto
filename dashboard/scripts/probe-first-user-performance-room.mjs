// 첫 사용자가 성과실(/)에 들어갈 때 화면이 멎지 않는지 실제 브라우저로 본다.
// 배경: 성과실 첫 화면 시험 두 건이 무한 갱신으로 끝나지 않던 사고의 재발 방지 탐침.
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";
const exe = "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const W = process.env.PROBE_WORKSPACE || "cd1d0a40-540d-4524-9b49-bf2445d82182";
const base = process.env.FOUR_ROOM_BASE_URL || "http://localhost:3456";
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
if (!operatorToken) throw new Error("DASHBOARD_AUTH_TOKEN이 필요합니다");

let issuedTokenId = "";
let b;
const request = (pathname, options = {}) => fetch(`${base}${pathname}`, {
  ...options,
  headers: { authorization: `Bearer ${operatorToken}`, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
});

try {
  const issued = await request("/api/tenant-tokens", { method: "POST", body: JSON.stringify({ tenant_id: W, label: `qa-first-user-${Date.now()}` }) });
  const issuedBody = await issued.json();
  if (!issued.ok || !issuedBody.token) throw new Error(`고객 토큰 발급 실패: HTTP ${issued.status}`);
  issuedTokenId = issuedBody.id;

  b = await playwright.chromium.launch({ executablePath: exe, headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1200 } });
  // 처음 온 사용자 상태: 학습 정보도 작업물도 없다. 작업 공간만 있다.
  await ctx.addInitScript(({ t, w }) => {
    localStorage.setItem("dashboard_auth_token", t);
    localStorage.setItem("active_workspace", JSON.stringify({ id: w, slug: "local", name: "로컬 검증 작업 공간", tier: "team" }));
  }, { t: issuedBody.token, w: W });

  const page = await ctx.newPage();
  const consoleErrors = [];
  const updateDepth = [];
  page.on("console", (m) => {
    const text = m.text();
    if (/Maximum update depth|Too many re-renders/i.test(text)) updateDepth.push(text);
    if (m.type() === "error") consoleErrors.push(text);
  });
  let metricsCalls = 0;
  page.on("request", (r) => { if (r.url().includes("/api/metrics")) metricsCalls += 1; });

  const t0 = Date.now();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-room="performance"]', { timeout: 20000 });
  const firstPaintMs = Date.now() - t0;

  // 멎는지 본다. 무한 갱신이면 이 10초 동안 갱신 경고나 같은 요청 폭주가 나온다.
  await page.waitForTimeout(10000);
  const roomHeader = await page.locator("text=성과실").first().innerText().catch(() => "");
  const responsive = await page.evaluate(() => new Promise((res) => {
    const s = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => res(Math.round(performance.now() - s))));
  }));
  await page.screenshot({ path: "../docs/qa/first-user-performance-room.png", fullPage: false });

  const verdict = updateDepth.length === 0 && metricsCalls <= 4 && responsive < 400;
  console.log(JSON.stringify({
    firstPaintMs, roomHeader, metricsCallsIn10s: metricsCalls,
    maxUpdateDepthWarnings: updateDepth.length, frameLatencyMs: responsive,
    consoleErrors, verdict: verdict ? "PASS 화면이 멎지 않는다" : "FAIL 갱신 폭주 의심",
  }, null, 2));
  if (!verdict) process.exitCode = 1;
} finally {
  if (b) await b.close();
  if (issuedTokenId) await request(`/api/tenant-tokens?id=${issuedTokenId}`, { method: "DELETE" }).catch(() => {});
}
