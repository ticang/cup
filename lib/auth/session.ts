import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "football_ai_admin";

type SessionPayload = {
  email: string;
  issuedAt: number;
};

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, issuedAt: Date.now() } satisfies SessionPayload),
    "utf8"
  ).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.email !== "string" || typeof parsed.issuedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function adminCookieName() {
  return COOKIE_NAME;
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "development-only-secret";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
