export interface SurveyRow {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export class Survey {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly title: string,
        public readonly description: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static fromRow(row: SurveyRow) {
        return new Survey(
            row.id,
            row.user_id,
            row.title,
            row.description,
            new Date(row.created_at),
            new Date(row.updated_at),
        );
    }
}

