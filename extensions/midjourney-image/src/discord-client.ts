/**
 * Minimal Discord REST client for interacting with Midjourney bot.
 *
 * Flow:
 *   1. Send /imagine slash command via Discord interactions API
 *   2. Poll channel messages for Midjourney bot response
 *   3. Detect completion (attachment with final image, no "Waiting" progress)
 *   4. Download the generated image
 *
 * Note: This uses Discord's REST API only (no WebSocket gateway).
 * Rate limiting: respects Discord's rate limit headers.
 */

const DISCORD_API = "https://discord.com/api/v10";
const MIDJOURNEY_BOT_ID = "936929561302675456";

export type MidjourneyConfig = {
  discordToken: string;
  channelId: string;
  serverId: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export type MidjourneyResult = {
  imageUrl: string;
  messageId: string;
  prompt: string;
};

type DiscordMessage = {
  id: string;
  author: { id: string };
  content: string;
  attachments: Array<{ url: string; filename: string; width?: number; height?: number }>;
  components?: Array<{
    type: number;
    components?: Array<{ type: number; custom_id?: string; label?: string }>;
  }>;
  timestamp: string;
};

function headers(token: string) {
  return {
    Authorization: token,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };
}

async function rateLimitedFetch(url: string, opts: RequestInit): Promise<Response> {
  const resp = await fetch(url, opts);
  if (resp.status === 429) {
    const body = (await resp.json()) as { retry_after?: number };
    const wait = (body.retry_after ?? 1) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return fetch(url, opts);
  }
  return resp;
}

/**
 * Send /imagine command via Discord interaction.
 * Uses the application command endpoint to trigger Midjourney.
 */
export async function sendImagine(
  config: MidjourneyConfig,
  prompt: string,
): Promise<string> {
  // Send as a regular message with /imagine prefix
  // Midjourney responds to messages that trigger its slash command
  // We use the interaction approach: send application command
  const resp = await rateLimitedFetch(`${DISCORD_API}/interactions`, {
    method: "POST",
    headers: headers(config.discordToken),
    body: JSON.stringify({
      type: 2, // APPLICATION_COMMAND
      application_id: MIDJOURNEY_BOT_ID,
      guild_id: config.serverId,
      channel_id: config.channelId,
      session_id: "openclaw-" + Date.now(),
      data: {
        version: "1237876415471554623",
        id: "938956540159881230",
        name: "imagine",
        type: 1,
        options: [{ type: 3, name: "prompt", value: prompt }],
      },
    }),
  });

  if (!resp.ok && resp.status !== 204) {
    const errText = await resp.text();
    throw new Error(`Discord /imagine failed (${resp.status}): ${errText}`);
  }

  return prompt;
}

/**
 * Poll channel messages for Midjourney bot's completed image.
 *
 * Midjourney response lifecycle:
 *   1. Initial message: "**prompt** - <@user> (Waiting to start)"
 *   2. Progress updates: embedded image with percentage
 *   3. Final message: full-res image attachment with action buttons (U1-U4, V1-V4)
 *
 * We detect completion by: attachment present + action buttons (U1/V1) present.
 */
export async function pollForResult(
  config: MidjourneyConfig,
  prompt: string,
  afterTimestamp: string,
): Promise<MidjourneyResult> {
  const pollInterval = config.pollIntervalMs ?? 5000;
  const timeout = config.timeoutMs ?? 300000; // 5 minutes
  const deadline = Date.now() + timeout;

  // Normalize prompt for matching (Midjourney may modify it slightly)
  const promptLower = prompt.toLowerCase().slice(0, 50);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const messages = await getRecentMessages(config, 10);

    for (const msg of messages) {
      // Must be from Midjourney bot
      if (msg.author.id !== MIDJOURNEY_BOT_ID) continue;

      // Must be after our command was sent
      if (new Date(msg.timestamp) <= new Date(afterTimestamp)) continue;

      // Must contain our prompt in the message content
      if (!msg.content.toLowerCase().includes(promptLower)) continue;

      // Check if this is a completed generation (has attachment + action buttons)
      const hasImage = msg.attachments.length > 0 && msg.attachments[0].width;
      const hasButtons = msg.components?.some(
        (row) => row.components?.some((btn) => btn.custom_id?.startsWith("MJ::JOB::upsample")),
      );

      if (hasImage && hasButtons) {
        return {
          imageUrl: msg.attachments[0].url,
          messageId: msg.id,
          prompt,
        };
      }
    }
  }

  throw new Error(`Midjourney timed out after ${timeout / 1000}s waiting for: ${prompt}`);
}

