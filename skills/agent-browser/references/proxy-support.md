# Managed network and proxy boundary

By default Instrument connects `agent-browser` to an existing in-app browser context, so launch-time proxy flags do not apply to it. External local launches (`--profile`, `--executable-path`) accept `--proxy`; use that only when the task genuinely requires a different network context and the user has provided the proxy.

## What to do

- Use the managed browser for the network context it already has.
- For a corporate or system proxy, ask the user to configure the application or operating system before the browser task begins.
- Do not place proxy credentials in commands, environment variables, task files, or chat.
- Do not claim regional or isolated proxy testing from one managed session.

## Verify current connectivity

Open a user-approved diagnostic endpoint or the actual target and inspect the response:

```bash
agent-browser read https://example.com
```

If the target is unreachable, record the actual error. Do not retry with `--proxy`, `--provider`, `--profile`, or other launch flags as a connectivity fix: they never change the managed browser's network path; they route the invocation to an external browser, which is a deliberate choice, not a retry.

## Alternative HTTP retrieval

When the task only needs a public document and not browser interaction, use the web or HTTP-fetching surface available to the agent. That is separate from the managed browser and may have different network behavior. Do not use it to bypass authentication, access controls, or organizational policy.
