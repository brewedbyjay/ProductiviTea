# ProductiviTea

A cross-platform, gamified productivity app. Define your own tasks and rewards,
earn in-app currency by completing tasks, and spend it on rewards you actually
want — reframing rewards as something you **earn**, not something you impulsively
consume.

> Full product & design spec: [`docs/SPEC.md`](docs/SPEC.md).

## Status

Early build. The first vertical slice of the core loop is in place:
**create a task -> complete it -> earn Fibonacci currency -> balance persists
across reloads.** Everything is local-first; the backend comes later.

## Repository layout

```
apps/
  web/        React + Vite + TypeScript frontend (also the hosted web build)
  desktop/    Tauri 2.0 shell that wraps the web build into a native app
backend/      .NET API + PostgreSQL — phase 2 (not built yet)
docs/         SPEC.md (source of truth) + ARCHIVED_IDEAS.md
```

The same React build powers both the browser version and the Tauri desktop app.

### Frontend architecture

The frontend is layered like the future .NET backend, so the mental model is
consistent across both stacks:

- `src/domain/` — pure entities and rules (Fibonacci scale, balance projection). No framework, no IO.
- `src/application/` — use-cases (`createActivity`, `completeActivity`, `getBalance`) behind repository ports.
- `src/infrastructure/` — adapters; currently Dexie/IndexedDB implementations of the ports.
- `src/ui/` — React components.

Balance, streaks, and stats are **derived projections** over an append-only,
immutable completion log — never stored as mutable running totals.

## Getting started

Prerequisites: Node 20+, and (for the desktop app) the Rust toolchain.

```sh
# Web app (browser)
cd apps/web
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)

# Desktop app (Tauri) — runs the web app in a native window
cd apps/desktop
npm install
npm run dev
```

## Conventions

English throughout · Conventional Commits · only permissively-licensed
(MIT/Apache-2.0/BSD) dependencies. See [`docs/SPEC.md`](docs/SPEC.md) for the
full design and the licensing constraint.
