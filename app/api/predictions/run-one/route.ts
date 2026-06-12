import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { runPredictionForFixture } from "@/lib/prediction/run";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fixtureId = String(formData.get("fixtureId") ?? "");

  if (!fixtureId) {
    return NextResponse.json({ error: "缺少比赛 ID" }, { status: 400 });
  }

  try {
    await runPredictionForFixture(fixtureId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "预测失败" },
      { status: 400 }
    );
  }

  revalidatePath("/");
  revalidatePath(`/matches/${fixtureId}`);
  return NextResponse.redirect(new URL(`/?predicted=${fixtureId}`, request.url), {
    status: 303
  });
}
