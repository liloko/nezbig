interface LoadingPanelProps {
  busy: boolean;
  llmBusy: boolean;
  estimatedSeconds: string;
}

export function LoadingPanel({ busy, llmBusy, estimatedSeconds }: LoadingPanelProps) {
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
      </div>
    </section>
  );
}
