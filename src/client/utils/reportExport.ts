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
 * Calculates the exact dynamic height needed for the report content
 */
function estimateReportHeight(report: ScanReport): number {
  let h = 400; // Header, title, separator, cards
  h += 240; // Summary section
  if (report.scanNotes?.length) {
    h += 60 + report.scanNotes.slice(0, 4).length * 35;
  }
  const matchCount = Math.max(1, Math.min(6, report.matches.length));
  h += 80 + matchCount * 85;
  if (report.aiOpinionNote) {
    h += 140;
  }
  const signalCount = Math.min(6, report.aiSignals.length);
  h += 80 + signalCount * 75;
  h += 120; // Footer & padding
  return Math.max(1600, h);
}

export function generateReportCanvas(report: ScanReport): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 1400;
  const height = estimateReportHeight(report);
  const scale = 2; // High-resolution export for crisp text

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
  context.font = "800 20px 'Actay Wide', Actay, sans-serif";
  context.fillText("НЕЗБІГ 2.0  •  ОФІЦІЙНИЙ ЗВІТ ОРИГІНАЛЬНОСТІ", 70, 68);

  // Date
  context.font = "500 20px Actay, sans-serif";
  context.fillStyle = printGray;
  const dateStr = new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt));
  context.fillText(dateStr, 1080, 68);

  // File Name Title
  context.fillStyle = printBlack;
  context.font = "800 42px 'Actay Wide', Actay, sans-serif";
  const titleY = wrapCanvasText(context, report.fileName, 70, 126, 1220, 52);

  // Header separator
  context.strokeStyle = printBlack;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(70, Math.max(190, titleY + 16));
  context.lineTo(1330, Math.max(190, titleY + 16));
  context.stroke();

  // Metrics Grid Cards
  let y = Math.max(240, titleY + 46);
  const cardWidth = 286;
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
    const x = 70 + index * (cardWidth + 24);
    context.fillStyle = printCardBg;
    context.strokeStyle = printLight;
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(x, y, cardWidth, 160, 12);
    context.fill();
    context.stroke();

    context.fillStyle = printGray;
    context.font = "700 20px Actay, sans-serif";
    context.fillText(card[0], x + 24, y + 42);

    context.fillStyle = printBlack;
    context.font = "800 60px 'Actay Wide', Actay, sans-serif";
    context.fillText(card[1], x + 24, y + 106);

    context.fillStyle = printGray;
    context.font = "500 19px Actay, sans-serif";
    context.fillText(card[2], x + 24, y + 138);
  }

  y += 210;

  // Summary Section
  context.fillStyle = printBlack;
  context.font = "800 26px 'Actay Wide', Actay, sans-serif";
  context.fillText("Підсумок перевірки", 70, y);
  context.fillStyle = printDark;
  context.font = "400 23px Actay, sans-serif";
  y = wrapCanvasText(context, reportSummaryText(report), 70, y + 38, 1220, 34) + 20;

  // AI Opinion Summary (if present)
  if (report.aiOpinionNote) {
    context.fillStyle = printCardBg;
    context.strokeStyle = accentEmerald;
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(70, y, 1260, 110, 10);
    context.fill();
    context.stroke();

    context.fillStyle = accentEmerald;
    context.font = "800 20px 'Actay Wide', Actay, sans-serif";
    context.fillText("Експертний AI-висновок нейромережі", 95, y + 36);

    context.fillStyle = printDark;
    context.font = "400 20px Actay, sans-serif";
    wrapCanvasText(context, report.aiOpinionNote, 95, y + 68, 1210, 28);
    y += 135;
  }

  // Scan Notes
  if (report.scanNotes?.length) {
    context.fillStyle = printBlack;
    context.font = "800 24px 'Actay Wide', Actay, sans-serif";
    context.fillText("Примітки та надійність аналізу", 70, y);
    context.fillStyle = printGray;
    context.font = "400 20px Actay, sans-serif";
    y += 34;
    for (const note of report.scanNotes.slice(0, 4)) {
      y = wrapCanvasText(context, `•  ${note}`, 85, y, 1180, 28);
    }
    y += 18;
  }

  // Separator
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(70, y);
  context.lineTo(1330, y);
  context.stroke();
  y += 36;

  // Sources Section
  context.fillStyle = printBlack;
  context.font = "800 26px 'Actay Wide', Actay, sans-serif";
  context.fillText("Знайдені джерела та збіги", 70, y);
  y += 42;
  context.font = "400 20px Actay, sans-serif";
  context.fillStyle = printGray;

  const matches = report.matches.slice(0, 5);
  if (matches.length === 0) {
    y = wrapCanvasText(context, "Сильних збігів у відкритих наукових базах та вебджерелах не знайдено.", 70, y, 1220, 30) + 24;
  } else {
    for (const match of matches) {
      context.fillStyle = printBlack;
      context.font = "800 22px Actay, sans-serif";
      y = wrapCanvasText(context, `${match.score}% збігу  —  ${match.title}`, 70, y, 1220, 30);

      context.fillStyle = printGray;
      context.font = "400 19px Actay, sans-serif";
      const evidenceLabel = match.confidence === "page" ? "текст підтверджено джерелом" : "пошуковий уривок";
      y = wrapCanvasText(
        context,
        `${match.url}  •  ${match.provider}  •  ${evidenceLabel}`,
        90,
        y + 4,
        1180,
        26
      );
      if (match.confidence === "page" && match.submittedEvidence) {
        context.fillStyle = printDark;
        y = wrapCanvasText(context, `Спільний уривок: «${match.submittedEvidence}»`, 90, y + 4, 1180, 26);
      }
      y += 16;
    }
  }

  // Separator
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(70, y);
  context.lineTo(1330, y);
  context.stroke();
  y += 36;

  // AI Signals Section
  context.fillStyle = printBlack;
  context.font = "800 26px 'Actay Wide', Actay, sans-serif";
  context.fillText("Маркери штучного інтелекту (AI Signals)", 70, y);
  y += 40;

  for (const signal of report.aiSignals.slice(0, 5)) {
    context.fillStyle = printBlack;
    context.font = "800 21px Actay, sans-serif";
    context.fillText(`${signal.label}: ${signal.score}%`, 70, y);

    context.fillStyle = printGray;
    context.font = "400 19px Actay, sans-serif";
    y = wrapCanvasText(context, signal.detail, 90, y + 28, 1180, 26) + 14;
  }

  // Footer
  y = Math.max(y + 20, height - 50);
  context.strokeStyle = printLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(70, y - 20);
  context.lineTo(1330, y - 20);
  context.stroke();

  context.fillStyle = printGray;
  context.font = "500 17px Actay, sans-serif";
  context.fillText(`ID звіту: ${report.id}  •  Перевірено на nezbig.vercel.app  •  Всі права захищено`, 70, y + 6);

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

export function downloadReportPdf(report: ScanReport): void {
  const canvas = generateReportCanvas(report);
  const imgData = canvas.toDataURL("image/png", 1.0);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeightMm;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightMm, undefined, "FAST");
  heightLeft -= pdfHeight;

  // Additional pages if needed
  while (heightLeft > 5) {
    position = position - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightMm, undefined, "FAST");
    heightLeft -= pdfHeight;
  }

  const safeName = report.fileName.replace(/[^a-z0-9а-яіїєґ]/gi, "_");
  pdf.save(`nezbig-report-${safeName}.pdf`);
}
