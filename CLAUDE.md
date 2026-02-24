# CLAUDE.md — Clip_PNJ

This file provides guidance for AI assistants (Claude Code, etc.) working in this repository.

## Project Overview

**Repository:** Clip_PNJ
**Status:** Newly initialized — no source code or configuration files yet.
**Owner:** Mindyourbiz9000

This repository is in its initial bootstrapping phase. As the project evolves, this document should be updated to reflect the current architecture, conventions, and workflows.

## Repository Structure

```
Clip_PNJ/
├── CLAUDE.md          # AI assistant guidance (this file)
└── .git/              # Git repository
```

> **Note:** Update this tree as files and directories are added.

## Development Setup

### Prerequisites

_To be determined as the project is initialized. Update this section with:_
- Required runtime (Node.js, Python, etc.) and version
- Package manager (npm, yarn, pnpm, pip, etc.)
- System dependencies
- Environment variables (document required `.env` keys without secrets)

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd Clip_PNJ

# Install dependencies (update command when package manager is chosen)
# npm install / pip install -r requirements.txt / etc.
```

## Build & Run

_Update with actual commands once the build system is configured._

| Task        | Command |
|-------------|---------|
| Install     | TBD     |
| Dev server  | TBD     |
| Build       | TBD     |
| Test        | TBD     |
| Lint        | TBD     |
| Format      | TBD     |

## Testing

_No testing framework configured yet. When one is added, document:_
- Test runner and framework
- How to run all tests: `<command>`
- How to run a single test file: `<command> <path>`
- Test file naming conventions (e.g., `*.test.ts`, `test_*.py`)
- Test directory structure

## Code Conventions

### General Guidelines

- Keep code simple and readable; avoid over-engineering.
- Write small, focused functions with clear names.
- Prefer explicit over implicit behavior.
- Add comments only where the logic is non-obvious.

### Git Workflow

- **Branch naming:** Feature branches follow `claude/<description>-<session-id>` for Claude Code sessions.
- **Commit messages:** Use clear, descriptive messages. Prefer imperative mood (e.g., "Add feature" not "Added feature").
- **Do not** force-push to shared branches.
- **Do not** commit secrets, credentials, or `.env` files.

### Style & Formatting

_Update when linter/formatter is configured:_
- Linter: TBD
- Formatter: TBD
- Config files: TBD

## Architecture

_Document the architecture as it is established:_
- Entry points
- Core modules and their responsibilities
- Data flow
- External dependencies / APIs
- Database schema (if applicable)

## Environment & Configuration

- No `.env` file exists yet. When one is needed, create a `.env.example` with placeholder values and add `.env` to `.gitignore`.
- Document all required environment variables in this section.

## Key Decisions Log

Track important architectural and technology decisions here as they are made:

| Date       | Decision | Rationale |
|------------|----------|-----------|
| 2026-02-24 | Repository created | Initial project setup |

## AI Assistant Notes

When working in this repository, AI assistants should:

1. **Read this file first** at the start of every session.
2. **Update this file** when adding new tooling, dependencies, or architectural patterns.
3. **Never commit secrets** — check for `.env` files, API keys, or credentials before staging.
4. **Run tests before committing** once a test suite exists.
5. **Run lint/format checks** once configured, and fix issues before committing.
6. **Prefer editing existing files** over creating new ones.
7. **Keep changes focused** — one logical change per commit.
