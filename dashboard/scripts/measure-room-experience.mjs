#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.ROOM_MEASURE_BASE_URL || "http://localhost:3456";
const dashboardToken = process.env.ROOM_MEASURE_DASHBOARD_TOKEN || "";
const studioToken = process.env.ROOM_MEASURE_STUDIO_TOKEN || "";
const workspaceId = process.env.ROOM_MEASURE_WORKSPACE_ID || "";
const outputFile = process.env.ROOM_MEASURE_OUTPUT || path.resolve(process.cwd(), "../docs/qa/room-experience.json");
const screenshotDir = process.env.ROOM_MEASURE_SCREENSHOTS || path.dirname(outputFile);
const label = process.env.ROOM_MEASURE_LABEL || "measurement";
const runCount = Number(process.env.ROOM_MEASURE_RUNS || 3);
const executablePath = process.env.ROOM_MEASURE_CHROME_PATH || "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

if (!dashboardToken || !studioToken || !workspaceId) {
  throw new Error("ROOM_MEASURE_DASHBOARD_TOKEN, ROOM_MEASURE_STUDIO_TOKEN, ROOM_MEASURE_WORKSPACE_ID are required");
}
if (!Number.isInteger(runCount) || runCount < 1 || runCount > 10) {
  throw new Error("ROOM_MEASURE_RUNS must be an integer between 1 and 10");
}

const scenarios = [
  { key: "home", path: "/", selector: '[data-app-main="true"]' },
  { key: "performance", path: "/", selector: '[data-room="performance"]' },
  { key: "create", path: "/studio?room=create", selector: '[data-room="create"]' },
  { key: "edit", path: "/studio?room=edit", selector: '[data-room="edit"]' },
  { key: "publish", path: "/studio?room=publish", selector: '[data-room="publish"]' },
];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (value) => Math.round(Number(value) * 10) / 10;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const observations = [];

