import type { Context, Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { Controller } from "./Controller";

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY_SEC = 60 * 60;

const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export class AuthController extends Controller {
    path = "/auth";

    private authService: AuthService;

    constructor(authService: AuthService) {
        super();
        this.authService = authService;
    }

    register(app: Hono) {
        app.post(`${this.path}/register`, (c: Context) => this.registerUser(c));
        app.post(`${this.path}/login`, (c: Context) => this.loginUser(c));
    }

    private async registerUser(c: Context) {
        const body = await c.req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                { error: "Validation failed", issues: parsed.error.issues },
                400,
            );
        }
        const { email, password } = parsed.data;

        const result = await this.authService.register(email, password);

        if ("error" in result) {
            return c.json({ error: result.error }, 400);
        }

        return c.json(
            {
                id: result.id,
                email: result.email,
                createdAt: result.createdAt.toISOString(),
            },
            201,
        );
    }

    private async loginUser(c: Context) {
        const body = await c.req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                { error: "Validation failed", issues: parsed.error.issues },
                400,
            );
        }
        const { email, password } = parsed.data;

        const result = await this.authService.login(email, password);

        if ("error" in result) {
            return c.json({ error: result.error }, 401);
        }

        // unit
        const now = Math.floor(Date.now() / 1000);
        const accessToken = await sign(
            {
                sub: result.id,
                iat: now,
                exp: now + TOKEN_EXPIRY_SEC,
            },
            JWT_SECRET,
            "HS256",
        );

        return c.json({
            accessToken,
            user: {
                id: result.id,
                email: result.email,
                createdAt: result.createdAt.toISOString(),
            },
        });
    }
}
