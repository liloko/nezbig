import { FormEvent, useMemo, useState, useRef, useEffect, Suspense, lazy } from "react";
import { useScan } from "../hooks/useScan";
import { useAiOpinion } from "../hooks/useAiOpinion";
import { useDragDrop } from "../hooks/useDragDrop";
import { useDraft } from "../hooks/useDraft";
import { useFaviconProgress } from "../hooks/useFaviconProgress";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { recommendSettings, estimateScanSeconds, formatDuration, defaultSettings } from "../utils/scanSettings";
import { LoadingPanel } from "../components/LoadingPanel";

import { AdsterraBanner } from "../components/AdsterraBanner";

const ReportView = lazy(() => import("../components/ReportView").then(m => ({ default: m.ReportView })));

export default function Home({ showToast }: { showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [settings, setSettings] = useState(defaultSettings);
  const reportRef = useRef<HTMLElement | null>(null);

  const editor = useDocumentEditor((msg) => showToast(msg, "info"));
  const { report, setReport, busy, progress, scan, cancel } = useScan();
  const { llmBusy, loadLlmOpinion } = useAiOpinion(setReport);
  const mainRef = useRef<HTMLDivElement>(null);

  const isDragging = useDragDrop(mainRef, (file) => {
    setReport(null);
    void editor.handleFile(file);
  });

  const { draftSaved, clearDraft } = useDraft(editor.text, editor.sourceHtml, editor.fileName, (draft) => {
    editor.setEditorContent(draft.html, draft.text);
    editor.setFileName(draft.fileName);
  });

  useFaviconProgress(progress);

  const wordCount = useMemo(() => editor.text.trim().split(/\s+/).filter(Boolean).length, [editor.text]);
  const canScan = editor.text.length >= 120 && !busy;
  const estimatedSeconds = useMemo(() => estimateScanSeconds(settings, wordCount), [settings, wordCount]);

  useEffect(() => {
    setSettings((current) => {
      const recommended = recommendSettings(wordCount, current.sensitivity);
      if (current.chunkWords === recommended.chunkWords && current.overlapWords === recommended.overlapWords) return current;
      return recommended;
    });
  }, [wordCount]);

  useEffect(() => {
    if (!report) return;
    try {
      const stored = JSON.parse(localStorage.getItem("nezbig_local_history") || "[]");
      const filtered = stored.filter((item: any) => item.id !== report.id);
      filtered.unshift({
        id: report.id,
        fileName: report.fileName,
        checkedAt: report.checkedAt,
        plagiarismScore: report.plagiarismScore,
        wordCount: report.wordCount,
        aiProbability: report.aiProbability,
        fullReport: report
      });
      localStorage.setItem("nezbig_local_history", JSON.stringify(filtered.slice(0, 50)));
    } catch {
      // ignore
    }
    window.requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [report]);

  async function handleSubmit() {
    if (!canScan) {
      showToast("Додайте файл або щонайменше 120 символів тексту.", "error");
      return;
    }

    // Trigger popunder ad while user waits for scan results
    try {
      const popScript = document.createElement("script");
      popScript.src = "https://pl30923795.effectivecpmnetwork.com/75/56/41/755641c675fce2ce16353c0d40e0be47.js";
      popScript.async = true;
      document.body.appendChild(popScript);
    } catch {
      // ignore
    }

    const scanSettings = recommendSettings(wordCount, settings.sensitivity);
    try {
      const result = await scan(editor.text, editor.fileName, editor.selectedFile, scanSettings);
      clearDraft();
      showToast("Базовий звіт готовий.", "success");
      void loadLlmOpinion(result, editor.text, editor.selectedFile);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        showToast("Перевірку скасовано.", "error");
      } else {
        showToast(error instanceof Error ? error.message : "Перевірка не вдалася.", "error");
      }
    }
  }

  if (busy || llmBusy || report) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-margin-desktop md:py-margin-desktop relative z-10 fade-in flex flex-col gap-8">
        {(busy || llmBusy) && (
          <LoadingPanel busy={busy} llmBusy={llmBusy} progress={progress} estimatedSeconds={formatDuration(estimatedSeconds)} onCancel={cancel} />
        )}
        {report && (
          <Suspense fallback={<div className="loading-skeleton">Завантаження звіту…</div>}>
            <ReportView report={report} llmBusy={llmBusy} reportRef={reportRef} />
            <div className="flex justify-center mt-8">
              <button onClick={() => { setReport(null); cancel(); }} className="bg-surface-variant hover:bg-surface-bright text-white px-8 py-3 rounded-xl border border-outline-variant hover:border-emerald-glow transition-all">
                Повернутись до редактора
              </button>
            </div>
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-start gap-4 px-2">
      {/* Left Sidebar Ad (desktop >= 1536px) */}
      <aside id="ad-left-sidebar" className="hidden 2xl:flex w-[160px] shrink-0 sticky top-24 justify-center items-center py-4 text-center">
        {/* Left skyscraper unit can be added here */}
      </aside>

      <div ref={mainRef} className="max-w-container-max flex-grow py-6 md:py-8 flex flex-col gap-6 relative z-10 fade-in w-full">
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-emerald-glow/10 backdrop-blur-sm border-2 border-dashed border-emerald-glow rounded-xl flex items-center justify-center">
            <p className="text-headline-lg text-emerald-glow font-bold">Відпустіть файл для завантаження</p>
          </div>
        )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col min-h-[600px] h-[calc(100vh-240px)]">
          <div className="glass-panel rounded-xl flex flex-col h-full border hover:border-emerald-glow/40 transition-colors duration-300 overflow-hidden relative group">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-surface-container-high/60">
              <h2 className="font-headline-sm text-headline-sm text-white font-medium">Вставте текст або завантажте файл</h2>
              <div className="flex items-center gap-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">.docx, .pdf {editor.selectedFile && `(${editor.selectedFile.name})`}</span>
                <label className="bg-surface-variant/80 hover:bg-surface-bright text-white px-4 py-1.5 rounded-full font-label-sm text-label-sm border border-outline-variant hover:border-emerald-glow transition-all flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Вибрати файл
                  <input type="file" className="hidden" accept=".docx,.pdf" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReport(null);
                      void editor.handleFile(file);
                    }
                  }} />
                </label>
              </div>
            </div>
            <div className="flex-grow p-6 relative overflow-hidden flex flex-col">
              <div 
                ref={editor.editorRef}
                className="w-full h-full bg-transparent !border-0 !outline-none !shadow-none focus:!outline-none focus:!ring-0 text-body-lg text-white placeholder:text-on-surface-variant/60 custom-scrollbar !p-0 overflow-y-auto [&_*]:!text-inherit [&_*]:!bg-transparent" 
                contentEditable
                onPaste={editor.handleRichPaste}
                onInput={() => editor.syncEditorFromDom(true)}
                suppressContentEditableWarning
              />
              {!editor.text && (
                <div className="absolute top-6 left-6 text-body-lg text-on-surface-variant/50 pointer-events-none select-none">
                  Вставте текст з Word або скопіюйте сюди текст...
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-white/10 flex justify-between items-center bg-surface-container/60 shrink-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{wordCount} слів</span>
              <button 
                type="button"
                aria-label="Clear text" 
                title="Очистити поле"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all flex items-center justify-center cursor-pointer"
                onClick={() => {
                  editor.setEditorContent("", "");
                  editor.setSelectedFile(null);
                  setReport(null);
                }}
              >
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 min-h-[600px] h-[calc(100vh-240px)]">
          <div className="glass-panel rounded-xl p-8 flex flex-col border flex-grow overflow-y-auto custom-scrollbar">
            <h3 className="font-headline-md text-headline-md text-white mb-4">Параметри</h3>
            <div className="flex flex-col gap-4">
              <h4 className="font-body-lg text-body-lg text-white font-medium">Режим перевірки</h4>
              <div className="flex flex-col gap-4">
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-high/60 hover:bg-surface-bright/80 backdrop-blur-sm transition-colors cursor-pointer border border-transparent hover:border-white/20 has-[:checked]:border-emerald-glow/50 has-[:checked]:bg-emerald-glow/20">
                  <input type="radio" name="check_mode" className="mt-1" checked={settings.sensitivity === "quick"} onChange={() => setSettings(s => ({...s, sensitivity: "quick"}))} />
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-white font-medium">Швидко</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Короткий огляд, менше запитів</span>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-high/60 hover:bg-surface-bright/80 backdrop-blur-sm transition-colors cursor-pointer border border-transparent hover:border-white/20 has-[:checked]:border-emerald-glow/50 has-[:checked]:bg-emerald-glow/20">
                  <input type="radio" name="check_mode" className="mt-1" checked={settings.sensitivity === "balanced"} onChange={() => setSettings(s => ({...s, sensitivity: "balanced"}))} />
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-white font-medium">Глибоко</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Детальний аналіз, вища точність</span>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-high/60 hover:bg-surface-bright/80 backdrop-blur-sm transition-colors cursor-pointer border border-transparent hover:border-white/20 has-[:checked]:border-emerald-glow/50 has-[:checked]:bg-emerald-glow/20">
                  <input type="radio" name="check_mode" className="mt-1" checked={settings.sensitivity === "deep"} onChange={() => setSettings(s => ({...s, sensitivity: "deep"}))} />
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-white font-medium">Експертно</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Максимальна перевірка</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-emerald-glow/30 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-glow/20 to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Розмір фрагмента</span>
                <span className="font-body-lg text-body-lg text-white font-medium mt-1">{settings.chunkWords} слів</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Орієнтовно</span>
                <span className="font-body-lg text-body-lg text-white font-medium mt-1">~{formatDuration(estimatedSeconds)}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Перекриття</span>
                <span className="font-body-lg text-body-lg text-white font-medium mt-1">{settings.overlapWords} слів</span>
              </div>
            </div>
          </div>
          
            <button onClick={handleSubmit} disabled={busy || !canScan} className="relative z-10 bg-gradient-to-br from-emerald-glow to-primary-container hover:from-primary hover:to-emerald-glow text-on-primary font-headline-md text-body-lg font-medium py-4 px-6 rounded-xl shadow-[0_8px_32px_rgba(42,187,167,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:hover:translate-y-0 w-full shrink-0">
              <span>Запустити перевірку</span>
              <span className="material-symbols-outlined text-3xl transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Bottom Adsterra Banner */}
        <AdsterraBanner
          containerId="container-0acae988e7ace003a0345a1c382bef41"
          scriptSrc="https://pl30923793.effectivecpmnetwork.com/0acae988e7ace003a0345a1c382bef41/invoke.js"
          className="w-full max-w-container-max mx-auto mt-2 rounded-xl border border-white/5 bg-white/[0.01] p-2 min-h-[90px]"
        />
      </div>

      {/* Right Sidebar Ad (desktop >= 1536px) */}
      <aside className="hidden 2xl:flex w-[160px] shrink-0 sticky top-24 justify-center items-center py-4 text-center">
        {/* Right skyscraper unit can be added here */}
      </aside>
    </div>
  );
}
