import type { Context, Hono } from "hono";
import { AuthService } from "../services/AuthService";
import { SessionRepository } from "../db/repositories/SessionRepository";
import { Controller } from "./Controller";
import { loginSchema, registerSchema } from "../validation/authSchemas";
import { getBearerToken } from "../middleware/AuthMiddleware";

const SESSION_TTL_SEC = 60 * 60 * 24; // 24 hours

export class AuthController extends Controller {
    path = "/auth";

    private authService: AuthService;
    private sessionRepository: SessionRepository;

    constructor(
        authService: AuthService,
        sessionRepository: SessionRepository,
    ) {
        super();
        this.authService = authService;
        this.sessionRepository = sessionRepository;
    }

    register(app: Hono) {
        app.post(`${this.path}/register`, (c: Context) => this.registerUser(c));
        app.post(`${this.path}/login`, (c: Context) => this.loginUser(c));
        app.post(`${this.path}/logout`, (c: Context) => this.logoutUser(c));
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

        const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);
        const session = await this.sessionRepository.create(
            result.id,
            expiresAt,
        );

        return c.json({
            token: session.id,
            tokenType: "Bearer",
            expiresAt: session.expiresAt.toISOString(),
            user: {
                id: result.id,
                email: result.email,
                createdAt: result.createdAt.toISOString(),
            },
        });
    }

    private async logoutUser(c: Context) {
        const token = getBearerToken(c);

        if (token) {
            await this.sessionRepository.deleteBySessionId(token);
        }

        return c.json({ ok: true });
    }
}
