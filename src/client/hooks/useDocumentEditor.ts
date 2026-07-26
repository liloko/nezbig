import { useState, useRef, useCallback, type ClipboardEvent } from "react";
import { insertRichHtmlAtSelection } from "../richPaste";
import { htmlFromPlainText, plainTextFromRichHtml, sanitizeRichHtml } from "../richText";
import type { UploadedText } from "../../shared/types";

export function useDocumentEditor(onMessage?: (msg: string) => void) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("Вставлений текст");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceHtml, setSourceHtml] = useState("");
  const [formattedPreviewBusy, setFormattedPreviewBusy] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const setEditorContent = useCallback((html: string, plainText: string) => {
    setSourceHtml(html);
    setText(plainText);
    window.requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = html;
    });
  }, []);

  const syncEditorFromDom = useCallback((clearFile = true) => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichHtml(editor.innerHTML);
    setText(plainTextFromRichHtml(html));
    setSourceHtml(html);
    if (clearFile) {
      setFileName("Вставлений текст");
      setSelectedFile(null);
    }
  }, []);

  const handleRichPaste = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const clipboardHtml = event.clipboardData.getData("text/html");
    const clipboardText = event.clipboardData.getData("text/plain");
    const hasRichHtml = clipboardHtml.trim().length > 0;
    const html = hasRichHtml ? sanitizeRichHtml(clipboardHtml) : htmlFromPlainText(clipboardText);
    insertRichHtmlAtSelection(event.currentTarget, html);
    syncEditorFromDom(true);
    onMessage?.(hasRichHtml ? "Текст вставлено разом із форматуванням Word." : "Текст вставлено без форматування.");
  }, [syncEditorFromDom, onMessage]);

  const loadFormattedPreview = useCallback(async (file: File) => {
    setFormattedPreviewBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/extract", { method: "POST", body: formData });
      const payload = (await response.json()) as UploadedText | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Не вдалося прочитати форматування.");
      }

      const html = payload.html ? sanitizeRichHtml(payload.html) : htmlFromPlainText(payload.text);
      setEditorContent(html, payload.text);
      onMessage?.(
        payload.html
          ? `Файл прикріплено: ${payload.fileName}. Форматування Word показано в preview; перевірка піде файлом.`
          : `Файл прикріплено: ${payload.fileName}. Форматованого preview немає, показано текст.`
      );
    } catch (error) {
      setEditorContent("", "");
      onMessage?.(error instanceof Error ? error.message : `Файл прикріплено: ${file.name}. Форматоване preview недоступне.`);
    } finally {
      setFormattedPreviewBusy(false);
    }
  }, [setEditorContent, onMessage]);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    setEditorContent("", "");
    onMessage?.(`Файл прикріплено: ${file.name}. Читаю форматування для preview; перевірка піде файлом.`);
    void loadFormattedPreview(file);
  }, [setEditorContent, loadFormattedPreview, onMessage]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFileName("Вставлений текст");
    setEditorContent("", "");
    onMessage?.("Файл прибрано. Можна вставити текст вручну.");
  }, [setEditorContent, onMessage]);

  return {
    text, fileName, selectedFile, sourceHtml, formattedPreviewBusy,
    editorRef, setEditorContent, syncEditorFromDom, handleRichPaste,
    handleFile, clearFile, setText, setFileName, setSelectedFile, setSourceHtml
  };
}
