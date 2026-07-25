import type { ScanReport } from "../../shared/types";

export function SignalCard({ signal, className = "" }: { signal: ScanReport["aiSignals"][number]; className?: string }) {
  const isCritical = signal.score >= 50 && signal.category !== "safeguard";
  const isSafeguard = signal.category === "safeguard";

  return (
    <article className={`signal ${className} ${isCritical ? "signal-critical" : ""} ${isSafeguard ? "signal-safeguard" : ""}`.trim()} key={signal.label}>
      <div className="signal-header">
        <div className="signal-title-group">
          <span className="signal-icon" aria-hidden="true" />
          <strong>{signal.label}</strong>
        </div>
        <span className="signal-score-badge">{signal.score}%</span>
      </div>
      <progress
        value={signal.score}
        max="100"
        aria-label={`${signal.label}: ${signal.score}%`}
        className={isCritical ? "progress-critical" : isSafeguard ? "progress-safeguard" : ""}
      />
      <p className="signal-detail">{signal.detail}</p>
      {signal.evidence && signal.evidence.length > 0 ? (
        <ul className="evidence-list">
          {signal.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
