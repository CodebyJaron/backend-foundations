import { z } from "zod";

export const pageParamSchema = z.object({
    surveyId: z.string().uuid(),
    pageId: z.string().uuid(),
});

export const questionParamSchema = z.object({
    surveyId: z.string().uuid(),
    pageId: z.string().uuid(),
    id: z.string().uuid(),
});

export const multipleChoiceOptionsSchema = z.object({
    choices: z.array(z.string().min(1)).min(1),
});

export const numberScaleOptionsSchema = z
    .object({
        min: z.number().int(),
        max: z.number().int(),
        step: z.number().int().min(1).optional(),
    })
    .refine((v) => v.max > v.min, { message: "max must be greater than min" });

export const questionSchema = z.discriminatedUnion("type", [
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

export const updateQuestionSchema = z
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

