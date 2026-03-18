import type { Context, Hono } from "hono";
import { SurveyService } from "../services/SurveyService";
import { Controller } from "./Controller";
import { authMiddleware } from "../middleware/AuthMiddleware";
import {
    createSurveySchema,
    createSurveyWithAiSchema,
    idParamSchema,
    updateSurveySchema,
} from "../validation/surveySchemas";

export class SurveyController extends Controller {
    path = "/surveys";
    private readonly surveyService: SurveyService;

    constructor(surveyService: SurveyService) {
        super();
        this.surveyService = surveyService;
    }

    register(app: Hono) {
        app.get(`${this.path}`, authMiddleware, (c: Context) => this.list(c));

        app.get(`${this.path}/:id`, authMiddleware, (c: Context) =>
            this.getById(c),
        );

        app.post(`${this.path}/ai`, authMiddleware, (c: Context) =>
            this.createWithAi(c),
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

        const surveys = await this.surveyService.list(userId);

        return c.json(
            surveys.map((s) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString(),
            })),
        );
    }

    private async getById(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = idParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                {
                    error: "Validation failed",
                    issues: parsedParams.error.issues,
                },
                400,
            );
        }

        const survey = await this.surveyService.getById(
            parsedParams.data.id,
            userId,
        );
        if (!survey) {
            return c.json({ error: "Survey not found" }, 404);
        }

        return c.json({
            id: survey.id,
            title: survey.title,
            description: survey.description,
            createdAt: survey.createdAt.toISOString(),
            updatedAt: survey.updatedAt.toISOString(),
        });
    }

    private async create(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const body = await c.req.json();
        const parsed = createSurveySchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                { error: "Validation failed", issues: parsed.error.issues },
                400,
            );
        }

        const created = await this.surveyService.create(
            userId,
            parsed.data.title,
            parsed.data.description,
        );

        return c.json(
            {
                id: created.id,
                title: created.title,
                description: created.description,
                createdAt: created.createdAt.toISOString(),
                updatedAt: created.updatedAt.toISOString(),
            },
            201,
        );
    }

    private async createWithAi(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const body = await c.req.json();
        const parsed = createSurveyWithAiSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                { error: "Validation failed", issues: parsed.error.issues },
                400,
            );
        }

        try {
            const created = await this.surveyService.createWithOpenAI(
                userId,
                parsed.data,
            );

            return c.json(
                {
                    survey: {
                        id: created.survey.id,
                        title: created.survey.title,
                        description: created.survey.description,
                        createdAt: created.survey.createdAt.toISOString(),
                        updatedAt: created.survey.updatedAt.toISOString(),
                    },
                    page: {
                        id: created.page.id,
                        surveyId: created.page.surveyId,
                        title: created.page.title,
                        content: created.page.content,
                        position: created.page.position,
                        createdAt: created.page.createdAt.toISOString(),
                        updatedAt: created.page.updatedAt.toISOString(),
                    },
                    questions: created.questions.map((q) => ({
                        id: q.id,
                        pageId: q.pageId,
                        type: q.type,
                        text: q.text,
                        options: q.options,
                        position: q.position,
                        createdAt: q.createdAt.toISOString(),
                        updatedAt: q.updatedAt.toISOString(),
                    })),
                },
                201,
            );
        } catch (error) {
            return c.json(
                { error: "Failed to create survey with AI", details: error },
                500,
            );
        }
    }

    private async update(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = idParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                {
                    error: "Validation failed",
                    issues: parsedParams.error.issues,
                },
                400,
            );
        }

        const body = await c.req.json();
        const parsedBody = updateSurveySchema.safeParse(body);
        if (!parsedBody.success) {
            return c.json(
                { error: "Validation failed", issues: parsedBody.error.issues },
                400,
            );
        }

        const updated = await this.surveyService.update(
            parsedParams.data.id,
            userId,
            parsedBody.data,
        );

        if (!updated) {
            return c.json({ error: "Survey not found" }, 404);
        }

        return c.json({
            id: updated.id,
            title: updated.title,
            description: updated.description,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        });
    }

    private async remove(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = idParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                {
                    error: "Validation failed",
                    issues: parsedParams.error.issues,
                },
                400,
            );
        }

        const ok = await this.surveyService.delete(
            parsedParams.data.id,
            userId,
        );
        if (!ok) {
            return c.json({ error: "Survey not found" }, 404);
        }

        return c.json({ ok: true });
    }
}
