import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import {
  DEFAULT_FILTERS,
  formatStartTime,
  MAX_LOADED,
  mergeAccidents,
  PAGE_SIZE,
} from "./data";
import { useAccidents } from "./hooks/useAccidents";
import type {
  Accident,
  AccidentDetail,
  DatasetMetadata,
  HotspotResult,
  MapMode,
} from "./types";

// Isolate Leaflet's DOM/tiles; live marker placement is verified in the browser.
vi.mock("./components/AccidentMap", () => ({
  default: ({
    accidents,
    onSelect,
    mode,
    hotspots,
  }: {
    accidents: Accident[];
    onSelect: (record: Accident) => void;
    mode: MapMode;
    hotspots: HotspotResult | null;
  }) =>
    mode === "hotspots" ? (
      <div aria-label="Test concentration map">
        {hotspots?.total} accidents in grid
      </div>
    ) : (
      <div aria-label="Test map">
        {accidents.map((row) => (
          <button key={row.uri} onClick={() => onSelect(row)}>
            Select {row.id}
          </button>
        ))}
      </div>
    ),
}));

const fixture: Accident = {
  id: "test-accident",
  uri: "http://example.test/accidents/test-accident",
  latitude: 40.77,
  longitude: -73.95,
  severity: 2,
  start_time: "2021-06-16T01:10:39",
  street_name: null,
};

const metadata: DatasetMetadata = {
  start_time: "2016-03-24T09:56:12",
  end_time: "2023-03-31T14:08:16",
  south: 40.69,
  north: 40.88,
  west: -74.03,
  east: -73.91,
};
const detail: AccidentDetail = {
  ...fixture,
  end_time: null,
  description: null,
  has_traffic_signal: false,
  street_uri: null,
  street_wikidata_uri: null,
  city: null,
  state: null,
  country: null,
};

