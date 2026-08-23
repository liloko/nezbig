import type { ScanReport } from "../../shared/types";
import { SignalCard } from "./SignalCard";
import { reliabilityLabel, languageLabel, formatNumber, isDuplicateOpinionSignal } from "../utils/reportLabels";
import { stripHtml } from "../utils/sanitizeHtml";

interface AiAnalysisPanelProps {
  report: ScanReport;
  llmBusy: boolean;
  primarySignals: ScanReport["aiSignals"];
  onRetryOpinion?: () => void;
}

export function AiAnalysisPanel({ report, llmBusy, primarySignals, onRetryOpinion }: AiAnalysisPanelProps) {
  return (
    <section aria-labelledby="ai-title">
      <h3 id="ai-title">Розширений AI-аналіз</h3>
      <p className="model-badge">{llmBusy ? "AI-думка: очікування відповіді…" : "Локальний AI-відсоток незалежний від LLM"}</p>
      <div className={`reliability-line reliability-${report.aiReliability.level}`}>
        <strong>
          Надійність оцінки: {reliabilityLabel(report.aiReliability.level)} ({report.aiReliability.score}/100)
        </strong>
        <span>
          {report.aiReliability.segmentCount} сегм. · розкид {report.aiReliability.segmentSpread} п.п.
        </span>
        <p>{report.aiReliability.reason}</p>
      </div>
      <div className="ai-context-strip" aria-label="Контекст локального AI-аналізу">
        <span>
          <strong>Мова</strong>
          {languageLabel(report.aiLanguage.code)} · {report.aiLanguage.supportedPercent}% покриття
        </span>
        <span>
          <strong>Проаналізовано</strong>
          {formatNumber(report.aiExclusions.analyzedWords)} слів
        </span>
        {report.aiExclusions.codeWords > 0 ? (
          <span>
            <strong>Код вилучено</strong>
            {formatNumber(report.aiExclusions.codeWords)} слів
          </span>
        ) : null}
        {report.aiExclusions.quotedWords + report.aiExclusions.referenceWords > 0 ? (
          <span>
            <strong>Цитати й джерела</strong>
            {formatNumber(report.aiExclusions.quotedWords + report.aiExclusions.referenceWords)} слів
          </span>
        ) : null}
      </div>
      {report.aiNote ? <p className="provider-note">{stripHtml(report.aiNote)}</p> : null}
      {report.aiOpinionError && !llmBusy ? (
        <p className="provider-note" role="status">
          {stripHtml(report.aiOpinionError)}{" "}
          {onRetryOpinion ? (
            <button type="button" className="retry-opinion-button" onClick={onRetryOpinion}>
              Повторити AI-думку
            </button>
          ) : null}
        </p>
      ) : null}
      {report.aiOpinionProbability !== undefined ? (
        <div className="opinion-panel">
          <strong>AI-думка: {report.aiOpinionProbability}%</strong>
          <span>{report.aiOpinionModel}</span>
          {report.aiOpinionNote ? <p>{stripHtml(report.aiOpinionNote)}</p> : null}
        </div>
      ) : null}
      <p className="section-note">
        Локальний ансамбль перевіряє авторський текст повністю й окремими сегментами. Відсоток є евристичним індикатором ризику, а не каліброваною ймовірністю чи доказом
        авторства. Смуга «±N п.п.» показує орієнтовну невизначеність: вона ширша для коротких текстів, слабкої надійності та великого розкиду між сегментами.
      </p>
      <div className="signal-list">
        {primarySignals.map((signal) => (
          <SignalCard signal={signal} key={signal.label} />
        ))}
        {report.aiOpinionSignals
          ?.filter((signal) => !isDuplicateOpinionSignal(signal, report.aiSignals))
          .map((signal) => (
            <SignalCard signal={signal} className="opinion-signal" key={`opinion-${signal.label}`} />
          ))}
      </div>
    </section>
  );
}
