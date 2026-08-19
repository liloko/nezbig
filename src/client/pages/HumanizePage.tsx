import { useState } from "react";
import { useHumanize } from "../hooks/useHumanize";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { useWordExport } from "../hooks/useWordExport";
import { HumanizePanel } from "../components/HumanizePanel";
import { useNavigate } from "react-router-dom";

export default function HumanizePage({ showToast }: { showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [message, setMessage] = useState("");
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
    showToast("Редагую стиль тексту...", "info");
    try {
      const result = await handleHumanize(editor.text, editor.sourceHtml, editor.selectedFile);
      showToast(`Редагування готове: ${result.changes.length} груп змін.`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Редагування не вдалося.", "error");
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-margin-desktop md:py-margin-desktop flex flex-col gap-12 relative z-10 fade-in">
      <h1 className="font-display-lg text-display-lg font-bold text-white mb-4">Олюднення тексту</h1>
      <p className="text-body-lg text-on-surface-variant mb-8 max-w-2xl">
        Наш AI-редактор допоможе переписати текст так, щоб він звучав природно, уникаючи типових "роботизованих" фраз та структур, які часто виявляються AI-детекторами.
      </p>

      <div className="glass-panel rounded-xl flex flex-col h-full border hover:border-emerald-glow/40 transition-colors duration-300 overflow-hidden relative group min-h-[400px]">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-surface-container-high/60">
          <h2 className="font-headline-md text-headline-md text-white">Текст для редагування</h2>
          <label className="bg-surface-variant/80 backdrop-blur-sm hover:bg-surface-bright text-white px-6 py-2 rounded-full font-label-sm text-label-sm border border-outline-variant hover:border-emerald-glow transition-all flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Вибрати файл
            <input type="file" className="hidden" accept=".docx,.pdf" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setHumanized(null);
                void editor.handleFile(file);
              }
            }} />
          </label>
        </div>
        <div className="flex-grow p-6 relative">
              <div 
                ref={editor.editorRef}
                className="rich-editor w-full h-full bg-transparent border-none resize-none focus:ring-0 text-body-lg text-white placeholder:text-on-surface-variant/60 custom-scrollbar p-0 overflow-y-auto [&_*]:!text-inherit [&_*]:!bg-transparent" 
                contentEditable
                onPaste={editor.handleRichPaste}
                onInput={() => editor.syncEditorFromDom(true)}
            suppressContentEditableWarning
          />
          {!editor.text && (
            <div className="absolute top-6 left-6 text-body-lg text-on-surface-variant/60 pointer-events-none">
              Вставте текст сюди...
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-4 relative">
        <button onClick={onHumanize} disabled={humanizerBusy || !canHumanize} className="relative z-10 bg-gradient-to-br from-emerald-glow to-primary-container hover:from-primary hover:to-emerald-glow text-on-primary font-headline-md text-headline-md font-medium py-4 px-12 rounded-xl shadow-[0_8px_32px_rgba(42,187,167,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 group disabled:opacity-50 disabled:hover:translate-y-0">
          <span>{humanizerBusy ? "Редагування..." : "Олюднити текст"}</span>
          <span className="material-symbols-outlined text-3xl transition-transform group-hover:translate-x-1">auto_fix_high</span>
        </button>
      </div>

      {humanized && (
        <div className="mt-12">
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
