#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const baseUrl = process.env.R02_BASE_URL || "http://localhost:3459";
const tenantToken = process.env.R02_TENANT_TOKEN || "";
const chromePath = process.env.R02_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = Number(process.env.R02_CHROME_DEBUG_PORT || 9329);
const livePublish = process.env.R02_LIVE_PUBLISH === "1";
const timeoutMs = Number(process.env.R02_TIMEOUT_MS || 180000);

if (!tenantToken) throw new Error("R02_TENANT_TOKEN is required");
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = (ms = timeoutMs) => Date.now() + ms;

async function waitFor(check, message, ms = timeoutMs) {
  const until = deadline(ms);
  let last;
  while (Date.now() < until) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await sleep(250);
  }
  throw new Error(`${message}${last ? `: ${last.message}` : ""}`);
}

async function api(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}: ${JSON.stringify(body)}`);
  return { status: response.status, body };
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      const key = `${message.sessionId || "browser"}:${message.method}`;
      for (const listener of this.listeners.get(key) || []) listener(message.params || {});
    });
  }

  call(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  once(method, sessionId) {
    const key = `${sessionId || "browser"}:${method}`;
    return new Promise((resolve) => {
      const listener = (params) => {
        this.listeners.set(key, (this.listeners.get(key) || []).filter((item) => item !== listener));
        resolve(params);
      };
      this.listeners.set(key, [...(this.listeners.get(key) || []), listener]);
    });
  }

  on(method, sessionId, listener) {
    const key = `${sessionId || "browser"}:${method}`;
    this.listeners.set(key, [...(this.listeners.get(key) || []), listener]);
  }

  close() {
    this.ws.close();
  }
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "r02-chrome-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1024,900",
  "about:blank",
], { stdio: "ignore" });

let cdp;
try {
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
    return response.ok ? response.json() : null;
  }, "Chrome DevTools did not start", 15000);
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.open();
  const { targetId } = await cdp.call("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.call("Target.attachToTarget", { targetId, flatten: true });
  await Promise.all([
    cdp.call("Page.enable", {}, sessionId),
    cdp.call("Runtime.enable", {}, sessionId),
    cdp.call("Log.enable", {}, sessionId),
  ]);

  const consoleErrors = [];
  cdp.on("Runtime.exceptionThrown", sessionId, ({ exceptionDetails }) => {
    consoleErrors.push(exceptionDetails?.text || "runtime exception");
  });
  cdp.on("Log.entryAdded", sessionId, ({ entry }) => {
    if (entry?.level === "error") consoleErrors.push(entry.text);
  });

  async function evaluate(expression) {
    const result = await cdp.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "browser evaluation failed");
    return result.result?.value;
  }

  async function navigate(pathname) {
    const loaded = cdp.once("Page.loadEventFired", sessionId);
    await cdp.call("Page.navigate", { url: new URL(pathname, baseUrl).href }, sessionId);
    await Promise.race([loaded, sleep(15000).then(() => { throw new Error(`navigation timeout: ${pathname}`); })]);
    await waitFor(() => evaluate("document.readyState === 'complete'"), `page did not finish: ${pathname}`, 15000);
  }

  async function screenshot(file) {
    const { data } = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
    fs.writeFileSync(file, Buffer.from(data, "base64"));
  }

  const overview = await api("/api/overview");
  const metrics = await api("/api/metrics");
  const drafts = await api("/api/studio/drafts");
  if (overview.body.source !== "db") throw new Error(`overview source is not db: ${overview.body.source}`);
  if (!Array.isArray(drafts.body.drafts) || !drafts.body.drafts.some((draft) => draft.text)) {
    throw new Error("no loadable Studio draft with text");
  }

  await navigate("/login");
  const loginText = await evaluate("document.body.innerText");
  if (!loginText.includes("Google로 계속")) throw new Error("Google-only login CTA missing");
  await evaluate(`localStorage.setItem("dashboard_auth_token", ${JSON.stringify(tenantToken)})`);

  await navigate("/");
  await waitFor(() => evaluate("document.body.innerText.includes('성과 요약')"), "home summary did not render");
  const homeText = await evaluate("document.body.innerText");
  if (homeText.includes("운영 현황") || homeText.includes("THIS WEEK") || homeText.includes("발행물 성과")) {
    throw new Error("removed duplicate home panel returned");
  }
  await screenshot("/tmp/r02-home-1024.png");

  await navigate("/studio");
  await waitFor(() => evaluate("document.body.innerText.includes('발행 이력')"), "Studio did not render");
  let draftLoadAttempts = 0;
  let nextDraftLoadAttemptAt = 0;
  const publishButtonText = await waitFor(async () => {
    const shouldClickDraft = Date.now() >= nextDraftLoadAttemptAt;
    const state = await evaluate(`(() => {
      const isVisible = (element) => Boolean(element && element.getClientRects().length > 0);
      const publishButton = [...document.querySelectorAll("button")].find((button) => {
        const label = button.textContent?.replace(/\\s+/g, " ").trim() || "";
        return isVisible(button) && !button.disabled && /^(?:🚀\\s*)?Publish\\s*\\(\\d+\\)$/.test(label);
      });
      if (publishButton) return { publishButtonText: publishButton.textContent.trim(), clicked: false };

      const loadButtons = [...document.querySelectorAll("button")].filter((button) =>
        isVisible(button) && !button.disabled && button.textContent?.trim() === "불러오기"
      );
      const loadButton = loadButtons.find((button) =>
        !button.parentElement?.textContent?.includes("본문 없음")
      );
      if (!loadButton || !${shouldClickDraft}) return { publishButtonText: null, clicked: false };
      loadButton.click();
      return { publishButtonText: null, clicked: true };
    })()`);
    if (state?.clicked) {
      draftLoadAttempts += 1;
      nextDraftLoadAttemptAt = Date.now() + 1000;
    }
    return state?.publishButtonText || null;
  }, "loaded draft did not expose an enabled Publish button", Math.min(timeoutMs, 60000));

  let publishResult = "not-requested";
  if (livePublish) {
    const uniqueText = `R02 E2E ${new Date().toISOString()}`;
    const started = await evaluate(`(() => {
      const input = document.querySelector('input[placeholder="글감 / 콘텐츠 주제 입력"]');
      const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === "OSMU 생성");
      if (!input || !button) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(uniqueText)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      button.click();
      return true;
    })()`);
    if (!started) throw new Error("Studio generation controls missing");
    await sleep(300);
    const generation = await waitFor(() => evaluate(`(() => {
      const text = document.body.innerText;
      const failure = text.match(/마지막 실패:[^\n]+/);
      if (failure) return { ok: false, error: failure[0] };
      const ready = [...document.querySelectorAll("button")].some((button) => button.textContent?.includes("Publish ("));
      return ready ? { ok: true } : null;
    })()`), "content generation did not finish");
    if (!generation.ok) throw new Error(`content generation failed: ${generation.error}`);

    await evaluate(`(() => {
      const card = document.querySelector("div.group.cursor-pointer");
      if (!card) return false;
      card.click();
      return true;
    })()`);
    await waitFor(() => evaluate("Boolean(document.querySelector('textarea'))"), "Studio editor did not open");
    await evaluate(`(() => {
      const textarea = document.querySelector("textarea");
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(textarea, ${JSON.stringify(uniqueText)});
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      return textarea.value;
    })()`);
    await evaluate(`(() => {
      const close = [...document.querySelectorAll("button")].find((button) => button.getAttribute("aria-label")?.includes("편집 닫기"));
      close?.click();
      const boxes = [...document.querySelectorAll('label input[type="checkbox"]')]
        .filter((box) => box.parentElement?.textContent?.includes("발행"));
      boxes.forEach((box, index) => {
        const wanted = index === 0;
        if (box.checked !== wanted) box.click();
      });
      return boxes.map((box) => box.checked);
    })()`);
    const clicked = await evaluate(`(() => {
      const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.includes("Publish (1)"));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error("single-platform Publish button missing");
    const publishState = await waitFor(() => evaluate(`(() => {
        const link = document.querySelector('a[title="게시물 보기"]');
        if (link) return { ok: true, href: link.href };
        const text = document.body.innerText;
        const failure = text.match(/(?:일부 )?발행 실패[^\n]*/);
        if (failure) return { ok: false, error: failure[0] };
        return null;
      })()`), "live publish did not finish");
    if (!publishState.ok) throw new Error(`live publish failed: ${publishState.error}`);
    publishResult = publishState.href;
  }
  await screenshot("/tmp/r02-studio-1024.png");

  const expectedPublished = Number(overview.body.summary?.published || 0);
  const metricsPublished = (metrics.body.posts || []).filter((post) => post.status === "published").length;
  const result = {
    ok: true,
    api: {
      overviewStatus: overview.status,
      overviewSource: overview.body.source,
      metricsStatus: metrics.status,
      draftsStatus: drafts.status,
      loadableDrafts: drafts.body.drafts.filter((draft) => draft.text).length,
      publishedCountMatches: expectedPublished === metricsPublished,
    },
    browser: {
      loginGoogleOnly: true,
      homeSummary: true,
      studioDraftLoad: true,
      publishButtonText,
      draftLoadAttempts,
      livePublish,
      publishResult,
      consoleErrors,
      screenshots: ["/tmp/r02-home-1024.png", "/tmp/r02-studio-1024.png"],
    },
  };
  if (consoleErrors.length > 0) throw new Error(`browser console errors: ${JSON.stringify(consoleErrors)}`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`E2E FAILED: ${error?.stack || error?.message || error}\n`);
  process.exitCode = 1;
} finally {
  cdp?.close();
  chrome.kill("SIGTERM");
  try { fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
