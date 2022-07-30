// src/server/trpc/router/index.ts
import { t } from "../utils";
import { exampleRouter } from "./example";
import { authRouter } from "./auth";
import { linkRouter } from "./link";

export const appRouter = t.router({
  example: exampleRouter,
  auth: authRouter,
  link: linkRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
