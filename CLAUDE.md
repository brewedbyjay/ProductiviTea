# ProductiviTea — CLAUDE.md

## Project Overview

ProductiviTea is a cross-platform gamified productivity app. The core idea is to help users build healthy routines by rewarding task completion with in-app currency that can be spent on user-defined rewards. It reframes how users think about delayed gratification.

**Key concept:**
- Users define their own tasks (e.g., cook a meal, work out, code for 1h)
- Users define their own rewards (e.g., drink a Cola, watch a movie, gaming session)
- Every entry has a value/tier based on effort or desirability
- Completing tasks earns currency → currency is spent in the shop to unlock rewards
- Streaks track consistency and incentivize daily engagement

## Tech Stack (directional — finalization in progress)

| Layer | Technology |
|---|---|
| Frontend | React |
| Desktop/Mobile shell | Tauri 2.0 |
| Backend API | .NET Web Core API |
| Database | PostgreSQL |
| Infrastructure | Docker |

**Architecture principles:**
- **Mobile-first** UI design
- **Clean Architecture / Modular Monolith** on the backend
- Cross-device sync via the .NET API

## Features

### Core
- [ ] Task management — create, edit, delete daily tasks with tier/value
- [ ] Reward management — create, edit, delete rewards with tier/value
- [ ] Currency system — earn on task completion, spend in shop
- [ ] Shop — browse and purchase user-defined rewards
- [ ] Streaks — track consecutive days of task completion

### Platform
- [ ] Cross-device sync via API
- [ ] Push notifications / reminders
- [ ] Offline-first capability (local state, sync when online)

## Architecture Overview

```
┌─────────────────────────────────┐
│  Tauri Shell (Desktop/Mobile)   │
│  ┌───────────────────────────┐  │
│  │  React Frontend           │  │
│  │  (Mobile-first UI)        │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ HTTP / WebSocket
┌──────────────▼──────────────────┐
│  .NET Web Core API              │
│  (Clean Architecture /          │
│   Modular Monolith)             │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  PostgreSQL                     │
└─────────────────────────────────┘

Docker containers: API + PostgreSQL
```

## Development Conventions

- **Language**: All code, comments, commit messages, and documentation are written in **English**
- **Comments**: Write comments to explain intent, non-obvious logic, and context for collaborators — not to restate what the code does
- **Commits**: Conventional Commits style (`feat:`, `fix:`, `chore:`, etc.)
- **Branching**: Feature branches off `main`, PRs for review before merging
- **API design**: RESTful, versioned endpoints (`/api/v1/...`)
- **Frontend**: Component-based React, keep components small and focused
- **Backend**: Follow Clean Architecture layers — Domain, Application, Infrastructure, API

## Project Goals

1. Help users build sustainable daily routines
2. Shift the mindset around rewards from impulsive to earned
3. Make habit-tracking feel like a game, not a chore
