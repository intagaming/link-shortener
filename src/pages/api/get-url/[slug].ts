import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const slug = req.query.slug;
  if (!slug || typeof slug !== "string") {
    res.status(400).json({ error: "use single slug" });
    return;
  }

  const data = await prisma.shortLink.findFirst({
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  if (!data) {
    res.status(404).json({ error: "not found" });
    return;
  }

  res.status(200).json(data);
}
