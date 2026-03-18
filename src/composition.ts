import { AuthController } from "./controllers/AuthController";
import { SurveyController } from "./controllers/SurveyController";
import { Database } from "./db/Database";
import { SurveyRepository } from "./db/repositories/SurveyRepository";
import { AuthService } from "./services/AuthService";
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
