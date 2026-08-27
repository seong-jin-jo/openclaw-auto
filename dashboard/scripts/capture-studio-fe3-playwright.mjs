#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.FE3_BASE_URL || "http://localhost:3456";
const dashboardToken = process.env.FE3_DASHBOARD_TOKEN || "";
const studioToken = process.env.FE3_STUDIO_TOKEN || "";
const workspaceId = process.env.FE3_WORKSPACE_ID || "";
const studioWorkspaceId = process.env.FE3_STUDIO_WORKSPACE_ID || workspaceId;
const outputDir = process.env.FE3_OUTPUT_DIR || path.resolve(process.cwd(), "../docs/prototype/qa-fe3");
const executablePath = process.env.FE3_CHROME_PATH || "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

if (!dashboardToken || !studioToken || !workspaceId) {
  throw new Error("FE3_DASHBOARD_TOKEN, FE3_STUDIO_TOKEN, FE3_WORKSPACE_ID are required");
}
fs.mkdirSync(outputDir, { recursive: true });
let chatAlwaysAt390 = 0;
let chatVisibleAt390 = false;

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
await context.addInitScript(({ dashboardTokenValue, studioTokenValue, workspaceIdValue, studioWorkspaceIdValue }) => {
  localStorage.setItem("dashboard_auth_token", dashboardTokenValue);
  localStorage.setItem("active_workspace", JSON.stringify({ id: workspaceIdValue, slug: "local-fe3-verification", name: "로컬 검증 작업 공간", tier: "team" }));
  localStorage.setItem("studio_work", JSON.stringify({
    idea: "1인 사업가의 콘텐츠 운영 시간 줄이기",
    text: {
      threads: "콘텐츠 운영 시간을 줄이는 세 가지 기준",
      x: "반복 업무부터 줄여야 콘텐츠가 남습니다.",
      facebook: "아이디어, 편집, 발행을 한 흐름으로 묶습니다.",
      instagram: { caption: "한 번 만들고 일곱 채널에 맞게 고칩니다.", hashtags: ["OSMU", "콘텐츠운영"], slides: ["기준 1", "기준 2", "기준 3"] },
      shorts: { hook: "매일 발행해도 시간이 남는 이유", body: "반복을 줄이고 기준을 남깁니다.", cta: "오늘 한 편부터 묶어 보세요." },
    },
    includes: { threads: true, x: true, facebook: false, instagram: true, shorts: false, reels: false, tiktok: false },
  }));
  sessionStorage.setItem("studio_generation_token", studioTokenValue);
  sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
  sessionStorage.setItem("studio_workspace_id", studioWorkspaceIdValue);
}, { dashboardTokenValue: dashboardToken, studioTokenValue: studioToken, workspaceIdValue: workspaceId, studioWorkspaceIdValue: studioWorkspaceId });

const page = await context.newPage();
await page.route("**/api/me", (route) => route.fulfill({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isOperator: false, tenant: { id: workspaceId, slug: "local-fe3-verification", name: "로컬 검증 작업 공간", status: "active" } }),
}));

const consoleErrors = [];
const unauthorizedUrls = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() === 401) unauthorizedUrls.push(response.url());
});

