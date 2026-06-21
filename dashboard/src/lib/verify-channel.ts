import { verifyXCredentials } from "@/lib/publish";

interface VerifyResult {
  verified: boolean;
  // verified=false지만 네트워크 등으로 "확인 불가"(키는 저장됨)일 때 true. UI에서 앰버로 구분.
  unverified?: boolean;
  reason?: string;
  account?: string;
  error?: string;
}

export async function verifyChannel(channel: string, cfg: Record<string, string>): Promise<VerifyResult> {
  try {
    if (channel === "threads") {
      const token = cfg.accessToken || "";
      if (!token) return { verified: false, error: "Access Token is empty" };
      const res = await fetch(`https://graph.threads.net/v1.0/me?fields=username&access_token=${token}`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (!res.ok) return { verified: false, error: `API error (${res.status}): ${JSON.stringify(data).slice(0, 200)}` };
      return { verified: true, account: `@${data.username || ""}` };
    }

    if (channel === "bluesky") {
      const handle = cfg.handle || "";
      const pw = cfg.appPassword || "";
      if (!handle || !pw) return { verified: false, error: "Handle and App Password required" };
      const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password: pw }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (!res.ok) return { verified: false, error: `API error (${res.status}): ${JSON.stringify(data).slice(0, 200)}` };
      return { verified: true, account: `@${data.handle || ""}` };
    }

    if (channel === "telegram") {
      const token = cfg.botToken || "";
      if (!token) return { verified: false, error: "Bot Token is empty" };
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.ok) return { verified: true, account: `@${data.result?.username || ""}` };
      return { verified: false, error: "Invalid bot token" };
    }

    if (channel === "x") {
      const required = ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"];
      const missing = required.filter((k) => !cfg[k]);
      if (missing.length) return { verified: false, error: `Missing: ${missing.join(", ")}` };
      // 실검증: OAuth1 서명 GET verify_credentials(read-only). 키 존재만 보던 기존 동작 대체.
      const r = await verifyXCredentials({
        apiKey: cfg.apiKey, apiSecret: cfg.apiKeySecret,
        accessToken: cfg.accessToken, accessSecret: cfg.accessTokenSecret,
      });
      if (r.ok) return { verified: true, account: r.account };
      if (r.networkError) return { verified: false, unverified: true, reason: "네트워크 확인 실패 — 키는 저장됨" };
      if (r.status === 403) return { verified: false, unverified: true, reason: "X API 접근 제한(앱 권한 확인) — 키는 저장됨" };
      return { verified: false, error: `X 인증 실패(${r.status ?? "?"})` };
    }

    if (channel === "instagram") {
      const token = cfg.accessToken || "";
      const userId = cfg.userId || "";
      if (!token) return { verified: false, error: "Access Token is empty" };
      if (!userId) return { verified: false, error: "User ID is empty" };
      const res = await fetch(`https://graph.instagram.com/v21.0/${userId}?fields=username&access_token=${token}`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (!res.ok) return { verified: false, error: `API error (${res.status}): ${JSON.stringify(data).slice(0, 200)}` };
      return { verified: true, account: `@${data.username || ""}` };
    }

    if (channel === "facebook") {
      const token = cfg.accessToken || "";
      const pageId = cfg.pageId || "";
      if (!token || !pageId) return { verified: false, error: "Access Token and Page ID required" };
      const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=name&access_token=${token}`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (!res.ok) return { verified: false, error: `API error (${res.status}): ${JSON.stringify(data).slice(0, 200)}` };
      return { verified: true, account: data.name || pageId };
    }

    if (channel === "discord") {
      const webhookUrl = cfg.webhookUrl || "";
      if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return { verified: false, error: "Invalid Discord Webhook URL" };
      }
      // 실제 webhook 검증 — GET으로 webhook 정보 확인
      try {
        const res = await fetch(webhookUrl, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (res.ok && data.name) return { verified: true, account: data.name };
        return { verified: false, error: `Webhook invalid (${res.status})` };
      } catch {
        return { verified: false, unverified: true, reason: "네트워크 확인 실패 — Webhook URL은 저장됨" };
      }
    }

    if (channel === "slack") {
      const webhookUrl = cfg.webhookUrl || "";
      if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
        return { verified: false, error: "Invalid Slack Webhook URL" };
      }
      // 실제 webhook 검증 — 빈 POST로 응답 확인
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "" }),
          signal: AbortSignal.timeout(5000),
        });
        // Slack은 빈 text면 400 반환하지만 webhook은 유효
        if (res.status === 400 || res.ok) return { verified: true, account: "(Webhook verified)" };
        return { verified: false, error: `Webhook invalid (${res.status})` };
      } catch {
        return { verified: false, unverified: true, reason: "네트워크 확인 실패 — Webhook URL은 저장됨" };
      }
    }

    if (channel === "line") {
      const token = cfg.channelAccessToken || "";
      if (!token) return { verified: false, error: "Channel Access Token is empty" };
      // 실제 API 검증
      try {
        const res = await fetch("https://api.line.me/v2/bot/info", {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (res.ok) return { verified: true, account: data.displayName || data.basicId || "(Connected)" };
        return { verified: false, error: `LINE API error (${res.status})` };
      } catch {
        return { verified: false, unverified: true, reason: "네트워크 확인 실패 — 토큰은 저장됨" };
      }
    }

    // Generic: check if any key has value
    const hasAny = Object.values(cfg).some((v) => typeof v === "string" && v.trim());
    return { verified: hasAny, account: hasAny ? "(credentials saved)" : "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // DNS/network errors — 확인 "불가"(키는 저장되되 verified=false, 비활성 유지가 안전). UI는 앰버 표시.
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("name resolution")) {
      return { verified: false, unverified: true, reason: "네트워크 확인 실패 — 저장됨(검증 미완)", error: msg.slice(0, 200) };
    }
    return { verified: false, error: msg.slice(0, 200) };
  }
}
