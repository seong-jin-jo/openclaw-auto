#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.STUDIO_BASE_URL || "http://localhost:3456";
const studioToken = process.env.STUDIO_DEV_BEARER_TOKEN;
const dashboardToken = process.env.DASHBOARD_AUTH_TOKEN;
const workspaceId = process.env.STUDIO_DEV_WORKSPACE_IDS?.split(",")[0];
if (!studioToken || !dashboardToken || !workspaceId) throw new Error("Studio 로컬 인증 설정이 필요합니다");

const outputDir = path.resolve(process.cwd(), "../docs/qa/captures/생성-LLM-연동-2026-08-31");
fs.mkdirSync(outputDir, { recursive: true });
const executablePath = "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
await context.addInitScript(({ dashboardTokenValue, studioTokenValue, workspaceIdValue }) => {
  localStorage.setItem("dashboard_auth_token", dashboardTokenValue);
  localStorage.setItem("active_workspace", JSON.stringify({ id: workspaceIdValue, slug: "llm-evidence", name: "LLM 검증 작업 공간", tier: "team" }));
  sessionStorage.setItem("studio_generation_token", studioTokenValue);
  sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
  sessionStorage.setItem("studio_workspace_id", workspaceIdValue);
}, { dashboardTokenValue: dashboardToken, studioTokenValue: studioToken, workspaceIdValue: workspaceId });

const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") console.error(`browser-console: ${message.text()}`); });
page.on("pageerror", (error) => console.error(`browser-pageerror: ${error.message}`));
await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ isOperator: false, tenant: { id: workspaceId, slug: "llm-evidence", name: "LLM 검증 작업 공간", status: "active" } }) }));
await page.route("**/api/studio/v1/generations", (route) => route.continue({ headers: { ...route.request().headers(), authorization: `Bearer ${studioToken}` } }));
try {
  await page.goto(`${baseUrl}/studio?room=create`, { waitUntil: "networkidle", timeout: 60_000 });
  const learningDialog = page.getByRole("dialog", { name: "학습 정보 문답" });
  if (await learningDialog.isVisible()) await learningDialog.getByRole("button", { name: "나중에 하기" }).click();
  await page.getByRole("button", { name: "영상" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.locator("[data-create-purpose-picker] button").first().click();
  await page.locator("[data-create-audience-picker] button").first().click();
  await page.getByRole("button", { name: "직접 입력" }).click();
  await page.locator("#studio-topic").fill("자동화가 실패했을 때 확인할 세 가지");
  await page.getByRole("button", { name: "이 주제로 계속" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "입력 내용 확인" }).click();
  const generated = page.waitForResponse((response) => response.url().includes("/api/studio/v1/generations") && response.request().method() === "POST", { timeout: 210_000 });
  await page.getByRole("button", { name: "구조 초안 3개 보기" }).click();
  const response = await generated;
  if (response.status() !== 201) throw new Error(`생성 API ${response.status()}: ${await response.text()}`);
  await page.locator('[data-create-candidate="C"]').waitFor({ timeout: 10_000 });
  const titles = await page.locator("[data-create-candidate] b").allTextContents();
  if (new Set(titles).size !== 3) throw new Error("세 후보 제목이 서로 다르지 않습니다");
  const screenshot = path.join(outputDir, "로컬-실제-LLM-후보-3개-1440.png");
  await page.screenshot({ path: screenshot, fullPage: true });
  console.log(JSON.stringify({ status: response.status(), titles, screenshot }));
} catch (error) {
  const diagnostic = path.join(outputDir, "진단.png");
  await page.screenshot({ path: diagnostic, fullPage: true });
  console.error(JSON.stringify({ url: page.url(), text: (await page.locator("body").innerText()).slice(0, 1000), diagnostic }));
  throw error;
} finally {
  await browser.close();
}
