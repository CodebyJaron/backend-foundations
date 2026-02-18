import { Database } from "../Database";
import { User, UserRow } from "../../models/User";

export class UserRepository {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async findByEmail(email: string) {
        const normalized = email.trim().toLowerCase();
        const [row] = await this.db.query<UserRow>`
            SELECT id, email, password, created_at
            FROM users WHERE email = ${normalized}
        `;

        return row ? User.fromRow(row) : null;
    }

    async emailAlreadyExists(email: string) {
        const normalized = email.trim().toLowerCase();
        const [row] = await this.db.query<{ exists: boolean }>`
            SELECT EXISTS (
                SELECT 1 FROM users WHERE email = ${normalized}
            ) as exists
        `;

        return Boolean(row?.exists);
    }

    async create(email: string, password: string) {
        const normalized = email.trim().toLowerCase();

        const [userRow] = await this.db.query<UserRow>`
            INSERT INTO users (email, password)
            VALUES (${normalized}, ${password})
            RETURNING id, email, password, created_at
        `;

        if (!userRow) {
            throw new Error("Failed to create user");
        }

        const user = User.fromRow(userRow);

        return user;
    }
}
