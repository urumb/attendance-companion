import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { extractTimetableFromUpload } from "./timetable-extraction";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  timetable: router({
    extract: publicProcedure
      .input(z.object({
        base64: z.string().min(1).max(13_000_000),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]),
        fileName: z.string().min(1).max(255),
        categories: z.array(z.object({
          id: z.string().min(1),
          name: z.string().min(1).max(80),
          mode: z.enum(["both", "presentOnly", "totalOnly", "excluded"]),
          color: z.string().min(1).max(30),
        })).min(1).max(40),
      }))
      .mutation(({ input }) => extractTimetableFromUpload(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
