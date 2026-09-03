#!/usr/bin/env node

import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.V75_BASE_URL || "http://127.0.0.1:3467";
const executablePath = process.env.V75_CHROME_PATH || "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const workspaceId = "11111111-1111-4111-8111-111111111111";
const generatedText = "선택한 구조가 반영된 한국어 초안입니다. 첫 문제를 짚고, 해결 순서를 설명한 뒤, 오늘 할 행동으로 마칩니다.";
const textRequests = [];
const consoleErrors = [];

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
await context.addInitScript(({ id }) => {
  localStorage.setItem("dashboard_auth_token", "build-click-token");
  localStorage.setItem("active_workspace", JSON.stringify({ id, slug: "build-click", name: "클릭 검증 작업 공간", tier: "team" }));
}, { id: workspaceId });

const page = await context.newPage();
page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.route("**/api/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const pathname = url.pathname;

  if (pathname === "/api/me") return json(route, { isOperator: false, tenant: { id: workspaceId, slug: "build-click", name: "클릭 검증 작업 공간", status: "active" } });
  if (pathname === "/api/channel-config") return json(route, {});
  if (pathname === "/api/studio/brand-setup") return json(route, { guide: null });
  if (pathname === "/api/studio/engine-status") return json(route, { ready: true });
  if (pathname === "/api/studio/drafts") return json(route, { drafts: [], currentWork: null });
  if (pathname === "/api/images") return json(route, { images: [] });
  if (pathname === "/api/studio/text" && request.method() === "POST") {
    textRequests.push(JSON.parse(request.postData() || "{}"));
    return json(route, { ok: true, threads: generatedText });
  }
  return json(route, {});
});

try {
  await page.goto(`${baseUrl}/studio?room=create`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator('[data-room="create"]').waitFor({ state: "visible" });
  await page.getByLabel("초안 주제").fill("고객이 반복해서 묻는 질문에 답하기");

  const structureBodyBefore = await page.evaluate(() => document.body.innerText.length);
  await page.getByRole("button", { name: "B 구조 사용", exact: true }).click();
  const structureBodyAfter = await page.evaluate(() => document.body.innerText.length);
  const selectedStructureText = await page.locator('[data-quick-structure="B"]').innerText();

  const generateBodyBefore = await page.evaluate(() => document.body.innerText.length);
  await page.getByRole("button", { name: "초안 만들기", exact: true }).click();
  await page.getByText(generatedText, { exact: true }).waitFor({ state: "visible" });
  const generateBodyAfter = await page.evaluate(() => document.body.innerText.length);

  const buttonTexts = await page.locator("button").allInnerTexts();
  const englishButtonLabels = buttonTexts
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => /[A-Za-z]{2,}/.test(text));

  if (structureBodyAfter === structureBodyBefore) throw new Error("구조 카드 클릭 전후 본문 길이가 같습니다");
  if (generateBodyAfter === generateBodyBefore) throw new Error("생성 단추 클릭 전후 본문 길이가 같습니다");
  if (textRequests.length !== 1) throw new Error(`텍스트 생성 요청이 ${textRequests.length}건입니다`);
  if (textRequests[0]?.structure?.label !== "B") throw new Error("선택한 B 구조가 생성 요청에 없습니다");
  if (englishButtonLabels.length !== 0) throw new Error(`영어 단추 라벨이 남았습니다: ${englishButtonLabels.join(", ")}`);
  if (consoleErrors.length !== 0) throw new Error(`브라우저 콘솔 오류가 남았습니다: ${consoleErrors.join(" | ")}`);

  const evidence = {
    generateClick: {
      bodyTextLengthBefore: generateBodyBefore,
      bodyTextLengthAfter: generateBodyAfter,
      delta: generateBodyAfter - generateBodyBefore,
    },
    structureClick: {
      bodyTextLengthBefore: structureBodyBefore,
      bodyTextLengthAfter: structureBodyAfter,
      delta: structureBodyAfter - structureBodyBefore,
      selectedStructureText,
    },
    buttonTexts,
    englishButtonLabelCount: englishButtonLabels.length,
    textRequestCount: textRequests.length,
    textRequestStructure: textRequests[0].structure,
    generatedResult: generatedText,
    consoleErrorCount: consoleErrors.length,
  };
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
}
