import { useState } from "react";
import type { ScanReport } from "../../shared/types";
import { downloadReportPdf, downloadReportPng } from "../utils/reportExport";

interface ExportToolbarProps {
  report: ScanReport;
}

export function ExportToolbar({ report }: ExportToolbarProps) {
  const [exportingType, setExportingType] = useState<"pdf" | "png" | "json" | null>(null);

  const downloadIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  const handlePdfClick = () => {
    setExportingType("pdf");
    setTimeout(() => {
      try {
        downloadReportPdf(report);
      } finally {
        setExportingType(null);
      }
    }, 20);
  };

  const handlePngClick = () => {
    setExportingType("png");
    setTimeout(() => {
      try {
        downloadReportPng(report);
      } finally {
        setExportingType(null);
      }
    }, 20);
  };

  const handleJsonClick = () => {
    setExportingType("json");
    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = report.fileName.replace(/[^a-z0-9а-яіїєґ]/gi, "_");
      a.download = `${safeName}_report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        className="secondary-button"
        type="button"
        disabled={exportingType !== null}
        onClick={handlePdfClick}
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
      >
        {downloadIcon}
        {exportingType === "pdf" ? "PDF..." : "PDF"}
      </button>
      <button
        className="secondary-button"
        type="button"
        disabled={exportingType !== null}
        onClick={handlePngClick}
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
      >
        {downloadIcon}
        {exportingType === "png" ? "PNG..." : "PNG"}
      </button>
      <button
        className="secondary-button"
        type="button"
        disabled={exportingType !== null}
        onClick={handleJsonClick}
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
      >
        {downloadIcon}
        JSON
      </button>
    </div>
  );
}
