#!/usr/bin/env bash
# gstack-based E2E smoke for the multi-tenant dashboard (customer entry flow)
# Google-only auth (owner directive 2026-07-16): email/password signup/login/reset removed.
# Flow: logout(unauth) → /login shows "Google로 계속" only → /signup redirects to /login →
#       storage-clear keeps Google-only UX (no auto-redirect into app).
# Run: bash dashboard/scripts/verify-e2e.sh [BASE_URL]
# Requires gstack browse binary in PATH or standard location.

set -euo pipefail

BASE_URL="${1:-https://openclaw.example.com}"
B=""
if command -v browse >/dev/null 2>&1; then
  B="browse"
elif [ -x "$HOME/.claude/skills/gstack/browse/dist/browse" ]; then
  B="$HOME/.claude/skills/gstack/browse/dist/browse"
elif [ -x "$(git rev-parse --show-toplevel 2>/dev/null || echo .)/.claude/skills/gstack/browse/dist/browse" ]; then
  B="$(git rev-parse --show-toplevel)/.claude/skills/gstack/browse/dist/browse"
else
  echo "ERROR: gstack browse binary not found. Install/run gstack or set path." >&2
  exit 2
fi

echo "=== gstack E2E (Google-only auth) ==="
echo "BASE: $BASE_URL"
echo "B: $B"

assert_google_only() {
  # $1 = snapshot text, $2 = label for error messages
  local snap="$1" label="$2"
  if ! echo "$snap" | grep -q 'Google로 계속'; then
    echo "   FAIL: '$label' has no 'Google로 계속' CTA"; exit 1
  fi
  echo "   OK: 'Google로 계속' CTA present on $label"
  if echo "$snap" | grep -qi 'textbox.*\(email\|이메일\)'; then
    echo "   FAIL: '$label' still exposes an email textbox (should be Google-only)"; exit 1
  fi
  if echo "$snap" | grep -q '비밀번호'; then
    echo "   FAIL: '$label' still exposes password/recovery UI (should be Google-only)"; exit 1
  fi
  echo "   OK: no email/password/recovery controls on $label"
}

echo "1) Landing (unauth state)"
"$B" goto "$BASE_URL/"
"$B" wait --networkidle || true
URL1=$("$B" url)
echo "   URL: $URL1"
"$B" snapshot -i >/dev/null
"$B" screenshot "/tmp/e2e-landing.png" || true

echo "2) /login → Google-only UX"
"$B" goto "$BASE_URL/login"
"$B" wait --networkidle || true
URL2=$("$B" url)
echo "   URL: $URL2"
if [[ "$URL2" != *"/login"* ]]; then
  echo "   FAIL: /login did not resolve to a /login URL (got $URL2)"; exit 1
fi
SNAP=$("$B" snapshot -i 2>/dev/null | cat)
assert_google_only "$SNAP" "/login"
"$B" screenshot "/tmp/e2e-login.png" || true

echo "3) /signup redirects to /login and shows Google-only UX"
"$B" goto "$BASE_URL/signup"
"$B" wait --networkidle || true
URL3=$("$B" url)
echo "   URL: $URL3"
if [[ "$URL3" != *"/login"* ]]; then
  echo "   FAIL: /signup did not redirect to /login (got $URL3)"; exit 1
fi
echo "   OK: /signup redirected to /login"
SNAP3=$("$B" snapshot -i 2>/dev/null | cat)
assert_google_only "$SNAP3" "/signup→/login"
"$B" screenshot "/tmp/e2e-signup.png" || true

echo "4) Simulate logout (clear storage) + re-visit /login"
"$B" js "localStorage.clear(); sessionStorage.clear();"
"$B" goto "$BASE_URL/login"
"$B" wait --networkidle || true
SNAP2=$("$B" snapshot -i 2>/dev/null | cat)
assert_google_only "$SNAP2" "/login (post storage-clear)"
"$B" screenshot "/tmp/e2e-logout.png" || true

echo "5) Basic console check (expect some 401 for unauth /api/me)"
ERRS=$("$B" console --errors 2>/dev/null | cat || true)
echo "   console errors (sample): $(echo "$ERRS" | head -3)"

echo "=== E2E SMOKE PASSED (Google-only core flow) ==="
echo "Screenshots: /tmp/e2e-*.png"
echo "Note: full authenticated dashboard + tenant isolation requires valid Supabase creds or operator token."
echo "RLS isolation covered by Vitest: dashboard/tests/isolation/rls.isolation.test.ts"
exit 0
