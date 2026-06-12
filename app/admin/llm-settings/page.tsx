import { getAdminSession } from "@/lib/auth/session";
import { formatProviderName } from "@/lib/admin/presentation";
import { prisma } from "@/lib/db/client";
import { maskAppKey } from "@/lib/llm/settings";

export const dynamic = "force-dynamic";

export default async function LlmSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;

  if (!session) {
    return (
      <section className="panel">
        <span className="eyebrow">管理后台</span>
        <h1>LLM 配置</h1>
        <p>请先登录管理后台，再配置模型服务。</p>
      </section>
    );
  }

  const settings = await prisma.llmSettings.findUnique({
    where: { id: "default" }
  });

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">LLM 配置</span>
        <h1>页面配置 LLM 模型</h1>
        <p>配置解释层使用的模型地址、AppKey 和模型 ID。留空 AppKey 不会覆盖已有密钥。</p>
      </div>

      {params.saved ? (
        <div className="notice" role="status">
          配置已保存。下次触发预测时会优先使用这里的设置。
        </div>
      ) : null}

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>模型配置</h2>
          <form className="form-grid" action="/api/admin/llm-settings" method="post">
            <div className="field">
              <label htmlFor="provider">模型类型</label>
              <select id="provider" name="provider" defaultValue={settings?.provider ?? "openai-compatible"}>
                <option value="openai-compatible">OpenAI 兼容接口</option>
                <option value="ollama">Ollama 本地模型</option>
                <option value="template">模板解释</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="baseUrl">模型地址</label>
              <input
                id="baseUrl"
                name="baseUrl"
                placeholder="https://api.openai.com/v1 或 http://localhost:11434"
                defaultValue={settings?.baseUrl ?? "https://api.openai.com/v1"}
              />
            </div>

            <div className="field">
              <label htmlFor="modelId">模型 ID</label>
              <input
                id="modelId"
                name="modelId"
                placeholder="gpt-4.1-mini / qwen2.5 / llama3.1"
                defaultValue={settings?.modelId ?? "gpt-4.1-mini"}
              />
            </div>

            <div className="field">
              <label htmlFor="appKey">AppKey</label>
              <input
                id="appKey"
                name="appKey"
                type="password"
                placeholder={settings?.appKey ? "留空则保留已有 AppKey" : "输入 AppKey"}
                autoComplete="off"
              />
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input name="enabled" type="checkbox" defaultChecked={settings?.enabled ?? true} />
              启用该 LLM 配置
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input name="clearAppKey" type="checkbox" />
              清除已保存的 AppKey
            </label>

            <button className="button" type="submit">
              保存配置
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>当前状态</h2>
          <table className="table">
            <tbody>
              <tr>
                <th>模型类型</th>
                <td>{settings?.provider ? formatProviderName(settings.provider) : "未配置"}</td>
              </tr>
              <tr>
                <th>模型地址</th>
                <td>{settings?.baseUrl ?? "未配置"}</td>
              </tr>
              <tr>
                <th>模型 ID</th>
                <td>{settings?.modelId ?? "未配置"}</td>
              </tr>
              <tr>
                <th>AppKey</th>
                <td>{maskAppKey(settings?.appKey)}</td>
              </tr>
              <tr>
                <th>状态</th>
                <td>{settings?.enabled ?? true ? "启用" : "停用"}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>
            AppKey 会保存到本地 SQLite，页面不会明文回显。生产部署时建议改成加密存储或外部密钥管理。
          </p>
        </section>
      </div>
    </>
  );
}
