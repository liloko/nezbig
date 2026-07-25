import { useState, useCallback } from "react";
import type { ScanReport, LlmOpinion } from "../../shared/types";

export function useAiOpinion(setReport: React.Dispatch<React.SetStateAction<ScanReport | null>>) {
  const [llmBusy, setLlmBusy] = useState(false);

  const loadLlmOpinion = useCallback(async (
    baseReport: ScanReport,
    sourceText: string,
    sourceFile: File | null
  ): Promise<LlmOpinion | void> => {
    setLlmBusy(true);
    try {
      let response: Response;
      if (sourceFile) {
        const formData = new FormData();
        formData.append("file", sourceFile);
        formData.append("localProbability", String(baseReport.aiProbability));
        formData.append("localSignals", JSON.stringify(baseReport.aiSignals));
        response = await fetch("/api/ai-opinion-file", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/ai-opinion", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: sourceText,
            localProbability: baseReport.aiProbability,
            localSignals: baseReport.aiSignals
          })
        });
      }

      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error || "AI-думка недоступна.");

      setReport((current) =>
        current?.id === baseReport.id
          ? {
              ...current,
              aiOpinionProbability: payload.aiProbability,
              aiOpinionModel: payload.aiModel,
              aiOpinionNote: payload.aiNote,
              aiOpinionSignals: payload.aiSignals
            }
          : current
      );
      return payload;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const summarizeAiError = (msg: string) => {
        if (/rate-limited|rate.?limit|429/i.test(msg)) return "модель тимчасово обмежена лімітом запитів";
        if (/insufficient_quota|out of credits|quota/i.test(msg)) return "у провайдера закінчилася квота";
        if (/aborted|timeout/i.test(msg)) return "модель не відповіла вчасно";
        if (/empty response/i.test(msg)) return "модель повернула порожню відповідь";
        return msg.slice(0, 180);
      };
      const note = `AI-думка недоступна, залишено локальний звіт: ${summarizeAiError(errMessage)}.`;
      setReport((current) => (current?.id === baseReport.id ? { ...current, aiNote: note } : current));
      throw error;
    } finally {
      setLlmBusy(false);
    }
  }, [setReport]);

  return { loadLlmOpinion, llmBusy };
}
