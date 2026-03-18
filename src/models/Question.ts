export type QuestionType = "text" | "multiple_choice" | "number_scale" | "yes_no";

export interface QuestionRow {
    id: string;
    page_id: string;
    type: string;
    text: string;
    options: unknown | null;
    position: number;
    created_at: Date;
    updated_at: Date;
}

export class Question {
    constructor(
        public readonly id: string,
        public readonly pageId: string,
        public readonly type: QuestionType,
        public readonly text: string,
        public readonly options: unknown | null,
        public readonly position: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static fromRow(row: QuestionRow) {
        const type = row.type as QuestionType;
        const options =
            typeof row.options === "string" ? JSON.parse(row.options) : row.options;

        return new Question(
            row.id,
            row.page_id,
            type,
            row.text,
            options ?? null,
            row.position,
            new Date(row.created_at),
            new Date(row.updated_at),
        );
    }
}

