import { useEffect, useRef } from "react";

const DRAFT_KEY = "nezbig:draft";

interface Draft {
  text: string;
  html: string;
  fileName: string;
  savedAt: string;
}

export function useDraft(text: string, html: string, fileName: string, onRestore: (d: Draft) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text.trim()) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, html, fileName, savedAt: new Date().toISOString() }));
    }, 3000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, html, fileName]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Draft;
      if (Date.now() - new Date(draft.savedAt).getTime() > 48 * 3600000) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      if (draft.text.length > 120 && window.confirm(`Відновити чернетку «${draft.fileName}» від ${new Date(draft.savedAt).toLocaleString("uk-UA")}?`)) {
        onRestore(draft);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export const clearDraft = () => localStorage.removeItem(DRAFT_KEY);
