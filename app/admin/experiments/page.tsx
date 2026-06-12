import {
  formatDataWindow,
  formatExperimentName,
  formatMetricName,
  formatModelName
} from "@/lib/admin/presentation";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; promoted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const experiments = await prisma.trainingExperiment.findMany({
    include: {
      metrics: true,
      promotedModelVersion: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">V1.2</span>
        <h1>模型训练实验台</h1>
        <p>记录特征集、参数、验证指标和晋级模型版本。V1.2 先提供可审计实验流。</p>
      </div>

      <ExperimentNotice params={params} />

      <div className="grid two">
        <section className="panel">
          <h2>运行样例实验</h2>
          <form className="form-grid" action="/api/admin/experiments/run" method="post">
            <div className="field">
              <label htmlFor="name">实验名称</label>
              <input id="name" name="name" defaultValue="集成模型实验" />
            </div>
            <button className="button" type="submit">
              记录实验
            </button>
          </form>
          <p>当前实现记录可复现实验元数据和指标；真实训练产物可在后续接入。</p>
        </section>

        <section className="panel">
          <h2>晋级规则</h2>
          <p>
            实验只有在指标、数据窗口和参数都被持久化后，才能晋级为可用于预测的模型版本。
          </p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>实验历史</h2>
        {experiments.length === 0 ? (
          <p>暂无实验记录。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>实验</th>
                <th>指标</th>
                <th>晋级模型</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((experiment) => (
                <tr key={experiment.id}>
                  <td>
                    {formatExperimentName(experiment.name)}
                    <br />
                    <span className="muted">{formatDataWindow(experiment.dataWindow)}</span>
                  </td>
                  <td>
                    {experiment.metrics.map((metric) => (
                      <div key={metric.id}>
                        {formatMetricName(metric.name)}: {metric.value.toFixed(3)}
                      </div>
                    ))}
                  </td>
                  <td>
                    {experiment.promotedModelVersion ? (
                      formatModelName(experiment.promotedModelVersion.name)
                    ) : (
                      <form action="/api/admin/experiments/promote" method="post">
                        <input type="hidden" name="experimentId" value={experiment.id} />
                        <button className="button secondary" type="submit">
                          晋级
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function ExperimentNotice({
  params
}: {
  params: { created?: string; promoted?: string; error?: string };
}) {
  if (params.error) {
    const message =
      params.error === "login-required"
        ? "请先登录后再执行实验操作。"
        : "实验操作失败，请刷新后重试。";

    return (
      <div className="notice" role="alert" style={{ marginBottom: 16 }}>
        {message}
      </div>
    );
  }

  if (params.created) {
    return (
      <div className="notice" role="status" style={{ marginBottom: 16 }}>
        实验已记录，历史列表已更新。
      </div>
    );
  }

  if (params.promoted) {
    return (
      <div className="notice" role="status" style={{ marginBottom: 16 }}>
        实验已晋级为模型版本。
      </div>
    );
  }

  return null;
}
