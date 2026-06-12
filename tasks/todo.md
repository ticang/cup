# Todo: Football AI Prediction Platform

## 当前阶段

- [x] 明确产品边界：通用足球预测平台，世界杯作为赛事配置
- [x] 明确安全边界：赔率分析可以做，不做下注执行、仓位或资金分配建议
- [x] 明确技术边界：Next.js + TypeScript + Prisma + SQLite + Python 模型服务
- [x] 编写 PRD：`docs/prd.md`
- [x] 编写架构文档：`docs/architecture.md`
- [x] 编写关键 ADR：`docs/decisions/`
- [ ] 等待用户确认 PRD、架构和本实施计划

## V1 实施计划

- [x] 初始化项目骨架
  - Acceptance: Next.js、TypeScript、Prisma、SQLite、Python model-service 目录存在并能安装依赖
  - Verify: `npm run build`、`npm run typecheck`、Python 测试命令可运行
  - Files: `package.json`、`app/`、`lib/`、`prisma/`、`model-service/`

- [x] 建立数据库模型与种子数据
  - Acceptance: competitions、teams、fixtures、results、odds、predictions、model versions、backtests 等核心表可迁移
  - Verify: Prisma migrate/dev 或等效 SQLite 初始化命令成功
  - Files: `prisma/schema.prisma`、`prisma/seed/`

- [x] 实现 CSV 导入基础能力
  - Acceptance: 管理员可导入球队、赛事、赛程、赛果、赔率样例 CSV，并看到校验错误
  - Verify: CSV parser 单测、手动导入烟雾测试
  - Files: `lib/csv/`、`app/admin/`、`app/api/admin/import/`

- [x] 实现 Python 预测基线
  - Acceptance: Elo + Poisson/Skellam 可对样例比赛输出比分分布和胜平负概率
  - Verify: Python 单测覆盖概率归一化、Elo、Poisson 分布
  - Files: `model-service/football_ai/models/`、`model-service/tests/`

- [x] 实现 ML 与集成层接口
  - Acceptance: 统计模型和 ML 模型输出可通过配置权重合并；无训练产物时可使用确定性基线
  - Verify: 集成层单测覆盖权重、归一化、空模型兜底
  - Files: `model-service/football_ai/features/`、`model-service/football_ai/models/`

- [x] 实现 LLM 解释层
  - Acceptance: 支持 OpenAI-compatible API、Ollama、模板 fallback；输出不包含下注指令
  - Verify: Provider 单测和安全文案测试
  - Files: `model-service/football_ai/explain/`、`lib/safety/`

- [x] 实现公开赛事页与比赛详情页
  - Acceptance: 用户能浏览赛事、比赛列表和比赛详情；详情页显示概率、比分分布、解释、赔率对比和免责声明
  - Verify: 页面烟雾测试、组件测试、手动浏览
  - Files: `app/(public)/`、`components/prediction/`

- [x] 实现管理员后台
  - Acceptance: 管理员能登录、导入 CSV、查看数据质量、触发预测
  - Verify: API 授权测试、手动后台流程
  - Files: `app/admin/`、`lib/auth/`、`app/api/admin/`

- [x] 实现模型评估页
  - Acceptance: 可查看 Backtest、Brier Score、校准摘要、模型版本对比
  - Verify: 后端指标单测、页面烟雾测试
  - Files: `app/admin/evaluations/`、`model-service/football_ai/backtest/`

- [x] V1 验证与收尾
  - Acceptance: 文档命令可执行，核心页面可访问，核心测试通过
  - Verify: `npm run lint`、`npm run typecheck`、`npm test`、Python tests、`npm run build`
  - Files: `README.md`、`.env.example`、相关测试文件

## V1.1 实施计划

- [x] 实现赔率快照重复导入
  - Acceptance: 同一比赛可保存多个时间点赔率，不覆盖历史
  - Verify: 数据库测试和导入测试

- [x] 实现赔率监控大屏
  - Acceptance: 展示赔率变化、隐含概率变化、模型与市场偏差
  - Verify: 页面烟雾测试和手动检查

- [x] 实现偏差提醒
  - Acceptance: 大幅偏差以分析提醒展示，不输出下注指令
  - Verify: 安全文案测试

## V1.2 实施计划

- [x] 实现训练实验配置
  - Acceptance: 管理员可定义数据窗口、特征集、模型参数
  - Verify: 配置校验测试

- [x] 实现实验运行与记录
  - Acceptance: 实验保存参数、数据范围、指标、产物路径
  - Verify: Python 实验测试和数据库记录检查

- [x] 实现模型版本晋级
  - Acceptance: 管理员可把实验产物晋级为可用于预测的 model version
  - Verify: 晋级流程测试和回归预测测试

## Review

已完成 V1、V1.1、V1.2 的首版可运行闭环。

完成内容：

- V1：Next.js 应用、SQLite/Prisma schema、seed 数据、公开赛事页、比赛详情页、管理员登录、CSV 导入、预测触发、模型评估页。
- V1.1：赔率快照重复导入、赔率监控大屏、模型与市场隐含概率偏差提醒。
- V1.2：训练实验数据模型、实验记录 API、实验台页面、实验晋级为模型版本 API。
- 模型：TypeScript 预测核心、Python model-service 基线、Brier Score、LLM provider/fallback 解释层和安全文案过滤。
- Python 后台：FastAPI `/health` 与 `/predict` 接口，可独立运行在 `127.0.0.1:8000`。
- 实时数据：新增 2026 世界杯赛程/赛果同步，管理员可从后台调用 `worldcup26.ir/get/games` 写入本地 SQLite。
- LLM 配置：新增管理员页面配置 Provider、模型地址、AppKey、模型 ID；预测解释优先使用页面配置，未配置时回退环境变量或模板解释。
- 中文化与首页总览：公开视频面改为中文展示；首页新增每场比赛最近预测、实际比分和命中情况；比赛详情新增预测分析内容；已为当前 106 场比赛生成预测记录。
- 后台中文化：管理后台、模型评估、LLM 配置、赔率监控、实验台的比赛名、模型名、指标、导入类型、状态和样例数据展示已改为中文。
- 首页单场预测：每场比赛新增“执行预测”按钮；单场预测会更新最近预测和预测原因；首页直接展示预测原因摘要，预测详情页保留完整分析。
- 后台按钮修复：后台表单提交后统一重定向回页面并显示结果提示；批量预测改为本地模板解释，避免逐场调用 LLM 导致按钮长时间无响应。
- 预测校准修正：实时球队加入基础强弱评分，预测比分不再全部坍缩为 1-1；“命中”改为严格按精确比分判断，比分不一致显示未命中。

验证结果：

- `npm test` 通过：3 个测试文件，7 个测试。
- `python -m pytest model-service\tests` 通过：4 个测试。
- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `$env:DATABASE_URL='file:./dev.db'; npm run build` 通过。
- 生产服务 `localhost:3001` 烟雾检查通过：首页、赛事页、比赛详情页、管理后台、模型评估页、赔率监控页、实验台均返回 200。

已知说明：

- Prisma 6 提示 `package.json#prisma` 配置未来会弃用，目前不影响运行；后续可迁移到 `prisma.config.ts`。
- V1.2 的训练实验台已具备可审计实验记录和晋级流程，真实 ML 训练产物生成仍是后续深化点。
