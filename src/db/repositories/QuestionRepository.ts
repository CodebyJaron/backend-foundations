import { Database } from "../Database";
import { Question, type QuestionRow, type QuestionType } from "../../models/Question";

export class QuestionRepository {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async getNextPositionForPage(pageId: string, surveyId: string, userId: string) {
        const [row] = await this.db.query<{ next_position: number }>`
            SELECT COALESCE(MAX(q.position), 0) + 1 AS next_position
            FROM questions q
            JOIN pages p ON p.id = q.page_id
            JOIN surveys s ON s.id = p.survey_id
            WHERE q.page_id = ${pageId}
              AND p.survey_id = ${surveyId}
              AND s.user_id = ${userId}
        `;

        return row?.next_position ?? 1;
    }

    async listByPage(pageId: string, surveyId: string, userId: string) {
        const rows = await this.db.query<QuestionRow>`
            SELECT q.id, q.page_id, q.type, q.text, q.options, q.position, q.created_at, q.updated_at
            FROM questions q
            JOIN pages p ON p.id = q.page_id
            JOIN surveys s ON s.id = p.survey_id
            WHERE q.page_id = ${pageId}
              AND p.survey_id = ${surveyId}
              AND s.user_id = ${userId}
            ORDER BY q.position ASC
        `;

        return rows.map(Question.fromRow);
    }

    async findById(
        id: string,
        pageId: string,
        surveyId: string,
        userId: string,
    ) {
        const [row] = await this.db.query<QuestionRow>`
            SELECT q.id, q.page_id, q.type, q.text, q.options, q.position, q.created_at, q.updated_at
            FROM questions q
            JOIN pages p ON p.id = q.page_id
            JOIN surveys s ON s.id = p.survey_id
            WHERE q.id = ${id}
              AND q.page_id = ${pageId}
              AND p.survey_id = ${surveyId}
              AND s.user_id = ${userId}
        `;

        return row ? Question.fromRow(row) : null;
    }

    async create(
        pageId: string,
        surveyId: string,
        userId: string,
        data: {
            type: QuestionType;
            text: string;
            options?: unknown | null;
            position?: number;
        },
    ) {
        const position =
            data.position ??
            (await this.getNextPositionForPage(pageId, surveyId, userId));

        const optionsJson =
            data.options === undefined ? null : JSON.stringify(data.options);

        const [row] = await this.db.query<QuestionRow>`
            INSERT INTO questions (page_id, type, text, options, position)
            SELECT ${pageId},
                   ${data.type},
                   ${data.text},
                   ${optionsJson}::jsonb,
                   ${position}
            WHERE EXISTS (
                SELECT 1
                FROM pages p
                JOIN surveys s ON s.id = p.survey_id
                WHERE p.id = ${pageId}
                  AND p.survey_id = ${surveyId}
                  AND s.user_id = ${userId}
            )
            RETURNING id, page_id, type, text, options, position, created_at, updated_at
        `;

        return row ? Question.fromRow(row) : null;
    }

    async update(
        id: string,
        pageId: string,
        surveyId: string,
        userId: string,
        patch: {
            type?: QuestionType;
            text?: string;
            options?: unknown | null;
            position?: number;
        },
    ) {
        const existing = await this.findById(id, pageId, surveyId, userId);
        if (!existing) return null;

        const nextType = patch.type ?? existing.type;
        const nextText = patch.text ?? existing.text;
        const nextOptions = (() => {
            if (patch.type === "text" || patch.type === "yes_no") return null;
            return patch.options === undefined ? existing.options : patch.options;
        })();
        const nextPosition = patch.position ?? existing.position;

        const optionsJson = nextOptions === null ? null : JSON.stringify(nextOptions);

        const [row] = await this.db.query<QuestionRow>`
            UPDATE questions q
            SET type = ${nextType},
                text = ${nextText},
                options = ${optionsJson}::jsonb,
                position = ${nextPosition},
                updated_at = NOW()
            FROM pages p
            JOIN surveys s ON s.id = p.survey_id
            WHERE q.id = ${id}
              AND q.page_id = ${pageId}
              AND p.id = q.page_id
              AND p.survey_id = ${surveyId}
              AND s.user_id = ${userId}
            RETURNING q.id, q.page_id, q.type, q.text, q.options, q.position, q.created_at, q.updated_at
        `;

        return row ? Question.fromRow(row) : null;
    }

    async delete(id: string, pageId: string, surveyId: string, userId: string) {
        const [row] = await this.db.query<{ deleted: boolean }>`
            WITH deleted AS (
                DELETE FROM questions q
                USING pages p, surveys s
                WHERE q.id = ${id}
                  AND q.page_id = ${pageId}
                  AND p.id = q.page_id
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

