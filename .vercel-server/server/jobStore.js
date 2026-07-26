import { DistributedCache } from "./searchCache.js";
export const scanJobCache = new DistributedCache("scan-job", 1000 * 60 * 60 * 2, 200);
export const reportCache = new DistributedCache("scan-report", 1000 * 60 * 60 * 24 * 7, 500);
