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

            await this.query`
                CREATE TABLE IF NOT EXISTS surveys (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID,
                    title VARCHAR(200) NOT NULL,
                    description VARCHAR(2000),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `;

            const fkExists = await this.query<{ constraint_name: string }>`
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'surveys'
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name = 'fk_surveys_users'
            `;
            if (!fkExists || fkExists.length === 0) {
                await this.query`
                    ALTER TABLE surveys
                    ADD CONSTRAINT fk_surveys_users
                    FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE;
                `;
            }

            await this.query`
                CREATE TABLE IF NOT EXISTS pages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    survey_id UUID NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    content TEXT,
                    position INT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_pages_survey_position UNIQUE (survey_id, position)
                )
            `;

            const pagesFkExists = await this.query<{ constraint_name: string }>`
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'pages'
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name = 'fk_pages_surveys'
            `;
            if (!pagesFkExists || pagesFkExists.length === 0) {
                await this.query`
                    ALTER TABLE pages
                    ADD CONSTRAINT fk_pages_surveys
                    FOREIGN KEY (survey_id)
                    REFERENCES surveys(id)
                    ON DELETE CASCADE;
                `;
            }
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
