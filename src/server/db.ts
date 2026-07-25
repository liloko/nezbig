import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl ? new Redis(redisUrl) : null;

if (redis) {
  redis.on("error", (err: unknown) => console.error("[Redis] Error:", err));
  console.log("[Redis] Connected for History & Cache");
}

export async function saveReport(reportId: string, report: any): Promise<void> {
  if (!redis) return;
  // Expire history in 30 days
  await redis.set(`history:${reportId}`, JSON.stringify(report), "EX", 60 * 60 * 24 * 30);
}

export async function getReport(reportId: string): Promise<any | null> {
  if (!redis) return null;
  const data = await redis.get(`history:${reportId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
