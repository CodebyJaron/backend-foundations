import type { Context, MiddlewareHandler } from "hono";
import { SessionRepository } from "../db/repositories/SessionRepository";

export function getBearerToken(c: Context): string | undefined {
    const header = c.req.header("authorization") ?? "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || undefined;
}

export function authMiddleware(
    sessionRepository: SessionRepository,
): MiddlewareHandler {
    return async (c: Context, next) => {
        const token = getBearerToken(c);

        if (!token) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const userId =
            await sessionRepository.findValidUserIdBySessionId(token);

        if (!userId) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        c.set("userId", userId);
        await next();
    };
}
