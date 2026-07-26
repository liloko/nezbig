import type { LlmOpinion, ScanReport } from "../../shared/types";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("uk-UA").format(value);
}

export function riskLabel(value: number): string {
  if (value >= 70) return "Високий";
  if (value >= 38) return "Середній";
  return "Низький";
}

export function reliabilityLabel(level: ScanReport["aiReliability"]["level"]): string {
  if (level === "high") return "висока";
  if (level === "medium") return "середня";
  return "низька";
}

export function aiVerdictLabel(verdict: ScanReport["aiVerdict"]): string {
  if (verdict === "insufficient") return "Недостатньо даних";
  if (verdict === "mixed") return "Змішаний документ";
  if (verdict === "uncertain") return "Невизначений результат";
  if (verdict === "high") return "Високий ризик";
  if (verdict === "elevated") return "Підвищений ризик";
  return "Низький ризик";
}

export function languageLabel(code: ScanReport["aiLanguage"]["code"]): string {
  if (code === "uk") return "українська";
  if (code === "en") return "англійська";
  if (code === "mixed") return "українська + англійська";
  return "обмежене покриття";
}

export function aiMetricCaption(report: ScanReport): string {
  return `${aiVerdictLabel(report.aiVerdict)} · надійність ${report.aiReliability.score}/100`;
}

export function reportSummaryText(report: ScanReport): string {
  if (report.aiOpinionProbability === undefined) return report.summary;
  return `${report.summary} AI-думка показана окремо: ${report.aiOpinionProbability}%.`;
}

export function summarizeAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/rate-limited|rate.?limit|429/i.test(message)) return "модель тимчасово обмежена лімітом запитів";
  if (/insufficient_quota|out of credits|quota/i.test(message)) return "у провайдера закінчилася квота";
  if (/aborted|timeout/i.test(message)) return "модель не відповіла вчасно";
  if (/empty response/i.test(message)) return "модель повернула порожню відповідь";
  return message.slice(0, 180);
}

export function isDuplicateOpinionSignal(signal: LlmOpinion["aiSignals"][number], localSignals: ScanReport["aiSignals"]): boolean {
  const normalizedLabel = signal.label.trim().toLowerCase();
  return localSignals.some((localSignal) => localSignal.label.trim().toLowerCase() === normalizedLabel);
}
