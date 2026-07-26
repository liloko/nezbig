import DOMPurify from "dompurify";

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty; // SSR fallback
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ["b", "i", "em", "strong"] });
}

export function stripHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
