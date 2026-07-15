import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// This package has no jsdom/@testing-library/react dependency (vitest.config.ts uses
// environment: 'node'; no existing test in this repo mounts a full React component tree —
// see tests/setup.ts). Mounting login/page.tsx or studio/page.tsx to click-simulate a failed
// vs successful API response is out of scope for a minimal-footprint addition, so this
// contract test instead statically proves the two "fire only after confirmed backend success"
// requirements by asserting the trackEvent(...) call sites are lexically inside the
// success-guarded branch, not before it / not unconditionally in the handler.
//
// This is deliberately a source-shape check, not a full behavioral test — see the final report
// RED_TEAM section for what was traced by hand (the actual variables passed at each call site).

const dashboardRoot = path.resolve(__dirname, "../..");

function read(relPath: string): string {
  return readFileSync(path.join(dashboardRoot, relPath), "utf8");
}

describe("sign_up / publish_success fire only after confirmed API success, not on click alone", () => {
  it("login/page.tsx: sign_up trackEvent fires after the error guard, gated on `data.user` (account actually created)", () => {
    // 2026-07-14 Codex review #4: sign_up must fire for BOTH outcomes of a successful signUp()
    // call — with an immediate session, and the "email confirmation required" no-session case
    // (data.user present, data.session absent) — since both are a real created account. It must
    // still fire strictly after the error guard, and strictly before the session/pending branch.
    const src = read("src/app/login/page.tsx");
    const signupBlock = src.slice(src.indexOf("mode === \"signup\""), src.indexOf("else { setPending(email)"));
    expect(signupBlock).toContain("await sb.auth.signUp(");
    expect(signupBlock).toContain('if (error) { setMsg(error.message); return; }');
    const errorGuardIdx = signupBlock.indexOf("if (error) { setMsg(error.message); return; }");
    const userGuardIdx = signupBlock.indexOf("if (data.user)");
    const sessionGuardIdx = signupBlock.indexOf("if (data.session)");
    const trackIdx = signupBlock.indexOf('trackEvent({ name: "sign_up"');
    expect(userGuardIdx).toBeGreaterThan(-1);
    expect(userGuardIdx).toBeGreaterThan(errorGuardIdx);
    // trackEvent must be lexically inside the `if (data.user)` line (same statement), and that
    // whole check must precede the session/pending branch — so it fires regardless of which
    // branch (session vs. pending-confirmation) is taken next.
    expect(trackIdx).toBeGreaterThan(userGuardIdx);
    expect(trackIdx - userGuardIdx).toBeLessThan(80); // same statement, not a distant unconditional call
    expect(userGuardIdx).toBeLessThan(sessionGuardIdx);
  });

  it("login/page.tsx: sign_up is NOT unconditionally called before the error guard (no fire on failed signUp)", () => {
    const src = read("src/app/login/page.tsx");
    const signupBlock = src.slice(src.indexOf("mode === \"signup\""), src.indexOf("else { setPending(email)"));
    const errorGuardIdx = signupBlock.indexOf("if (error) { setMsg(error.message); return; }");
    const trackIdx = signupBlock.indexOf('trackEvent({ name: "sign_up"');
    expect(trackIdx).toBeGreaterThan(errorGuardIdx);
  });

  it("login/page.tsx: login trackEvent is inside the `if (data.session)` branch, after signInWithPassword() resolves", () => {
    const src = read("src/app/login/page.tsx");
    const loginBlockStart = src.indexOf("signInWithPassword({ email, password: pw })");
    const loginBlockEnd = src.indexOf("} catch (e) {", loginBlockStart);
    const loginBlock = src.slice(loginBlockStart, loginBlockEnd);
    const errorGuardIdx = loginBlock.indexOf("if (error) { setMsg(error.message); return; }");
    const sessionGuardIdx = loginBlock.indexOf("if (data.session)");
    const trackIdx = loginBlock.indexOf('trackEvent({ name: "login"');
    expect(errorGuardIdx).toBeGreaterThanOrEqual(0);
    expect(trackIdx).toBeGreaterThan(errorGuardIdx);
    expect(trackIdx).toBeGreaterThan(sessionGuardIdx);
  });

  it("studio/page.tsx: publish_success trackEvent only fires inside `if (r?.ok)` after apiPost('/api/publish') resolves", () => {
    const src = read("src/app/studio/page.tsx");
    const attemptIdx = src.indexOf('trackEvent({ name: "publish_attempt"');
    const apiCallIdx = src.indexOf('apiPost<{ ok?: boolean; permalink?: string; error?: string }>("/api/publish"', attemptIdx);
    const successIdx = src.indexOf('if (r?.ok)', apiCallIdx);
    const trackSuccessIdx = src.indexOf('trackEvent({ name: "publish_success"', successIdx);
    // publish_attempt must precede the API call (submission time), publish_success must be
    // strictly after the API call resolves and inside the ok-branch.
    expect(attemptIdx).toBeGreaterThan(-1);
    expect(attemptIdx).toBeLessThan(apiCallIdx);
    expect(successIdx).toBeGreaterThan(apiCallIdx);
    expect(trackSuccessIdx).toBeGreaterThan(successIdx);
    expect(trackSuccessIdx - successIdx).toBeLessThan(120); // same line/branch, not a distant unconditional call
  });

  it("studio/page.tsx: publish_success is NOT called in the error branch (else push to errs)", () => {
    const src = read("src/app/studio/page.tsx");
    const elseIdx = src.indexOf("else errs.push(`${LABEL[p]}: ${r?.error");
    const errsLineEnd = src.indexOf("\n", elseIdx);
    const errsLine = src.slice(elseIdx, errsLineEnd);
    expect(errsLine).not.toContain("publish_success");
  });
});

