import { Redis } from "ioredis";
const redisUrl = process.env.REDIS_URL;
export const redis = redisUrl ? new Redis(redisUrl) : null;
if (redis) {
    redis.on("error", (err) => console.error("[Redis] Error:", err));
    console.log("[Redis] Connected for History & Cache");
}
export async function saveReport(reportId, report) {
    if (!redis)
        return;
    try {
        // Expire history in 30 days
        await redis.set(`history:${reportId}`, JSON.stringify(report), "EX", 60 * 60 * 24 * 30);
        await redis.zadd("history:index", Date.now(), reportId);
        await redis.expire("history:index", 60 * 60 * 24 * 30);
    }
    catch (err) {
        console.error("[Redis] saveReport error:", err);
    }
}
export async function getReport(reportId) {
    if (!redis)
        return null;
    try {
        const data = await redis.get(`history:${reportId}`);
        if (data) {
            return JSON.parse(data);
        }
    }
    catch (err) {
        console.error("[Redis] getReport error:", err);
    }
    return null;
}
