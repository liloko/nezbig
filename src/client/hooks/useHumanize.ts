import { useState, useCallback } from "react";
import type { HumanizeResult } from "../../shared/types";

export function useHumanize() {
  const [humanizerBusy, setHumanizerBusy] = useState(false);
  const [humanized, setHumanized] = useState<HumanizeResult | null>(null);

  const handleHumanize = useCallback(async (
    text: string,
    sourceHtml: string,
    selectedFile: File | null
  ): Promise<HumanizeResult> => {
    setHumanizerBusy(true);
    setHumanized(null);
    try {
      let response: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        response = await fetch("/api/humanize-file", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/humanize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, html: sourceHtml })
        });
      }
      
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Редагування не вдалося.");
      }
      
      setHumanized(payload);
      return payload;
    } finally {
      setHumanizerBusy(false);
    }
  }, []);

  return { humanized, setHumanized, humanizerBusy, handleHumanize };
}
