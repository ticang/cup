# ADR-002: Use a separate Python model service

## Status

Accepted

## Date

2026-06-12

## Context

The platform needs statistical models, ML models, backtesting, and later training experiments. Python has stronger libraries and workflows for model development than TypeScript.

## Decision

Use Next.js and TypeScript for product UI/API, and a separate Python service or CLI package for prediction, backtesting, explanation preparation, and training experiments.

## Alternatives Considered

### All TypeScript

- Pros: one language, simpler deployment shape.
- Cons: weaker ML ecosystem and more friction for future experiments.
- Rejected for this project.

### All Python

- Pros: simple model integration.
- Cons: less aligned with a modern production web UI/admin experience.
- Rejected.

## Consequences

- The boundary between web app and model service must be explicit.
- Test suites exist in both TypeScript and Python.
- Prediction outputs must be persisted so public pages do not depend on live model calls.
