import { z } from "zod";

export const createSurveySchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
});

export const createSurveyWithAiSchema = z.object({
    topic: z.string().min(1).max(500),
    audience: z.string().min(1).max(200).optional(),
    language: z.string().min(1).max(50).optional(),
    questionCount: z.number().int().min(3).max(25).optional(),
});

export const updateSurveySchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
});

export const idParamSchema = z.object({
    id: z.string().uuid(),
});

