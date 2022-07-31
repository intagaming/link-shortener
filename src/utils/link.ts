import { env } from "../env/client.mjs";

export const getBaseUrl = () => {
  if (env.NEXT_PUBLIC_DOMAIN) return `https://${env.NEXT_PUBLIC_DOMAIN}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};
