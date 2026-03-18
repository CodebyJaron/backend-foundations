import { QuestionRepository } from "../db/repositories/QuestionRepository";
import type { QuestionType } from "../models/Question";

export class QuestionService {
    private readonly repo: QuestionRepository;

    constructor(repo: QuestionRepository) {
        this.repo = repo;
    }

    listByPage(pageId: string, surveyId: string, userId: string) {
        return this.repo.listByPage(pageId, surveyId, userId);
    }

    getById(id: string, pageId: string, surveyId: string, userId: string) {
        return this.repo.findById(id, pageId, surveyId, userId);
    }

    create(
        pageId: string,
        surveyId: string,
        userId: string,
        data: {
            type: QuestionType;
            text: string;
            options?: unknown | null;
            position?: number;
        },
    ) {
        return this.repo.create(pageId, surveyId, userId, data);
    }

    update(
        id: string,
        pageId: string,
        surveyId: string,
        userId: string,
        patch: {
            type?: QuestionType;
            text?: string;
            options?: unknown | null;
            position?: number;
        },
    ) {
        return this.repo.update(id, pageId, surveyId, userId, patch);
    }

    delete(id: string, pageId: string, surveyId: string, userId: string) {
        return this.repo.delete(id, pageId, surveyId, userId);
    }
}

