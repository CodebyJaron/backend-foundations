import { AuthController } from "./controllers/AuthController";
import { PageController } from "./controllers/PageController";
import { SurveyController } from "./controllers/SurveyController";
import { Database } from "./db/Database";
import { PageRepository } from "./db/repositories/PageRepository";
import { SurveyRepository } from "./db/repositories/SurveyRepository";
import { AuthService } from "./services/AuthService";
import { PageService } from "./services/PageService";
import { SurveyService } from "./services/SurveyService";
import { UserRepository } from "./db/repositories/UserRepository";

export function createAuthController(db: Database) {
    const userRepository = new UserRepository(db);
    const authService = new AuthService(userRepository);

    return new AuthController(authService);
}

export function createSurveyController(db: Database) {
    const surveyRepository = new SurveyRepository(db);
    const surveyService = new SurveyService(surveyRepository);

    return new SurveyController(surveyService);
}

export function createPageController(db: Database) {
    const pageRepository = new PageRepository(db);
    const pageService = new PageService(pageRepository);

    return new PageController(pageService);
}
