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

{{GENERATED_SCRIPT_DOCS}}
