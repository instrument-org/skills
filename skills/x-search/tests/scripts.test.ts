import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { xSearch } from "../scripts/x-search.ts";

const MOCK_ENV = {
  OPENROUTER_API_KEY: "test-key",
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
};

const MOCK_RESPONSE = {
  choices: [{ message: { content: "Here are posts about @handle..." } }],
  model: "x-ai/grok-4.1-fast",
};

function mockFetchOk(body = MOCK_RESPONSE) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve(body),
      ok: true,
    }),
  );
}

function mockFetchError(status: number, text: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      text: () => Promise.resolve(text),
    }),
  );
}

beforeEach(() => {
  process.env["OPENROUTER_API_KEY"] = MOCK_ENV.OPENROUTER_API_KEY;
  process.env["OPENROUTER_BASE_URL"] = MOCK_ENV.OPENROUTER_BASE_URL;
});

afterEach(() => {
  delete process.env["OPENROUTER_API_KEY"];
  delete process.env["OPENROUTER_BASE_URL"];
  vi.restoreAllMocks();
});

describe("xSearch", () => {
  it("returns content from a successful response", async () => {
    mockFetchOk();
    const result = await xSearch({ prompt: "Search X for posts about AI" });
    expect(result.content).toMatchInlineSnapshot(
      `"Here are posts about @handle..."`,
    );
    expect(result.model).toMatchInlineSnapshot(`"x-ai/grok-4.1-fast"`);
  });

  it("sends the correct request body", async () => {
    mockFetchOk();
    await xSearch({ prompt: "Find posts about AI" });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${MOCK_ENV.OPENROUTER_BASE_URL}/chat/completions`);
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe("x-ai/grok-4.1-fast");
    expect(body.plugins).toEqual([{ id: "web" }]);
    expect(body.messages[0].content).toBe("Find posts about AI");
    expect(body.x_search_filter).toBeUndefined();
  });

  it("uses a custom model when provided", async () => {
    mockFetchOk({ ...MOCK_RESPONSE, model: "x-ai/grok-4" });
    const result = await xSearch({
      model: "x-ai/grok-4",
      prompt: "Find posts",
    });
    expect(result.model).toBe("x-ai/grok-4");
  });

  it("includes x_search_filter when filter options are provided", async () => {
    mockFetchOk();
    await xSearch({
      filter: { fromDate: "2025-01-01", toDate: "2026-01-01" },
      prompt: "Recent AI posts",
    });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1]?.body as string) ?? "",
    );
    expect(body.x_search_filter).toEqual({
      from_date: "2025-01-01",
      to_date: "2026-01-01",
    });
  });

  it("includes allowed_x_handles in filter", async () => {
    mockFetchOk();
    await xSearch({
      filter: { allowedHandles: ["handle1", "handle2"] },
      prompt: "Posts from these accounts",
    });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1]?.body as string) ?? "",
    );
    expect(body.x_search_filter.allowed_x_handles).toEqual([
      "handle1",
      "handle2",
    ]);
  });

  it("omits x_search_filter when filter is empty", async () => {
    mockFetchOk();
    await xSearch({ filter: {}, prompt: "Open search" });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1]?.body as string) ?? "",
    );
    expect(body.x_search_filter).toBeUndefined();
  });

  it("throws on non-ok HTTP response", async () => {
    mockFetchError(401, "Unauthorized");
    await expect(xSearch({ prompt: "test" })).rejects.toThrow(
      "OpenRouter error 401: Unauthorized",
    );
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    delete process.env["OPENROUTER_API_KEY"];
    await expect(xSearch({ prompt: "test" })).rejects.toThrow(
      "OPENROUTER_API_KEY is not set",
    );
  });

  it("throws when OPENROUTER_BASE_URL is missing", async () => {
    delete process.env["OPENROUTER_BASE_URL"];
    await expect(xSearch({ prompt: "test" })).rejects.toThrow(
      "OPENROUTER_BASE_URL is not set",
    );
  });

  it("throws when response has no content", async () => {
    mockFetchOk({ choices: [], model: "x-ai/grok-4.1-fast" });
    await expect(xSearch({ prompt: "test" })).rejects.toThrow(
      "No content in response",
    );
  });
});
