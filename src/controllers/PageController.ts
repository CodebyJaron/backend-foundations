import type { Context, Hono } from "hono";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { PageService } from "../services/PageService";
import { Controller } from "./Controller";
import {
    createPageSchema,
    pageParamSchema,
    surveyParamSchema,
    updatePageSchema,
} from "../validation/pageSchemas";

export class PageController extends Controller {
    path = "/surveys/:surveyId/pages";
    private readonly pageService: PageService;

    constructor(pageService: PageService) {
        super();
        this.pageService = pageService;
    }

    register(app: Hono) {
        app.get(`${this.path}`, authMiddleware, (c: Context) => this.list(c));

        app.get(`${this.path}/:id`, authMiddleware, (c: Context) =>
            this.getById(c),
        );

        app.post(`${this.path}`, authMiddleware, (c: Context) =>
            this.create(c),
        );

        app.put(`${this.path}/:id`, authMiddleware, (c: Context) =>
            this.update(c),
        );

        app.delete(`${this.path}/:id`, authMiddleware, (c: Context) =>
            this.remove(c),
        );
    }

    private async list(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = surveyParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const pages = await this.pageService.listBySurvey(
            parsedParams.data.surveyId,
            userId,
        );

        return c.json(
            pages.map((p) => ({
                id: p.id,
                surveyId: p.surveyId,
                title: p.title,
                content: p.content,
                position: p.position,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            })),
        );
    }

    private async getById(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = pageParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const page = await this.pageService.getById(
            parsedParams.data.id,
            parsedParams.data.surveyId,
            userId,
        );

        if (!page) {
            return c.json({ error: "Page not found" }, 404);
        }

        return c.json({
            id: page.id,
            surveyId: page.surveyId,
            title: page.title,
            content: page.content,
            position: page.position,
            createdAt: page.createdAt.toISOString(),
            updatedAt: page.updatedAt.toISOString(),
        });
    }

    private async create(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = surveyParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const body = await c.req.json();
        const parsedBody = createPageSchema.safeParse(body);
        if (!parsedBody.success) {
            return c.json(
                { error: "Validation failed", issues: parsedBody.error.issues },
                400,
            );
        }

        const created = await this.pageService.create(
            parsedParams.data.surveyId,
            userId,
            parsedBody.data,
        );

        if (!created) {
            return c.json({ error: "Survey not found" }, 404);
        }

        return c.json(
            {
                id: created.id,
                surveyId: created.surveyId,
                title: created.title,
                content: created.content,
                position: created.position,
                createdAt: created.createdAt.toISOString(),
                updatedAt: created.updatedAt.toISOString(),
            },
            201,
        );
    }

    private async update(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = pageParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const body = await c.req.json();
        const parsedBody = updatePageSchema.safeParse(body);
        if (!parsedBody.success) {
            return c.json(
                { error: "Validation failed", issues: parsedBody.error.issues },
                400,
            );
        }

        const updated = await this.pageService.update(
            parsedParams.data.id,
            parsedParams.data.surveyId,
            userId,
            parsedBody.data,
        );

        if (!updated) {
            return c.json({ error: "Page not found" }, 404);
        }

        return c.json({
            id: updated.id,
            surveyId: updated.surveyId,
            title: updated.title,
            content: updated.content,
            position: updated.position,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        });
    }

    private async remove(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = pageParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const ok = await this.pageService.delete(
            parsedParams.data.id,
            parsedParams.data.surveyId,
            userId,
        );

        if (!ok) {
            return c.json({ error: "Page not found" }, 404);
        }

        return c.json({ ok: true });
    }
}

