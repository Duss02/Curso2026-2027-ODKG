import { useEffect, useState } from "react";
import { api } from "../api";
import { formatStartTime, SEVERITY_COLORS } from "../data";
import type { AccidentDetail } from "../types";
import { Icon } from "./Icon";

export function AccidentDetails({
  accidentId,
  onClose,
}: {
  accidentId: string;
  onClose: () => void;
}) {
  const [accident, setAccident] = useState<AccidentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setAccident(null);
    setError(null);
    api
      .detail(accidentId, abort.signal)
      .then((row) => {
        if (!abort.signal.aborted) setAccident(row);
      })
      .catch((cause: unknown) => {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to retrieve accident details.",
          );
      });
    return () => abort.abort();
  }, [accidentId, revision]);

  const wikidata = accident?.street_wikidata_uri;
  const safeWikidata =
    wikidata &&
    /^https?:\/\/www\.wikidata\.org\/entity\/Q[1-9][0-9]*$/.test(wikidata)
      ? wikidata
      : null;

  return (
    <section
      aria-label={`Details for ${accidentId}`}
      className="accident-details"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Accident details</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close accident details"
        >
          <Icon name="close" />
        </button>
      </div>
      {error ? (
        <div role="alert" className="mt-5 text-sm text-rose-800">
          <p>{error}</p>
          <button
            className="secondary-button mt-4"
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry details
          </button>
        </div>
      ) : !accident || accident.id !== accidentId ? (
        <p role="status" className="mt-5 flex items-center gap-3 text-sm">
          <span className="spinner" />
          Loading accident details…
        </p>
      ) : (
        <>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            {accident.street_name?.trim() || "Unknown street"}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{accident.id}</p>
          <dl className="detail-list">
            <div>
              <dt>Severity</dt>
              <dd className="flex items-center gap-2">
                <span
                  className="severity-dot"
                  style={{ background: SEVERITY_COLORS[accident.severity] }}
                />
                Level {accident.severity}
              </dd>
            </div>
            <div>
              <dt>Start time</dt>
              <dd>{formatStartTime(accident.start_time)}</dd>
            </div>
            <div>
              <dt>End time</dt>
              <dd>
                {accident.end_time
                  ? formatStartTime(accident.end_time)
                  : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Latitude</dt>
              <dd>{accident.latitude}</dd>
            </div>
            <div>
              <dt>Longitude</dt>
              <dd>{accident.longitude}</dd>
            </div>
            <div>
              <dt>Traffic signal</dt>
              <dd>
                {accident.has_traffic_signal === null
                  ? "Not recorded"
                  : accident.has_traffic_signal
                    ? "Yes"
                    : "No"}
              </dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>{accident.city || "Not recorded"}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{accident.state || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{accident.country || "Not recorded"}</dd>
            </div>
          </dl>
          <p className="eyebrow mb-2">Description</p>
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {accident.description || "No description available."}
          </p>
          {safeWikidata && (
            <a
              className="wikidata-link"
              href={safeWikidata}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Wikidata ↗
            </a>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            Time shown as recorded in the dataset, without timezone conversion.
          </p>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="eyebrow mb-2">RDF resource URI</p>
            <code className="block break-all text-xs leading-relaxed text-teal-800">
              {accident.uri}
            </code>
            {accident.street_uri && (
              <>
                <p className="eyebrow mb-2 mt-4">Local street URI</p>
                <code className="block break-all text-xs leading-relaxed text-teal-800">
                  {accident.street_uri}
                </code>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