beforeEach(() => {
  vi.spyOn(api, "health").mockResolvedValue({
    status: "ok",
    graphdb: "reachable",
  });
  vi.spyOn(api, "dataset").mockResolvedValue(metadata);
  vi.spyOn(api, "detail").mockResolvedValue(detail);
  vi.spyOn(api, "hotspots").mockResolvedValue({
    cell_size_degrees: 0.005,
    cells: [
      { south: 40.75, north: 40.755, west: -73.955, east: -73.95, count: 1 },
    ],
    total: 1,
    max_count: 1,
  });
  vi.spyOn(api, "severity").mockResolvedValue([{ severity: 2, count: 1 }]);
  vi.spyOn(api, "accidents").mockResolvedValue({
    items: [fixture],
    limit: PAGE_SIZE,
    offset: 0,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("dashboard states", () => {
  it("shows loading feedback before any data resolves", () => {
    vi.mocked(api.health).mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(
      screen.getByText("Requesting accident records from GraphDB."),
    ).toBeTruthy();
    expect(screen.queryByText("Unknown street")).toBeNull();
  });

  it("renders API records and real details with a missing-street fallback", async () => {
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Select test-accident" }),
    );
    expect(await screen.findByText(fixture.uri)).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Details for test-accident" })
        .textContent,
    ).toContain("Unknown street");
    expect(screen.getByText("40.77")).toBeTruthy();
    expect(screen.getByText("2021-06-16 01:10:39")).toBeTruthy();
    expect(screen.getByText("1 of 1 accidents loaded")).toBeTruthy();
  });

  it("shows connection errors and retries without fabricated data", async () => {
    vi.mocked(api.health).mockRejectedValueOnce(
      new Error("Cannot connect to GraphDB."),
    );
    render(<App />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Cannot connect to GraphDB.",
    );
    expect(
      screen.queryByRole("button", { name: "Select test-accident" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByRole("button", { name: "Select test-accident" }),
    ).toBeTruthy();
  });

  it("renders an honest empty state", async () => {
    vi.mocked(api.severity).mockResolvedValue([]);
    vi.mocked(api.accidents).mockResolvedValue({
      items: [],
      limit: PAGE_SIZE,
      offset: 0,
    });
    render(<App />);
    expect(await screen.findByText("No accidents to display")).toBeTruthy();
    expect(screen.getByText("0 of 0 accidents loaded")).toBeTruthy();
  });
});

describe("progressive loading", () => {
  function fullPage(offset: number) {
    return {
      items: Array.from({ length: PAGE_SIZE }, (_, index) => ({
        ...fixture,
        id: `test-${offset + index}`,
        uri: `http://example.test/${offset + index}`,
      })),
      limit: PAGE_SIZE,
      offset,
    };
  }

  it("requests deterministic pages, keeps loaded points on failure, and retries the same offset", async () => {
    vi.mocked(api.severity).mockResolvedValue([{ severity: 2, count: 1500 }]);
    vi.mocked(api.accidents)
      .mockResolvedValueOnce(fullPage(0))
      .mockRejectedValueOnce(new Error("GraphDB timed out."))
      .mockResolvedValueOnce(fullPage(500));
    const { result } = renderHook(() => useAccidents());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(500);
    expect(result.current.error).toBe("GraphDB timed out.");
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(1000);
    expect(api.accidents).toHaveBeenNthCalledWith(
      2,
      500,
      500,
      expect.any(AbortSignal),
      DEFAULT_FILTERS,
    );
    expect(api.accidents).toHaveBeenNthCalledWith(
      3,
      500,
      500,
      expect.any(AbortSignal),
      DEFAULT_FILTERS,
    );
  });

  it("caps loading and never requests the whole dataset automatically", async () => {
    vi.mocked(api.severity).mockResolvedValue([{ severity: 2, count: 21699 }]);
    vi.mocked(api.accidents).mockImplementation(async (_limit, offset) =>
      fullPage(offset),
    );
    const { result } = renderHook(() => useAccidents());
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(api.accidents).toHaveBeenCalledTimes(1);
    for (let loaded = PAGE_SIZE; loaded < MAX_LOADED; loaded += PAGE_SIZE) {
      await act(async () => {
        await result.current.loadMore();
      });
    }
    expect(result.current.items).toHaveLength(MAX_LOADED);
    expect(result.current.capped).toBe(true);
    await act(async () => {
      await result.current.loadMore();
    });
    expect(api.accidents).toHaveBeenCalledTimes(MAX_LOADED / PAGE_SIZE);
  });

  it("prevents duplicate concurrent page requests", async () => {
    vi.mocked(api.severity).mockResolvedValue([{ severity: 2, count: 1500 }]);
    vi.mocked(api.accidents).mockResolvedValue(fullPage(0));
    const { result } = renderHook(() => useAccidents());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });
    expect(api.accidents).toHaveBeenCalledTimes(2);
  });

  it("resets pagination when filters change and passes them to both API calls", async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useAccidents(filters),
      { initialProps: { filters: DEFAULT_FILTERS } },
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    const next = {
      ...DEFAULT_FILTERS,
      severities: [1 as const],
      street: "Broad",
      start_date: "2021-01-01",
      end_date: "2021-12-31",
    };
    rerender({ filters: next });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(api.accidents).toHaveBeenLastCalledWith(
      500,
      0,
      expect.any(AbortSignal),
      next,
    );
    expect(api.severity).toHaveBeenLastCalledWith(
      expect.any(AbortSignal),
      next,
    );
  });

  it("cancels a pending page and ignores its result after filters change", async () => {
    vi.mocked(api.severity).mockResolvedValue([{ severity: 2, count: 1500 }]);
    vi.mocked(api.accidents).mockResolvedValueOnce(fullPage(0));
    const { result, rerender } = renderHook(
      ({ filters }) => useAccidents(filters),
      { initialProps: { filters: DEFAULT_FILTERS } },
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    let resolveOld: (page: ReturnType<typeof fullPage>) => void = () => {};
    vi.mocked(api.accidents).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    let pending: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });
    const oldSignal = vi.mocked(api.accidents).mock.calls[1][2];
    vi.mocked(api.accidents).mockResolvedValueOnce({
      items: [fixture],
      limit: PAGE_SIZE,
      offset: 0,
    });
    rerender({ filters: { ...DEFAULT_FILTERS, street: "Broad" } });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => {
      resolveOld(fullPage(500));
      await pending;
    });
    expect(result.current.items).toHaveLength(1);
  });
});

