---
name: x-search
description: Search X/Twitter posts and profiles using the OpenRouter xAI web plugin. Use when the user wants to find posts on X, look up what people are saying about a topic or handle, research someone's X activity, find people who mentioned a product, or scan for engagement on a brand or account. Activate for requests like "search X for...", "find tweets about...", "who's talking about X on Twitter", or "look up someone's X posts".
---

# X Search

Use the script in `scripts/` to search X/Twitter posts and profiles.

## Tips

- **Single-person lookup**: use `--handles <handle>` without a prompt -- it auto-generates "What has @handle posted recently?".
- **Latest posts**: omit `--from-date` entirely; Grok returns recent results by default.
- **Pagination**: follow up with "show me more posts before [date]" to get older results.

## Scripts

### `x-search.ts` Search X/Twitter posts and profiles via the OpenRouter xAI web plugin

Exports:

- `xSearch({ filter, model, prompt, }: XSearchOptions): Promise<XSearchResult>`

```text
x-search

Usage:
  $ x-search <prompt> [options]

Options:
  --model <id>                 Model to use (default: x-ai/grok-4.1-fast)
  --from-date <date>           Filter posts from this ISO 8601 date
  --to-date <date>             Filter posts up to this ISO 8601 date
  --handles <handles>          Comma-separated list of handles to include (max 10)
  --exclude-handles <handles>  Comma-separated list of handles to exclude (max 10)
  --images                     Enable image understanding in posts
  --videos                     Enable video understanding in posts
  -h, --help                   Display this message
```

> [!NOTE]
> Requires OPENROUTER_API_KEY and OPENROUTER_BASE_URL env vars set in your .env file or shell environment.
> Use a 60s+ timeout when calling due to latency of the API.
> Results are capped per query (~20-50 posts). For more, follow up with "show me more posts before [date]".
> Grok resolves handle migrations automatically -- pass the known handle and it will surface the active account.
> --handles and --exclude-handles are mutually exclusive. If both are passed the filter is silently dropped by the API.
