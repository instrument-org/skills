# Authentication in Instrument

Use the browser session that Instrument manages for the current project.
Cookies, `localStorage`, `sessionStorage`, IndexedDB, and service workers persist
across `agent-browser` commands. Upstream auth vault, named session, saved state,
connection, and lifecycle commands are unavailable in the managed browser.

## User-assisted login

Do not request passwords, one-time codes, tokens, or recovery codes in chat and
do not pass them through shell commands. Open the real login page, let the user
enter secrets in the visible browser, then continue after the authenticated
state appears.

```bash
agent-browser open https://app.example.com/login
agent-browser wait --load networkidle
agent-browser snapshot -i
```

Tell the user what step is waiting in the browser. After they complete it,
verify the result instead of assuming login succeeded:

```bash
agent-browser wait --url "**/dashboard" --timeout 120000
agent-browser get url
agent-browser read
```

If the application does not change URL, wait for authenticated copy or a stable
control and verify it with text or element state.

## OAuth, SSO, CAPTCHA, and two-factor flows

OAuth redirects work inside the same managed browser. Let the user complete
provider consent, CAPTCHA, security-key, passkey, and two-factor steps in the
visible browser. Do not automate a challenge whose purpose is human or device
verification.

After the user finishes, wait for the application origin or authenticated UI,
then take a fresh snapshot because refs from before the redirect are stale.

```bash
agent-browser wait --url "**/app.example.com/**" --timeout 120000
agent-browser snapshot -i
agent-browser read
```

## Reuse and expiry

The managed session persists for subsequent commands in the project. Open a
protected page directly and check whether the site redirects to login:

```bash
agent-browser open https://app.example.com/dashboard
agent-browser wait --load networkidle
agent-browser get url
```

If the session expired, repeat the user-assisted login. To sign out, use the
site's own sign-out control. Use `agent-browser cookies clear` only when the
task explicitly requires clearing browser cookies; it can sign the user out of
unrelated sites in the same managed project session.

## Security rules

- Never write browser state, cookies, tokens, or credentials into task files.
- Never echo secrets or include them in `fill`, `type`, `eval`, cookie, header,
  or HTTP-auth command arguments.
- Verify the site origin before asking the user to enter credentials.
- Stop and ask the user when a consent or security step is ambiguous.
- Treat authenticated downloads and mutations as external actions requiring
  the same authorization as any other browser action.
