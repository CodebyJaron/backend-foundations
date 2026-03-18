export interface PageRow {
    id: string;
    survey_id: string;
    title: string;
    content: string | null;
    position: number;
    created_at: Date;
    updated_at: Date;
}

export class Page {
    constructor(
        public readonly id: string,
        public readonly surveyId: string,
        public readonly title: string,
        public readonly content: string | null,
        public readonly position: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static fromRow(row: PageRow) {
        return new Page(
            row.id,
            row.survey_id,
            row.title,
            row.content,
            row.position,
            new Date(row.created_at),
            new Date(row.updated_at),
        );
    }
}

