import type { Hono } from "hono";

export abstract class Controller {
    abstract path: string;
    abstract register(app: Hono): void;
}
