export interface SessionRow {
    id: string;
    user_id: string;
    created_at: Date;
    expires_at: Date;
}

export class Session {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly createdAt: Date,
        public readonly expiresAt: Date,
    ) {}

    static fromRow(row: SessionRow) {
        return new Session(
            row.id,
            row.user_id,
            new Date(row.created_at),
            new Date(row.expires_at),
        );
    }
}
