import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { importCsv, type ImportEntity } from "@/lib/csv/importers";

const entities = new Set(["competitions", "teams", "fixtures", "odds"]);

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.redirect(new URL("/admin?error=login-required", request.url), {
      status: 303
    });
  }

  const formData = await request.formData();
  const entity = String(formData.get("entity") ?? "");
  const file = formData.get("file");

  if (!entities.has(entity) || !(file instanceof File)) {
    return NextResponse.redirect(new URL("/admin?error=import-invalid", request.url), {
      status: 303
    });
  }

  const result = await importCsv(entity as ImportEntity, await file.text());
  return NextResponse.redirect(
    new URL(
      `/admin?imported=${result.successRows}&importErrors=${result.errors.length}`,
      request.url
    ),
    { status: 303 }
  );
}
