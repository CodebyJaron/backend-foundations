import { PageRepository } from "../db/repositories/PageRepository";

export class PageService {
    private readonly repo: PageRepository;

    constructor(repo: PageRepository) {
        this.repo = repo;
    }

    listBySurvey(surveyId: string, userId: string) {
        return this.repo.listBySurvey(surveyId, userId);
    }

    getById(id: string, surveyId: string, userId: string) {
        return this.repo.findById(id, surveyId, userId);
    }

    create(
        surveyId: string,
        userId: string,
        data: { title: string; content?: string | null; position?: number },
    ) {
        return this.repo.create(surveyId, userId, data);
    }

    update(
        id: string,
        surveyId: string,
        userId: string,
        patch: { title?: string; content?: string | null; position?: number },
    ) {
        return this.repo.update(id, surveyId, userId, patch);
    }

    delete(id: string, surveyId: string, userId: string) {
        return this.repo.delete(id, surveyId, userId);
    }
}

