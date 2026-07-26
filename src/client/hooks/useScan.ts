import { useState, useCallback } from "react";
import type { ScanReport, ScanSettings } from "../../shared/types";

export function useScan() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ checked: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (
    text: string,
    fileName: string,
    selectedFile: File | null,
    settings: ScanSettings
  ): Promise<ScanReport> => {
    setBusy(true);
    setError(null);
    setReport(null);
    setProgress(null);

    try {
      let response: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("settings", JSON.stringify(settings));
        response = await fetch("/api/scan-file/jobs", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/scan/jobs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, fileName, settings })
        });
      }

      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to start scan job.");
      }

      if (payload.status === "completed" && payload.result) {
        setReport(payload.result);
        setBusy(false);
        return payload.result;
      }

      const jobId = payload.jobId;

      return await new Promise<ScanReport>((resolve, reject) => {
        const poll = async () => {
          try {
            const statusRes = await fetch(`/api/scan-status/${jobId}`);
            const statusPayload = await statusRes.json();
            
            if (!statusRes.ok || statusPayload.error) {
              throw new Error(statusPayload.error || "Job failed.");
            }

            if (statusPayload.status === "completed") {
              setReport(statusPayload.result);
              setBusy(false);
              resolve(statusPayload.result);
            } else if (statusPayload.status === "error") {
              throw new Error(statusPayload.error || "Job error.");
            } else {
              if (statusPayload.progress) {
                setProgress({ checked: statusPayload.progress.chunksChecked, total: statusPayload.progress.totalChunks });
              }
              setTimeout(poll, 2000);
            }
          } catch (err) {
            setBusy(false);
            const errMsg = err instanceof Error ? err.message : String(err);
            setError(errMsg);
            reject(new Error(errMsg));
          }
        };
        setTimeout(poll, 2000);
      });
    } catch (err) {
      setBusy(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      throw new Error(errMsg);
    }
  }, []);

  return { report, setReport, busy, progress, error, scan };
}
