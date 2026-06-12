# ADR-003: Use LLMs for explanations, not primary predictions

## Status

Accepted

## Date

2026-06-12

## Context

The product needs "AI prediction", but predictions must be auditable, backtestable, and explainable. LLMs alone are not suitable as the primary source of score probabilities.

## Decision

Use statistical and ML models for prediction. Use LLM providers only to generate plain-language explanations from structured prediction outputs. Support OpenAI-compatible APIs and Ollama, with deterministic template fallback.

## Alternatives Considered

### LLM-only prediction

- Pros: fast to demo.
- Cons: hard to backtest reliably, unstable outputs, poor auditability.
- Rejected.

### No LLM

- Pros: deterministic and simple.
- Cons: weaker user-facing explanation quality.
- Rejected because the project explicitly wants AI-assisted explanations.

## Consequences

- All model probabilities must exist before explanation generation.
- LLM prompts must be constrained to structured model facts.
- Safety filtering must prevent betting instructions from appearing in generated explanations.
