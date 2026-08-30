import { useState } from "react";
import { useHumanize } from "../hooks/useHumanize";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { useWordExport } from "../hooks/useWordExport";
import { useLanguage } from "../context/LanguageContext";
import { HumanizePanel } from "../components/HumanizePanel";
import { useNavigate } from "react-router-dom";
import type { HumanizeMode } from "../../shared/types";

export default function HumanizePage({ showToast }: { showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const { t, lang } = useLanguage();
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<HumanizeMode>("academic");
  const editor = useDocumentEditor(setMessage);
  const { humanized, setHumanized, humanizerBusy, handleHumanize } = useHumanize();
  const wordExport = useWordExport(setMessage);
  const navigate = useNavigate();

  const wordCount = editor.text.trim().split(/\s+/).filter(Boolean).length;
  const canHumanize = (editor.selectedFile !== null || wordCount >= 20) && !humanizerBusy;

  async function onHumanize() {
    if (!canHumanize) {
      showToast(lang === "uk" ? "Для редагування додайте файл або щонайменше 20 слів." : "Please add a file or at least 20 words to humanize.", "error");
      return;
    }
    showToast(lang === "uk" ? "Редагую стиль тексту згідно обраного режиму..." : "Rewriting text style according to selected mode...", "info");
    try {
      const result = await handleHumanize(editor.text, editor.sourceHtml, editor.selectedFile, mode);
      showToast(lang === "uk" ? `Редагування готове: ${result.changes.length} груп змін.` : `Humanizing complete: ${result.changes.length} groups of changes.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : (lang === "uk" ? "Редагування не вдалося." : "Humanization failed."), "error");
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">{t("humanizeTitle")}</h1>
        <p className="text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
          {lang === "uk"
            ? "Науковий інструмент переписування тексту: усуває штучні LLM-шаблони, нормалізує темпоритм (Burstiness), перетворює пасивні форми на активні та зберігає структуру документа."
            : "Scientific text humanization engine: removes artificial LLM patterns, modulates burstiness sentence pacing, resolves passive voice, and preserves document structure."}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-surface-container-high/70 backdrop-blur-md rounded-2xl border border-white/10 w-full max-w-2xl">
        <button
          type="button"
          onClick={() => setMode("academic")}
          className={`flex-1 py-3 px-4 rounded-xl font-body-md font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "academic"
              ? "bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/40 shadow-sm"
              : "text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span className="material-symbols-outlined text-lg">school</span>
          <span>{t("modeAcademic")}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("natural")}
          className={`flex-1 py-3 px-4 rounded-xl font-body-md font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "natural"
              ? "bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/40 shadow-sm"
              : "text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span className="material-symbols-outlined text-lg">eco</span>
          <span>{t("modeNatural")}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("concise")}
          className={`flex-1 py-3 px-4 rounded-xl font-body-md font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "concise"
              ? "bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/40 shadow-sm"
              : "text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
          <span>{t("modeConcise")}</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl flex flex-col h-full border border-white/10 hover:border-emerald-glow/40 transition-colors duration-300 overflow-hidden relative group min-h-[420px]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-surface-container-high/60 gap-4">
          <div className="flex flex-col min-w-0 pr-2">
            <h2 className="font-headline-sm text-headline-sm text-white font-medium truncate">
              {editor.selectedFile ? (
                <span className="flex items-center gap-2 text-emerald-glow">
                  <span className="material-symbols-outlined text-xl shrink-0">description</span>
                  <span className="truncate max-w-[240px] sm:max-w-[380px]">{editor.selectedFile.name}</span>
                </span>
              ) : (
                lang === "uk" ? "Вставте текст або завантажте файл" : "Paste text or upload file"
              )}
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              {editor.selectedFile ? (lang === "uk" ? "Файл завантажено для стильового редагування" : "File loaded for style humanization") : t("fileFormats")}
            </span>
          </div>

          <label className="bg-surface-variant/80 hover:bg-surface-bright text-white px-4 py-2 rounded-full font-label-sm text-label-sm border border-outline-variant hover:border-emerald-glow transition-all flex items-center gap-2 cursor-pointer shrink-0">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {editor.selectedFile ? (lang === "uk" ? "Замінити файл" : "Replace file") : (lang === "uk" ? "Вибрати файл" : "Choose file")}
            <input
              type="file"
              className="hidden"
              accept=".docx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setHumanized(null);
                  void editor.handleFile(file);
                }
              }}
            />
          </label>
        </div>

        <div className="flex-grow p-6 relative flex flex-col">
          <div
            ref={editor.editorRef}
            className="w-full h-full min-h-[260px] bg-transparent !border-0 !outline-none !shadow-none focus:!outline-none focus:!ring-0 text-body-lg text-white placeholder:text-on-surface-variant/60 custom-scrollbar !p-0 overflow-y-auto [&_*]:!text-inherit [&_*]:!bg-transparent"
            contentEditable
            onPaste={editor.handleRichPaste}
            onInput={() => editor.syncEditorFromDom(true)}
            suppressContentEditableWarning
          />
          {!editor.text && (
            <div className="absolute top-6 left-6 text-body-lg text-on-surface-variant/50 pointer-events-none select-none">
              {lang === "uk" ? "Вставте текст сюди або завантажте документ..." : "Paste text here or upload document..."}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-2 relative">
        <button
          onClick={onHumanize}
          disabled={!canHumanize || humanizerBusy}
          className="bg-emerald-glow hover:bg-emerald-glow/90 disabled:opacity-40 text-on-primary font-headline-md text-headline-sm px-8 py-4 rounded-xl shadow-lg shadow-emerald-glow/20 transition-all flex items-center gap-3 cursor-pointer disabled:cursor-not-allowed group"
        >
          {humanizerBusy ? (
            <>
              <span className="material-symbols-outlined animate-spin">refresh</span>
              <span>{t("humanizing")}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_fix_high</span>
              <span>{t("humanizeBtn")}</span>
            </>
          )}
        </button>
      </div>

      {humanized && (
        <HumanizePanel
          result={humanized}
          sourceHtml={editor.sourceHtml}
          sourceText={editor.text}
          fileName={editor.selectedFile?.name || "document.docx"}
          onExportDocx={() => wordExport.exportWord(humanized, editor.selectedFile?.name || "document.docx")}
          onScanHumanized={() => {
            navigate(`/?text=${encodeURIComponent(humanized.humanizedText)}`);
          }}
        />
      )}
    </div>
  );
}
