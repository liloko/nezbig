import type { ScanReport } from "../../shared/types";
import { downloadReportPng } from "../utils/reportExport";

interface ExportToolbarProps {
  report: ScanReport;
}

export function ExportToolbar({ report }: ExportToolbarProps) {
  const downloadIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button className="secondary-button" type="button" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {downloadIcon}
        PDF
      </button>
      <button className="secondary-button" type="button" onClick={() => downloadReportPng(report)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {downloadIcon}
        PNG
      </button>
    </div>
  );
}
