import type { ScanReport } from "../../shared/types";
import { ExportToolbar } from "./ExportToolbar";
import { AiAnalysisPanel } from "./AiAnalysisPanel";
import { SuspiciousSegments } from "./SuspiciousSegments";
import { PlagiarismMatches } from "./PlagiarismMatches";
import { ProviderDiagnostics } from "./ProviderDiagnostics";
import { SignalCard } from "./SignalCard";
import { formatNumber, riskLabel, aiMetricCaption, reportSummaryText, aiVerdictLabel } from "../utils/reportLabels";

interface ReportViewProps {
  report: ScanReport;
  llmBusy: boolean;
  reportRef: React.RefObject<HTMLElement | null>;
}

export function ReportView({ report, llmBusy, reportRef }: ReportViewProps) {
  const confirmedMatchCount = report.matches.filter((match) => match.confidence === "page").length;
  const leadMatchCount = report.matches.length - confirmedMatchCount;
  const searchAttemptCount = report.searchDiagnostics?.providers.reduce((sum, provider) => sum + provider.attempted, 0) ?? 0;
  const searchSuccessCount = report.searchDiagnostics?.providers.reduce((sum, provider) => sum + provider.succeeded, 0) ?? 0;
  const searchCircuitOpen = report.searchDiagnostics?.providers.some((provider) => /повторних помилок/i.test(provider.skippedReason ?? "")) ?? false;
  const allSearchProvidersFailed = searchSuccessCount === 0 && (searchAttemptCount > 0 || searchCircuitOpen);
  const aiSignalSplit = Math.max(1, Math.ceil(report.aiSignals.length / 2));
  const primaryAiSignals = report.aiSignals.slice(0, aiSignalSplit);
  const secondaryAiSignals = report.aiSignals.slice(aiSignalSplit);

  return (
    <section ref={reportRef} className="report" aria-labelledby="report-title">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <p className="font-label-sm text-label-sm text-emerald-glow tracking-wider uppercase mb-1">Звіт Незбіг</p>
          <h2 id="report-title" className="font-headline-lg text-headline-lg text-white font-bold break-all leading-tight">
            {report.fileName}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed max-w-3xl">
            {reportSummaryText(report)}
          </p>
        </div>
        <div className="flex flex-col lg:items-end gap-3 shrink-0">
          <time className="text-label-sm text-on-surface-variant font-mono" dateTime={report.checkedAt}>
            {new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt))}
          </time>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              className="px-3.5 py-2 rounded-xl border border-emerald-glow/40 text-emerald-glow hover:bg-emerald-glow/10 text-body-md font-medium transition-all"
              type="button" 
              onClick={() => navigator.clipboard.writeText(window.location.origin + "/history/" + report.id)}
            >
              Копіювати посилання
            </button>
            <ExportToolbar report={report} />
          </div>
        </div>
      </div>

      <div className="metrics">
        <article>
          <span>Плагіат</span>
          <strong>{report.plagiarismScore}%</strong>
          <small>{riskLabel(report.plagiarismScore)} ризик</small>
        </article>
        <article>
          <span>ШІ-аналіз</span>
          <strong>{report.aiVerdict === "insufficient" ? "—" : `${report.aiProbability}%`}</strong>
          <small>{aiMetricCaption(report)}</small>
        </article>
        <article>
          <span>AI-думка</span>
          <strong>{report.aiOpinionProbability !== undefined ? `${report.aiOpinionProbability}%` : "…"}</strong>
          <small>
            {report.aiOpinionProbability !== undefined
              ? `${riskLabel(report.aiOpinionProbability)} рівень від моделі`
              : llmBusy
                ? "модель ще думає"
                : "немає відповіді моделі"}
          </small>
        </article>
        <article>
          <span>Фрагменти</span>
          <strong>{formatNumber(report.chunksChecked)}</strong>
          <small>{formatNumber(report.wordCount)} слів</small>
        </article>
      </div>

      {report.scanNotes && report.scanNotes.length > 0 ? (
        <div className="scan-notes" aria-label="Примітки перевірки">
          {report.skippedTitleWords ? <strong>Титулку пропущено: {formatNumber(report.skippedTitleWords)} слів</strong> : null}
          {report.scanNotes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      ) : null}

      <div className="report-grid">
        <div className="report-left-stack">
          <PlagiarismMatches
            matches={report.matches}
            confirmedMatchCount={confirmedMatchCount}
            leadMatchCount={leadMatchCount}
            allSearchProvidersFailed={allSearchProvidersFailed}
            diagnosticsNode={report.searchDiagnostics ? <ProviderDiagnostics diagnostics={report.searchDiagnostics} /> : null}
          />

          <SuspiciousSegments segments={report.aiSuspiciousSegments} />

          {secondaryAiSignals.length > 0 ? (
            <div className="signal-list signal-list-left" aria-label="Додаткові AI-сигнали">
              {secondaryAiSignals.map((signal) => (
                <SignalCard signal={signal} key={signal.label} />
              ))}
            </div>
          ) : null}
        </div>

        <AiAnalysisPanel report={report} llmBusy={llmBusy} primarySignals={primaryAiSignals} />
      </div>
    </section>
  );
}
