import { Prisma, ShortLink } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { algoliaClient, algoliaIndex } from "../../algolia/client";
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

const convertShortLinkToAlgoliaObject = (link: ShortLink) => {
  const { id, ...linkWithoutId } = link;
  return {
    ...linkWithoutId,
    objectID: id,
  };
};

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

        // Send the new link to Algolia
        await algoliaIndex
          .saveObject(convertShortLinkToAlgoliaObject(shortLink))
          .wait();

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

  updateUrl: authedProcedure
    .input(z.object({ slug: z.string(), url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const shortLink = await ctx.prisma.shortLink.findFirst({
        where: {
          userId: user.id!,
          slug: input.slug,
        },
      });
      if (!shortLink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Short link not found",
        });
      }
      await ctx.prisma.shortLink.update({
        where: {
          id: shortLink.id,
        },
        data: {
          url: input.url,
        },
      });

      // Update the link on Algolia
      await algoliaIndex
        .partialUpdateObject({
          objectID: shortLink.id,
          url: input.url,
        })
        .wait();
    }),

  delete: authedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const shortLink = await ctx.prisma.shortLink.findFirst({
        where: {
          userId: user.id!,
          slug: input.slug,
        },
      });
      if (!shortLink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Short link not found",
        });
      }
      await ctx.prisma.shortLink.delete({
        where: {
          id: shortLink.id,
        },
      });

      // Delete the link on Algolia
      await algoliaIndex
        .deleteBy({ filters: `objectID:${shortLink.id}` })
        .wait();
    }),

  searchApiKey: authedProcedure.query(({ ctx }) => {
    const user = ctx.session.user;

    const privateSearchKey = algoliaClient.generateSecuredApiKey(
      env.ALGOLIA_SEARCH_API_KEY, // A search key that you keep private
      {
        filters: `userId:${user.id!}`,
      }
    );

    return {
      appId: env.ALGOLIA_APP_ID,
      privateSearchKey,
      indexName: env.ALGOLIA_INDEX_NAME,
    };
  }),
});
