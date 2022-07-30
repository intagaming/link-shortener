import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/api/get-url") ||
    req.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return;
  }

  const splits = req.nextUrl.pathname.split("/");
  if (splits.length > 2) return;

  const slug = splits.pop();
  if (slug === "") return;

  const data = await (
    await fetch(`${req.nextUrl.origin}/api/get-url/${slug}`)
  ).json();

  if (data.url) {
    return NextResponse.redirect(data.url);
  }
}
