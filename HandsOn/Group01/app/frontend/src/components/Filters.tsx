import { useState } from "react";
import { DEFAULT_FILTERS, SEVERITIES, SEVERITY_COLORS } from "../data";
import type { AccidentFilters, DatasetMetadata } from "../types";

export function Filters({
  metadata,
  busy,
  onApply,
}: {
  metadata: DatasetMetadata | null;
  busy: boolean;
  onApply: (filters: AccidentFilters) => void;
}) {
  const [draft, setDraft] = useState<AccidentFilters>(DEFAULT_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const min = metadata?.start_time?.slice(0, 10);
  const max = metadata?.end_time?.slice(0, 10);

  return (
    <form
      className="filter-panel"
      aria-label="Accident filters"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.severities.length) {
          setError("Select at least one severity level.");
          return;
        }
        if (
          draft.start_date &&
          draft.end_date &&
          draft.start_date > draft.end_date
        ) {
          setError("Start date must be on or before end date.");
          return;
        }
        setError(null);
        onApply({ ...draft, street: draft.street.trim() });
      }}
    >
      <fieldset className="severity-options">
        <legend className="filter-label">Severity levels</legend>
        {SEVERITIES.map((level) => (
          <label key={level} className="severity-option">
            <input
              type="checkbox"
              checked={draft.severities.includes(level)}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  severities: event.target.checked
                    ? [...draft.severities, level].sort()
                    : draft.severities.filter((value) => value !== level),
                })
              }
            />
            <span
              className="severity-dot"
              style={{ background: SEVERITY_COLORS[level] }}
            />
            Severity {level}
          </label>
        ))}
      </fieldset>
      <div>
        <label className="filter-label" htmlFor="start-date">
          Start date
        </label>
        <input
          className="filter-input"
          id="start-date"
          type="date"
          min={min}
          max={max}
          value={draft.start_date}
          onChange={(event) =>
            setDraft({ ...draft, start_date: event.target.value })
          }
        />
      </div>
      <div>
        <label className="filter-label" htmlFor="end-date">
          End date (inclusive)
        </label>
        <input
          className="filter-input"
          id="end-date"
          type="date"
          min={min}
          max={max}
          value={draft.end_date}
          onChange={(event) =>
            setDraft({ ...draft, end_date: event.target.value })
          }
        />
      </div>
      <div>
        <label className="filter-label" htmlFor="street-search">
          Street name
        </label>
        <input
          className="filter-input"
          id="street-search"
          type="search"
          maxLength={120}
          placeholder="e.g. Broadway or FDR"
          value={draft.street}
          onChange={(event) =>
            setDraft({ ...draft, street: event.target.value })
          }
        />
      </div>
      <div className="filter-actions">
        <button className="primary-button" disabled={busy} type="submit">
          Apply filters
        </button>
        <button
          className="secondary-button"
          disabled={busy}
          type="button"
          onClick={() => {
            setDraft(DEFAULT_FILTERS);
            setError(null);
            onApply({ ...DEFAULT_FILTERS });
          }}
        >
          Reset filters
        </button>
      </div>
      <p className="filter-help">
        Dates use local dataset time. Street search matches partial names,
        ignoring case. Changes take effect when applied.
      </p>
      {error && (
        <p role="alert" className="filter-error">
          {error}
        </p>
      )}
    </form>
  );
}
