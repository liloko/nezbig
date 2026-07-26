import { FormEvent, useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ScanSettings } from "../shared/types";

// Hooks
import { useScan } from "./hooks/useScan";
import { useAiOpinion } from "./hooks/useAiOpinion";
import { useHumanize } from "./hooks/useHumanize";
import { useDocumentEditor } from "./hooks/useDocumentEditor";
import { useWordExport } from "./hooks/useWordExport";
import { useDragDrop } from "./hooks/useDragDrop";
import { useDraft } from "./hooks/useDraft";

// Utils
import { defaultSettings, recommendSettings, estimateScanSeconds, formatDuration } from "./utils/scanSettings";
import { sanitizeRichHtml, htmlFromPlainText } from "./richText";

// Components
import { BrandLogo } from "./components/BrandLogo";
import { TextEditor } from "./components/TextEditor";
import { ScanSettingsPanel } from "./components/ScanSettingsPanel";
import { LoadingPanel } from "./components/LoadingPanel";
import { HumanizePanel } from "./components/HumanizePanel";
import { ReportView } from "./components/ReportView";
import { HistoryPanel } from "./components/HistoryPanel";
import { DiffPanel } from "./components/DiffPanel";
import { useFaviconProgress } from "./hooks/useFaviconProgress";

export default function App() {
  const [appMode, setAppMode] = useState<"scan" | "diff">("scan");
  const [settings, setSettings] = useState<ScanSettings>(defaultSettings);
  const [message, setMessage] = useState("");
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
    setMessage("Відредагований текст перенесено в поле. Перевірте факти й запустіть повторний аналіз.");
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
      setMessage("Завантажено звіт із історії.");
      window.requestAnimationFrame(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Помилка завантаження історії.");
    }
  }, [setReport]);

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

        <div className="app-tabs" role="tablist">
          <button 
            role="tab" 
            aria-selected={appMode === "scan"} 
            className={`app-tab ${appMode === "scan" ? "active" : ""}`}
            onClick={() => setAppMode("scan")}
          >
            Перевірка тексту
          </button>
          <button 
            role="tab" 
            aria-selected={appMode === "diff"} 
            className={`app-tab ${appMode === "diff" ? "active" : ""}`}
            onClick={() => setAppMode("diff")}
          >
            Порівняння текстів
          </button>
        </div>

        {appMode === "scan" ? (
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
            <ReportView report={report} llmBusy={llmBusy} reportRef={reportRef} />
          ) : null}
          </>
        ) : (
          <DiffPanel />
        )}

        <footer className="app-footer">
          <p>Незбіг — безкоштовна перевірка тексту на плагіат та AI-сліди</p>
          <div className="footer-links">
            <a href="https://github.com/vadapadix/nezbig" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>·</span>
            <a href="/privacy.html">Privacy</a>
            <span>·</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </main>
    </>
  );
}
