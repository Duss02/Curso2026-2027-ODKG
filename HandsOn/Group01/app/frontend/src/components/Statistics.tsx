import { number, SEVERITIES, SEVERITY_COLORS } from "../data";
import type { SeverityCount } from "../types";
import { Icon } from "./Icon";

export function Statistics({
  total,
  loaded,
  statistics,
  ready,
  filtered = false,
}: {
  total: number;
  loaded: number;
  statistics: SeverityCount[];
  ready: boolean;
  filtered?: boolean;
}) {
  return (
    <section aria-label="Accident statistics" className="stats-grid">
      <article className="stat-card">
        <div className="flex items-center justify-between">
          <span className="eyebrow">
            {filtered ? "Matching accidents" : "Dataset total"}
          </span>
          <Icon name="layers" className="text-teal-700" />
        </div>
        <p className="stat-number">{ready ? number(total) : "—"}</p>
        <p className="text-sm text-slate-500">
          All matching historical records
        </p>
      </article>
      <article className="stat-card">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Markers loaded</span>
          <Icon name="pin" className="text-teal-700" />
        </div>
        <p className="stat-number">
          {ready ? number(loaded) : "—"}
          <span className="ml-2 text-sm font-normal text-slate-500">
            {ready && total > 0
              ? `${((loaded / total) * 100).toFixed(1)}% of total`
              : ""}
          </span>
        </p>
        <p className="text-sm text-slate-500">Paginated marker layer</p>
      </article>
      <article className="stat-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">Severity distribution</span>
          <span className="text-xs text-slate-500">
            {filtered ? "Matching results" : "Entire dataset"}
          </span>
        </div>
        <div
          className="my-4 flex h-2 overflow-hidden rounded-full bg-slate-100"
          aria-hidden="true"
        >
          {SEVERITIES.map((level) => (
            <span
              key={level}
              style={{
                width: `${total ? ((statistics.find((row) => row.severity === level)?.count ?? 0) / total) * 100 : 0}%`,
                background: SEVERITY_COLORS[level],
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SEVERITIES.map((level) => (
            <div key={level}>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="severity-dot"
                  style={{ background: SEVERITY_COLORS[level] }}
                />
                Level {level}
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {ready
                  ? number(
                      statistics.find((row) => row.severity === level)?.count ??
                        0,
                    )
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
