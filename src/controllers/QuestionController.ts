import type { Context, Hono } from "hono";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { QuestionService } from "../services/QuestionService";
import { Controller } from "./Controller";
import {
    pageParamSchema,
    questionParamSchema,
    questionSchema,
    updateQuestionSchema,
} from "../validation/questionSchemas";

const createQuestionSchema = questionSchema;

export class QuestionController extends Controller {
    path = "/surveys/:surveyId/pages/:pageId/questions";
    private readonly questionService: QuestionService;

    constructor(questionService: QuestionService) {
        super();
        this.questionService = questionService;
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

        const parsedParams = pageParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const questions = await this.questionService.listByPage(
            parsedParams.data.pageId,
            parsedParams.data.surveyId,
            userId,
        );

        return c.json(
            questions.map((q) => ({
                id: q.id,
                pageId: q.pageId,
                type: q.type,
                text: q.text,
                options: q.options,
                position: q.position,
                createdAt: q.createdAt.toISOString(),
                updatedAt: q.updatedAt.toISOString(),
            })),
        );
    }

    private async getById(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = questionParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const question = await this.questionService.getById(
            parsedParams.data.id,
            parsedParams.data.pageId,
            parsedParams.data.surveyId,
            userId,
        );

        if (!question) {
            return c.json({ error: "Question not found" }, 404);
        }

        return c.json({
            id: question.id,
            pageId: question.pageId,
            type: question.type,
            text: question.text,
            options: question.options,
            position: question.position,
            createdAt: question.createdAt.toISOString(),
            updatedAt: question.updatedAt.toISOString(),
        });
    }

    private async create(c: Context) {
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
        const parsedBody = createQuestionSchema.safeParse(body);
        if (!parsedBody.success) {
            return c.json(
                { error: "Validation failed", issues: parsedBody.error.issues },
                400,
            );
        }

        const created = await this.questionService.create(
            parsedParams.data.pageId,
            parsedParams.data.surveyId,
            userId,
            {
                type: parsedBody.data.type,
                text: parsedBody.data.text,
                options:
                    parsedBody.data.type === "multiple_choice" ||
                    parsedBody.data.type === "number_scale"
                        ? parsedBody.data.options
                        : null,
                position: parsedBody.data.position,
            },
        );

        if (!created) {
            return c.json({ error: "Page not found" }, 404);
        }

        return c.json(
            {
                id: created.id,
                pageId: created.pageId,
                type: created.type,
                text: created.text,
                options: created.options,
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

        const parsedParams = questionParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const body = await c.req.json();
        const parsedBody = updateQuestionSchema.safeParse(body);
        if (!parsedBody.success) {
            return c.json(
                { error: "Validation failed", issues: parsedBody.error.issues },
                400,
            );
        }

        const updated = await this.questionService.update(
            parsedParams.data.id,
            parsedParams.data.pageId,
            parsedParams.data.surveyId,
            userId,
            parsedBody.data,
        );

        if (!updated) {
            return c.json({ error: "Question not found" }, 404);
        }

        return c.json({
            id: updated.id,
            pageId: updated.pageId,
            type: updated.type,
            text: updated.text,
            options: updated.options,
            position: updated.position,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        });
    }

    private async remove(c: Context) {
        const userId = c.get("userId") as string | undefined;
        if (!userId) return c.json({ error: "Unauthorized" }, 401);

        const parsedParams = questionParamSchema.safeParse(c.req.param());
        if (!parsedParams.success) {
            return c.json(
                { error: "Validation failed", issues: parsedParams.error.issues },
                400,
            );
        }

        const ok = await this.questionService.delete(
            parsedParams.data.id,
            parsedParams.data.pageId,
            parsedParams.data.surveyId,
            userId,
        );

        if (!ok) {
            return c.json({ error: "Question not found" }, 404);
        }

        return c.json({ ok: true });
    }
}

