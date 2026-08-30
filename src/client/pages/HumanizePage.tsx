import { useState } from "react";
import { useHumanize } from "../hooks/useHumanize";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { useWordExport } from "../hooks/useWordExport";
import { HumanizePanel } from "../components/HumanizePanel";
import { useNavigate } from "react-router-dom";
import type { HumanizeMode } from "../../shared/types";

export default function HumanizePage({ showToast }: { showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
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
      showToast("Для редагування додайте файл або щонайменше 20 слів.", "error");
      return;
    }
    showToast("Редагую стиль тексту згідно обраного режиму...", "info");
    try {
      const result = await handleHumanize(editor.text, editor.sourceHtml, editor.selectedFile, mode);
      showToast(`Редагування готове: ${result.changes.length} груп змін.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Редагування не вдалося.", "error");
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Олюднення тексту (Text Humanizer)</h1>
        <p className="text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Науковий інструмент переписування тексту: усуває штучні LLM-шаблони, нормалізує темпоритм (Burstiness), перетворює пасивні форми на активні та зберігає структуру документа.
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
              : "text-on-surface-variant hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="material-symbols-outlined text-lg">school</span>
          <span>Академічний</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("natural")}
          className={`flex-1 py-3 px-4 rounded-xl font-body-md font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "natural"
              ? "bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/40 shadow-sm"
              : "text-on-surface-variant hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          <span>Природний</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("concise")}
          className={`flex-1 py-3 px-4 rounded-xl font-body-md font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "concise"
              ? "bg-emerald-glow/20 text-emerald-glow border border-emerald-glow/40 shadow-sm"
              : "text-on-surface-variant hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
          <span>Лаконічний</span>
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
                "Вставте текст або завантажте файл"
              )}
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              {editor.selectedFile ? "Файл завантажено для стильового редагування" : "Підтримуються формати .docx, .pdf"}
            </span>
          </div>

          <label className="bg-surface-variant/80 hover:bg-surface-bright text-white px-4 py-2 rounded-full font-label-sm text-label-sm border border-outline-variant hover:border-emerald-glow transition-all flex items-center gap-2 cursor-pointer shrink-0">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {editor.selectedFile ? "Замінити файл" : "Вибрати файл"}
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
              Вставте текст сюди або завантажте документ...
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-2 relative">
        <button
          onClick={onHumanize}
          disabled={humanizerBusy || !canHumanize}
          className="relative z-10 bg-gradient-to-br from-emerald-glow to-primary-container hover:from-primary hover:to-emerald-glow text-on-primary font-headline-md text-body-lg font-medium py-4 px-10 rounded-xl shadow-[0_8px_32px_rgba(42,187,167,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 group disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <span>{humanizerBusy ? "Редагування..." : "Олюднити текст"}</span>
          <span className="material-symbols-outlined text-2xl transition-transform group-hover:rotate-12">auto_fix_high</span>
        </button>
      </div>

      {humanized && (
        <div className="mt-6">
          <HumanizePanel
            humanized={humanized}
            wordDownloadBusy={wordExport.wordDownloadBusy}
            selectedFile={editor.selectedFile}
            onMoveToChecker={() => {
              showToast("Відредагований текст перенесено. Будь ласка, перейдіть на головну для перевірки.", "info");
              navigate("/");
            }}
            onCopyFormatted={() => void wordExport.copyHumanizedFormatted(humanized)}
            onDownloadForWord={() => void wordExport.downloadHumanizedForWord(humanized, editor.selectedFile, editor.fileName)}
          />
        </div>
      )}
    </div>
  );
}