try {
  for (const scenario of scenarios) {
    for (let run = 1; run <= runCount; run += 1) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addInitScript(({ dashboardTokenValue, studioTokenValue, workspaceIdValue, targetSelector }) => {
        localStorage.setItem("dashboard_auth_token", dashboardTokenValue);
        localStorage.setItem("active_workspace", JSON.stringify({
          id: workspaceIdValue,
          slug: "room-experience-verification",
          name: "화면 경험 검증 작업 공간",
          tier: "team",
        }));
        localStorage.setItem("studio_work", JSON.stringify({
          idea: "처음 만든 서비스의 첫 콘텐츠",
          text: {
            threads: "처음 만든 서비스를 알리는 첫 콘텐츠",
            x: "처음 만든 서비스를 오늘 알립니다.",
            facebook: "처음 만든 서비스를 알리는 과정을 한 흐름으로 묶었습니다.",
            instagram: { caption: "첫 콘텐츠를 한 번 만들고 여러 채널에 맞춥니다.", hashtags: ["첫콘텐츠"], slides: ["문제", "과정", "다음 행동"] },
            shorts: { hook: "첫 고객을 만나는 가장 짧은 길", body: "만들고 고치고 올립니다.", cta: "첫 편부터 시작하세요." },
          },
          includes: { threads: true, x: true, facebook: false, instagram: true, shorts: false, reels: false, tiktok: false },
          editLines: ["처음 만든 서비스를 보여 줍니다.", "누구를 돕는지 말합니다.", "첫 행동을 제안합니다."],
          createBranch: "video",
          editKind: "video",
        }));
        sessionStorage.setItem("studio_generation_token", studioTokenValue);
        sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
        sessionStorage.setItem("studio_workspace_id", workspaceIdValue);
        window.__roomReadyAt = null;
        const markReady = () => {
          if (window.__roomReadyAt == null && document.querySelector(targetSelector)) {
            window.__roomReadyAt = performance.now();
          }
        };
        new MutationObserver(markReady).observe(document, { childList: true, subtree: true });
        document.addEventListener("DOMContentLoaded", markReady, { once: true });
      }, {
        dashboardTokenValue: dashboardToken,
        studioTokenValue: studioToken,
        workspaceIdValue: workspaceId,
        targetSelector: scenario.selector,
      });

      const page = await context.newPage();
      const consoleErrors = [];
      const requests = new Map();
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("request", (request) => {
        requests.set(request, {
          url: request.url(),
          method: request.method(),
          type: request.resourceType(),
          start: performance.now(),
          end: null,
          status: null,
          contentLength: 0,
        });
      });
      page.on("response", (response) => {
        const record = requests.get(response.request());
        if (!record) return;
        record.end = performance.now();
        record.status = response.status();
        record.contentLength = Number(response.headers()["content-length"] || 0);
      });
      page.on("requestfailed", (request) => {
        const record = requests.get(request);
        if (record) record.end = performance.now();
      });

      const startedAt = performance.now();
      await page.goto(new URL(scenario.path, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.locator(scenario.selector).waitFor({ state: "visible", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 60000 });
      await page.waitForTimeout(250);

      const browserMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const paints = performance.getEntriesByType("paint");
        const firstContentfulPaint = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;
        return {
          firstContentfulPaint,
          readyAt: window.__roomReadyAt,
          responseStart: navigation?.responseStart ?? null,
          domContentLoaded: navigation?.domContentLoadedEventEnd ?? null,
          loadEnd: navigation?.loadEventEnd ?? null,
        };
      });

      const completedRequests = [...requests.values()].filter((request) => request.end != null);
      const apiRequests = completedRequests.filter((request) => request.url.startsWith(baseUrl) && request.url.includes("/api/"));
      const scriptRequests = completedRequests.filter((request) => request.type === "script");
      const slowestApis = apiRequests
        .map((request) => ({
          path: new URL(request.url).pathname + new URL(request.url).search,
          status: request.status,
          durationMs: round(request.end - request.start),
        }))
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 5);

      if (run === 1) {
        await page.screenshot({ path: path.join(screenshotDir, `${label}-${scenario.key}.png`), fullPage: false });
      }
      observations.push({
        scenario: scenario.key,
        path: scenario.path,
        run,
        wallReadyMs: round(performance.now() - startedAt),
        fcpMs: round(browserMetrics.firstContentfulPaint),
        firstPictureMs: round(browserMetrics.readyAt),
        ttfbMs: round(browserMetrics.responseStart),
        domContentLoadedMs: round(browserMetrics.domContentLoaded),
        loadEndMs: round(browserMetrics.loadEnd),
        requestCount: completedRequests.length,
        apiRequestCount: apiRequests.length,
        scriptRequestCount: scriptRequests.length,
        declaredTransferBytes: completedRequests.reduce((sum, request) => sum + request.contentLength, 0),
        scriptTransferBytes: scriptRequests.reduce((sum, request) => sum + request.contentLength, 0),
        slowestApis,
        consoleErrors,
      });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const summary = Object.fromEntries(scenarios.map((scenario) => {
  const rows = observations.filter((observation) => observation.scenario === scenario.key);
  const medianSlowest = rows
    .flatMap((row) => row.slowestApis)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5);
  return [scenario.key, {
    fcpMs: round(median(rows.map((row) => row.fcpMs))),
    firstPictureMs: round(median(rows.map((row) => row.firstPictureMs))),
    requestCount: round(median(rows.map((row) => row.requestCount))),
    apiRequestCount: round(median(rows.map((row) => row.apiRequestCount))),
    scriptTransferKb: round(median(rows.map((row) => row.scriptTransferBytes)) / 1024),
    slowestApis: medianSlowest,
  }];
}));

const result = {
  label,
  measuredAt: new Date().toISOString(),
  baseUrl,
  workspaceId,
  runCount,
  viewport: { width: 1440, height: 1000 },
  cache: "새 브라우저 문맥으로 각 회차 냉캐시 측정",
  summary,
  observations,
};
fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ label, outputFile, summary }, null, 2)}\n`);
