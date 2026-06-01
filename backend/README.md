# Backend (phase 2)

Not built yet. This is where the **.NET Web Core API + PostgreSQL + Docker**
showcase backend will live, following Clean Architecture (Domain → Application →
Infrastructure → API).

Per `docs/SPEC.md` §10, the build is sequenced **local-first first**: the Tauri +
React core loop (`apps/web`) ships before the backend. Accounts, persistence,
and cross-device sync arrive here in phase 2. The frontend already isolates
storage behind repository ports (`apps/web/src/application/ports.ts`), so the
local Dexie store can be swapped for this API's client without rewriting the
use-cases.

## API contract: spec-first OpenAPI (phase 2)

The frontend/backend contract will be **spec-first**: a hand-authored
`openapi.yaml` is the single source of truth, and we generate **both** the .NET
server stubs and the TypeScript client from it. This keeps the wire contract
neutral to either stack and is a clean engineering artifact for the portfolio.

Scope note — OpenAPI generates the **transport contract** (DTOs + HTTP client),
not domain behavior. The rich domain logic (`deriveBalance`, `canAfford`,
Fibonacci snapping, the no-debt rule) stays hand-written and *separate* on each
side, per Clean Architecture. On the frontend, the generated client lands as an
alternate implementation of the existing repository ports in
`apps/web/src/infrastructure/`, mapping generated DTOs ↔ the frontend domain
types — no change to `domain/` or `application/`.
