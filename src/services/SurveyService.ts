import { SurveyRepository } from "../db/repositories/SurveyRepository";

export class SurveyService {
    private readonly repo: SurveyRepository;

    constructor(repo: SurveyRepository) {
        this.repo = repo;
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
}

