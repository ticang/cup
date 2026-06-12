# Football AI Prediction Platform

Football match prediction and odds analysis platform. It supports general football competitions, with the World Cup as one configurable competition.

The product shows probabilistic analysis only. It does not provide bet execution, stake sizing, bankroll allocation, or guaranteed-profit advice.

## Quick Start

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client and build the app |
| `npm run lint` | Run Next.js lint checks |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run TypeScript unit tests |
| `npm run db:push` | Apply Prisma schema to local SQLite |
| `npm run db:seed` | Seed sample football data |

## Model Service

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r model-service\requirements.txt
.\.venv\Scripts\python -m pytest model-service\tests
.\.venv\Scripts\python -m uvicorn football_ai.api.app:app --app-dir model-service --host 127.0.0.1 --port 8000
```

## Architecture

See [docs/architecture.md](D:/a/codex/cup/docs/architecture.md) and [docs/prd.md](D:/a/codex/cup/docs/prd.md).