describe("filters and full details", () => {
  it("uses RDF calendar limits and applies all selected controls together", async () => {
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    expect(screen.getByLabelText("Start date").getAttribute("min")).toBe(
      "2016-03-24",
    );
    expect(
      screen.getByLabelText("End date (inclusive)").getAttribute("max"),
    ).toBe("2023-03-31");
    fireEvent.click(screen.getByLabelText("Severity 2"));
    fireEvent.click(screen.getByLabelText("Severity 4"));
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2021-01-01" },
    });
    fireEvent.change(screen.getByLabelText("End date (inclusive)"), {
      target: { value: "2021-12-31" },
    });
    fireEvent.change(screen.getByLabelText("Street name"), {
      target: { value: "Broad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(api.accidents).toHaveBeenLastCalledWith(
        500,
        0,
        expect.any(AbortSignal),
        {
          severities: [1, 3],
          start_date: "2021-01-01",
          end_date: "2021-12-31",
          street: "Broad",
        },
      ),
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Reset filters" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    await waitFor(() =>
      expect(api.accidents).toHaveBeenLastCalledWith(
        500,
        0,
        expect.any(AbortSignal),
        DEFAULT_FILTERS,
      ),
    );
  });

  it("requires a severity selection and rejects reversed dates", async () => {
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    for (const level of [1, 2, 3, 4])
      fireEvent.click(screen.getByLabelText(`Severity ${level}`));
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Select at least one",
    );
    fireEvent.click(screen.getByLabelText("Severity 1"));
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2022-01-02" },
    });
    fireEvent.change(screen.getByLabelText("End date (inclusive)"), {
      target: { value: "2022-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Start date must be",
    );
  });

  it("retrieves details by ID and shows a Wikidata link only when provided", async () => {
    vi.mocked(api.detail).mockResolvedValue({
      ...detail,
      street_uri: "http://example.test/local-road",
      street_wikidata_uri: "http://www.wikidata.org/entity/Q11260",
      description: "From GraphDB",
      has_traffic_signal: true,
    });
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Select test-accident" }),
    );
    const link = await screen.findByRole("link", {
      name: "View on Wikidata ↗",
    });
    expect(link.getAttribute("href")).toBe(
      "http://www.wikidata.org/entity/Q11260",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(screen.getByText("From GraphDB")).toBeTruthy();
    expect(screen.getByText("http://example.test/local-road")).toBeTruthy();
    expect(api.detail).toHaveBeenCalledWith(
      fixture.id,
      expect.any(AbortSignal),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Close accident details" }),
    );
    expect(
      screen.queryByRole("link", { name: "View on Wikidata ↗" }),
    ).toBeNull();
  });

  it("hides absent Wikidata and handles a failed detail lookup independently", async () => {
    vi.mocked(api.detail).mockRejectedValueOnce(
      new Error("Accident not found."),
    );
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Select test-accident" }),
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Accident not found.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry details" }));
    await screen.findByText(fixture.uri);
    expect(
      screen.queryByRole("link", { name: "View on Wikidata ↗" }),
    ).toBeNull();
    expect(screen.getByText("No description available.")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });
});

it("deduplicates by RDF identity and preserves recorded time", () => {
  expect(
    mergeAccidents([fixture], [{ ...fixture, street_name: "Updated label" }]),
  ).toHaveLength(1);
  expect(formatStartTime(fixture.start_time)).toBe("2021-06-16 01:10:39");
});