try {
  await page.goto(`${baseUrl}/studio?room=publish`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('[data-room="publish"]').waitFor();
  const loginCancel = page.getByRole("button", { name: "Cancel", exact: true });
  if (await loginCancel.count()) await loginCancel.click();
  if (unauthorizedUrls.length) throw new Error(`live browser received 401: ${JSON.stringify(unauthorizedUrls)}`);

  const roomFlow = page.getByRole("region", { name: "한 편의 제작 순서" });
  for (const room of ["생성실", "편집실", "발행실", "성과실"]) {
    if (await roomFlow.getByRole("link", { name: new RegExp(room) }).count() !== 1) throw new Error(`${room} sidebar route missing`);
  }
  if (await page.getByText("Marketing Hub", { exact: true }).count()) throw new Error("legacy Marketing Hub sidebar rendered");
  await page.screenshot({ path: path.join(outputDir, "sidebar-4room-1440.png") });
  await page.setViewportSize({ width: 1024, height: 900 });
  for (const room of ["생성실", "편집실", "발행실", "성과실"]) {
    if (!await roomFlow.getByText(room, { exact: true }).isVisible()) throw new Error(`${room} label hidden in narrow sidebar`);
  }
  await page.screenshot({ path: path.join(outputDir, "sidebar-4room-1024.png") });
  await page.setViewportSize({ width: 1440, height: 1200 });

  if (await page.locator("[data-room-preview]").count() !== 7) throw new Error("seven publish previews did not render");
  if (await page.getByRole("complementary", { name: "발행 담당 대화창" }).count() !== 1) throw new Error("publish chat dock missing");
  if (await page.getByRole("complementary", { name: "발행 담당 대화창" }).getByText("발행 채널", { exact: true }).count()) throw new Error("legacy channel selector rendered in chat dock");
  if (await page.getByText("발행 이력", { exact: true }).count()) throw new Error("legacy publish history rendered");
  if (await page.getByRole("button", { name: /중지/ }).count()) throw new Error("unsupported publish stop button rendered");
  for (const label of ["초안으로 저장", "검토 요청", "Publish (3)", "날짜 잡기"]) {
    if (await page.getByRole("button", { name: label, exact: true }).count() !== 1) throw new Error(`${label} action missing`);
  }
  for (const platform of ["threads", "x", "facebook", "instagram"]) {
    const preview = page.locator(`[data-room-preview="${platform}"]`);
    if (await preview.getByRole("checkbox", { name: new RegExp("발행$") }).count() !== 1) throw new Error(`${platform} inline publish checkbox missing`);
    if (await preview.getByRole("combobox", { name: new RegExp("발행 계정$") }).count() !== 1) throw new Error(`${platform} inline account selector missing`);
  }
  await page.screenshot({ path: path.join(outputDir, "publish-room-1440.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  chatAlwaysAt390 = await page.locator('[data-chat-always="true"]').count();
  chatVisibleAt390 = await page.locator('[data-chat-always="true"]').isVisible();
  await page.screenshot({ path: path.join(outputDir, "publish-room-390.png") });
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(400);

  await roomFlow.getByRole("link", { name: /생성실/ }).click();
  await page.locator('[data-room="create"]').waitFor();
  await page.locator("#studio-topic").fill("1인 사업가의 콘텐츠 운영 시간 줄이기");
  await page.locator("#studio-purpose").fill("콘텐츠 운영 시간을 줄인다");
  await page.locator("#studio-audience").fill("1인 사업가");
  await page.getByLabel("소재 권리를 확인했습니다").check();
  const generationResponse = page.waitForResponse((response) => response.url().includes("/api/studio/v1/generations") && response.request().method() === "POST");
  await page.getByRole("button", { name: "후보 세 장 만들기" }).click();
  const response = await generationResponse;
  if (response.status() !== 201) throw new Error(`Studio generation returned ${response.status()}`);
  await page.getByRole("button", { name: "A안 선택" }).waitFor();
  if (await page.getByRole("button", { name: /안 선택$/ }).count() !== 3) throw new Error("Studio API candidates A, B, C did not render");
  await page.screenshot({ path: path.join(outputDir, "create-room-candidates-1440.png") });

  if (consoleErrors.length) throw new Error(`browser console errors: ${JSON.stringify(consoleErrors)}`);
  process.stdout.write(`${JSON.stringify({
    sidebarRooms: 4,
    publishPreviews: 7,
    inlinePublishCheckboxes: 4,
    inlineAccountSelectors: 4,
    generationStatus: response.status(),
    candidateButtons: 3,
    publishStopButtons: 0,
    chatAlwaysAt390,
    chatVisibleAt390,
    unauthorizedUrls,
    consoleErrors,
  }, null, 2)}\n`);
} finally {
  await browser.close();
}
