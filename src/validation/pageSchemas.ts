import { z } from "zod";

export const surveyParamSchema = z.object({
    surveyId: z.string().uuid(),
});

export const pageParamSchema = z.object({
    surveyId: z.string().uuid(),
    id: z.string().uuid(),
});

export const createPageSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().nullable().optional(),
    position: z.number().int().min(1).optional(),
});

export const updatePageSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().nullable().optional(),
    position: z.number().int().min(1).optional(),
});

