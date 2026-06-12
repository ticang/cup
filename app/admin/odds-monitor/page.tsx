import Link from "next/link";
import { formatProviderName, formatTeamName } from "@/lib/admin/presentation";
import { prisma } from "@/lib/db/client";
import { formatDateTime, formatPercent } from "@/lib/format";
import { calculateImpliedProbabilities } from "@/lib/odds/implied-probability";

export const dynamic = "force-dynamic";

export default async function OddsMonitorPage() {
  const snapshots = await prisma.oddsSnapshot.findMany({
    include: {
      provider: true,
      fixture: {
        include: {
          homeTeam: true,
          awayTeam: true,
          predictions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { capturedAt: "desc" },
    take: 50
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">V1.1</span>
        <h1>赔率监控大屏</h1>
        <p>展示赔率快照、市场隐含概率和模型偏差。偏差是分析提醒，不是投注指令。</p>
      </div>

      <section className="panel">
        {snapshots.length === 0 ? (
          <p>暂无赔率快照，请先导入 odds CSV。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>比赛</th>
                <th>来源/时间</th>
                <th>市场隐含概率</th>
                <th>模型偏差提醒</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => {
                const implied = calculateImpliedProbabilities({
                  homeOdds: snapshot.homeOdds,
                  drawOdds: snapshot.drawOdds,
                  awayOdds: snapshot.awayOdds
                });
                const prediction = snapshot.fixture.predictions[0];
                const homeDelta = prediction ? prediction.homeWinProb - implied.home : 0;
                const alert =
                  Math.abs(homeDelta) >= 0.08
                    ? `主胜概率偏差 ${formatPercent(homeDelta, 1)}，需要复核数据质量`
                    : "未见显著偏差";

                return (
                  <tr key={snapshot.id}>
                    <td>
                      <Link href={`/matches/${snapshot.fixtureId}`}>
                        {formatTeamName(snapshot.fixture.homeTeam.name)} 对{" "}
                        {formatTeamName(snapshot.fixture.awayTeam.name)}
                      </Link>
                    </td>
                    <td>
                      {formatProviderName(snapshot.provider.name)}
                      <br />
                      <span className="muted">{formatDateTime(snapshot.capturedAt)}</span>
                    </td>
                    <td>
                      主 {formatPercent(implied.home)} · 平 {formatPercent(implied.draw)} · 客{" "}
                      {formatPercent(implied.away)}
                    </td>
                    <td>{alert}</td>
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
