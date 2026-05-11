import { Database } from "../Database";
import { Session, type SessionRow } from "../../models/Session";

export class SessionRepository {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async create(userId: string, expiresAt: Date) {
        const [row] = await this.db.query<SessionRow>`
            INSERT INTO sessions (user_id, expires_at)
            VALUES (${userId}, ${expiresAt})
            RETURNING id, user_id, created_at, expires_at
        `;

        if (!row) {
            throw new Error("Failed to create session");
        }

        return Session.fromRow(row);
    }

    async findValidUserIdBySessionId(sessionId: string) {
        const [row] = await this.db.query<{ user_id: string }>`
            SELECT user_id
            FROM sessions
            WHERE id = ${sessionId}
              AND expires_at > NOW()
        `;

        return row?.user_id ?? null;
    }

    async deleteBySessionId(sessionId: string) {
        const [row] = await this.db.query<{ deleted: boolean }>`
            WITH deleted AS (
                DELETE FROM sessions WHERE id = ${sessionId} RETURNING 1
            )
            SELECT EXISTS(SELECT 1 FROM deleted) AS deleted
        `;

        return Boolean(row?.deleted);
    }
}
