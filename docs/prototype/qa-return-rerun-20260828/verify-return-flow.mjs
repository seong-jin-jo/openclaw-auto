#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.RETURN_QA_BASE_URL || "http://localhost:3456";
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
const workspaceId = process.env.RETURN_QA_WORKSPACE_ID || "";
const outputDir = path.resolve(process.cwd(), "../docs/prototype/qa-return-rerun-20260828");
const executablePath = "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

if (!operatorToken || !workspaceId) throw new Error("DASHBOARD_AUTH_TOKEN과 RETURN_QA_WORKSPACE_ID가 필요합니다");
fs.mkdirSync(outputDir, { recursive: true });

const operatorRequest = (pathname, options = {}) => fetch(`${baseUrl}${pathname}`, {
  ...options,
  headers: {
    authorization: `Bearer ${operatorToken}`,
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.headers || {}),
  },
});

let tenantTokenId = "";
let browser;
const consoleErrors = [];
const unauthorizedUrls = [];
const observations = [];
const cleanupPostIds = [];

function fail(message) {
  throw new Error(message);
}

function normalized(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stringLeaves(value, leaves = []) {
  if (typeof value === "string") leaves.push(normalized(value));
  else if (Array.isArray(value)) value.forEach((item) => stringLeaves(item, leaves));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => stringLeaves(item, leaves));
  return leaves;
}

