import { useMemo } from "react";

/** Simple CSS bar chart — no chart library. */
export function MetricBars({ items, maxFallback = 1 }) {
  const max = Math.max(maxFallback, ...items.map((i) => i.value || 0));
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = max === 0 ? 0 : Math.round(((item.value || 0) / max) * 100);
        return (
          <div key={item.key || item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-warm-600">{item.label}</span>
              <span className="text-sm font-bold text-warm-700">{(item.value || 0).toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-warm-100">
              <div
                className="h-full rounded-full bg-warm-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.hint ? <p className="mt-0.5 text-[11px] text-warm-400">{item.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function FunnelChart({ steps }) {
  const max = Math.max(1, ...(steps || []).map((s) => s.count || 0));
  return (
    <div className="space-y-2">
      {(steps || []).map((step, i) => {
        const pct = Math.max(8, Math.round(((step.count || 0) / max) * 100));
        return (
          <div key={step.key} className="flex flex-col items-center">
            <div
              className="flex w-full items-center justify-between rounded-lg bg-warm-700 px-4 py-2.5 text-white transition-all"
              style={{ width: `${pct}%`, minWidth: "40%" }}
            >
              <span className="text-xs font-medium opacity-90">{step.label}</span>
              <span className="text-sm font-bold">{(step.count || 0).toLocaleString()}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="my-0.5 text-warm-300">↓</div>
            )}
          </div>
        );
      })}
      <p className="pt-2 text-[11px] text-warm-400">
        Direction requests ≠ confirmed visits. These are high-intent signals, not customers.
      </p>
    </div>
  );
}

export function Sparkline({ daily, eventKey = "place_view" }) {
  const values = useMemo(
    () => (daily || []).map((d) => Number(d.counts?.[eventKey] || 0)),
    [daily, eventKey]
  );
  const max = Math.max(1, ...values);
  if (!values.length) {
    return <p className="text-sm text-warm-400">No daily data yet — events start collecting as people explore.</p>;
  }
  return (
    <div className="flex h-24 items-end gap-1">
      {values.map((v, i) => (
        <div key={daily[i]?.date || i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t bg-terracotta-400/80"
            style={{ height: `${Math.max(4, Math.round((v / max) * 100))}%` }}
            title={`${daily[i]?.date}: ${v}`}
          />
        </div>
      ))}
    </div>
  );
}

export function SourcePieList({ sources }) {
  if (!sources?.length) {
    return <p className="text-sm text-warm-400">Sources appear once profile views are tracked.</p>;
  }
  return (
    <div className="space-y-2">
      {sources.map((s) => (
        <div key={s.source} className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-warm-100">
            <div className="h-full rounded-full bg-sage-500" style={{ width: `${s.pct || 0}%` }} />
          </div>
          <span className="w-24 truncate text-xs capitalize text-warm-600">{String(s.source).replace(/_/g, " ")}</span>
          <span className="w-10 text-right text-xs font-semibold text-warm-700">{s.pct}%</span>
        </div>
      ))}
    </div>
  );
}
