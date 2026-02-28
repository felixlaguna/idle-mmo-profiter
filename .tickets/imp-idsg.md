---
id: imp-idsg
status: closed
deps: [imp-2r6v]
links: []
created: 2026-02-28T22:19:27Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a9ce
---
# Phase 2: Create GitHub Actions CI workflow (lint, typecheck, test)

Create a CI workflow at .github/workflows/ci.yml that runs on every push and pull request to master.

**Project context (from codebase analysis):**
- Vite 7 + Vue 3 + TypeScript (vue-tsc for type-checking)
- Vitest test runner: 15 test files, 274 tests, happy-dom environment
- ESLint + Prettier for linting
- Node 22 (matches Dockerfile node:22-alpine)
- Build command: vue-tsc && vite build
- No env vars needed for build/test (VITE_ vars only affect runtime API config)

**Workflow specification:**

name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Lint
        run: npx eslint .
      - name: Type check
        run: npx vue-tsc --noEmit
      - name: Test
        run: npx vitest run
      - name: Build
        run: npx vite build

**Key decisions:**
- Use Node 22 to match the project Dockerfile (node:22-alpine)
- Run eslint . without --fix (CI should fail on lint issues, not auto-fix)
- Run vue-tsc --noEmit separately before build so type errors are clearly visible
- Run vitest run (non-watch mode, exits after tests)
- Run vite build (without vue-tsc prefix since we already type-checked) as final validation that the bundle compiles
- Cache npm dependencies via actions/setup-node cache option
- Single job (lint, typecheck, test, build) keeps it simple; can parallelize later if CI time grows

## Acceptance Criteria

- File .github/workflows/ci.yml exists and is valid YAML
- Workflow triggers on push to master and pull_request to master
- Pipeline has steps: npm ci, lint, type-check, test, build
- Uses Node 22 with npm cache


## Notes

**2026-02-28T22:43:14Z**

GitHub Actions CI workflow created successfully.

File created: /home/felix/idle-mmo-profiter/.github/workflows/ci.yml

Workflow configuration:
- Name: CI
- Triggers: push to master, pull_request to master
- Job: ci on ubuntu-latest
- Node.js: 22 with npm cache
- Steps:
  1. Checkout code
  2. Setup Node.js 22 with npm cache
  3. npm ci
  4. npx eslint . (without --fix for CI)
  5. npx vue-tsc --noEmit
  6. npm run test:run (vitest run)
  7. npm run build (vue-tsc && vite build)
