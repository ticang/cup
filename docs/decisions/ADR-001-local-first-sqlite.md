# ADR-001: Use SQLite for V1 storage

## Status

Accepted

## Date

2026-06-12

## Context

The first implementation should be production-grade in structure while staying easy to run locally. The user explicitly requested no Redis and local SQLite storage.

Key constraints:

- Single-machine first version.
- No distributed queue in V1.
- Admin-triggered imports and predictions are acceptable.
- Future migration to a hosted database should remain possible.

## Decision

Use SQLite with Prisma for V1 persistence.

## Alternatives Considered

### PostgreSQL

- Pros: better concurrent writes, strong hosted production story, common for multi-user systems.
- Cons: heavier local setup, not aligned with the current request.
- Rejected for V1. Keep as future migration target.

### In-memory storage

- Pros: fastest prototype path.
- Cons: cannot support production-grade auditability, backtests, model versions, or imports.
- Rejected.

## Consequences

- V1 can run locally with minimal infrastructure.
- Long-running and concurrent jobs must be kept simple.
- Schema design should avoid SQLite-specific assumptions where possible.
- A future ADR should cover migration to PostgreSQL if hosted multi-user deployment becomes a goal.
