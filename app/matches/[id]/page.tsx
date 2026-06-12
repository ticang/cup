import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { formatDateTime, formatPercent } from "@/lib/format";
import {
  buildPredictionAnalysis,
  formatActualScore,
  formatFixtureStatus,
  formatOutcome,
  formatPredictionAccuracy,
  predictedOutcome
} from "@/lib/matches/presentation";
import { calculateImpliedProbabilities } from "@/lib/odds/implied-probability";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      result: true,
      season: { include: { competition: true } },
      oddsSnapshots: {
        include: { provider: true },
        orderBy: { capturedAt: "desc" },
        take: 1
      },
      predictions: {
        include: { scoreProbabilities: { orderBy: { probability: "desc" } } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!fixture) {
    notFound();
  }

  const prediction = fixture.predictions[0];
  const latestOdds = fixture.oddsSnapshots[0];
  const implied = latestOdds
    ? calculateImpliedProbabilities({
        homeOdds: latestOdds.homeOdds,
        drawOdds: latestOdds.drawOdds,
        awayOdds: latestOdds.awayOdds
      })
    : null;

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">
          {fixture.season.competition.name} · {fixture.season.name}
        </span>
        <h1>
          {fixture.homeTeam.name} 对 {fixture.awayTeam.name}
        </h1>
        <p>
          {formatDateTime(fixture.kickoffAt)}
          {fixture.venue ? ` · ${fixture.venue}` : ""}
          {` · ${formatFixtureStatus(fixture.status)}`}
        </p>
      </div>

      <div className="notice" role="note">
        本页内容是概率分析，不是投注、金融或投资建议。请不要把模型输出理解为确定性结果。
      </div>

      {!prediction ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>暂无预测</h2>
          <p>管理员可以在后台触发预测生成。</p>
        </section>
      ) : (
        <div className="grid two" style={{ marginTop: 16 }}>
          <section className="panel">
            <h2>模型预测</h2>
            <div className="grid three">
              <div className="metric">
                <span className="muted">最可能比分</span>
                <strong>
                  {prediction.predictedHome}-{prediction.predictedAway}
                </strong>
              </div>
              <div className="metric">
                <span className="muted">最高赛果置信度</span>
                <strong>{formatPercent(prediction.confidence)}</strong>
              </div>
              <div className="metric">
                <span className="muted">大于 2.5 球</span>
                <strong>{formatPercent(prediction.over25Prob)}</strong>
              </div>
            </div>
            <p style={{ marginTop: 16 }}>{prediction.explanation}</p>
          </section>

          <section className="panel">
            <h2>预测分析</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th>预测赛果</th>
                  <td>
                    {formatOutcome(
                      predictedOutcome(prediction),
                      fixture.homeTeam.name,
                      fixture.awayTeam.name
                    )}
                  </td>
                </tr>
                <tr>
                  <th>实际比分</th>
                  <td>{formatActualScore(fixture.result)}</td>
                </tr>
                <tr>
                  <th>比分命中</th>
                  <td>{formatPredictionAccuracy(prediction, fixture.result)}</td>
                </tr>
              </tbody>
            </table>
            <ul style={{ margin: "12px 0 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.7 }}>
              {buildPredictionAnalysis(
                prediction,
                fixture.homeTeam.name,
                fixture.awayTeam.name
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>胜平负概率</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th>{fixture.homeTeam.name}</th>
                  <td>{formatPercent(prediction.homeWinProb)}</td>
                </tr>
                <tr>
                  <th>平局</th>
                  <td>{formatPercent(prediction.drawProb)}</td>
                </tr>
                <tr>
                  <th>{fixture.awayTeam.name}</th>
                  <td>{formatPercent(prediction.awayWinProb)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h2>比分分布前 10</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>比分</th>
                  <th>概率</th>
                </tr>
              </thead>
              <tbody>
                {prediction.scoreProbabilities.slice(0, 10).map((score) => (
                  <tr key={score.id}>
                    <td>
                      {score.homeGoals}-{score.awayGoals}
                    </td>
                    <td>{formatPercent(score.probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h2>市场隐含概率</h2>
            {latestOdds && implied ? (
              <table className="table">
                <tbody>
                  <tr>
                    <th>来源</th>
                    <td>{latestOdds.provider.name}</td>
                  </tr>
                  <tr>
                    <th>{fixture.homeTeam.name}</th>
                    <td>
                      {latestOdds.homeOdds.toFixed(2)} · {formatPercent(implied.home)}
                    </td>
                  </tr>
                  <tr>
                    <th>平局</th>
                    <td>
                      {latestOdds.drawOdds.toFixed(2)} · {formatPercent(implied.draw)}
                    </td>
                  </tr>
                  <tr>
                    <th>{fixture.awayTeam.name}</th>
                    <td>
                      {latestOdds.awayOdds.toFixed(2)} · {formatPercent(implied.away)}
                    </td>
                  </tr>
                  <tr>
                    <th>市场水位</th>
                    <td>{formatPercent(implied.overround)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>暂无赔率快照。</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
