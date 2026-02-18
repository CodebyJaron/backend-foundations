import { Hono } from "hono";
import { SQL } from "bun";

const app = new Hono();

export const db = new SQL(
    process.env.DATABASE_URL ??
        "postgres://postgres:postgres@localhost:5432/backend",
);

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.get("/health", async (c) => {
    const [result] = await db`SELECT 1 as ok`;
    return c.json({ db: result?.ok === 1 ? "ok" : "error" });
});

export default app;
