import { useState } from "react";

export interface DiffPart {
  count?: number;
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function DiffPanel() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffResult, setDiffResult] = useState<DiffPart[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!original.trim() || !modified.trim()) {
      setError("Вставте обидва тексти для порівняння.");
      return;
    }
    
    setBusy(true);
    setError(null);
    setDiffResult(null);
    
    try {
      const res = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, modified })
      });
      
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Помилка при порівнянні");
      
      setDiffResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    setOriginal("");
    setModified("");
    setDiffResult(null);
    setError(null);
  };

  return (
    <section className="diff-panel workspace">
      <div className="diff-inputs">
        <div className="diff-input-group">
          <label htmlFor="diff-original">Оригінальний текст</label>
          <textarea
            id="diff-original"
            className="diff-textarea"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Вставте початковий варіант тексту сюди..."
          />
        </div>
        <div className="diff-input-group">
          <label htmlFor="diff-modified">Редагований варіант</label>
          <textarea
            id="diff-modified"
            className="diff-textarea"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="Вставте змінений текст сюди..."
          />
        </div>
      </div>
      
      <div className="diff-actions">
        <button 
          className="primary-button" 
          onClick={handleCompare} 
          disabled={busy || (!original.trim() || !modified.trim())}
        >
          {busy ? "Аналіз..." : "Порівняти"}
        </button>
        <button 
          className="secondary-button" 
          onClick={handleClear} 
          disabled={busy || (!original && !modified && !diffResult)}
        >
          Очистити
        </button>
      </div>

      {error && <div className="panel-banner panel-banner-error">{error}</div>}

      {diffResult && (
        <div className="diff-result">
          <h3 className="diff-result-title">Результат порівняння (Inline Diff)</h3>
          <div className="diff-content">
            {diffResult.map((part, index) => {
              if (part.added) {
                return <ins key={index}>{part.value}</ins>;
              }
              if (part.removed) {
                return <del key={index}>{part.value}</del>;
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}
