import { getAdminSession } from "@/lib/auth/session";
import {
  formatEntityLabel,
  formatModelName,
  formatStatusLabel
} from "@/lib/admin/presentation";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    importErrors?: string;
    predicted?: string;
    synced?: string;
    results?: string;
  }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;

  if (!session) {
    return (
      <div className="grid two">
        <section className="panel">
          <span className="eyebrow">管理后台</span>
          <h1>管理员登录</h1>
          <p>V1 只有管理员后台，没有普通用户账号。</p>
          {params.error ? <p style={{ color: "var(--danger)" }}>登录失败，请检查账号密码。</p> : null}
          <form className="form-grid" action="/api/admin/login" method="post">
            <div className="field">
              <label htmlFor="email">邮箱</label>
              <input id="email" name="email" type="email" defaultValue="admin@example.com" />
            </div>
            <div className="field">
              <label htmlFor="password">密码</label>
              <input id="password" name="password" type="password" />
            </div>
            <button className="button" type="submit">
              登录
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>后台能力</h2>
          <p>导入 CSV、检查数据质量、触发预测、查看模型版本和回测结果。</p>
        </section>
      </div>
    );
  }

  const [counts, jobs, models] = await Promise.all([
    getCounts(),
    prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.modelVersion.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">管理后台</span>
        <h1>管理后台</h1>
        <p>当前登录：{session.email}</p>
      </div>

      <AdminNotice params={params} />

      <div className="grid three">
        {counts.map((count) => (
          <div className="card metric" key={count.label}>
            <span className="muted">{count.label}</span>
            <strong>{count.value}</strong>
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>CSV 导入</h2>
          <form
            className="form-grid"
            action="/api/admin/import"
            method="post"
            encType="multipart/form-data"
          >
            <div className="field">
              <label htmlFor="entity">数据类型</label>
              <select id="entity" name="entity">
                <option value="competitions">赛事</option>
                <option value="teams">球队</option>
                <option value="fixtures">比赛</option>
                <option value="odds">赔率</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="file">CSV 文件</label>
              <input id="file" name="file" type="file" accept=".csv,text/csv" required />
            </div>
            <button className="button" type="submit">
              上传导入
            </button>
          </form>
          <p>
            上传后会回到本页，并显示导入成功行数和错误行数。
          </p>
        </section>

        <section className="panel">
          <h2>预测任务</h2>
          <form action="/api/admin/predictions/run" method="post">
            <button className="button" type="submit">
              触发全部待赛预测
            </button>
          </form>
          <p style={{ marginTop: 12 }}>
            V1 使用本地同步触发，不使用 Redis 或分布式队列。
          </p>
        </section>

        <section className="panel">
          <h2>LLM 配置</h2>
          <p>配置模型地址、AppKey 和模型 ID，用于生成预测解释。</p>
          <a className="button secondary" href="/admin/llm-settings">
            打开配置页
          </a>
        </section>

        <section className="panel">
          <h2>实时赛程与赛果</h2>
          <form action="/api/admin/worldcup2026/sync" method="post">
            <button className="button" type="submit">
              同步 2026 世界杯
            </button>
          </form>
          <p style={{ marginTop: 12 }}>
            从 worldcup26.ir 获取当前赛程和已完赛比分，写入本地 SQLite。
          </p>
        </section>

        <section className="panel">
          <h2>最近导入</h2>
          {jobs.length === 0 ? (
            <p>暂无导入记录。</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>状态</th>
                  <th>成功/总数</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{formatEntityLabel(job.entity)}</td>
                    <td>{formatStatusLabel(job.status)}</td>
                    <td>
                      {job.successRows}/{job.totalRows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>模型版本</h2>
          {models.length === 0 ? (
            <p>暂无模型版本。</p>
          ) : (
            <table className="table">
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <th>{formatModelName(model.name)}</th>
                    <td>{formatStatusLabel(model.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function AdminNotice(params: {
  params: {
    error?: string;
    imported?: string;
    importErrors?: string;
    predicted?: string;
    synced?: string;
    results?: string;
  };
}) {
  const { error, imported, importErrors, predicted, synced, results } = params.params;

  if (error) {
    const message =
      error === "login-required"
        ? "请先登录后再执行后台操作。"
        : error === "import-invalid"
          ? "导入请求无效，请选择正确的数据类型和 CSV 文件。"
          : "操作失败，请检查输入后重试。";

    return (
      <div className="notice" role="alert" style={{ marginBottom: 16 }}>
        {message}
      </div>
    );
  }

  if (imported) {
    return (
      <div className="notice" role="status" style={{ marginBottom: 16 }}>
        导入完成：成功 {imported} 行，错误 {importErrors ?? "0"} 行。
      </div>
    );
  }

  if (predicted) {
    return (
      <div className="notice" role="status" style={{ marginBottom: 16 }}>
        预测完成：已更新 {predicted} 场未开始比赛。
      </div>
    );
  }

  if (synced) {
    return (
      <div className="notice" role="status" style={{ marginBottom: 16 }}>
        同步完成：更新 {synced} 场赛程，其中 {results ?? "0"} 场已有赛果。
      </div>
    );
  }

  return null;
}

async function getCounts() {
  const [
    competitions,
    teams,
    fixtures,
    predictions,
    oddsSnapshots,
    backtests
  ] = await Promise.all([
    prisma.competition.count(),
    prisma.team.count(),
    prisma.fixture.count(),
    prisma.prediction.count(),
    prisma.oddsSnapshot.count(),
    prisma.backtestRun.count()
  ]);

  return [
    { label: "赛事", value: competitions },
    { label: "球队", value: teams },
    { label: "比赛", value: fixtures },
    { label: "预测", value: predictions },
    { label: "赔率快照", value: oddsSnapshots },
    { label: "回测", value: backtests }
  ];
}
