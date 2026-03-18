import { Database } from "../Database";
import { Survey, type SurveyRow } from "../../models/Survey";

export class SurveyRepository {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async list(userId: string) {
        const rows = await this.db.query<SurveyRow>`
            SELECT id, user_id, title, description, created_at, updated_at
            FROM surveys
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

        return rows.map(Survey.fromRow);
    }

    async findById(id: string, userId: string) {
        const [row] = await this.db.query<SurveyRow>`
            SELECT id, user_id, title, description, created_at, updated_at
            FROM surveys
            WHERE id = ${id} AND user_id = ${userId}
        `;

        return row ? Survey.fromRow(row) : null;
    }

    async create(userId: string, title: string, description?: string) {
        const [row] = await this.db.query<SurveyRow>`
            INSERT INTO surveys (user_id, title, description)
            VALUES (${userId}, ${title}, ${description ?? null})
            RETURNING id, user_id, title, description, created_at, updated_at
        `;

        if (!row) {
            throw new Error("Failed to create survey");
        }

        return Survey.fromRow(row);
    }

    async update(
        id: string,
        userId: string,
        patch: { title?: string; description?: string | null },
    ) {
        const existing = await this.findById(id, userId);
        if (!existing) return null;

        const nextTitle = patch.title ?? existing.title;
        const nextDescription =
            patch.description === undefined ? existing.description : patch.description;

        const [row] = await this.db.query<SurveyRow>`
            UPDATE surveys
            SET title = ${nextTitle},
                description = ${nextDescription ?? null},
                updated_at = NOW()
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING id, user_id, title, description, created_at, updated_at
        `;

        if (!row) {
            throw new Error("Failed to update survey");
        }

        return Survey.fromRow(row);
    }

    async delete(id: string, userId: string) {
        const [row] = await this.db.query<{ deleted: boolean }>`
            WITH deleted AS (
                DELETE FROM surveys WHERE id = ${id} AND user_id = ${userId}
                RETURNING 1
            )
            SELECT EXISTS(SELECT 1 FROM deleted) AS deleted
        `;

        return Boolean(row?.deleted);
    }
}

