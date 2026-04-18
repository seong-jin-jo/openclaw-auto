interface VerifyResult {
  verified: boolean;
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
      return { verified: true, account: "(OAuth 1.0a keys saved)" };
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
        return { verified: true, account: "(Webhook URL saved — verification skipped)" };
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
        return { verified: true, account: "(Webhook URL saved — verification skipped)" };
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
        return { verified: true, account: "(Token saved — verification skipped)" };
      }
    }

    // Generic: check if any key has value
    const hasAny = Object.values(cfg).some((v) => typeof v === "string" && v.trim());
    return { verified: hasAny, account: hasAny ? "(credentials saved)" : "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // DNS/network errors — save anyway with warning
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("name resolution")) {
      return { verified: true, account: "(saved — verification skipped due to network)", error: msg.slice(0, 200) };
    }
    return { verified: false, error: msg.slice(0, 200) };
  }
}