try {
  const issued = await operatorRequest("/api/tenant-tokens", {
    method: "POST",
    body: JSON.stringify({ tenant_id: workspaceId, label: `qa-return-${Date.now()}` }),
  });
  const issuedBody = await issued.json();
  if (!issued.ok || !issuedBody.token || !issuedBody.id) fail(`고객 토큰 발급 실패 HTTP ${issued.status}`);
  tenantTokenId = issuedBody.id;
  const tenantRequest = (pathname, options = {}) => fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      authorization: `Bearer ${issuedBody.token}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const draftsResponse = await tenantRequest("/api/queue?status=draft&returnTo=inbox");
  const draftsBody = await draftsResponse.json();
  if (!draftsResponse.ok) fail(`inbox queue 조회 실패 HTTP ${draftsResponse.status}`);
  const candidates = (draftsBody.posts || []).filter((post) => post.publishContext?.returnUrl && normalized(post.text));
  if (candidates.length < 2) fail(`복귀 검증용 draft queue가 ${candidates.length}건뿐입니다`);
  const [inboxPost, calendarSeed] = candidates.slice(0, 2);
  cleanupPostIds.push(inboxPost.id, calendarSeed.id);

  const approve = await tenantRequest(`/api/queue/${encodeURIComponent(calendarSeed.id)}/approve`, {
    method: "POST",
    body: JSON.stringify({ hours: 0 }),
  });
  const approveBody = await approve.json();
  if (!approve.ok || approveBody.post?.status !== "approved") fail(`calendar seed 예약 실패 HTTP ${approve.status}`);

  const calendarResponse = await tenantRequest("/api/queue?status=all&returnTo=calendar");
  const calendarBody = await calendarResponse.json();
  if (!calendarResponse.ok) fail(`calendar queue 조회 실패 HTTP ${calendarResponse.status}`);
  const calendarPost = (calendarBody.posts || []).find((post) => post.id === calendarSeed.id);
  if (!calendarPost?.publishContext?.returnUrl) fail("calendar 복귀 URL이 응답에 없습니다");

  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(({ token, workspace }) => {
    localStorage.setItem("dashboard_auth_token", token);
    localStorage.setItem("active_workspace", JSON.stringify({ id: workspace, slug: "qa-return", name: "복귀 QA 작업 공간", tier: "team" }));
  }, { token: issuedBody.token, workspace: workspaceId });
  const page = await context.newPage();
  await page.route("https://example.invalid/**", (route) => route.fulfill({ status: 204, body: "" }));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => { if (response.status() === 401) unauthorizedUrls.push(response.url()); });

  async function verifyReturn(source, post) {
    const sourcePath = source === "inbox" ? "/inbox" : "/calendar";
    await page.goto(`${baseUrl}${sourcePath}`, { waitUntil: "networkidle", timeout: 60000 });
    if (source === "calendar") {
      const day = new Date(post.scheduledAt).getDate();
      const dayButton = page.getByRole("button", { name: new RegExp(`^${day}(?:$|\\D)`) });
      await dayButton.click();
      await page.waitForTimeout(500);
    }
    const link = page.locator(`a[href*="queue_id=${post.id}"]`).filter({ hasText: "발행실로 돌아가기" });
    await page.screenshot({ path: path.join(outputDir, `${source}-before-link-lookup.png`), fullPage: true });
    try {
      await link.first().waitFor({ state: "visible", timeout: 10000 });
    } catch (error) {
      const diagnostic = await page.evaluate(() => ({
        text: document.body.innerText.slice(0, 3000),
        links: [...document.querySelectorAll("a")].map((anchor) => ({ text: anchor.textContent?.trim(), href: anchor.getAttribute("href") })).filter((item) => item.text || item.href),
        buttons: [...document.querySelectorAll("button")].map((button) => ({ text: button.textContent?.replace(/\s+/g, " ").trim(), html: button.outerHTML.slice(0, 500) })).filter((item) => item.text),
      }));
      console.error(`RETURN_LINK_DIAGNOSTIC ${source} ${JSON.stringify(diagnostic)}`);
      throw error;
    }
    const returnHref = await link.first().getAttribute("href");
    await page.screenshot({ path: path.join(outputDir, `${source}-return-link.png`), fullPage: true });
    await link.first().click();
    await page.waitForURL((url) => url.pathname === "/studio" && url.searchParams.get("room") === "publish" && url.searchParams.get("queue_id") === post.id && url.searchParams.get("from") === source, { timeout: 30000 });
    await page.locator('[data-room="publish"]').waitFor({ state: "visible", timeout: 30000 });
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => {
      const work = JSON.parse(localStorage.getItem("studio_work") || "null");
      const selected = [...document.querySelectorAll('[data-room-preview] input[type="checkbox"]')]
        .filter((input) => input instanceof HTMLInputElement && input.checked).length;
      const publishButtons = [...document.querySelectorAll("button")].map((button) => button.textContent?.trim() || "").filter((text) => /\d+곳에 올리기/.test(text));
      return { work, selected, publishButtons, bodyText: document.body.innerText };
    });
    if (!state.work) fail(`${source} 복귀 뒤 studio_work가 없습니다`);
    const expectedBody = normalized(post.text);
    const restoredStrings = stringLeaves(state.work);
    if (!restoredStrings.some((text) => text.includes(expectedBody) || expectedBody.includes(text))) {
      console.error(`BODY_RESTORE_DIAGNOSTIC ${source} expected=${JSON.stringify(expectedBody)} restored=${JSON.stringify(restoredStrings)}`);
      fail(`${source} queue 본문이 발행실 상태에 복원되지 않았습니다`);
    }
    const expectedSelected = Object.entries(post.channels || {}).filter(([, value]) => value && value.status !== "skipped").length || 3;
    if (state.selected !== expectedSelected) fail(`${source} 플랫폼 선택 복원 불일치 expected=${expectedSelected} actual=${state.selected}`);
    if (!state.publishButtons.some((text) => text.includes(`${expectedSelected}곳에 올리기`))) {
      console.error(`PUBLISH_BUTTON_DIAGNOSTIC ${source} expected=${expectedSelected} buttons=${JSON.stringify(state.publishButtons)}`);
      fail(`${source} 발행 단추 수량이 플랫폼 선택과 다릅니다`);
    }
    await page.screenshot({ path: path.join(outputDir, `${source}-publish-restored.png`), fullPage: true });
    observations.push({
      source,
      queuePostId: post.id,
      draftId: post.publishContext?.draftId || null,
      returnHref,
      queueBodyRestored: true,
      platformSelectionExpected: expectedSelected,
      platformSelectionObserved: state.selected,
      publishButton: state.publishButtons[0],
    });
  }

  await verifyReturn("inbox", inboxPost);
  await verifyReturn("calendar", calendarPost);

  const missingId = `qa-missing-${Date.now()}`;
  await page.evaluate(() => localStorage.removeItem("studio_work"));
  await page.goto(`${baseUrl}/studio?room=publish&queue_id=${missingId}&from=calendar`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByText("돌아갈 작업물을 찾지 못했습니다", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
  const missingPublishButtonCount = await page.getByRole("button", { name: /\d+곳에 올리기/ }).count();
  if (missingPublishButtonCount !== 0) fail(`없는 queue에서 발행 단추 ${missingPublishButtonCount}개가 노출됐습니다`);
  await page.screenshot({ path: path.join(outputDir, "missing-queue-rejected.png"), fullPage: true });
  observations.push({ source: "missing", queuePostId: missingId, rejected: true, publishButtonCount: 0 });

  if (unauthorizedUrls.length) fail(`브라우저 401 ${unauthorizedUrls.length}건: ${unauthorizedUrls.slice(0, 3).join(" | ")}`);
  if (consoleErrors.length) fail(`브라우저 콘솔 오류 ${consoleErrors.length}건: ${consoleErrors.slice(0, 3).join(" | ")}`);

  fs.writeFileSync(path.join(outputDir, "observations.json"), JSON.stringify({ workspaceId, observations, unauthorizedUrls, consoleErrors }, null, 2));
  console.log("PASS inbox 발행실 복귀, queue 본문과 플랫폼 선택 복원");
  console.log("PASS calendar 발행실 복귀, 연결 draft/queue 본문과 플랫폼 선택 복원");
  console.log("PASS 없는 queue 거절, 발행 단추 0건");
  console.log("PASS 브라우저 401 0건, 콘솔 오류 0건");
  console.log(`EVIDENCE ${outputDir}`);

  await context.close();
} finally {
  if (browser) await browser.close().catch(() => {});
  for (const postId of cleanupPostIds) {
    await operatorRequest(`/api/queue/${encodeURIComponent(postId)}/delete`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
  }
  if (tenantTokenId) {
    await operatorRequest(`/api/tenant-tokens?id=${encodeURIComponent(tenantTokenId)}`, { method: "DELETE" }).catch(() => {});
  }
}
