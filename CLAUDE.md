# CLAUDE.md — QuickClip (Clip_PNJ)

This file provides guidance for AI assistants (Claude Code, etc.) working in this repository.

## Project Overview

**Repository:** Clip_PNJ (QuickClip)
**Owner:** Mindyourbiz9000
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · FFmpeg · Docker

QuickClip is a database-free web app that generates downloadable MP4 clips from direct video URLs. Users paste a link, pick start/end times, choose an output format (16:9 / 9:16 / 1:1), and download the clip. No accounts, no database, no history.

## Repository Structure

```
Clip_PNJ/
├── app/
│   ├── api/
│   │   └── clip/
│   │       └── route.ts        # POST /api/clip — main API endpoint
│   ├── globals.css              # Tailwind base styles
│   ├── layout.tsx               # Root layout (metadata, html/body)
│   └── page.tsx                 # Single-page UI (client component)
├── lib/
│   ├── cleanup.ts               # Safe temp file deletion
│   ├── ffmpeg.ts                # FFmpeg arg builder + process runner
│   ├── semaphore.ts             # In-memory concurrency limiter
│   ├── time.ts                  # HH:MM:SS parsing + duration computation
│   └── validateUrl.ts           # SSRF-safe URL validation with DNS check
├── public/
│   └── .gitkeep
├── .env.example                 # Environment variable template
├── .gitignore
├── CLAUDE.md                    # AI assistant guidance (this file)
├── Dockerfile                   # Multi-stage build (Node 20 + FFmpeg)
├── docker-compose.yml           # Single-service compose config
├── next.config.js               # Next.js config (standalone output)
├── package.json
├── postcss.config.js
├── README.md                    # User-facing documentation
├── tailwind.config.ts
└── tsconfig.json
```

## Development Setup

### Prerequisites

- **Node.js 20+** and npm
- **FFmpeg** installed and on PATH (for local dev)
- Or just **Docker** + **Docker Compose** (FFmpeg included in image)

### Getting Started

```bash
# Clone
git clone https://github.com/Mindyourbiz9000/Clip_PNJ.git
cd Clip_PNJ

# Copy env file
cp .env.example .env

# Option A: Docker (recommended)
docker compose up --build
# → http://localhost:3000

# Option B: Local
npm install
npm run dev
# → http://localhost:3000
```

## Build & Run

| Task       | Command                        |
|------------|--------------------------------|
| Install    | `npm install`                  |
| Dev server | `npm run dev`                  |
| Build      | `npm run build`                |
| Start prod | `npm start`                    |
| Lint       | `npm run lint`                 |
| Docker     | `docker compose up --build`    |

## Testing

No testing framework configured yet. When adding tests:
- Use `vitest` or `jest` with `@testing-library/react`
- Place test files alongside source as `*.test.ts` / `*.test.tsx`
- Focus on: URL validation, time parsing, semaphore logic, API route responses

## Architecture

### Data Flow

```
Browser (page.tsx)
  ↓ POST /api/clip { url, start, end, format, limit60 }
  ↓
API Route (app/api/clip/route.ts)
  ├── validateUrl()    → SSRF-safe URL check + DNS resolution
  ├── computeDuration()→ Parse times, validate range, enforce cap
  ├── clipSemaphore    → Acquire concurrency slot
  └── runFfmpeg()      → Spawn ffmpeg, cut + crop + encode → /tmp/*.mp4
  ↓
Response: stream MP4 file → cleanup temp file
  ↓
Browser: blob → ObjectURL → <a download> → quickclip.mp4
```

### Key Modules

| Module | Responsibility |
|---|---|
| `lib/validateUrl.ts` | URL parsing, protocol/credential checks, DNS resolution, private IP blocking (SSRF) |
| `lib/time.ts` | HH:MM:SS parsing, duration calculation, max-seconds enforcement |
| `lib/semaphore.ts` | Counting semaphore limiting concurrent FFmpeg processes |
| `lib/ffmpeg.ts` | Build FFmpeg CLI args per format, spawn process with timeout, return output path |
| `lib/cleanup.ts` | Safe file deletion (ignores ENOENT) |
| `app/api/clip/route.ts` | Request validation, orchestration, file streaming, error responses |
| `app/page.tsx` | Client-side form, fetch + blob download, status display |

### FFmpeg Format Presets

| Format | Resolution | Filter |
|---|---|---|
| `landscape` | Max 1280w | `scale='min(1280,iw)':-2` |
| `vertical` | 720×1280 | `scale=-2:1280,crop=720:1280` |
| `square` | 720×720 | `scale=720:-2,crop=720:720` |

Encoding: libx264, veryfast, CRF 23, yuv420p, AAC 128k, faststart.

## Environment & Configuration

All via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `MAX_CLIP_SECONDS` | `60` | Hard cap on clip duration |
| `FFMPEG_TIMEOUT_SECONDS` | `120` | Kill FFmpeg after this many seconds |
| `MAX_CONCURRENT` | `1` | Max simultaneous FFmpeg processes |
| `TMP_DIR` | `/tmp` | Where temp MP4s are written |
| `PORT` | `3000` | Server listen port |

The `.env` file is gitignored. Only `.env.example` is committed.

## Security Considerations

- **SSRF protection** in `lib/validateUrl.ts`: blocks private IPs (10/8, 172.16/12, 192.168/16, 169.254/16, 127/8), loopback, link-local. Resolves DNS A/AAAA records and checks all resolved IPs.
- **Credential blocking**: URLs with `user:pass@host` are rejected.
- **Protocol enforcement**: only `http:` and `https:`.
- **FFmpeg timeout**: prevents runaway processes.
- **Concurrency semaphore**: prevents resource exhaustion.
- **Temp file cleanup**: always runs in `finally` block.

When modifying URL validation or FFmpeg invocation, take extra care not to weaken these protections.

## Code Conventions

### General

- TypeScript strict mode enabled.
- Functional style preferred; no classes except `Semaphore`.
- Errors thrown as `new Error(message)` — the API route catches and maps to HTTP status codes.
- No database, no auth, no sessions — keep it stateless.

### Git Workflow

- Feature branches: `claude/<description>-<session-id>` for Claude Code sessions.
- Commit messages: imperative mood ("Add feature", not "Added feature").
- Never force-push to shared branches.
- Never commit `.env`, secrets, or credentials.

### Style

- Tailwind CSS for styling (no separate CSS modules).
- Next.js App Router conventions (server components by default, `"use client"` only when needed).
- Lint with `next lint` (ESLint).

## Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-24 | Next.js 14 App Router + TypeScript | Modern React framework with built-in API routes |
| 2026-02-24 | No database | MVP simplicity — stateless clip generation |
| 2026-02-24 | FFmpeg via child_process.spawn | Direct control over encoding, no wrapper library needed |
| 2026-02-24 | Standalone Docker output | Single container with FFmpeg baked in |
| 2026-02-24 | In-memory semaphore | Simple concurrency control without external dependencies |

## AI Assistant Notes

When working in this repository:

1. **Read this file first** at the start of every session.
2. **Update this file** when adding new tooling, dependencies, or architectural patterns.
3. **Never commit secrets** — check for `.env` files, API keys, or credentials before staging.
4. **Run `npm run lint`** before committing and fix any issues.
5. **Run `npm run build`** to verify the build succeeds before pushing.
6. **Preserve SSRF protections** — do not weaken URL validation without explicit approval.
7. **Keep it stateless** — no database, no sessions, no persistent state.
8. **Prefer editing existing files** over creating new ones.
9. **Keep changes focused** — one logical change per commit.
10. **Test with Docker** when changing Dockerfile or system dependencies.
