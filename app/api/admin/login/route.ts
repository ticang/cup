import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName, createSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    email !== (process.env.ADMIN_EMAIL ?? "admin@example.com") ||
    password !== (process.env.ADMIN_PASSWORD ?? "change-me-before-production")
  ) {
    return NextResponse.redirect(new URL("/admin?error=invalid-login", request.url), {
      status: 303
    });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), {
    status: 303
  });
  response.cookies.set(adminCookieName(), createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
