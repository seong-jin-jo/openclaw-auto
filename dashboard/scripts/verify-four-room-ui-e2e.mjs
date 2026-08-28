#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.FOUR_ROOM_BASE_URL || "http://localhost:3456";
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
const workspaceId = process.env.FOUR_ROOM_WORKSPACE_ID || "cd1d0a40-540d-4524-9b49-bf2445d82182";
const outputDir = process.env.FOUR_ROOM_OUTPUT_DIR || path.resolve(process.cwd(), "../docs/prototype/qa-flow");
const executablePath = process.env.FOUR_ROOM_CHROME_PATH || "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const dataRoot = process.env.DATA_DIR || path.resolve(process.cwd(), "../data");
const settingsPath = path.join(dataRoot, "tenants", workspaceId, "settings.json");

if (!operatorToken) throw new Error("DASHBOARD_AUTH_TOKEN이 필요합니다");
if (!fs.existsSync(settingsPath)) throw new Error(`첫 사용자 설정 파일이 없습니다: ${settingsPath}`);

const widths = [390, 768, 1024, 1440];
const roomContracts = [
  { key: "create", label: "생성실", href: "/studio?room=create", selector: '[data-room="create"]' },
  { key: "edit", label: "편집실", href: "/studio?room=edit", selector: '[data-room="edit"]' },
  { key: "publish", label: "발행실", href: "/studio?room=publish", selector: '[data-room="publish"]' },
  { key: "performance", label: "성과실", href: "/", selector: '[data-room="performance"]' },
];

const request = async (pathname, options = {}) => fetch(`${baseUrl}${pathname}`, {
  ...options,
  headers: {
    authorization: `Bearer ${operatorToken}`,
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.headers || {}),
  },
});

let issuedTokenId = "";
let browser;
const originalSettings = fs.readFileSync(settingsPath, "utf8");
const observations = [];
const consoleErrors = [];
const unauthorizedUrls = [];

async function closeBrowserWithin(timeoutMs) {
  if (!browser) return;
  let timeout;
  await Promise.race([
    browser.close(),
    new Promise((resolve) => {
      timeout = setTimeout(resolve, timeoutMs);
    }),
  ]);
  if (timeout) clearTimeout(timeout);
}

function firstUserSettings(raw) {
  const parsed = JSON.parse(raw);
  return JSON.stringify({ ...parsed, onboardingComplete: false }, null, 2);
}

async function sidebar(page, width) {
  if (width < 768) {
    const open = page.getByRole("button", { name: "메뉴 열기" });
    if (await open.getAttribute("aria-expanded") !== "true") await open.click();
  }
  const nav = page.getByRole("complementary", { name: "주요 사이드바" });
  await nav.waitFor({ state: "visible" });
  return nav.getByRole("region", { name: "한 편의 제작 순서" });
}

async function clickRoom(page, width, room) {
  const flow = await sidebar(page, width);
  const link = flow.getByRole("link", { name: new RegExp(room.label) });
  if (await link.getAttribute("href") !== room.href) {
    throw new Error(`${width} ${room.label} href가 ${room.href}가 아닙니다`);
  }
  await link.click();
  await page.waitForURL((url) => `${url.pathname}${url.search}` === room.href, { timeout: 30000 });
  await page.locator(room.selector).waitFor({ state: "visible", timeout: 30000 });
}

