#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import playwright from "/Users/sj/kimstudy-auto/node_modules/playwright-core/index.js";

const { chromium } = playwright;
const baseUrl = process.env.ROOM_A11Y_BASE_URL || "http://localhost:3456";
const dashboardToken = process.env.ROOM_A11Y_DASHBOARD_TOKEN || "";
const studioToken = process.env.ROOM_A11Y_STUDIO_TOKEN || "";
const workspaceId = process.env.ROOM_A11Y_WORKSPACE_ID || "";
const outputFile = process.env.ROOM_A11Y_OUTPUT || path.resolve(process.cwd(), "../docs/qa/room-accessibility.json");
const screenshotDir = process.env.ROOM_A11Y_SCREENSHOTS || path.dirname(outputFile);
const label = process.env.ROOM_A11Y_LABEL || "accessibility";
const executablePath = process.env.ROOM_A11Y_CHROME_PATH || "/Users/sj/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

if (!dashboardToken || !studioToken || !workspaceId) {
  throw new Error("ROOM_A11Y_DASHBOARD_TOKEN, ROOM_A11Y_STUDIO_TOKEN, ROOM_A11Y_WORKSPACE_ID are required");
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(({ dashboardTokenValue, studioTokenValue, workspaceIdValue }) => {
  localStorage.setItem("dashboard_auth_token", dashboardTokenValue);
  localStorage.setItem("active_workspace", JSON.stringify({
    id: workspaceIdValue,
    slug: "room-accessibility-verification",
    name: "키보드 검증 작업 공간",
    tier: "team",
  }));
  sessionStorage.setItem("studio_generation_token", studioTokenValue);
  sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
  sessionStorage.setItem("studio_workspace_id", workspaceIdValue);
}, { dashboardTokenValue: dashboardToken, studioTokenValue: studioToken, workspaceIdValue: workspaceId });

const page = await context.newPage();
const consoleErrors = [];
const unauthorizedUrls = [];
const keyboardSteps = [];
const contrast = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("response", (response) => { if (response.status() === 401) unauthorizedUrls.push(response.url()); });

async function activeDescriptor() {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const labelledBy = element.getAttribute("aria-labelledby");
    const labelledText = labelledBy
      ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ")
      : "";
    const label = element.getAttribute("aria-label")
      || labelledText
      || (element.labels ? [...element.labels].map((item) => item.textContent || "").join(" ") : "")
      || element.textContent
      || element.getAttribute("placeholder")
      || "";
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      role: element.getAttribute("role") || "",
      label: label.replace(/\s+/g, " ").trim(),
      href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "",
      visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length),
      outlineStyle: getComputedStyle(element).outlineStyle,
      outlineWidth: getComputedStyle(element).outlineWidth,
    };
  });
}

async function tabTo(predicate, description, maxTabs = 240) {
  const visited = [];
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const current = await activeDescriptor();
    if (!current?.visible) continue;
    visited.push(current);
    if (predicate(current)) {
      keyboardSteps.push({ description, tabs: index + 1, focused: current });
      return current;
    }
  }
  throw new Error(`${description}에 Tab으로 도달하지 못했습니다: ${JSON.stringify(visited.slice(-20))}`);
}

async function auditContrast(screen) {
  for (const theme of ["light", "dark"]) {
    await page.evaluate((nextTheme) => document.documentElement.setAttribute("data-theme", nextTheme), theme);
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const parse = (value) => {
        const match = value.match(/rgba?\((?:\s*)(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d+(?:\.\d+)?))?\s*\)/i);
        return match ? { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] == null ? 1 : Number(match[4]) } : null;
      };
      const over = (front, back) => {
        const alpha = front.a + back.a * (1 - front.a);
        if (alpha === 0) return { r: 255, g: 255, b: 255, a: 0 };
        return {
          r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
          g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
          b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
          a: alpha,
        };
      };
      const luminance = (color) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
      };
      const ratio = (a, b) => {
        const first = luminance(a);
        const second = luminance(b);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      };
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      };
      const textElements = [...document.querySelectorAll("body *")].filter((element) => {
        if (!(element instanceof HTMLElement) || !visible(element)) return false;
        if (element.closest("button:disabled, input:disabled, select:disabled, textarea:disabled, [aria-disabled='true']")) return false;
        return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      });
      const failures = [];
      let checked = 0;
      let complexBackgrounds = 0;
      for (const element of textElements) {
        const style = getComputedStyle(element);
        const ancestors = [];
        let cursor = element;
        let complex = false;
        let opacity = 1;
        while (cursor instanceof HTMLElement) {
          const cursorStyle = getComputedStyle(cursor);
          ancestors.push(cursorStyle);
          opacity *= Number(cursorStyle.opacity || 1);
          if (cursorStyle.backgroundImage !== "none") complex = true;
          cursor = cursor.parentElement;
        }
        if (complex) {
          complexBackgrounds += 1;
          continue;
        }
        let background = { r: 255, g: 255, b: 255, a: 1 };
        for (const ancestorStyle of ancestors.reverse()) {
          const color = parse(ancestorStyle.backgroundColor);
          if (color) background = over(color, background);
        }
        const foregroundRaw = parse(style.color);
        if (!foregroundRaw) continue;
        const foreground = over({ ...foregroundRaw, a: foregroundRaw.a * opacity }, background);
        const actual = ratio(foreground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const minimum = large ? 3 : 4.5;
        checked += 1;
        if (actual + 0.0001 < minimum) {
          failures.push({
            text: element.innerText.replace(/\s+/g, " ").trim().slice(0, 100),
            tag: element.tagName.toLowerCase(),
            className: element.className?.toString().slice(0, 180) || "",
            ratio: Math.round(actual * 100) / 100,
            minimum,
            color: style.color,
            background: `rgb(${Math.round(background.r)} ${Math.round(background.g)} ${Math.round(background.b)})`,
          });
        }
      }
      return { checked, complexBackgrounds, failures };
    });
    contrast.push({ screen, theme, ...result });
  }
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
}