describe("OAuth login tracking covers PKCE (not just implicit-flow hash tokens)", () => {
  // 2026-07-14 Codex review #5: the old implementation only tracked `login` when a hash token
  // (#access_token=...) was present in the URL — the implicit flow. Supabase's PKCE flow returns
  // via `?code=...` with no hash token at all, so OAuth logins through PKCE were silently never
  // tracked. Fix: set a non-PII sessionStorage marker right before the redirect, consume it only
  // after a session is actually confirmed on return, covering both flows without duplicate fires.

  it("google(): sets the pending marker in sessionStorage before redirecting, after authUrl is confirmed", () => {
    const src = read("src/app/login/page.tsx");
    const googleBlockStart = src.indexOf("const google = async ()");
    const googleBlockEnd = src.indexOf("finally { setBusy(false); }", googleBlockStart);
    const block = src.slice(googleBlockStart, googleBlockEnd);
    const authUrlGuardIdx = block.indexOf("if (!r.ok || !d.authUrl)");
    const markerSetIdx = block.indexOf("sessionStorage.setItem(OAUTH_PENDING_KEY");
    const redirectIdx = block.indexOf("window.location.href = d.authUrl");
    expect(authUrlGuardIdx).toBeGreaterThan(-1);
    expect(markerSetIdx).toBeGreaterThan(authUrlGuardIdx); // only set once we know we're about to redirect
    expect(markerSetIdx).toBeLessThan(redirectIdx); // set BEFORE navigating away
  });

  it("enter(): consumes the marker only inside the confirmed-session callback, gated by a one-shot ref (no duplicate fires)", () => {
    const src = read("src/app/login/page.tsx");
    const enterBlockStart = src.indexOf("const enter = (accessToken: string)");
    const enterBlockEnd = src.indexOf("sb.auth.getSession()", enterBlockStart);
    const block = src.slice(enterBlockStart, enterBlockEnd);
    expect(block).toContain("oauthTrackedRef.current");
    expect(block).toContain("sessionStorage.getItem(OAUTH_PENDING_KEY)");
    expect(block).toContain("sessionStorage.removeItem(OAUTH_PENDING_KEY)");
    const oneShotGuardIdx = block.indexOf("if (!oauthTrackedRef.current)");
    const trackIdx = block.indexOf('trackEvent({ name: "login", params: { method: "oauth" } })');
    const markerConsumeIdx = block.indexOf("oauthTrackedRef.current = true");
    expect(oneShotGuardIdx).toBeGreaterThan(-1);
    expect(markerConsumeIdx).toBeGreaterThan(oneShotGuardIdx);
    expect(trackIdx).toBeGreaterThan(markerConsumeIdx);
  });

  // 2026-07-14 Codex review round 2: hadHashToken alone is NOT a valid OAuth signal — email
  // confirmation and password-recovery callbacks also return via #access_token=..., so the
  // marker must be the SOLE classification truth source.
  it("(a) the oauth-tracking condition inside enter() checks ONLY oauthPending — hadHashToken is never OR'd in", () => {
    const src = read("src/app/login/page.tsx");
    const enterBlockStart = src.indexOf("const enter = (accessToken: string)");
    const enterBlockEnd = src.indexOf("sb.auth.getSession()", enterBlockStart);
    const block = src.slice(enterBlockStart, enterBlockEnd);
    expect(block).toContain("if (oauthPending)");
    expect(block).not.toContain("hadHashToken || oauthPending");
    expect(block).not.toContain("oauthPending || hadHashToken");
  });

  it("(b) marker present + confirmed session tracks oauth login exactly once (already covered by the one-shot-ref test above; re-asserted for locality)", () => {
    const src = read("src/app/login/page.tsx");
    const enterBlockStart = src.indexOf("const enter = (accessToken: string)");
    const enterBlockEnd = src.indexOf("sb.auth.getSession()", enterBlockStart);
    const block = src.slice(enterBlockStart, enterBlockEnd);
    const guardIdx = block.indexOf("if (oauthPending)");
    const trackIdx = block.indexOf('trackEvent({ name: "login", params: { method: "oauth" } })');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(trackIdx).toBeGreaterThan(guardIdx);
    expect(trackIdx - guardIdx).toBeLessThan(200); // same guarded block, not a distant unconditional call
  });

  it("(c) the email sign-in/sign-up path clears any stale marker BEFORE calling signUp/signInWithPassword", () => {
    const src = read("src/app/login/page.tsx");
    const submitStart = src.indexOf("const submit = async ()");
    const submitEnd = src.indexOf("const resend = async", submitStart);
    const block = src.slice(submitStart, submitEnd);
    const clearIdx = block.indexOf("sessionStorage.removeItem(OAUTH_PENDING_KEY)");
    const signUpIdx = block.indexOf("await sb.auth.signUp(");
    const signInIdx = block.indexOf("await sb.auth.signInWithPassword(");
    expect(clearIdx).toBeGreaterThan(-1);
    expect(clearIdx).toBeLessThan(signUpIdx);
    expect(clearIdx).toBeLessThan(signInIdx);
  });

  it("(d) an OAuth callback error (error=/error_code= in hash or query) clears the marker before enter() could ever consume it", () => {
    const src = read("src/app/login/page.tsx");
    const effectStart = src.indexOf("const sb = createBrowserSupabase();", src.indexOf("useEffect(() => {\n    // supabase env"));
    const enterStart = src.indexOf("const enter = (accessToken: string)");
    const block = src.slice(effectStart, enterStart);
    expect(block).toContain("isOAuthCallbackError");
    expect(block).toMatch(/error=/);
    expect(block).toMatch(/error_code=/);
    const errorCheckIdx = block.indexOf("isOAuthCallbackError =");
    const clearIdx = block.indexOf("sessionStorage.removeItem(OAUTH_PENDING_KEY)");
    expect(errorCheckIdx).toBeGreaterThan(-1);
    expect(clearIdx).toBeGreaterThan(errorCheckIdx); // clear happens after computing the error flag
    expect(clearIdx).toBeLessThan(enterStart - effectStart); // and strictly before enter() is defined/called
  });

  it("the pending marker key is a plain non-PII literal, not derived from email/user data", () => {
    const src = read("src/app/login/page.tsx");
    const keyDeclIdx = src.indexOf('const OAUTH_PENDING_KEY = "osmu_oauth_pending"');
    expect(keyDeclIdx).toBeGreaterThan(-1);
  });
});
