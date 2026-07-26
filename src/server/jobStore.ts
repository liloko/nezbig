import { DistributedCache } from "./searchCache.js";
import type { ScanReport } from "../shared/types.js";

export type ScanJobStatus = "pending" | "processing" | "completed" | "error";

export type ScanJob = {
  id: string;
  status: ScanJobStatus;
  progress?: {
    chunksChecked: number;
    totalChunks: number;
  };
  result?: ScanReport;
  error?: string;
  createdAt: string;
};

export const scanJobCache = new DistributedCache<ScanJob>("scan-job", 1000 * 60 * 60 * 2, 200);
export const reportCache = new DistributedCache<ScanReport>("scan-report", 1000 * 60 * 60 * 24 * 7, 500);
