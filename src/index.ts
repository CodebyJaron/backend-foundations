import type { Context } from "hono";
import { Hono } from "hono";
import { AuthController } from "./controllers/AuthController";
import { PageController } from "./controllers/PageController";
import { QuestionController } from "./controllers/QuestionController";
import { SurveyController } from "./controllers/SurveyController";
import { Database } from "./db/Database";
import { PageRepository } from "./db/repositories/PageRepository";
import { QuestionRepository } from "./db/repositories/QuestionRepository";
import { SurveyRepository } from "./db/repositories/SurveyRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { SessionRepository } from "./db/repositories/SessionRepository";
import { AuthService } from "./services/AuthService";
import { PageService } from "./services/PageService";
import { QuestionService } from "./services/QuestionService";
import { SurveyService } from "./services/SurveyService";
import { authMiddleware } from "./middleware/AuthMiddleware";

const app = new Hono();

const database = new Database(process.env.DATABASE_URL!);
await database.connect();

app.get("/health", async (c: Context) => {
    const [result] = await database.query<{ ok: number }>`SELECT 1 as ok`;
    return c.json({ db: result?.ok === 1 ? "ok" : "error" });
});

function createAuthController(db: Database) {
    const userRepository = new UserRepository(db);
    const authService = new AuthService(userRepository);
    const sessionRepository = new SessionRepository(db);

    return new AuthController(authService, sessionRepository);
}

function createSurveyController(db: Database) {
    const surveyRepository = new SurveyRepository(db);
    const pageRepository = new PageRepository(db);
    const questionRepository = new QuestionRepository(db);
    const sessionRepository = new SessionRepository(db);
    const authMiddlewareInstance = authMiddleware(sessionRepository);

    const surveyService = new SurveyService(
        surveyRepository,
        pageRepository,
        questionRepository,
    );

    return new SurveyController(surveyService, authMiddlewareInstance);
}

function createPageController(db: Database) {
    const pageRepository = new PageRepository(db);
    const pageService = new PageService(pageRepository);
    const sessionRepository = new SessionRepository(db);
    const authMiddlewareInstance = authMiddleware(sessionRepository);

    return new PageController(pageService, authMiddlewareInstance);
}

function createQuestionController(db: Database) {
    const questionRepository = new QuestionRepository(db);
    const questionService = new QuestionService(questionRepository);
    const sessionRepository = new SessionRepository(db);
    const authMiddlewareInstance = authMiddleware(sessionRepository);

    return new QuestionController(questionService, authMiddlewareInstance);
}

createAuthController(database).register(app);
createSurveyController(database).register(app);
createPageController(database).register(app);
createQuestionController(database).register(app);

const shutdown = async () => {
    await database.close();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
