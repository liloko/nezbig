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

/**
 * Calculates the exact height needed for the report
 */
function estimateReportHeight(report: ScanReport): number {
  let h = 380; // Header, title, separator, cards
  h += 200; // Summary section
  if (report.scanNotes?.length) {
    h += 50 + report.scanNotes.slice(0, 4).length * 32;
  }
  const matchCount = Math.max(1, Math.min(5, report.matches.length));
  h += 70 + matchCount * 80;
  if (report.aiOpinionNote) {
    h += 130;
  }
  const signalCount = Math.min(5, report.aiSignals.length);
  h += 70 + signalCount * 70;
  h += 100; // Footer & padding
  return Math.max(1400, h);
}

export function generateReportCanvas(report: ScanReport): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = estimateReportHeight(report);
  const scale = 1.5; // High resolution with lightweight memory footprint

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const printBlack = "#0f172a";
  const printDark = "#1e293b";
  const printGray = "#475569";
  const printLight = "#e2e8f0";
  const printCardBg = "#f8fafc";
  const printPaper = "#ffffff";
  const accentEmerald = "#059669";

  context.scale(scale, scale);
  context.fillStyle = printPaper;
  context.fillRect(0, 0, width, height);

  // Top header brand
  context.fillStyle = accentEmerald;
  context.font = "800 18px 'Actay Wide', Actay, sans-serif";
  context.fillText("НЕЗБІГ 2.0  •  ОФІЦІЙНИЙ ЗВІТ ОРИГІНАЛЬНОСТІ", 60, 60);

  // Date
  context.font = "500 18px Actay, sans-serif";
  context.fillStyle = printGray;
  const dateStr = new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt));
  context.fillText(dateStr, 930, 60);

  // File Name Title
  context.fillStyle = printBlack;
  context.font = "800 36px 'Actay Wide', Actay, sans-serif";
  const titleY = wrapCanvasText(context, report.fileName, 60, 114, 1080, 46);

  // Header separator
  context.strokeStyle = printBlack;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(60, Math.max(165, titleY + 14));
  context.lineTo(1140, Math.max(165, titleY + 14));
  context.stroke();

  // Metrics Grid Cards
  let y = Math.max(210, titleY + 40);
  const cardWidth = 250;
  const cards = [
    ["Плагіат", `${report.plagiarismScore}%`, `${riskLabel(report.plagiarismScore)} ризик`],
    ["ШІ-аналіз", report.aiVerdict === "insufficient" ? "—" : `${report.aiProbability}%`, aiVerdictLabel(report.aiVerdict)],
    [
      "AI-думка",
      report.aiOpinionProbability !== undefined ? `${report.aiOpinionProbability}%` : "—",
      report.aiOpinionProbability !== undefined ? `${riskLabel(report.aiOpinionProbability)} рівень` : "модель не задіяна"
    ],
    ["Фрагменти", formatNumber(report.chunksChecked), `${formatNumber(report.wordCount)} слів`]
  ];

  for (const [index, card] of cards.entries()) {
    const x = 60 + index * (cardWidth + 26);
    context.fillStyle = printCardBg;
    context.strokeStyle = printLight;
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(x, y, cardWidth, 145, 10);
    context.fill();
    context.stroke();

    context.fillStyle = printGray;
    context.font = "700 18px Actay, sans-serif";
    context.fillText(card[0], x + 20, y + 38);

    context.fillStyle = printBlack;
    context.font = "800 52px 'Actay Wide', Actay, sans-serif";
    context.fillText(card[1], x + 20, y + 96);

    context.fillStyle = printGray;
    context.font = "500 17px Actay, sans-serif";
    context.fillText(card[2], x + 20, y + 125);
  }

  y += 185;

  // Summary Section
  context.fillStyle = printBlack;
  context.font = "800 24px 'Actay Wide', Actay, sans-serif";
  context.fillText("Підсумок перевірки", 60, y);
  context.fillStyle = printDark;
  context.font = "400 21px Actay, sans-serif";
  y = wrapCanvasText(context, reportSummaryText(report), 60, y + 34, 1080, 30) + 16;

  // AI Opinion Summary (if present)
  if (report.aiOpinionNote) {
    context.fillStyle = printCardBg;
    context.strokeStyle = accentEmerald;
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(60, y, 1080, 100, 8);
    context.fill();
    context.stroke();

    context.fillStyle = accentEmerald;
    context.font = "800 18px 'Actay Wide', Actay, sans-serif";
    context.fillText("Експертний AI-висновок нейромережі", 80, y + 32);

    context.fillStyle = printDark;
    context.font = "400 18px Actay, sans-serif";
    wrapCanvasText(context, report.aiOpinionNote, 80, y + 60, 1040, 25);
    y += 120;
  }

  // Scan Notes
  if (report.scanNotes?.length) {
    context.fillStyle = printBlack;
    context.font = "800 22px 'Actay Wide', Actay, sans-serif";
    context.fillText("Примітки та надійність аналізу", 60, y);
    context.fillStyle = printGray;
    context.font = "400 18px Actay, sans-serif";
    y += 30;
    for (const note of report.scanNotes.slice(0, 4)) {
      y = wrapCanvasText(context, `•  ${note}`, 75, y, 1050, 25);
    }
    y += 14;
  }

  // Separator
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(60, y);
  context.lineTo(1140, y);
  context.stroke();
  y += 32;

  // Sources Section
  context.fillStyle = printBlack;
  context.font = "800 24px 'Actay Wide', Actay, sans-serif";
  context.fillText("Знайдені джерела та збіги", 60, y);
  y += 36;
  context.font = "400 18px Actay, sans-serif";
  context.fillStyle = printGray;

  const matches = report.matches.slice(0, 5);
  if (matches.length === 0) {
    y = wrapCanvasText(context, "Сильних збігів у відкритих наукових базах та вебджерелах не знайдено.", 60, y, 1080, 28) + 20;
  } else {
    for (const match of matches) {
      context.fillStyle = printBlack;
      context.font = "800 20px Actay, sans-serif";
      y = wrapCanvasText(context, `${match.score}% збігу  —  ${match.title}`, 60, y, 1080, 28);

      context.fillStyle = printGray;
      context.font = "400 17px Actay, sans-serif";
      const evidenceLabel = match.confidence === "page" ? "текст підтверджено джерелом" : "пошуковий уривок";
      y = wrapCanvasText(
        context,
        `${match.url}  •  ${match.provider}  •  ${evidenceLabel}`,
        80,
        y + 4,
        1050,
        24
      );
      if (match.confidence === "page" && match.submittedEvidence) {
        context.fillStyle = printDark;
        y = wrapCanvasText(context, `Спільний уривок: «${match.submittedEvidence}»`, 80, y + 4, 1050, 24);
      }
      y += 14;
    }
  }

  // Separator
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(60, y);
  context.lineTo(1140, y);
  context.stroke();
  y += 32;

  // AI Signals Section
  context.fillStyle = printBlack;
  context.font = "800 24px 'Actay Wide', Actay, sans-serif";
  context.fillText("Маркери штучного інтелекту (AI Signals)", 60, y);
  y += 36;

  for (const signal of report.aiSignals.slice(0, 5)) {
    context.fillStyle = printBlack;
    context.font = "800 19px Actay, sans-serif";
    context.fillText(`${signal.label}: ${signal.score}%`, 60, y);

    context.fillStyle = printGray;
    context.font = "400 17px Actay, sans-serif";
    y = wrapCanvasText(context, signal.detail, 80, y + 24, 1050, 24) + 12;
  }

  // Footer
  y = Math.max(y + 20, height - 40);
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(60, y - 16);
  context.lineTo(1140, y - 16);
  context.stroke();

  context.fillStyle = printGray;
  context.font = "500 15px Actay, sans-serif";
  context.fillText(`ID звіту: ${report.id}  •  Перевірено на nezbig.vercel.app  •  Всі права захищено`, 60, y + 6);

  return canvas;
}

