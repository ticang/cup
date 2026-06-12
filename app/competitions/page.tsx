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

export default async function CompetitionsPage() {
  const competitions = await prisma.competition.findMany({
    include: {
      seasons: {
        include: {
          fixtures: {
            include: {
              homeTeam: true,
              awayTeam: true,
              result: true,
              predictions: {
                orderBy: { createdAt: "desc" },
                take: 1
              }
            },
            orderBy: { kickoffAt: "asc" }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">公开预测</span>
        <h1>赛事与比赛预测</h1>
        <p>浏览已导入赛事的赛前预测。赔率对比只用于市场分析，不构成投注建议。</p>
      </div>

      {competitions.length === 0 ? (
        <div className="panel">
          <h2>还没有赛事数据</h2>
          <p>请先在管理后台导入 CSV 或运行 seed 命令。</p>
        </div>
      ) : (
        <div className="grid">
          {competitions.map((competition) => (
            <section className="panel" key={competition.id}>
              <span className="badge">{competition.region || "全球"}</span>
              <h2>{competition.name}</h2>
              <p>{competition.description || "通用足球赛事配置。"}</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>比赛</th>
                    <th>开球时间</th>
                    <th>最近预测</th>
                    <th>实际结果</th>
                    <th>比分命中</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {competition.seasons.flatMap((season) =>
                    season.fixtures.map((fixture) => (
                      <tr key={fixture.id}>
                        <td>
                          <Link href={`/matches/${fixture.id}`}>
                            {fixture.homeTeam.name} 对 {fixture.awayTeam.name}
                          </Link>
                        </td>
                        <td>{formatDateTime(fixture.kickoffAt)}</td>
                        <td>{formatPredictionScore(fixture.predictions[0])}</td>
                        <td>{formatActualScore(fixture.result)}</td>
                        <td>{formatPredictionAccuracy(fixture.predictions[0], fixture.result)}</td>
                        <td>{formatFixtureStatus(fixture.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
