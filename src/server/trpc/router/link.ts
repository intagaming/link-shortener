import { Prisma, ShortLink } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { t, authedProcedure } from "../utils";

function makeRandomString(length: number) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const randomSlugLength = 7;
const maxRetries = 10;

export const linkRouter = t.router({
  newLink: authedProcedure
    .input(z.object({ link: z.string().url(), slug: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      let slug = input.slug;

      if (!slug) {
        let success = false;
        for (let i = 0; i < maxRetries; i++) {
          slug = makeRandomString(randomSlugLength);
          const count = await ctx.prisma.shortLink.count({
            where: {
              slug,
            },
          });
          if (count === 0) {
            success = true;
            break;
          }
        }
        // The !slug check below is for type checking
        if (!success || !slug) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate slug",
          });
        }
      }

      try {
        const shortLink = await ctx.prisma.shortLink.create({
          data: {
            url: input.link,
            userId: user.id!,
            slug,
          },
        });
        return shortLink;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Slug already exists",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create short link",
        });
      }
    }),
});
