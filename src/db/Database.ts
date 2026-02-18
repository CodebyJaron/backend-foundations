import { SQL } from "bun";

export class Database {
    private connection: SQL | null = null;
    private readonly url;

    constructor(url: string) {
        this.url = url;
    }

    private getConnection() {
        if (!this.connection) {
            this.connection = new SQL(this.url);
        }
        return this.connection;
    }

    async query<T>(strings: TemplateStringsArray, ...values: unknown[]) {
        const result = await this.getConnection()(strings, ...values);
        return Array.isArray(result) ? result : [result];
    }

    async initSchema() {
        try {
            await this.query`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;
        } catch (error) {
            console.error("Failed to initialize database schema:", error);
            throw error;
        }
    }

    async connect() {
        await this.getConnection().connect();
    }

    async close() {
        if (this.connection) {
            await this.connection.close({ timeout: 2 });
            this.connection = null;
        }
    }
}
