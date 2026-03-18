import { SurveyRepository } from "../db/repositories/SurveyRepository";
import { PageRepository } from "../db/repositories/PageRepository";
import { QuestionRepository } from "../db/repositories/QuestionRepository";
import type { QuestionType } from "../models/Question";
import { aiSurveySchema } from "../validation/surveyAiSchemas";
import OpenAI from "openai";

export class SurveyService {
    private readonly repo: SurveyRepository;
    private readonly pageRepo: PageRepository;
    private readonly questionRepo: QuestionRepository;

    constructor(
        repo: SurveyRepository,
        pageRepo: PageRepository,
        questionRepo: QuestionRepository,
    ) {
        this.repo = repo;
        this.pageRepo = pageRepo;
        this.questionRepo = questionRepo;
    }

    list(userId: string) {
        return this.repo.list(userId);
    }

    getById(id: string, userId: string) {
        return this.repo.findById(id, userId);
    }

    create(userId: string, title: string, description?: string) {
        return this.repo.create(userId, title, description);
    }

    update(
        id: string,
        userId: string,
        patch: { title?: string; description?: string | null },
    ) {
        return this.repo.update(id, userId, patch);
    }

    delete(id: string, userId: string) {
        return this.repo.delete(id, userId);
    }

    async createWithOpenAI(
        userId: string,
        input: {
            topic: string;
            audience?: string;
            language?: string;
            questionCount?: number;
        },
    ) {
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        const language = input.language?.trim() ?? "Dutch";
        const audience = input.audience?.trim() ?? "general";
        const questionCount = input.questionCount ?? 8;

        const system = [
            "You generate high-quality surveys.",
            "Return only valid JSON. No markdown, no code fences, no commentary.",
            "All questions must be answerable without external context.",
        ].join(" ");

        const userPrompt = [
            `Language: ${language}`,
            `Audience: ${audience}`,
            `Topic: ${input.topic}`,
            `Number of questions: ${questionCount}`,
            "",
            "Create one survey with exactly one page and a list of questions.",
            'Allowed question types: "text", "yes_no", "multiple_choice", "number_scale".',
            "For multiple_choice include options.choices (2-8 items).",
            "For number_scale include options.min/options.max and optional options.step.",
            "",
            "Return this JSON shape:",
            `{`,
            `  "title": string,`,
            `  "description": string|null,`,
            `  "page": { "title": string, "content": string|null },`,
            `  "questions": [`,
            `    { "type": "...", "text": "...", "options"?: ... }`,
            `  ]`,
            `}`,
        ].join("\n");

        const client = new OpenAI({ apiKey });
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [
                { role: "system", content: system },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
        });

        const content = completion.choices?.[0]?.message?.content;
        if (!content?.trim()) {
            throw new Error("OpenAI returned empty response");
        }

        let aiSurveyUnknown: unknown;
        try {
            aiSurveyUnknown = JSON.parse(content);
        } catch {
            throw new Error("OpenAI returned invalid JSON");
        }

        const aiParsed = aiSurveySchema.safeParse(aiSurveyUnknown);
        if (!aiParsed.success) {
            throw new Error(
                `OpenAI JSON did not match expected schema: ${aiParsed.error.message}`,
            );
        }

        const aiSurvey = aiParsed.data;

        const createdSurvey = await this.repo.create(
            userId,
            aiSurvey.title,
            aiSurvey.description ?? undefined,
        );

        const createdPage = await this.pageRepo.create(
            createdSurvey.id,
            userId,
            {
                title: aiSurvey.page.title,
                content: aiSurvey.page.content ?? null,
                position: 1,
            },
        );

        if (!createdPage) {
            throw new Error("Failed to create page for generated survey");
        }

        const getQuestionOptions = (
            q: (typeof aiSurvey)["questions"][number],
        ) => {
            if (q.type === "multiple_choice" || q.type === "number_scale") {
                return q.options;
            }
            return null;
        };

        const createdQuestions = [];
        for (let i = 0; i < aiSurvey.questions.length; i++) {
            const q = aiSurvey.questions[i];
            const created = await this.questionRepo.create(
                createdPage.id,
                createdSurvey.id,
                userId,
                {
                    type: q.type,
                    text: q.text,
                    options: getQuestionOptions(q),
                    position: i + 1,
                },
            );

            if (!created) {
                throw new Error(
                    "Failed to create question for generated survey",
                );
            }
            createdQuestions.push(created);
        }

        return {
            survey: createdSurvey,
            page: createdPage,
            questions: createdQuestions,
        };
    }
}
