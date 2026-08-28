/*
STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer
PURPOSE: v24의 전체 route, state, 실제 data-action click을 DOM 런타임에서 재현한다.
SOURCES: v24 prototype | dashboard/src route inventory | gstack browse interaction workflow
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { JSDOM, VirtualConsole } from "../../../dashboard/node_modules/jsdom/lib/api.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(
  currentDir,
  "../openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html",
);
const html = readFileSync(htmlPath, "utf8");
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => {
  runtimeErrors.push({ type: "jsdom", text: error.message, detail: error.stack || "" });
});
virtualConsole.on("error", (...args) => {
  runtimeErrors.push({ type: "console", text: args.map(String).join(" ") });
});

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://127.0.0.1:8899/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html",
  virtualConsole,
  beforeParse(window) {
    window.scrollTo = () => {};
    window.alert = () => {};
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
    window.addEventListener("error", (event) => {
      runtimeErrors.push({
        type: "window",
        text: event.message,
        detail: event.error?.stack || "",
      });
    });
    if (window.HTMLDialogElement) {
      window.HTMLDialogElement.prototype.showModal = function showModal() {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function close() {
        this.open = false;
      };
    }
  },
});

await new Promise((resolveWait) => setTimeout(resolveWait, 20));
const { window } = dom;
const checks = [];

function snapshot(name, before, evaluationError = null) {
  const root = window.document.getElementById("root");
  checks.push({
    name,
    evaluationError,
    errors: runtimeErrors.slice(before),
    rootChars: (root?.textContent || "").trim().length,
    rootChildren: root?.children.length || 0,
    dialogs: window.document.querySelectorAll('[role="dialog"], .dialog').length,
    path: window.__V24_TEST_API__?.getState().path,
    role: window.__V24_TEST_API__?.getState().role,
  });
}

function check(name, callback) {
  const before = runtimeErrors.length;
  let evaluationError = null;
  try {
    callback();
  } catch (error) {
    evaluationError = error.stack || error.message;
  }
  snapshot(name, before, evaluationError);
}

const testApi = window.__V24_TEST_API__;
const manifest = window.__V24_MANIFEST__;
const routes = window.__V19_MANIFEST__?.destinations.map((item) => item.path) || [];
const discoveredActions = new Map();

if (!testApi || !manifest) {
  check("bootstrap", () => {
    throw new Error("v24 test API 또는 manifest가 정의되지 않았습니다.");
  });
} else {
  const collectActions = (context) => {
    for (const element of window.document.querySelectorAll("[data-action]")) {
      const action = element.getAttribute("data-action");
      if (action && !discoveredActions.has(action)) {
        discoveredActions.set(action, {
          context,
          state: JSON.parse(JSON.stringify(testApi.getState())),
        });
      }
    }
  };
  const findByAttribute = (attribute, value) =>
    [...window.document.querySelectorAll(`[${attribute}]`)].find(
      (element) => element.getAttribute(attribute) === value,
    );
  const clickByAttribute = (name, attribute, value) => {
    check(name, () => {
      const element = findByAttribute(attribute, value);
      if (!element) throw new Error(`${attribute}=${value} 컨트롤이 없습니다.`);
      element.click();
    });
  };

  for (const route of routes) {
    check(`route:${route}`, () => testApi.go(route));
    collectActions(`route:${route}`);
    check(`route-click:${route}`, () => {
      testApi.setRole("customer");
      const element = findByAttribute("data-route", route);
      if (!element) throw new Error(`data-route=${route} 메뉴가 없습니다.`);
      element.click();
    });
  }

  for (const tab of ["channels", "ai", "storage", "design", "notifications", "tokens", "keywords", "system"]) {
    check(`settings:${tab}`, () => {
      testApi.getState().settingsTab = tab;
      testApi.go("/settings");
    });
    clickByAttribute(`settings-click:${tab}`, "data-settings-tab", tab);
    collectActions(`settings:${tab}`);
  }

  for (const [route, tabs] of [
    ["/channels/threads", ["queue", "analytics", "growth", "popular", "settings"]],
    ["/channels/instagram", ["queue", "editor", "settings"]],
  ]) {
    for (const tab of tabs) {
      check(`channel-tab:${route}:${tab}`, () => {
        testApi.getState().platformTab = tab;
        testApi.go(route);
      });
      clickByAttribute(`channel-tab-click:${route}:${tab}`, "data-platform-tab", tab);
      collectActions(`channel-tab:${route}:${tab}`);
    }
  }

  for (const step of [1, 2, 3, 4, 7, 11, 14]) {
    check(`journey:${step}`, () => testApi.setJourneyStep(step));
    collectActions(`journey:${step}`);
  }

  check("onboarding", () => {
    testApi.getState().onboardingOpen = true;
    testApi.render();
  });
  collectActions("onboarding");
  check("connect", () => {
    testApi.getState().connectOpen = true;
    testApi.render();
  });
  collectActions("connect");
  check("operator", () => testApi.setRole("operator"));
  collectActions("operator");
  clickByAttribute("operator-role-click:customer", "data-role-switch", "customer");
  clickByAttribute("operator-role-click:operator", "data-role-switch", "operator");
  collectActions("operator-click");

  for (const screenState of ["success", "loading", "empty", "error", "partial", "permission", "uncertain", "repair"]) {
    check(`home-state:${screenState}`, () => {
      testApi.setRole("customer");
      testApi.go("/");
      testApi.setScreenState(screenState);
    });
    check(`studio-state:${screenState}`, () => {
      testApi.go("/studio");
      testApi.setScreenState(screenState);
    });
  }

  for (const [action, source] of discoveredActions) {
    check(`action-click:${action}`, () => {
      Object.assign(testApi.getState(), source.state);
      testApi.render();
      const element = findByAttribute("data-action", action);
      if (!element) throw new Error(`data-action=${action} 컨트롤이 없습니다.`);
      element.click();
    });
  }
}

const failed = checks.filter(
  (item) => item.evaluationError || item.errors.length || item.rootChars === 0 || item.rootChildren === 0,
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
dom.window.close();
if (failed.length) process.exitCode = 1;

// MODEL: gpt-codex/gpt-5.6
// SKILLS_USED: gstack browse interaction workflow를 DOM 감사 설계에 사용
// SKILLS_SKIPPED: 실제 Chrome은 sandbox의 localhost와 CDP 차단으로 별도 감사에 위임
