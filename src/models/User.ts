export interface UserRow {
    id: string;
    email: string;
    password: string;
    created_at: Date;
}

export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        // hashed password
        public readonly password: string,
        public readonly createdAt: Date,
    ) {}

    static fromRow(row: UserRow) {
        return new User(
            row.id,
            row.email,
            row.password,
            new Date(row.created_at),
        );
    }

    getDisplayEmail() {
        return this.email.trim().toLowerCase();
    }
}
