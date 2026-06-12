import {
  formatDataWindow,
  formatMetricName,
  formatModelName,
  formatSegmentLabel
} from "@/lib/admin/presentation";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function EvaluationsPage() {
  const runs = await prisma.backtestRun.findMany({
    include: {
      modelVersion: true,
      metrics: true
    },
    orderBy: { startedAt: "desc" }
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">模型评估</span>
        <h1>模型评估</h1>
        <p>对比回测指标、校准表现和模型版本。V1 先展示核心指标，V1.2 再扩展训练实验台。</p>
      </div>

      {runs.length === 0 ? (
        <section className="panel">
          <h2>暂无回测</h2>
          <p>运行 seed 后会有一条样例回测记录。</p>
        </section>
      ) : (
        <div className="grid">
          {runs.map((run) => (
            <section className="panel" key={run.id}>
              <span className="badge">{formatModelName(run.modelVersion.name)}</span>
              <h2>{formatDataWindow(run.name)}</h2>
              <p>{formatDataWindow(run.dataWindow)}</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>指标</th>
                    <th>数值</th>
                    <th>分段</th>
                  </tr>
                </thead>
                <tbody>
                  {run.metrics.map((metric) => (
                    <tr key={metric.id}>
                      <td>{formatMetricName(metric.name)}</td>
                      <td>{metric.value.toFixed(3)}</td>
                      <td>{formatSegmentLabel(metric.segment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
