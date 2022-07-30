import { z } from "zod";
import { t, authedProcedure } from "../utils";

export const linkRouter = t.router({
  newLink: authedProcedure
    .input(z.object({ link: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      const shortLink = await ctx.prisma.shortLink.create({
        data: {
          url: input.link,
          userId: user.id!,
        },
      });

      return shortLink;
    }),
});