try {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('[data-room="performance"]').waitFor({ state: "visible" });
  await auditContrast("home-performance");
  await page.screenshot({ path: path.join(screenshotDir, `${label}-home-performance.png`), fullPage: false });

  await tabTo((item) => item.tag === "a" && item.label.includes("생성실"), "홈에서 생성실 링크");
  await page.keyboard.press("Enter");
  await page.locator('[data-room="create"]').waitFor({ state: "visible" });
  await auditContrast("create");

  await tabTo((item) => item.id === "studio-topic", "생성실 주제 입력");
  await page.keyboard.type("처음 만든 서비스를 알리는 첫 콘텐츠");
  await tabTo((item) => item.id === "studio-purpose", "생성실 목적 입력");
  await page.keyboard.type("첫 고객에게 서비스 가치를 알린다");
  await tabTo((item) => item.id === "studio-audience", "생성실 대상 입력");
  await page.keyboard.type("처음 서비스를 만든 1인 사업가");
  await tabTo((item) => item.tag === "input" && item.label.includes("소재 권리"), "소재 권리 확인");
  await page.keyboard.press("Space");
  await tabTo((item) => item.tag === "button" && item.label === "후보 세 장 만들기", "후보 생성 단추");
  const generationResponse = page.waitForResponse((response) => response.url().includes("/api/studio/v1/generations") && response.request().method() === "POST");
  await page.keyboard.press("Enter");
  const generated = await generationResponse;
  if (generated.status() !== 201) throw new Error(`후보 생성 HTTP ${generated.status()}`);
  await page.getByRole("button", { name: "A안 선택", exact: true }).waitFor();
  await tabTo((item) => item.tag === "button" && item.label === "A안 선택", "A안 선택 단추");
  await page.keyboard.press("Enter");
  await tabTo((item) => item.tag === "button" && item.label === "편집실로 이동", "편집실 이동 단추");
  await page.keyboard.press("Enter");
  await page.locator('[data-room="edit"]').waitFor({ state: "visible" });
  await auditContrast("edit");

  await tabTo((item) => item.tag === "button" && item.label === "비율 도구", "편집실 비율 도구");
  await page.keyboard.press("Enter");
  await tabTo((item) => item.tag === "button" && item.label === "정사각", "편집실 정사각 비율");
  await page.keyboard.press("Enter");
  await tabTo((item) => item.tag === "a" && item.label.includes("발행실"), "편집실에서 발행실 링크");
  await page.keyboard.press("Enter");
  await page.locator('[data-room="publish"]').waitFor({ state: "visible" });
  await auditContrast("publish");

  const duplicateInlineEditors = await page.locator('[data-pv-inline-edit="threads:caption"]').count();
  await tabTo((item) => item.tag === "button" && item.label === "초안으로 저장", "발행실 초안 저장 단추");
  const saveResponse = page.waitForResponse((response) => response.url().includes("/api/studio/drafts") && response.request().method() === "POST");
  await page.keyboard.press("Enter");
  const saved = await saveResponse;
  if (![200, 201].includes(saved.status())) throw new Error(`초안 저장 HTTP ${saved.status()}`);
  await tabTo((item) => item.tag === "a" && item.label.includes("성과실"), "발행실에서 성과실 링크");
  await page.keyboard.press("Enter");
  await page.locator('[data-room="performance"]').waitFor({ state: "visible" });
  await tabTo((item) => item.tag === "button" && item.label === "전체", "성과실 플랫폼 전체 단추");
  await page.keyboard.press("Enter");

  const result = {
    label,
    observedAt: new Date().toISOString(),
    baseUrl,
    workspaceId,
    keyboard: {
      passed: true,
      focusRingObserved: keyboardSteps.every((step) => step.focused.outlineStyle !== "none" && Number.parseFloat(step.focused.outlineWidth) >= 3),
      generationHttpStatus: generated.status(),
      draftSaveHttpStatus: saved.status(),
      steps: keyboardSteps,
    },
    duplicateInlineEditors,
    contrast,
    contrastFailureCount: contrast.reduce((sum, item) => sum + item.failures.length, 0),
    unauthorizedUrls,
    consoleErrors,
  };
  fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify({
    label,
    outputFile,
    keyboardPassed: result.keyboard.passed,
    keyboardSteps: result.keyboard.steps.length,
    generationHttpStatus: result.keyboard.generationHttpStatus,
    draftSaveHttpStatus: result.keyboard.draftSaveHttpStatus,
    duplicateInlineEditors,
    contrast: contrast.map((item) => ({ screen: item.screen, theme: item.theme, checked: item.checked, failures: item.failures.length })),
    unauthorizedCount: unauthorizedUrls.length,
    consoleErrorCount: consoleErrors.length,
  }, null, 2)}\n`);
} finally {
  await context.close();
  await browser.close();
}
