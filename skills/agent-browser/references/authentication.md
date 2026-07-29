# Authentication in Instrument

Instrument reuses one browser target for commands in the current task and agent session. The target keeps its page, navigation history, and `sessionStorage` while it remains live. Cookies, `localStorage`, IndexedDB, and service workers use the workspace's persistent browser profile. Upstream auth vault, named session, and lifecycle commands are unavailable in the managed browser.

When the task needs the user's existing logged-in session rather than a fresh login, an external browser can reuse it: `--profile <name>` (list names with `profiles`) launches a debuggable copy of their Chrome profile with its logins; see the External browsers section in `SKILL.md`. Confirm scope with the user before mutating anything in their logged-in sessions.

## User-assisted login

Do not request passwords, one-time codes, tokens, or recovery codes in chat and do not pass them through shell commands. Open the real login page, let the user enter secrets in the visible browser, then continue after the authenticated state appears.

```bash
agent-browser open https://app.example.com/login
agent-browser wait --load networkidle
agent-browser snapshot -i
```

Tell the user what step is waiting in the browser. After they complete it, verify the result instead of assuming login succeeded:

```bash
agent-browser wait --url "https://app.example.com/dashboard**" --timeout 120000
agent-browser get url
agent-browser read
```

If the application does not change URL, wait for authenticated copy or a stable control and verify it with text or element state.

## OAuth, SSO, CAPTCHA, and two-factor flows

OAuth redirects work when they stay in the same managed target. Popup-based OAuth and SSO flows are unavailable because the browser denies new windows and does not expose tabs. If the site offers a same-window sign-in path, use that. Otherwise report the limitation instead of trying `tab`, `window new`, or `click --new-tab`.

Let the user complete provider consent, CAPTCHA, security-key, passkey, and two-factor steps in the visible browser. Do not automate a challenge whose purpose is human or device verification.

After the user finishes, wait for the application origin or authenticated UI, then take a fresh snapshot because refs from before the redirect are stale.

```bash
agent-browser wait --url "https://app.example.com/**" --timeout 120000
agent-browser snapshot -i
agent-browser read
```

## Reuse and expiry

The current task and agent session reuse its managed browser target across commands. Durable site data can also remain in the workspace browser profile when a target is recreated. Open a protected page directly and check whether the site redirects to login:

```bash
agent-browser open https://app.example.com/dashboard
agent-browser wait --load networkidle
agent-browser get url
```

If the session expired, repeat the user-assisted login. To sign out, use the site's own sign-out control. Use `agent-browser cookies clear` only when the task explicitly requires clearing browser cookies; it can sign the user out of unrelated sites in the same workspace browser profile.

## Security rules

- Never write browser state, cookies, tokens, or credentials into task files.
- Never echo secrets or include them in `fill`, `type`, `eval`, cookie, header, or HTTP-auth command arguments.
- Verify the site origin before asking the user to enter credentials.
- Stop and ask the user when a consent or security step is ambiguous.
- Treat authenticated downloads and mutations as external actions requiring the same authorization as any other browser action.
