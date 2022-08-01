import { PrismaClient } from "@prisma/client";
import algoliasearch from "algoliasearch";
import { z } from "zod";

const prisma = new PrismaClient();

const envSchema = z.object({
  ALGOLIA_APP_ID: z.string(),
  ALGOLIA_API_KEY: z.string(),
  ALGOLIA_INDEX_NAME: z.string(),
});
const env = envSchema.parse(process.env);

const algoliaClient = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_API_KEY);
const index = algoliaClient.initIndex(env.ALGOLIA_INDEX_NAME);

async function main() {
  // Fetch all links from database
  const links = await prisma.shortLink.findMany({
    select: {
      id: true,
      slug: true,
      url: true,
      userId: true,
    },
  });

  const algoliaLinks = links.map((link) => {
    const { id, ...linkWithoutId } = link;
    return {
      ...linkWithoutId,
      objectID: id,
    };
  });

  await index.saveObjects(algoliaLinks).wait();

  console.log("ok");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
