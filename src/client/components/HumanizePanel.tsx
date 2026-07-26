import type { HumanizeResult } from "../../shared/types";
import { htmlFromPlainText, sanitizeRichHtml } from "../richText";
import { formatNumber } from "../utils/reportLabels";

interface HumanizePanelProps {
  humanized: HumanizeResult;
  wordDownloadBusy: boolean;
  selectedFile: File | null;
  onMoveToChecker: () => void;
  onCopyFormatted: () => void;
  onDownloadForWord: () => void;
}

export function HumanizePanel({
  humanized,
  wordDownloadBusy,
  selectedFile,
  onMoveToChecker,
  onCopyFormatted,
  onDownloadForWord
}: HumanizePanelProps) {
  return (
    <section className="humanizer-result" aria-labelledby="humanizer-title">
      <div>
        <p className="eyebrow">Редактор стилю</p>
        <h2 id="humanizer-title">Відредагований текст</h2>
        <p>
          {formatNumber(humanized.originalWordCount)} -&gt; {formatNumber(humanized.revisedWordCount)} слів
        </p>
      </div>
      <div
        className="humanized-output rich-output"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(humanized.revisedHtml ?? htmlFromPlainText(humanized.revisedText)) }}
      />
      <div className="humanizer-actions">
        <button type="button" className="secondary-button" onClick={onMoveToChecker}>
          Перенести в перевірку
        </button>
        <button type="button" className="secondary-button" onClick={onCopyFormatted}>
          Копіювати у Word
        </button>
        <button type="button" className="secondary-button" disabled={wordDownloadBusy} onClick={onDownloadForWord}>
          {wordDownloadBusy ? "Збираю DOCX…" : selectedFile && /\.docx$/i.test(selectedFile.name) ? "Завантажити DOCX" : "Завантажити для Word"}
        </button>
        <span>Після перенесення перевірте факти й запустіть аналіз повторно.</span>
      </div>
      <div className="humanizer-grid">
        <section>
          <h3>Зміни</h3>
          {humanized.changes.length === 0 ? (
            <p className="empty-state">Помітних AI-шаблонів не знайдено.</p>
          ) : (
            <ul className="humanizer-list">
              {humanized.changes.map((change) => (
                <li key={change.label}>
                  <strong>{change.label}</strong>
                  <span>
                    {change.count}x - {change.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Примітки</h3>
          <ul className="humanizer-list">
            {humanized.notes.map((note) => (
              <li key={note}>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
