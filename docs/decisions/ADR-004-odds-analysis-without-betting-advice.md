# ADR-004: Provide odds analysis without betting advice

## Status

Accepted

## Date

2026-06-12

## Context

The product includes odds analysis and market-implied probability comparisons. Direct betting instructions, stake sizing, bankroll strategy, and sportsbook routing create compliance and user-harm risk.

## Decision

The platform may show odds, implied probabilities, odds movement, model-vs-market deviation, and historical backtests. It must not output actual betting instructions, bet placement steps, stake sizing, bankroll allocation, or guaranteed-profit language.

## Alternatives Considered

### Full betting decision system

- Pros: more directly tied to betting workflows.
- Cons: unacceptable compliance and harm risk.
- Rejected.

### No odds at all

- Pros: simplest safety posture.
- Cons: loses an important analytical dimension requested by the user.
- Rejected in favor of bounded odds analysis.

## Consequences

- UI copy must use analysis language, not instruction language.
- Public pages need disclaimers.
- LLM output must be constrained and checked.
- Admin research features must preserve the same safety boundary.