async function measureRoom(page, width, room) {
  if (room.key === "performance") {
    await page.waitForFunction(() => Number(document.querySelector("[data-perf-suggestions]")?.getAttribute("data-perf-suggestions") || 0) >= 3);
  }
  const metrics = await page.evaluate((roomKey) => {
    const overlay = document.querySelector('[data-onboarding-mode="modal"], .fixed.inset-0.z-50');
    const firstAction = roomKey === "create"
      ? document.querySelector('[data-empty-next="create"]')
      : roomKey === "publish"
        ? document.querySelector('[data-empty-next="publish"]')
        : roomKey === "performance"
          ? document.querySelector('[data-perf-suggestions]')
          : document.querySelector("[data-edit-outline]");
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      fullScreenOverlay: Boolean(overlay),
      nextActionVisible: firstAction instanceof HTMLElement && firstAction.offsetParent !== null,
      suggestionCount: Number(document.querySelector("[data-perf-suggestions]")?.getAttribute("data-perf-suggestions") || 0),
      inlineOnboarding: document.querySelector('[data-onboarding-mode="inline"]') instanceof HTMLElement,
    };
  }, room.key);
  if (metrics.documentWidth > width + 1) throw new Error(`${width} ${room.label} 가로 넘침 ${metrics.documentWidth}/${width}`);
  if (metrics.fullScreenOverlay) throw new Error(`${width} ${room.label} 전체 화면 모달이 길을 막습니다`);
  if (!metrics.nextActionVisible) throw new Error(`${width} ${room.label} 다음 행동이 보이지 않습니다`);
  if (room.key === "performance" && metrics.suggestionCount < 3) throw new Error(`${width} 성과실 방향 제안이 ${metrics.suggestionCount}건입니다`);
  observations.push({ width, room: room.key, path: new URL(page.url()).pathname + new URL(page.url()).search, ...metrics });
  await page.screenshot({ path: path.join(outputDir, `${width}-${room.key}.png`), fullPage: true });
}

try {
  const issued = await request("/api/tenant-tokens", {
    method: "POST",
    body: JSON.stringify({ tenant_id: workspaceId, label: `qa-four-room-${Date.now()}` }),
  });
  const issuedBody = await issued.json();
  if (!issued.ok || !issuedBody.token || !issuedBody.id) throw new Error(`고객 토큰 발급 실패: HTTP ${issued.status}`);
  issuedTokenId = issuedBody.id;

  fs.writeFileSync(settingsPath, firstUserSettings(originalSettings));
  fs.mkdirSync(outputDir, { recursive: true });

  browser = await chromium.launch({ executablePath, headless: true });
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 1200 } });
    await context.addInitScript(({ token, workspace }) => {
      localStorage.setItem("dashboard_auth_token", token);
      localStorage.setItem("active_workspace", JSON.stringify({ id: workspace, slug: "qa-four-room", name: "네 방 검증 작업 공간", tier: "team" }));
    }, { token: issuedBody.token, workspace: workspaceId });
    const page = await context.newPage();
    page.on("pageerror", (error) => consoleErrors.push(`${width}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(`${width}: ${message.text()}`); });
    page.on("response", (response) => { if (response.status() === 401) unauthorizedUrls.push(`${width}: ${response.url()}`); });

    await page.goto(`${baseUrl}/studio?room=create`, { waitUntil: "networkidle", timeout: 60000 });
    for (const room of roomContracts) {
      await clickRoom(page, width, room);
      await measureRoom(page, width, room);
    }

    await clickRoom(page, width, roomContracts[0]);
    if (!await page.locator('[data-room="create"]').isVisible()) throw new Error(`${width} 성과실에서 생성실로 돌아가지 못했습니다`);
    observations.push({ width, room: "performance-to-create", path: new URL(page.url()).pathname + new URL(page.url()).search, navigated: true });
    await context.close();
  }

  if (consoleErrors.length) throw new Error(`브라우저 콘솔 오류 ${consoleErrors.length}건: ${consoleErrors.slice(0, 3).join(" | ")}`);
  if (unauthorizedUrls.length) throw new Error(`브라우저 401 ${unauthorizedUrls.length}건: ${unauthorizedUrls.slice(0, 3).join(" | ")}`);
  fs.writeFileSync(path.join(outputDir, "observations.json"), JSON.stringify({ workspaceId, widths, observations, consoleErrors, unauthorizedUrls }, null, 2));
  console.log(`PASS 네 방 ${roomContracts.length}개 x ${widths.length}폭, 성과실 왕복 ${widths.length}건`);
  console.log(`PASS 전체 화면 모달 0건, 브라우저 401 0건, 콘솔 오류 0건`);
  console.log(`CAPTURES ${outputDir}`);
} finally {
  fs.writeFileSync(settingsPath, originalSettings);
  if (issuedTokenId) {
    const revoked = await request(`/api/tenant-tokens?id=${encodeURIComponent(issuedTokenId)}`, { method: "DELETE" });
    if (!revoked.ok) console.error(`임시 고객 토큰 폐기 실패: HTTP ${revoked.status}`);
  }
  await closeBrowserWithin(5000);
}

process.exit(0);
