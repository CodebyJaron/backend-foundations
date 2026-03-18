import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

type JwtPayload = {
    sub?: string;
    iat?: number;
    exp?: number;
};

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization") ?? "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return c.json(
            { error: "Missing or invalid Authorization header" },
            401,
        );
    }

    const token = match[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return c.json(
            { error: "Server misconfigured: JWT_SECRET missing" },
            500,
        );
    }

    try {
        const payload = await verify(token, secret, "HS256");
        if (!payload?.sub || typeof payload.sub !== "string") {
            return c.json({ error: "Invalid token payload" }, 401);
        }

        c.set("userId", payload.sub);
        await next();
    } catch {
        return c.json({ error: "Invalid or expired token" }, 401);
    }
};
