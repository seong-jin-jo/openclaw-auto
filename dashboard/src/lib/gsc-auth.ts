/**
 * Get Google OAuth2 access token from service account key using JWT.
 * Uses the Web Crypto API (available in Node 18+) to avoid native dependencies.
 */
export async function getGoogleAccessToken(keyData: Record<string, string>, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: keyData.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer | Uint8Array) =>
    Buffer.from(new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)).toString("base64url");

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const claimB64 = b64url(enc.encode(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;

  // Import PEM private key
  const pemBody = keyData.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const keyBuffer = Buffer.from(pemBody, "base64");

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, enc.encode(signingInput));
  const sigB64 = b64url(signature);
  const jwtToken = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwtToken}`,
    signal: AbortSignal.timeout(10000),
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
