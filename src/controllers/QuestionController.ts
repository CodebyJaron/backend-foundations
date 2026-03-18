import type { Context, Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware";
import { QuestionService } from "../services/QuestionService";
import { Controller } from "./Controller";

const pageParamSchema = z.object({
    surveyId: z.string().uuid(),
    pageId: z.string().uuid(),
});

const questionParamSchema = z.object({
    surveyId: z.string().uuid(),
    pageId: z.string().uuid(),
    id: z.string().uuid(),
});

const multipleChoiceOptionsSchema = z.object({
    choices: z.array(z.string().min(1)).min(1),
});

const numberScaleOptionsSchema = z
    .object({
        min: z.number().int(),
        max: z.number().int(),
        step: z.number().int().min(1).optional(),
    })
    .refine((v) => v.max > v.min, { message: "max must be greater than min" });

const createQuestionSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("text"),
        text: z.string().min(1),
        options: z.null().optional(),
        position: z.number().int().min(1).optional(),
    }),
    z.object({
        type: z.literal("multiple_choice"),
        text: z.string().min(1),
        options: multipleChoiceOptionsSchema,
        position: z.number().int().min(1).optional(),
    }),
    z.object({
        type: z.literal("number_scale"),
        text: z.string().min(1),
        options: numberScaleOptionsSchema.default({ min: 0, max: 10, step: 1 }),
        position: z.number().int().min(1).optional(),
    }),
    z.object({
        type: z.literal("yes_no"),
        text: z.string().min(1),
        options: z.null().optional(),
        position: z.number().int().min(1).optional(),
    }),
]);

const updateQuestionSchema = z
    .object({
        type: z.enum(["text", "multiple_choice", "number_scale", "yes_no"]).optional(),
        text: z.string().min(1).optional(),
        options: z.unknown().nullable().optional(),
        position: z.number().int().min(1).optional(),
    })
    .superRefine((val, ctx) => {
        if (val.options !== undefined && val.type === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "type is required when options is provided",
                path: ["type"],
            });
            return;
        }

        if (val.type === "multiple_choice" && val.options !== undefined) {
            const parsed = multipleChoiceOptionsSchema.safeParse(val.options);
            if (!parsed.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "invalid options for multiple_choice",
                    path: ["options"],
                });
            }
        }

        if (val.type === "number_scale" && val.options !== undefined) {
            const parsed = numberScaleOptionsSchema.safeParse(val.options);
            if (!parsed.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "invalid options for number_scale",
                    path: ["options"],
                });
            }
        }

        if ((val.type === "text" || val.type === "yes_no") && val.options !== undefined) {
            if (val.options !== null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "options must be null for this question type",
                    path: ["options"],
                });
            }
        }
    });

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

