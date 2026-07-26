import { useState, useEffect, useCallback } from "react";

export interface HistoryItem {
  id: string;
  fileName: string;
  checkedAt: string;
  plagiarismScore: number;
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Не вдалося завантажити історію");
      const data = (await res.json()) as HistoryItem[];
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}
