interface LoadingPanelProps {
  busy: boolean;
  llmBusy: boolean;
  estimatedSeconds: string;
  progress?: { checked: number; total: number } | null;
  onCancel?: () => void;
}

export function LoadingPanel({ busy, llmBusy, estimatedSeconds, progress, onCancel }: LoadingPanelProps) {
  return (
    <section className="loading-panel" aria-live="polite" aria-label="Стан перевірки">
      <div className="loader-orbit" aria-hidden="true" />
      <div>
        <h2>{busy ? "Готуємо звіт" : "AI-думка аналізує текст"}</h2>
        <p className="loading-estimate">{busy ? `Орієнтовний час: ${estimatedSeconds}` : "AI-думка може відповідати довше за локальний звіт."}</p>
        <ol>
          <li className={busy ? "step-active" : "step-done"}>Нарізаємо текст на фрагменти</li>
          <li className={busy ? "step-active" : llmBusy ? "step-done" : ""}>Шукаємо збіги у відкритих джерелах</li>
          <li className={llmBusy ? "step-active" : ""}>Додаємо окрему AI-думку</li>
        </ol>
        {progress && progress.total > 0 ? (
          <div className="progress-track" style={{ marginTop: "1.5rem", background: "#f1f3f5", borderRadius: "8px", overflow: "hidden" }}>
            <div 
              className="progress-fill" 
              style={{ width: `${Math.round((progress.checked / progress.total) * 100)}%`, background: "#2EC4B6", height: "8px", transition: "width 0.3s ease" }}
            />
            <p className="progress-label" style={{ fontSize: "13px", color: "#868e96", marginTop: "8px" }}>
              Перевірено {progress.checked} з {progress.total} фрагментів
            </p>
          </div>
        ) : null}
        {onCancel && busy ? (
          <button type="button" className="secondary-button" onClick={onCancel} style={{ marginTop: "1rem" }}>
            Скасувати
          </button>
        ) : null}
      </div>
    </section>
  );
}
