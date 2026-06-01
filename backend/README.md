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
