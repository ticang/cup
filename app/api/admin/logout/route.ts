import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(adminCookieName(), "", {
    path: "/",
    maxAge: 0
  });
  return response;
}
