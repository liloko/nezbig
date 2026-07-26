import type { ScanReport } from "../../shared/types";
import { ProviderIcon } from "./ProviderIcon";
import { stripHtml } from "../utils/sanitizeHtml";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function confidenceLabel(value: "snippet" | "page"): string {
  return value === "page" ? "сторінку прочитано" : "лише уривок пошуку";
}

import type { ReactNode } from "react";

interface PlagiarismMatchesProps {
  matches: ScanReport["matches"];
  confirmedMatchCount: number;
  leadMatchCount: number;
  allSearchProvidersFailed: boolean;
  diagnosticsNode?: ReactNode;
}

export function PlagiarismMatches({
  matches,
  confirmedMatchCount,
  leadMatchCount,
  allSearchProvidersFailed,
  diagnosticsNode
}: PlagiarismMatchesProps) {
  return (
    <section className="source-panel" aria-labelledby="matches-title">
      <div className="section-heading-row">
        <h3 id="matches-title">Ймовірні джерела</h3>
        <span>{matches.length ? `${formatNumber(confirmedMatchCount)} підтвердж. · ${formatNumber(leadMatchCount)} підказ.` : "0 збігів"}</span>
      </div>
      {diagnosticsNode}
      {matches.length === 0 ? (
        <p className={`empty-state compact-empty${allSearchProvidersFailed ? " search-failed-state" : ""}`}>
          {allSearchProvidersFailed
            ? "Вебпошук не завершено: доступні індекси не відповіли. Відсутність збігів не підтверджена."
            : "Сильних збігів у відкритих вебджерелах не знайдено."}
        </p>
      ) : (
        <div className="match-list">
          {matches.map((match) => (
            <article className="match-card" key={`${match.url}-${match.chunkIndex}`}>
              <div className="match-score">
                <strong>{match.score}%</strong>
                <span>Фрагмент {match.chunkIndex + 1}</span>
              </div>
              <h4>
                <a href={match.url} target="_blank" rel="noreferrer">
                  {stripHtml(match.title)}
                </a>
              </h4>
              <p>{stripHtml(match.snippet)}</p>
              {match.confidence === "page" && match.submittedEvidence ? (
                <div className="match-evidence">
                  <strong>Підтверджений спільний уривок</strong>
                  <blockquote>{match.submittedEvidence}</blockquote>
                  {match.sourceEvidence && match.sourceEvidence !== match.submittedEvidence ? <blockquote>{match.sourceEvidence}</blockquote> : null}
                </div>
              ) : (
                <p className="match-lead-note">Пошукова підказка: сторінку ще не підтверджено, тому цей результат не впливає на загальний відсоток плагіату.</p>
              )}
              <dl>
                <div>
                  <dt>Слова</dt>
                  <dd>{match.overlapPercent}%</dd>
                </div>
                <div>
                  <dt>N-грам</dt>
                  <dd>{match.ngramOverlapPercent}%</dd>
                </div>
                <div>
                  <dt>Довгий збіг</dt>
                  <dd>{match.longestRun} слів</dd>
                </div>
                <div>
                  <dt>Winnowing</dt>
                  <dd>{match.hashOverlapPercent}%</dd>
                </div>
                <div>
                  <dt>Full-text</dt>
                  <dd>{match.fullTextRank}%</dd>
                </div>
                <div>
                  <dt>Доказ</dt>
                  <dd>{confidenceLabel(match.confidence)}</dd>
                </div>
                <div>
                  <dt>Джерело:</dt>
                  <dd>
                    <ProviderIcon provider={match.provider ?? ""} /> {match.provider ?? "Web"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