export function downloadReportPng(report: ScanReport): void {
  const canvas = generateReportCanvas(report);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = report.fileName.replace(/[^a-z0-9а-яіїєґ]/gi, "_");
    link.download = `nezbig-report-${safeName}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/**
 * Generates an instant, crisp A4 PDF document without browser freezing
 */
export function downloadReportPdf(report: ScanReport): void {
  const fullCanvas = generateReportCanvas(report);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pdfWidthMm = 210;
  const pdfHeightMm = 297;
  const a4Ratio = pdfHeightMm / pdfWidthMm; // 1.4142857

  // Pixel dimensions for each A4 page slice
  const canvasCssWidth = 1200;
  const scale = 1.5;
  const pageHeightCss = Math.round(canvasCssWidth * a4Ratio); // 1697 px
  const pageHeightRaw = pageHeightCss * scale;
  const totalHeightRaw = fullCanvas.height;

  const totalPages = Math.max(1, Math.ceil(totalHeightRaw / pageHeightRaw));

  for (let page = 0; page < totalPages; page += 1) {
    if (page > 0) {
      pdf.addPage();
    }

    // Create single-page slice canvas
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = pageHeightRaw;

    const pageCtx = pageCanvas.getContext("2d");
    if (!pageCtx) continue;

    // Fill white background
    pageCtx.fillStyle = "#ffffff";
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    // Source slice rectangle
    const sy = page * pageHeightRaw;
    const sHeight = Math.min(pageHeightRaw, totalHeightRaw - sy);

    pageCtx.drawImage(
      fullCanvas,
      0, sy, fullCanvas.width, sHeight,
      0, 0, fullCanvas.width, sHeight
    );

    // Fast native JPEG stream compression (takes ~15ms vs 15000ms PNG inflate)
    const pageJpegData = pageCanvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(pageJpegData, "JPEG", 0, 0, pdfWidthMm, pdfHeightMm, undefined, "FAST");
  }

  const safeName = report.fileName.replace(/[^a-z0-9а-яіїєґ]/gi, "_");
  pdf.save(`nezbig-report-${safeName}.pdf`);
}
