import { UserRepository } from "../db/repositories/UserRepository";

export class AuthService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async register(email: string, password: string) {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !password || password.length < 6) {
            return { error: "Email and password (min 6 characters) required" };
        }

        const alreadyExists =
            await this.userRepository.emailAlreadyExists(normalized);
        if (alreadyExists) {
            return { error: "Email already registered" };
        }

        const passwordHash = await Bun.password.hash(password, {
            algorithm: "bcrypt",
            cost: 10,
        });

        const createdUser = await this.userRepository.create(
            normalized,
            passwordHash,
        );

        return createdUser;
    }

    async login(email: string, password: string) {
        const normalized = email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalized);

        if (!user) {
            return { error: "Invalid email or password" };
        }

        const ok = await Bun.password.verify(password, user.password, "bcrypt");

        if (!ok) {
            return { error: "Invalid email or password" };
        }

        return user;
    }
}
