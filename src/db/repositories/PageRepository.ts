import { Database } from "../Database";
import { Page, type PageRow } from "../../models/Page";

export class PageRepository {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async getNextPositionForSurvey(surveyId: string, userId: string) {
        const [row] = await this.db.query<{ next_position: number }>`
            SELECT COALESCE(MAX(p.position), 0) + 1 AS next_position
            FROM pages p
            JOIN surveys s ON s.id = p.survey_id
            WHERE p.survey_id = ${surveyId} AND s.user_id = ${userId}
        `;

        return row?.next_position ?? 1;
    }

    async listBySurvey(surveyId: string, userId: string) {
        const rows = await this.db.query<PageRow>`
            SELECT p.id, p.survey_id, p.title, p.content, p.position, p.created_at, p.updated_at
            FROM pages p
            JOIN surveys s ON s.id = p.survey_id
            WHERE p.survey_id = ${surveyId} AND s.user_id = ${userId}
            ORDER BY p.position ASC
        `;

        return rows.map(Page.fromRow);
    }

    async findById(id: string, surveyId: string, userId: string) {
        const [row] = await this.db.query<PageRow>`
            SELECT p.id, p.survey_id, p.title, p.content, p.position, p.created_at, p.updated_at
            FROM pages p
            JOIN surveys s ON s.id = p.survey_id
            WHERE p.id = ${id} AND p.survey_id = ${surveyId} AND s.user_id = ${userId}
        `;

        return row ? Page.fromRow(row) : null;
    }

    async create(
        surveyId: string,
        userId: string,
        data: { title: string; content?: string | null; position?: number },
    ) {
        const position =
            data.position ??
            (await this.getNextPositionForSurvey(surveyId, userId));

        const [row] = await this.db.query<PageRow>`
            INSERT INTO pages (survey_id, title, content, position)
            SELECT ${surveyId}, ${data.title}, ${data.content ?? null}, ${position}
            WHERE EXISTS (
                SELECT 1 FROM surveys s
                WHERE s.id = ${surveyId} AND s.user_id = ${userId}
            )
            RETURNING id, survey_id, title, content, position, created_at, updated_at
        `;

        return row ? Page.fromRow(row) : null;
    }

    async update(
        id: string,
        surveyId: string,
        userId: string,
        patch: { title?: string; content?: string | null; position?: number },
    ) {
        const existing = await this.findById(id, surveyId, userId);
        if (!existing) return null;

        const nextTitle = patch.title ?? existing.title;
        const nextContent =
            patch.content !== undefined ? patch.content : existing.content;
        const nextPosition = patch.position ?? existing.position;

        const [row] = await this.db.query<PageRow>`
            UPDATE pages p
            SET title = ${nextTitle},
                content = ${nextContent ?? null},
                position = ${nextPosition},
                updated_at = NOW()
            FROM surveys s
            WHERE p.id = ${id}
              AND p.survey_id = ${surveyId}
              AND s.id = p.survey_id
              AND s.user_id = ${userId}
            RETURNING p.id, p.survey_id, p.title, p.content, p.position, p.created_at, p.updated_at
        `;

        return row ? Page.fromRow(row) : null;
    }

    async delete(id: string, surveyId: string, userId: string) {
        const [row] = await this.db.query<{ deleted: boolean }>`
            WITH deleted AS (
                DELETE FROM pages p
                USING surveys s
                WHERE p.id = ${id}
                  AND p.survey_id = ${surveyId}
                  AND s.id = p.survey_id
                  AND s.user_id = ${userId}
                RETURNING 1
            )
            SELECT EXISTS(SELECT 1 FROM deleted) AS deleted
        `;

        return Boolean(row?.deleted);
    }
}
