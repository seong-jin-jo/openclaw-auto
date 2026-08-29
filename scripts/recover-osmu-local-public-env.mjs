#!/usr/bin/env node

import { chmod, lstat, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_PUBLIC_URL = "https://openclaw.sj-onpremise-cloudflare-tunnel.cloud";
const REQUIRED_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function fail(message) { throw new Error(message); }

export function parseEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

export function mergeMissingPublicEnv(content, recovered) {
  const existing = parseEnv(content);
  for (const key of REQUIRED_KEYS) {
    const current = existing.get(key);
    if (current && current !== recovered[key]) fail(`${key} already differs; refusing to overwrite`);
  }
  let next = content;
  if (next && !next.endsWith("\n")) next += "\n";
  for (const key of REQUIRED_KEYS) if (!existing.get(key)) next += `${key}=${recovered[key]}\n`;
  return next;
}

export function extractSupabaseBase(authUrl) {
  const parsed = new URL(authUrl);
  if (parsed.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname)) {
    fail("live preflight returned an unexpected Supabase origin");
  }
  if (!parsed.pathname.startsWith("/auth/v1/authorize")) fail("live preflight returned an unexpected auth path");
  return parsed.origin;
}

function jwtPayload(value) {
  try { return JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8")); }
  catch { return null; }
}

export function extractAnonCandidates(source, projectRef) {
  const found = new Set();
  for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    const payload = jwtPayload(match[0]);
    if (payload?.role === "anon" && payload?.ref === projectRef) found.add(match[0]);
  }
  for (const match of source.matchAll(/sb_publishable_[A-Za-z0-9_-]+/g)) found.add(match[0]);
  return [...found];
}

async function checkedText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) fail(`HTTP ${response.status} while reading ${new URL(url).pathname}`);
  return response.text();
}

async function recoverFromLive(publicUrl) {
  const appOrigin = new URL(publicUrl).origin;
  const preflightUrl = new URL("/api/auth/google", appOrigin);
  preflightUrl.searchParams.set("redirect_to", `${appOrigin}/login`);
  const preflight = await fetch(preflightUrl, { signal: AbortSignal.timeout(15_000) });
  if (preflight.status !== 200) fail(`live Google preflight returned HTTP ${preflight.status}`);
  const body = await preflight.json();
  if (typeof body.authUrl !== "string") fail("live Google preflight did not return authUrl");
  const supabaseUrl = extractSupabaseBase(body.authUrl);
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  const html = await checkedText(new URL("/login", appOrigin));
  const scripts = new Set();
  for (const match of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
    const url = new URL(match[1], appOrigin);
    if (url.origin === appOrigin && url.pathname.startsWith("/_next/static/")) scripts.add(url.href);
  }
  if (!scripts.size) fail("live login page exposed no same-origin Next.js chunks");

  const candidates = new Set();
  for (const script of scripts) {
    for (const candidate of extractAnonCandidates(await checkedText(script), projectRef)) candidates.add(candidate);
  }
  const valid = [];
  for (const candidate of candidates) {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: candidate, Authorization: `Bearer ${candidate}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) valid.push(candidate);
  }
  if (valid.length !== 1) fail(`expected one verified public anon key, found ${valid.length}`);
  return { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: valid[0] };
}

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = resolve(process.env.OSMU_LOCAL_ENV_FILE || `${repoRoot}/dashboard/.env.local`);
  let content = "";
  let exists = false;
  try {
    const info = await lstat(envPath);
    if (info.isSymbolicLink()) fail("local env path must not be a symbolic link");
    if (!info.isFile()) fail("local env path is not a regular file");
    content = await readFile(envPath, "utf8");
    exists = true;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const current = parseEnv(content);
  if (REQUIRED_KEYS.every((key) => Boolean(current.get(key)))) {
    if (exists) await chmod(envPath, 0o600);
    console.log("OSMU local public auth env: already configured; no values changed");
    return;
  }
  const recovered = await recoverFromLive(process.env.OSMU_BASE_URL || DEFAULT_PUBLIC_URL);
  const next = mergeMissingPublicEnv(content, recovered);
  const temp = `${envPath}.recover-${process.pid}`;
  await writeFile(temp, next, { flag: "wx", mode: 0o600 });
  try {
    await chmod(temp, 0o600);
    await rename(temp, envPath);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw error;
  }
  console.log("OSMU local public auth env: recovered and verified 2 public values; existing values preserved");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`OSMU local public auth env recovery failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
