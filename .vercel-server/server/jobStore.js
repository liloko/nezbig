import { DistributedCache } from "./searchCache.js";
export const scanJobCache = new DistributedCache("scan-job", 1000 * 60 * 60 * 2, 200);
