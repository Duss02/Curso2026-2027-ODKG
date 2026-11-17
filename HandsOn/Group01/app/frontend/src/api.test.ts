import { afterEach, describe, expect, it, vi } from "vitest";
import { api, filterParams } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("API transport", () => {
  it("uses bounded explicit pagination and the configured API origin", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [], limit: 500, offset: 500 })),
      );
    vi.stubGlobal("fetch", fetcher);
    await api.accidents(500, 500);
    expect(fetcher.mock.calls[0][0]).toMatch(
      /\/api\/accidents\?limit=500&offset=500$/,
    );
    expect(fetcher.mock.calls[0][1].headers.Accept).toBe("application/json");
  });

  it("preserves a useful GraphDB failure message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: {
              code: "graphdb_unavailable",
              message: "Cannot connect to GraphDB.",
            },
          }),
          { status: 503 },
        ),
      ),
    );
    await expect(api.health()).rejects.toThrow("Cannot connect to GraphDB.");
  });

  it("explains connection failures without fallback records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(api.accidents(500, 0)).rejects.toThrow("Cannot reach the API");
  });

  it("rejects malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>error</html>")),
    );
    await expect(api.severity()).rejects.toThrow("unreadable response");
  });

  it("keeps a useful error for non-JSON upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("proxy error", { status: 502 })),
    );
    await expect(api.health()).rejects.toThrow("HTTP 502");
  });

  it("does not send invalid pagination to the backend", () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(() => api.accidents(1001, 0)).toThrow("Invalid pagination");
    expect(() => api.accidents(500, -1)).toThrow("Invalid pagination");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("encodes combined filters without losing repeated severity values", async () => {
    const filters = {
      severities: [1 as const, 3 as const],
      start_date: "2021-01-01",
      end_date: "2021-01-31",
      street: 'Broad & "Main"',
    };
    const params = filterParams(filters);
    expect(params.getAll("severity")).toEqual(["1", "3"]);
    expect(params.get("street")).toBe('Broad & "Main"');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([])));
    vi.stubGlobal("fetch", fetcher);
    await api.severity(undefined, filters);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.getAll("severity")).toEqual(["1", "3"]);
    expect(url.searchParams.get("end_date")).toBe("2021-01-31");
  });
});
