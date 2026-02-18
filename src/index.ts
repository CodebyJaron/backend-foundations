import type { Context } from "hono";
import { Hono } from "hono";
import { createAuthController } from "./composition";
import { Database } from "./db/Database";

const app = new Hono();

const database = new Database(process.env.DATABASE_URL!);
await database.connect();
await database.initSchema();

app.get("/health", async (c: Context) => {
    const [result] = await database.query<{ ok: number }>`SELECT 1 as ok`;
    return c.json({ db: result?.ok === 1 ? "ok" : "error" });
});

createAuthController(database).register(app);

const shutdown = async () => {
    await database.close();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