/**
 * Click an upscale button (U1-U4) on a Midjourney grid result.
 */
export async function clickUpscale(
  config: MidjourneyConfig,
  messageId: string,
  index: number, // 1-4
): Promise<void> {
  // Get the message to find the button custom_id
  const msg = await getMessage(config, messageId);
  if (!msg.components) throw new Error("Message has no action buttons");

  let customId: string | undefined;
  for (const row of msg.components) {
    for (const btn of row.components ?? []) {
      if (btn.label === `U${index}` || btn.custom_id?.includes(`upsample::${index}`)) {
        customId = btn.custom_id;
        break;
      }
    }
    if (customId) break;
  }

  if (!customId) throw new Error(`Upscale button U${index} not found`);

  const resp = await rateLimitedFetch(`${DISCORD_API}/interactions`, {
    method: "POST",
    headers: headers(config.discordToken),
    body: JSON.stringify({
      type: 3, // MESSAGE_COMPONENT
      guild_id: config.serverId,
      channel_id: config.channelId,
      message_id: messageId,
      session_id: "openclaw-" + Date.now(),
      data: {
        component_type: 2,
        custom_id: customId,
      },
    }),
  });

  if (!resp.ok && resp.status !== 204) {
    const errText = await resp.text();
    throw new Error(`Upscale click failed (${resp.status}): ${errText}`);
  }
}

/**
 * Poll for upscaled image result after clicking U1-U4.
 */
export async function pollForUpscale(
  config: MidjourneyConfig,
  prompt: string,
  afterTimestamp: string,
  index: number,
): Promise<MidjourneyResult> {
  const pollInterval = config.pollIntervalMs ?? 5000;
  const timeout = config.timeoutMs ?? 300000;
  const deadline = Date.now() + timeout;
  const promptLower = prompt.toLowerCase().slice(0, 50);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const messages = await getRecentMessages(config, 10);

    for (const msg of messages) {
      if (msg.author.id !== MIDJOURNEY_BOT_ID) continue;
      if (new Date(msg.timestamp) <= new Date(afterTimestamp)) continue;
      if (!msg.content.toLowerCase().includes(promptLower)) continue;

      // Upscaled images: single image, content mentions "Image #N"
      const hasImage = msg.attachments.length > 0 && msg.attachments[0].width;
      const isUpscale = msg.content.includes(`Image #${index}`) ||
                        (hasImage && !msg.components?.some(
                          (row) => row.components?.some((btn) => btn.custom_id?.startsWith("MJ::JOB::upsample")),
                        ));

      if (hasImage && isUpscale) {
        return {
          imageUrl: msg.attachments[0].url,
          messageId: msg.id,
          prompt,
        };
      }
    }
  }

  throw new Error(`Upscale timed out after ${timeout / 1000}s`);
}

/**
 * Download image from Discord CDN.
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Image download failed (${resp.status})`);
  return Buffer.from(await resp.arrayBuffer());
}

async function getRecentMessages(
  config: MidjourneyConfig,
  limit: number,
): Promise<DiscordMessage[]> {
  const resp = await rateLimitedFetch(
    `${DISCORD_API}/channels/${config.channelId}/messages?limit=${limit}`,
    { headers: headers(config.discordToken) },
  );
  if (!resp.ok) throw new Error(`Fetch messages failed (${resp.status})`);
  return (await resp.json()) as DiscordMessage[];
}

async function getMessage(
  config: MidjourneyConfig,
  messageId: string,
): Promise<DiscordMessage> {
  const resp = await rateLimitedFetch(
    `${DISCORD_API}/channels/${config.channelId}/messages/${messageId}`,
    { headers: headers(config.discordToken) },
  );
  if (!resp.ok) throw new Error(`Fetch message failed (${resp.status})`);
  return (await resp.json()) as DiscordMessage;
}
