import algoliasearch from "algoliasearch";
import { env } from "../../env/server.mjs";

export const algoliaClient = algoliasearch(
  env.ALGOLIA_APP_ID,
  env.ALGOLIA_ADMIN_API_KEY
);

export const algoliaIndex = algoliaClient.initIndex(env.ALGOLIA_INDEX_NAME);
