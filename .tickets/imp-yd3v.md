---
id: imp-yd3v
status: closed
deps: [imp-uvfm]
links: []
created: 2026-02-28T23:15:23Z
type: task
priority: 3
assignee: Félix Laguna Teno
parent: imp-rgz3
tags: [docs]
---
# Update README to remove raw npm commands and document Docker-only workflow

Rewrite the README to make Docker the only documented development path. Remove all raw npm/npx command references. Document all new Makefile targets.

## Design

File: /home/felix/idle-mmo-profiter/README.md

Changes:
1. Prerequisites: Remove "Node.js 18+ and npm (for local development)", keep only Docker
2. Remove the entire "Local Development (Without Docker)" section
3. Remove the "Local Commands" subsection
4. Expand the "Docker Commands" section to include all new targets:

```markdown
### Prerequisites
- **Docker and Docker Compose**

### Development Commands

```bash
make help          # Show all available commands

# Services
make up            # Start all services (app + tunnel)
make dev           # Start dev server only (no tunnel)
make down          # Stop all services
make restart       # Restart services
make logs          # View logs (follow mode)
make ps            # Show running containers

# Code Quality
make lint          # Run ESLint
make lint-fix      # Run ESLint with auto-fix
make typecheck     # Run TypeScript type checking
make format        # Run Prettier formatter
make test          # Run tests (single run)
make test-watch    # Run tests (watch mode)

# Build
make build         # Rebuild Docker images
make build-app     # Build application for production
make ci            # Run full CI suite (lint + typecheck + test + build)

# Utilities
make install       # Install npm dependencies in container
make clean         # Clean node_modules and dist
make refresh-prices # Refresh market prices from API
make url           # Show application URLs
```

## Acceptance Criteria

- [ ] No raw npm or npx commands appear anywhere in README.md
- [ ] 'Local Development (Without Docker)' section is removed
- [ ] 'Local Commands' section (with npm run lint, npm run format, npx vue-tsc) is removed
- [ ] Prerequisites list only Docker and Docker Compose (remove Node.js/npm)
- [ ] All Makefile targets are documented, including new ones (lint, lint-fix, typecheck, test, test-watch, format, build-app, refresh-prices, ci)
- [ ] Quick Start section uses make commands only
- [ ] Document the make ci target as the way to run the full check suite locally


## Notes

**2026-02-28T23:24:39Z**

Updated README.md to use Docker-first approach:
- Removed Node.js/npm from prerequisites, kept only Docker
- Removed 'Quick Start with Docker (Recommended)' qualifier - now just 'Quick Start'
- Removed entire 'Local Development (Without Docker)' section
- Removed 'Local Commands' section with raw npm/npx commands
- Expanded Development Commands section with all Makefile targets
- All commands now use 'make' targets instead of raw npm commands

Files modified:
- /home/felix/idle-mmo-profiter/README.md

Verification: No raw npm/npx commands remain in user-facing sections (only descriptive text for what make install does)
