import type { AiSuspiciousSegment } from "../../shared/types";
import { formatNumber } from "../utils/reportLabels";

interface SuspiciousSegmentsProps {
  segments: AiSuspiciousSegment[];
}

export function SuspiciousSegments({ segments }: SuspiciousSegmentsProps) {
  if (segments.length === 0) return null;

  return (
    <section className="segment-panel" aria-labelledby="segments-title">
      <div className="section-heading-row">
        <h3 id="segments-title">Підозрілі фрагменти</h3>
        <span>{segments.length} для перевірки</span>
      </div>
      <p className="section-note">Це найсильніші локальні сигнали, а не твердження про авторство всього документа.</p>
      <div className="segment-list">
        {segments.map((segment) => (
          <article className="segment-card" key={`${segment.index}-${segment.startWord}`}>
            <div>
              <strong>
                Слова {formatNumber(segment.startWord)}–{formatNumber(segment.endWord)}
              </strong>
              <span>{segment.score}%</span>
            </div>
            <blockquote>{segment.excerpt}</blockquote>
            <ul>
              {segment.evidence.map((evidence) => (
                <li key={evidence}>{evidence}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
