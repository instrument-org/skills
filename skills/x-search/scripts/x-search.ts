/**
 * Search X/Twitter posts and profiles via the OpenRouter xAI web plugin
 * @note Requires OPENROUTER_API_KEY and OPENROUTER_BASE_URL env vars set in your .env file or shell environment.
 * @note Use a 60s+ timeout when calling due to latency of the API.
 * @note Results are capped per query (~20-50 posts). For more, follow up with "show me more posts before [date]".
 * @note Grok resolves handle migrations automatically -- pass the known handle and it will surface the active account.
 * @note --handles and --exclude-handles are mutually exclusive. If both are passed the filter is silently dropped by the API.
 */
import { pathToFileURL } from "node:url";
import { cac } from "cac";

export type XSearchFilter = {
  allowedHandles?: string[];
  enableImageUnderstanding?: boolean;
  enableVideoUnderstanding?: boolean;
  excludedHandles?: string[];
  fromDate?: string;
  toDate?: string;
};

export type XSearchOptions = {
  filter?: XSearchFilter;
  model?: string;
  prompt: string;
};

export type XSearchResult = {
  content: string;
  model: string;
};

function getEnv() {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  const baseUrl = process.env["OPENROUTER_BASE_URL"];

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env file or shell environment.",
    );
  }
  if (!baseUrl) {
    throw new Error(
      "OPENROUTER_BASE_URL is not set. Add it to your .env file or shell environment.",
    );
  }

  return { apiKey, baseUrl };
}

export async function xSearch({
  filter,
  model = "x-ai/grok-4.1-fast",
  prompt,
}: XSearchOptions): Promise<XSearchResult> {
  const { apiKey, baseUrl } = getEnv();

  const xSearchFilter =
    filter && Object.values(filter).some((v) => v !== undefined)
      ? {
          ...(filter.fromDate && { from_date: filter.fromDate }),
          ...(filter.toDate && { to_date: filter.toDate }),
          ...(filter.allowedHandles && {
            allowed_x_handles: filter.allowedHandles,
          }),
          ...(filter.excludedHandles && {
            excluded_x_handles: filter.excludedHandles,
          }),
          ...(filter.enableImageUnderstanding && {
            enable_image_understanding: true,
          }),
          ...(filter.enableVideoUnderstanding && {
            enable_video_understanding: true,
          }),
        }
      : undefined;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    body: JSON.stringify({
      messages: [{ content: prompt, role: "user" }],
      model,
      plugins: [{ id: "web" }],
      ...(xSearchFilter && { x_search_filter: xSearchFilter }),
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    model: string;
  };

  const content = data.choices[0]?.message.content;
  if (!content) {
    throw new Error("No content in response");
  }

  return { content, model: data.model };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cli = cac("x-search");
  cli.usage("<prompt> [options]");

  cli.option("--model <id>", "Model to use", { default: "x-ai/grok-4.1-fast" });
  cli.option("--from-date <date>", "Filter posts from this ISO 8601 date");
  cli.option("--to-date <date>", "Filter posts up to this ISO 8601 date");
  cli.option(
    "--handles <handles>",
    "Comma-separated list of handles to include (max 10)",
  );
  cli.option(
    "--exclude-handles <handles>",
    "Comma-separated list of handles to exclude (max 10)",
  );
  cli.option("--images", "Enable image understanding in posts");
  cli.option("--videos", "Enable video understanding in posts");
  cli.help();

  const { args, options } = cli.parse();
  if (options.help) process.exit(0);

  const handles = options.handles as string | undefined;
  const prompt =
    args[0] ??
    (handles ? `What has @${handles.split(",")[0]} posted recently?` : "");

  if (!prompt) {
    cli.outputHelp();
    process.exit(1);
  }

  const result = await xSearch({
    filter: {
      ...(options.fromDate && { fromDate: options.fromDate as string }),
      ...(options.toDate && { toDate: options.toDate as string }),
      ...(handles && { allowedHandles: handles.split(",") }),
      ...(options.excludeHandles && {
        excludedHandles: (options.excludeHandles as string).split(","),
      }),
      ...(options.images && { enableImageUnderstanding: true }),
      ...(options.videos && { enableVideoUnderstanding: true }),
    },
    model: options.model as string,
    prompt,
  });

  console.log(result.content);
}