describe("complete-population concentration view", () => {
  it("loads the full grid on demand, clears selection and reuses both layers", async () => {
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Select test-accident" }),
    );
    await screen.findByText(fixture.uri);
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    expect(
      await screen.findByText("All 1 matching accidents represented"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: "Details for test-accident" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Load 500 more" })).toBeNull();
    expect(api.hotspots).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Accident markers" }));
    await screen.findByText("1 of 1 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    await screen.findByText("All 1 matching accidents represented");
    expect(api.accidents).toHaveBeenCalledTimes(1);
    expect(api.hotspots).toHaveBeenCalledTimes(1);
    expect(api.severity).toHaveBeenCalledTimes(1);
    expect(api.dataset).toHaveBeenCalledTimes(1);
  });

  it("does not fetch a marker page when filtering in concentration mode", async () => {
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    await screen.findByText("All 1 matching accidents represented");
    fireEvent.change(screen.getByLabelText("Street name"), {
      target: { value: "Broad" },
    });
    expect(api.hotspots).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(api.hotspots).toHaveBeenCalledTimes(2));
    await screen.findByText("All 1 matching accidents represented");
    expect(api.hotspots).toHaveBeenLastCalledWith(expect.any(AbortSignal), {
      ...DEFAULT_FILTERS,
      street: "Broad",
    });
    expect(api.accidents).toHaveBeenCalledTimes(1);
    expect(api.dataset).toHaveBeenCalledTimes(1);
  });

  it("rejects inconsistent totals instead of claiming a partial grid is complete", async () => {
    vi.mocked(api.hotspots).mockResolvedValue({
      cell_size_degrees: 0.005,
      cells: [],
      total: 999,
      max_count: 0,
    });
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "counts changed",
    );
    expect(screen.queryByLabelText("Test concentration map")).toBeNull();
  });

  it("reports a GraphDB grid failure and can return to cached markers", async () => {
    vi.mocked(api.hotspots).mockRejectedValue(
      new Error("Cannot connect to GraphDB."),
    );
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Cannot connect to GraphDB.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Accident markers" }));
    expect(await screen.findByText("1 of 1 accidents loaded")).toBeTruthy();
  });

  it("cancels an obsolete grid request when filters change", async () => {
    let resolveOld: (grid: HotspotResult) => void = () => {};
    vi.mocked(api.hotspots).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    const { result, rerender } = renderHook(
      ({ filters, mode }) => useAccidents(filters, mode),
      {
        initialProps: { filters: DEFAULT_FILTERS, mode: "hotspots" as MapMode },
      },
    );
    await waitFor(() => expect(api.hotspots).toHaveBeenCalledTimes(1));
    const oldSignal = vi.mocked(api.hotspots).mock.calls[0][0];
    rerender({
      filters: { ...DEFAULT_FILTERS, street: "new" },
      mode: "hotspots",
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => {
      resolveOld({
        cell_size_degrees: 0.005,
        cells: [],
        total: 200,
        max_count: 200,
      });
    });
    expect(result.current.hotspots?.total).toBe(1);
    expect(result.current.error).toBeNull();
    expect(api.accidents).not.toHaveBeenCalled();
  });

  it("does not repeat requests for unchanged filters or each street keystroke", async () => {
    render(<App />);
    await screen.findByText("1 of 1 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    fireEvent.change(screen.getByLabelText("Street name"), {
      target: { value: "B" },
    });
    fireEvent.change(screen.getByLabelText("Street name"), {
      target: { value: "Br" },
    });
    expect(api.accidents).toHaveBeenCalledTimes(1);
    expect(api.severity).toHaveBeenCalledTimes(1);
  });

  it("shows an empty concentration state without inventing cells", async () => {
    vi.mocked(api.severity).mockResolvedValue([]);
    vi.mocked(api.accidents).mockResolvedValue({
      items: [],
      limit: PAGE_SIZE,
      offset: 0,
    });
    vi.mocked(api.hotspots).mockResolvedValue({
      cell_size_degrees: 0.005,
      cells: [],
      total: 0,
      max_count: 0,
    });
    render(<App />);
    await screen.findByText("0 of 0 accidents loaded");
    fireEvent.click(screen.getByRole("button", { name: "Concentration grid" }));
    expect(
      await screen.findByText("All 0 matching accidents represented"),
    ).toBeTruthy();
    expect(screen.getByText("No accidents to display")).toBeTruthy();
    expect(screen.queryByLabelText("Test concentration map")).toBeNull();
  });
});
