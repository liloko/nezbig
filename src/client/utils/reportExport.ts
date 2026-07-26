import { jsPDF } from "jspdf";
import type { ScanReport } from "../../shared/types";
import { riskLabel, aiVerdictLabel, reportSummaryText, formatNumber } from "./reportLabels";

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function generateReportCanvas(report: ScanReport): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 1400;
  const height = 1800;
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const printBlack = "#111111";
  const printGray = "#555555";
  const printLight = "#e6e6e6";
  const printPaper = "#ffffff";

  context.scale(scale, scale);
  context.fillStyle = printPaper;
  context.fillRect(0, 0, width, height);

  context.fillStyle = printBlack;
  context.font = "700 22px Actay, sans-serif";
  context.fillText("ЗВІТ НЕЗБІГ", 70, 72);
  context.font = "700 48px 'Actay Wide', Actay, sans-serif";
  const titleY = wrapCanvasText(context, report.fileName, 70, 132, 920, 56);
  context.font = "400 24px Actay, sans-serif";
  context.fillText(new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt)), 1050, 72);
  context.strokeStyle = printBlack;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(70, Math.max(210, titleY + 18));
  context.lineTo(1330, Math.max(210, titleY + 18));
  context.stroke();

  let y = Math.max(260, titleY + 48);
  const cardWidth = 280;
  const cards = [
    ["Плагіат", `${report.plagiarismScore}%`, `${riskLabel(report.plagiarismScore)} ризик`],
    ["ШІ-аналіз", report.aiVerdict === "insufficient" ? "—" : `${report.aiProbability}%`, aiVerdictLabel(report.aiVerdict)],
    [
      "AI-думка",
      report.aiOpinionProbability !== undefined ? `${report.aiOpinionProbability}%` : "…",
      report.aiOpinionProbability !== undefined ? `${riskLabel(report.aiOpinionProbability)} рівень` : "очікує модель"
    ],
    ["Фрагменти", formatNumber(report.chunksChecked), `${formatNumber(report.wordCount)} слів`]
  ];

  for (const [index, card] of cards.entries()) {
    const x = 70 + index * (cardWidth + 35);
    context.fillStyle = printPaper;
    context.strokeStyle = printBlack;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x, y, cardWidth, 170, 14);
    context.fill();
    context.stroke();
    context.fillStyle = printGray;
    context.font = "700 24px Actay, sans-serif";
    context.fillText(card[0], x + 28, y + 48);
    context.fillStyle = printBlack;
    context.font = "800 70px 'Actay Wide', Actay, sans-serif";
    context.fillText(card[1], x + 28, y + 116);
    context.fillStyle = printGray;
    context.font = "400 22px Actay, sans-serif";
    context.fillText(card[2], x + 28, y + 148);
  }

  y += 225;
  context.fillStyle = printBlack;
  context.font = "800 28px 'Actay Wide', Actay, sans-serif";
  context.fillText("Підсумок", 70, y);
  context.fillStyle = printGray;
  context.font = "400 24px Actay, sans-serif";
  y = wrapCanvasText(context, reportSummaryText(report), 70, y + 42, 1220, 34) + 22;

  if (report.scanNotes?.length) {
    context.fillStyle = printBlack;
    context.font = "800 26px 'Actay Wide', Actay, sans-serif";
    context.fillText("Примітки перевірки", 70, y);
    context.fillStyle = printGray;
    context.font = "400 22px Actay, sans-serif";
    y += 38;
    for (const note of report.scanNotes.slice(0, 4)) {
      y = wrapCanvasText(context, `- ${note}`, 90, y, 1180, 30);
    }
    y += 18;
  }

  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(70, y);
  context.lineTo(1330, y);
  context.stroke();
  y += 36;

  context.fillStyle = printBlack;
  context.font = "800 28px 'Actay Wide', Actay, sans-serif";
  context.fillText("Ймовірні джерела", 70, y);
  y += 46;
  context.font = "400 22px Actay, sans-serif";
  context.fillStyle = printGray;

  const matches = report.matches.slice(0, 5);
  if (matches.length === 0) {
    y = wrapCanvasText(context, "Сильних збігів у відкритих вебджерелах не знайдено.", 70, y, 1220, 32) + 26;
  } else {
    for (const match of matches) {
      context.fillStyle = printBlack;
      context.font = "800 24px Actay, sans-serif";
      y = wrapCanvasText(context, `${match.score}% - ${match.title}`, 70, y, 1220, 32);
      context.fillStyle = printGray;
      context.font = "400 21px Actay, sans-serif";
      const evidenceLabel = match.confidence === "page" ? "підтверджено сторінкою" : "пошукова підказка";
      y = wrapCanvasText(
        context,
        `${match.url} | ${evidenceLabel} | слова ${match.overlapPercent}%, хеші ${match.hashOverlapPercent}%, full-text ${match.fullTextRank}%`,
        90,
        y + 6,
        1180,
        29
      );
      if (match.confidence === "page" && match.submittedEvidence) {
        y = wrapCanvasText(context, `Спільний уривок: ${match.submittedEvidence}`, 90, y + 4, 1180, 29);
      }
      y += 18;
    }
  }

  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(70, y);
  context.lineTo(1330, y);
  context.stroke();
  y += 36;

  context.fillStyle = printBlack;
  context.font = "800 28px 'Actay Wide', Actay, sans-serif";
  context.fillText("AI-сигнали", 70, y);
  y += 44;
  for (const signal of report.aiSignals.slice(0, 5)) {
    context.fillStyle = printBlack;
    context.font = "800 23px Actay, sans-serif";
    context.fillText(`${signal.label}: ${signal.score}%`, 70, y);
    context.fillStyle = printGray;
    context.font = "400 21px Actay, sans-serif";
    y = wrapCanvasText(context, signal.detail, 90, y + 32, 1180, 29) + 16;
  }

  return canvas;
}

export function downloadReportPng(report: ScanReport): void {
  const canvas = generateReportCanvas(report);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nezbig-report-${new Date(report.checkedAt).toISOString().slice(0, 10)}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function downloadReportPdf(report: ScanReport): void {
  const canvas = generateReportCanvas(report);
  const imgData = canvas.toDataURL("image/png");
  
  // A4 size: 210mm x 297mm. Calculate scaled height for A4 width
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`nezbig-report-${new Date(report.checkedAt).toISOString().slice(0, 10)}.pdf`);
}
