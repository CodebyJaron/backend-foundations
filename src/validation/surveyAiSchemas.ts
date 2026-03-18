import { z } from "zod";
import { questionSchema } from "./questionSchemas";

export const aiSurveySchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullable().optional(),
    page: z.object({
        title: z.string().min(1).max(200),
        content: z.string().nullable().optional(),
    }),
    questions: z.array(questionSchema).min(3).max(25),
});

