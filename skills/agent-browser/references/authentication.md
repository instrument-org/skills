# Authentication Patterns

Login flows, OAuth, 2FA, and authenticated browsing inside the harness.

**Related**: [SKILL.md](../SKILL.md) for quick start, [commands.md](commands.md) for the full command surface.

## Session model

Cookies, `localStorage`, `sessionStorage`, IndexedDB, and service workers persist across `agent-browser` invocations within a project. Log in once, then every subsequent command in the same project is already authenticated.

To start fresh, use `agent-browser cookies clear` and inspect/clear storage with `agent-browser storage local` / `storage session`.

## Contents

- [Basic Login Flow](#basic-login-flow)
- [OAuth / SSO Flows](#oauth--sso-flows)
- [Two-Factor Authentication](#two-factor-authentication)
- [HTTP Basic Auth](#http-basic-auth)
- [Cookie-Based Auth](#cookie-based-auth)
- [Detecting Session Expiry](#detecting-session-expiry)
- [Security Best Practices](#security-best-practices)

## Basic Login Flow

```bash
agent-browser open https://app.example.com/login
agent-browser wait --load networkidle
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Sign In"

agent-browser fill @e1 "$APP_USERNAME"
agent-browser fill @e2 "$APP_PASSWORD"
agent-browser click @e3
agent-browser wait --url "**/dashboard"

# Verify
agent-browser get url
```

Subsequent commands in this project are already authenticated — just `open` protected URLs directly.

## OAuth / SSO Flows

OAuth redirects work normally; just follow them with `wait --url` between steps:

```bash
agent-browser open https://app.example.com/auth/google

agent-browser wait --url "**/accounts.google.com**"
agent-browser snapshot -i
agent-browser fill @e1 "user@gmail.com"
agent-browser click @e2  # Next
agent-browser wait 2000
agent-browser snapshot -i
agent-browser fill @e3 "$GOOGLE_PASSWORD"
agent-browser click @e4  # Sign in

agent-browser wait --url "**/app.example.com**"
```

For consent screens that require human review, switch to headed mode (see 2FA below).

## Two-Factor Authentication

For 2FA, captcha, or any flow that requires a human, run headed and let the user complete it in the visible window:

```bash
AGENT_BROWSER_HEADED=1 agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$APP_USERNAME"
agent-browser fill @e2 "$APP_PASSWORD"
agent-browser click @e3

# Tell the user to complete 2FA in the browser window, then wait for the
# post-2FA URL. Use a generous timeout in ms.
agent-browser wait --url "**/dashboard" --timeout 120000
```

Once the wait resolves, the session is authenticated for the rest of the project.

## HTTP Basic Auth

```bash
agent-browser set credentials "$USERNAME" "$PASSWORD"
agent-browser open https://protected.example.com/api
```

## Cookie-Based Auth

If you have a session token from another source, set it directly:

```bash
agent-browser cookies set session_token "$TOKEN" --url https://app.example.com
agent-browser open https://app.example.com/dashboard
```

## Detecting Session Expiry

Check whether you got bounced to a login page:

```bash
agent-browser open https://app.example.com/dashboard
URL=$(agent-browser get url)
case "$URL" in
  *"/login"*) echo "session expired"; ;;
  *) echo "ok"; ;;
esac
```

If expired, re-run the login flow above.

## Security Best Practices

1. **Use environment variables for credentials** — never inline them.

   ```bash
   agent-browser fill @e1 "$APP_USERNAME"
   agent-browser fill @e2 "$APP_PASSWORD"
   ```

2. **Clear cookies when you're done with a sensitive task**:

   ```bash
   agent-browser cookies clear
   ```

3. **Don't echo tokens** to the agent's stdout (they end up in conversation transcripts). Prefer `cookies set` and `set credentials` over `eval`-based token injection that prints the token back.
