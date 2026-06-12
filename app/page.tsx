import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { formatDateTime } from "@/lib/format";
import {
  formatActualScore,
  formatFixtureStatus,
  formatPredictionAccuracy,
  formatPredictionScore
} from "@/lib/matches/presentation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ predicted?: string }>;
}) {
  const params = await searchParams;
  const fixtures = await prisma.fixture.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      result: true,
      season: { include: { competition: true } },
      predictions: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { kickoffAt: "asc" },
    take: 160
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">足球智能分析</span>
        <h1>每场比赛的预测、赛果和命中情况。</h1>
        <p>
          首页展示最近预测比分、实际比赛结果和预测是否命中。所有内容都是概率分析，不构成投注建议。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/competitions">
            查看赛事
          </Link>
          <Link className="button secondary" href="/admin">
            进入后台
          </Link>
        </div>
      </div>

      <section className="panel">
        <h2>比赛预测总览</h2>
        {params.predicted ? (
          <div className="notice" role="status" style={{ marginBottom: 12 }}>
            已完成单场预测，列表中的最近预测和原因已更新。
          </div>
        ) : null}
        {fixtures.length === 0 ? (
          <p>暂无比赛数据，请先同步赛程或导入 CSV。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>比赛</th>
                <th>赛事</th>
                <th>开球时间</th>
                <th>最近预测</th>
                <th>实际结果</th>
                <th>比分命中</th>
                <th>预测原因</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => {
                const prediction = fixture.predictions[0];
                return (
                  <tr key={fixture.id}>
                    <td>
                      <Link href={`/matches/${fixture.id}`}>
                        {fixture.homeTeam.name} 对 {fixture.awayTeam.name}
                      </Link>
                    </td>
                    <td>{fixture.season.competition.name}</td>
                    <td>{formatDateTime(fixture.kickoffAt)}</td>
                    <td>{formatPredictionScore(prediction)}</td>
                    <td>{formatActualScore(fixture.result)}</td>
                    <td>{formatPredictionAccuracy(prediction, fixture.result)}</td>
                    <td style={{ minWidth: 260 }}>
                      {prediction ? (
                        <span className="muted">{summarizeReason(prediction.explanation)}</span>
                      ) : (
                        "暂无原因"
                      )}
                    </td>
                    <td>{formatFixtureStatus(fixture.status)}</td>
                    <td>
                      <form action="/api/predictions/run-one" method="post">
                        <input type="hidden" name="fixtureId" value={fixture.id} />
                        <button className="button secondary" type="submit">
                          执行预测
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function summarizeReason(explanation: string): string {
  const normalized = explanation.replace(/\s+/g, " ").trim();
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
}
