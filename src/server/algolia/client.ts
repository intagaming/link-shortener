import algoliasearch from "algoliasearch";
import { env } from "../../env/server.mjs";

export const client = algoliasearch(
  env.ALGOLIA_APP_ID,
  env.ALGOLIA_ADMIN_API_KEY
);
