import { FormEvent, useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from "react";
import type { ScanSettings } from "../shared/types";

// Hooks
import { useScan } from "./hooks/useScan";
import { useAiOpinion } from "./hooks/useAiOpinion";
import { useHumanize } from "./hooks/useHumanize";
import { useDocumentEditor } from "./hooks/useDocumentEditor";
import { useWordExport } from "./hooks/useWordExport";
import { useDragDrop } from "./hooks/useDragDrop";
import { useDraft } from "./hooks/useDraft";
import { useToast } from "./hooks/useToast";

// Utils
import { defaultSettings, recommendSettings, estimateScanSeconds, formatDuration } from "./utils/scanSettings";
import { sanitizeRichHtml, htmlFromPlainText } from "./richText";

// Components
import { BrandLogo } from "./components/BrandLogo";
import { TextEditor } from "./components/TextEditor";
import { ScanSettingsPanel } from "./components/ScanSettingsPanel";
import { LoadingPanel } from "./components/LoadingPanel";
import { HumanizePanel } from "./components/HumanizePanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { useFaviconProgress } from "./hooks/useFaviconProgress";

const DiffPanel = lazy(() => import("./components/DiffPanel").then(m => ({ default: m.DiffPanel })));
const ReportView = lazy(() => import("./components/ReportView").then(m => ({ default: m.ReportView })));

export default function App() {
  const [appMode, setAppMode] = useState<"scan" | "diff">("scan");
  const [settings, setSettings] = useState<ScanSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const { toasts, show: showToast } = useToast();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const reportRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Hooks
  const editor = useDocumentEditor(setMessage);
  const { report, setReport, busy, progress, scan, cancel } = useScan();
  const { llmBusy, loadLlmOpinion } = useAiOpinion(setReport);
  const { humanized, setHumanized, humanizerBusy, handleHumanize } = useHumanize();
  const wordExport = useWordExport(setMessage);

  const isDragging = useDragDrop(mainRef, (file) => {
    setReport(null);
    setHumanized(null);
    void editor.handleFile(file);
  });

  const { draftSaved, clearDraft } = useDraft(editor.text, editor.sourceHtml, editor.fileName, (draft) => {
    editor.setEditorContent(draft.html, draft.text);
    editor.setFileName(draft.fileName);
  });
  useFaviconProgress(progress);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter" && !busy && editor.text.length >= 120) {
        e.preventDefault();
        const fakeEvent = { preventDefault: () => {} } as unknown as FormEvent<HTMLFormElement>;
        void handleSubmit(fakeEvent);
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        editor.setEditorContent("", "");
        editor.setFileName("Вставлений текст");
        editor.setSelectedFile(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, editor, handleSubmit]);

  // Derived state
  const wordCount = useMemo(() => editor.text.trim().split(/\s+/).filter(Boolean).length, [editor.text]);
  const canScan = editor.text.length >= 120 && !busy;
  const canHumanize = (editor.selectedFile !== null || wordCount >= 20) && !humanizerBusy;
  const estimatedSeconds = useMemo(() => estimateScanSeconds(settings, wordCount), [settings, wordCount]);

  // Auto-adjust settings based on word count
  useEffect(() => {
    setSettings((current) => {
      const recommended = recommendSettings(wordCount, current.sensitivity);
      if (current.chunkWords === recommended.chunkWords && current.overlapWords === recommended.overlapWords && current.maxChunks === recommended.maxChunks) {
        return current;
      }
      return recommended;
    });
  }, [wordCount]);

  // Scroll to report when it appears
  useEffect(() => {
    if (!report) return;
    window.requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [report?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canScan) {
      setMessage("Додайте файл або щонайменше 120 символів тексту.");
      return;
    }

    const scanSettings = recommendSettings(wordCount, settings.sensitivity);
    setMessage(`Шукаю збіги, відкриваю сторінки джерел і рахую локальні AI-сигнали. Орієнтовно: ${formatDuration(estimateScanSeconds(scanSettings, wordCount))}.`);
    setHumanized(null);

    try {
      const result = await scan(editor.text, editor.fileName, editor.selectedFile, scanSettings);
      clearDraft();
      setMessage("Базовий звіт готовий. AI-думка підвантажується окремо…");
      void loadLlmOpinion(result, editor.text, editor.selectedFile).catch(() => {
        setMessage("Базовий звіт готовий. AI-думка зараз недоступна, використано локальний аналіз.");
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessage("Перевірку скасовано користувачем.");
      } else {
        setMessage(error instanceof Error ? error.message : "Перевірка не вдалася.");
      }
    }
  }

  async function onHumanize() {
    if (!canHumanize) {
      setMessage("Для редагування додайте файл або щонайменше 20 слів.");
      return;
    }

    setMessage(editor.selectedFile ? "Редагую стиль тексту з файлу…" : "Редагую стиль вставленого тексту…");

    try {
      const result = await handleHumanize(editor.text, editor.sourceHtml, editor.selectedFile);
      setMessage(`Редагування готове: ${result.changes.length} груп змін.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Редагування не вдалося.");
    }
  }

  function moveHumanizedTextToChecker() {
    if (!humanized) return;
    editor.setEditorContent(sanitizeRichHtml(humanized.revisedHtml ?? htmlFromPlainText(humanized.revisedText)), humanized.revisedText);
    editor.setSelectedFile(null);
    editor.setFileName("Відредагований текст");
    setReport(null);
    showToast("Відредагований текст перенесено в поле. Перевірте факти й запустіть повторний аналіз.", "success");
    window.requestAnimationFrame(() => {
      document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const handleLoadHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) throw new Error("Звіт не знайдено");
      const reportData = await res.json();
      setReport(reportData);
      showToast("Завантажено звіт із історії.", "success");
      window.requestAnimationFrame(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Помилка завантаження історії.", "error");
    }
  }, [setReport, showToast]);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: feedbackText, page: window.location.href })
      });
      if (!res.ok) throw new Error();
      showToast("Дякуємо за ваш відгук!", "success");
      setFeedbackOpen(false);
      setFeedbackText("");
    } catch {
      showToast("Не вдалося надіслати відгук.", "error");
    } finally {
      setFeedbackBusy(false);
    }
  };

  // Handle /history/:id deep links on mount
  useEffect(() => {
    const match = window.location.pathname.match(/^\/history\/([\w-]+)$/);
    if (match) {
      const id = match[1];
      void handleLoadHistory(id);
      window.history.replaceState({}, "", "/");
    }
  }, [handleLoadHistory]);

  return (
    <>
      <a className="skip-link" href="#checker">
        Перейти до перевірки
      </a>
      <main ref={mainRef} className="app-shell">
        {isDragging && (
          <div className="drop-overlay">
            <div className="drop-zone">
              <p>Відпустіть файл для завантаження</p>
            </div>
          </div>
        )}
        <section className="intro" aria-labelledby="page-title">
          <div className="brand-lockup">
            <BrandLogo spinning={busy || llmBusy} width={136} height={136} />
            <div>
              <p className="eyebrow">Text originality forensics</p>
              <h1 id="page-title">Незбіг</h1>
              <p className="hero-copy">Безкоштовна перевірка тексту на плагіат, AI-сліди та відкриті вебджерела.</p>
            </div>
          </div>
        </section>

        <HistoryPanel onSelect={handleLoadHistory} />

        <div className="app-tabs" role="tablist" aria-label="Режим роботи">
          <button 
            role="tab" 
            aria-selected={appMode === "scan"} 
            aria-controls="scan-panel"
            id="tab-scan"
            className={`app-tab ${appMode === "scan" ? "active" : ""}`}
            onClick={() => setAppMode("scan")}
          >
            Перевірка тексту
          </button>
          <button 
            role="tab" 
            aria-selected={appMode === "diff"} 
            aria-controls="diff-panel"
            id="tab-diff"
            className={`app-tab ${appMode === "diff" ? "active" : ""}`}
            onClick={() => setAppMode("diff")}
          >
            Порівняння текстів
          </button>
        </div>

        <div role="tabpanel" id="scan-panel" aria-labelledby="tab-scan" hidden={appMode !== "scan"}>
          {appMode === "scan" && (
            <>
              <form id="checker" className="workspace" onSubmit={handleSubmit}>
          <TextEditor
            editorRef={editor.editorRef}
            selectedFile={editor.selectedFile}
            fileName={editor.fileName}
            sourceHtml={editor.sourceHtml}
            formattedPreviewBusy={editor.formattedPreviewBusy}
            onInput={() => editor.syncEditorFromDom(true)}
            onPaste={editor.handleRichPaste}
            onFileChange={(file) => {
              setReport(null);
              setHumanized(null);
              void editor.handleFile(file);
            }}
            onClearFile={() => {
              editor.setSelectedFile(null);
              editor.setFileName("Вставлений текст");
            }}
            onCopyFormatted={() => void wordExport.copyFormattedForWord(sanitizeRichHtml(editor.sourceHtml), editor.text)}
            onDownloadFormatted={() =>
              editor.selectedFile
                ? wordExport.downloadOriginalFile(editor.selectedFile)
                : wordExport.downloadFormattedForWord(editor.sourceHtml, editor.fileName)
            }
            draftSaved={draftSaved}
            wordCount={wordCount}
          />
          <ScanSettingsPanel
            settings={settings}
            wordCount={wordCount}
            estimatedScanSeconds={estimatedSeconds}
            canScan={canScan}
            busy={busy}
            canHumanize={canHumanize}
            humanizerBusy={humanizerBusy}
            message={message}
            onSettingsChange={setSettings}
            onHumanize={() => void onHumanize()}
          />
        </form>

        {humanized ? (
          <HumanizePanel
            humanized={humanized}
            wordDownloadBusy={wordExport.wordDownloadBusy}
            selectedFile={editor.selectedFile}
            onMoveToChecker={moveHumanizedTextToChecker}
            onCopyFormatted={() => void wordExport.copyHumanizedFormatted(humanized)}
            onDownloadForWord={() => void wordExport.downloadHumanizedForWord(humanized, editor.selectedFile, editor.fileName)}
          />
        ) : null}



        {busy || llmBusy ? (
          <LoadingPanel
            busy={busy}
            llmBusy={llmBusy}
            progress={progress}
            estimatedSeconds={formatDuration(estimatedSeconds)}
            onCancel={cancel}
          />
        ) : null}

          {report ? (
            <Suspense fallback={<div className="loading-skeleton">Завантаження звіту…</div>}>
              <ReportView report={report} llmBusy={llmBusy} reportRef={reportRef} />
            </Suspense>
          ) : null}
          </>
          )}
        </div>

        <div role="tabpanel" id="diff-panel" aria-labelledby="tab-diff" hidden={appMode !== "diff"}>
          {appMode === "diff" && (
            <Suspense fallback={<div className="loading-skeleton">Завантаження порівняння…</div>}>
              <DiffPanel />
            </Suspense>
          )}
        </div>

        <footer className="app-footer">
          <p>Незбіг — безкоштовна перевірка тексту на плагіат та AI-сліди</p>
          <div className="footer-links">
            <button type="button" className="text-button" onClick={() => setFeedbackOpen(true)}>Повідомити про помилку</button>
            <span>·</span>
            <a href="https://github.com/vadapadix/nezbig" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>·</span>
            <a href="/privacy.html">Privacy</a>
            <span>·</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </main>

      {feedbackOpen && (
        <div className="modal-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Зворотний зв'язок</h3>
            <p>Знайшли помилку чи маєте пропозицію? Напишіть нам!</p>
            <textarea 
              className="feedback-textarea" 
              value={feedbackText} 
              onChange={e => setFeedbackText(e.target.value)} 
              placeholder="Опишіть проблему..."
              rows={4}
            />
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setFeedbackOpen(false)}>Скасувати</button>
              <button type="button" className="primary-button" onClick={handleSendFeedback} disabled={feedbackBusy || !feedbackText.trim()}>
                {feedbackBusy ? "Надсилання..." : "Надіслати"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
