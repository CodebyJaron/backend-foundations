import { AuthController } from "./controllers/AuthController";
import { Database } from "./db/Database";
import { AuthService } from "./services/AuthService";
import { UserRepository } from "./db/repositories/UserRepository";

export function createAuthController(db: Database) {
    const userRepository = new UserRepository(db);
    const authService = new AuthService(userRepository);

    return new AuthController(authService);
}
