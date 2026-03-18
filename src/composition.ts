import { AuthController } from "./controllers/AuthController";
import { PageController } from "./controllers/PageController";
import { QuestionController } from "./controllers/QuestionController";
import { SurveyController } from "./controllers/SurveyController";
import { Database } from "./db/Database";
import { PageRepository } from "./db/repositories/PageRepository";
import { QuestionRepository } from "./db/repositories/QuestionRepository";
import { SurveyRepository } from "./db/repositories/SurveyRepository";
import { AuthService } from "./services/AuthService";
import { PageService } from "./services/PageService";
import { QuestionService } from "./services/QuestionService";
import { SurveyService } from "./services/SurveyService";
import { UserRepository } from "./db/repositories/UserRepository";

export function createAuthController(db: Database) {
    const userRepository = new UserRepository(db);
    const authService = new AuthService(userRepository);

    return new AuthController(authService);
}

export function createSurveyController(db: Database) {
    const surveyRepository = new SurveyRepository(db);
    const pageRepository = new PageRepository(db);
    const questionRepository = new QuestionRepository(db);

    const surveyService = new SurveyService(
        surveyRepository,
        pageRepository,
        questionRepository,
    );

    return new SurveyController(surveyService);
}

export function createPageController(db: Database) {
    const pageRepository = new PageRepository(db);
    const pageService = new PageService(pageRepository);

    return new PageController(pageService);
}

export function createQuestionController(db: Database) {
    const questionRepository = new QuestionRepository(db);
    const questionService = new QuestionService(questionRepository);

    return new QuestionController(questionService);
}
