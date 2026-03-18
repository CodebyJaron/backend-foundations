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
