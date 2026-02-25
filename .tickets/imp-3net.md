---
id: imp-3net
status: closed
deps: []
links: []
created: 2026-02-25T21:49:26Z
type: epic
priority: 2
assignee: Félix Laguna Teno
tags: [docker, cloudflare, devops]
---
# Docker Compose + Cloudflare Tunnel Setup

Add Docker Compose with Cloudflare tunnel runner (like opos-alvaro project). Serve with npm run dev for now. Future epic for Cloudflare Pages deployment.


## Notes

**2026-02-25T21:51:24Z**

## Planning Complete

### Reference Project Analysis (opos-alvaro)
Analyzed the Docker setup from /home/felix/opos-alvaro:
- docker-compose.yml: 7 services (postgres, redis, django, celery_worker, celery_beat, flower, cloudflared)
- Cloudflared service pattern: cloudflare/cloudflared:latest image, 'tunnel run' command, TUNNEL_TOKEN from .env
- .env.example documents CLOUDFLARE_TUNNEL_TOKEN= placeholder
- Makefile with up/down/restart/logs/build/ps/url targets

### Current Project Analysis (idle-mmo-profiter)
- Frontend-only: Vite 7.x + Vue 3 + TypeScript
- Dev command: npm run dev (runs vite, default port 5173)
- No Docker files exist yet
- .gitignore does NOT exclude .env files (must fix before adding secrets)
- Has dist/ folder with built output already

### Files to Create
- /home/felix/idle-mmo-profiter/Dockerfile (new)
- /home/felix/idle-mmo-profiter/docker-compose.yml (new)
- /home/felix/idle-mmo-profiter/.env.example (new)
- /home/felix/idle-mmo-profiter/Makefile (new)

### Files to Modify
- /home/felix/idle-mmo-profiter/.gitignore (add .env exclusion rules)

### Task Structure (4 tasks)
1. imp-q6fr: Dockerfile for Vite dev server (node:22-alpine, --host 0.0.0.0)
2. imp-ed6v: docker-compose.yml (app + cloudflared services)
3. imp-0bo7: .env.example + .gitignore update
4. imp-oezi: Makefile with convenience commands

### Dependencies
- imp-0bo7 (Phase 3: .env) and imp-q6fr (Phase 1: Dockerfile) can be done in parallel
- imp-ed6v (Phase 2: docker-compose) depends on both Phase 1 and Phase 3
- imp-oezi (Phase 4: Makefile) depends on Phase 2

### Future Epic Created
- imp-cib4: Cloudflare Pages Deployment (placeholder, no child tasks)

### Risks
- Vite HMR through Docker: WebSocket connections for Hot Module Replacement may need additional vite.config.ts tweaks (server.watch.usePolling for Docker volume mounts). The implementer should test and add if needed.
- The --host 0.0.0.0 flag on vite is critical; without it the dev server is unreachable from outside the container.

**2026-02-25T21:54:04Z**

Implementation Complete

All four phases completed successfully:

## Files Created
1. /home/felix/idle-mmo-profiter/Dockerfile
   - Node.js 22-alpine base image
   - Runs npm run dev with --host 0.0.0.0 for Docker networking
   - Exposes port 5173

2. /home/felix/idle-mmo-profiter/.env.example
   - CLOUDFLARE_TUNNEL_TOKEN placeholder
   - Documented with instructions

3. /home/felix/idle-mmo-profiter/docker-compose.yml
   - app service: Vite dev server with HMR support (volume mounts)
   - cloudflared service: Cloudflare tunnel for HTTPS access
   - Validated with 'docker compose config'

4. /home/felix/idle-mmo-profiter/Makefile
   - Commands: up, down, restart, logs, build, ps, url, dev, install, clean, help
   - Matches reference project pattern from opos-alvaro

## Files Modified
- /home/felix/idle-mmo-profiter/.gitignore
  - Added .env exclusion rules (.env, .env.local, .env.*.local)

- /home/felix/idle-mmo-profiter/vite.config.ts
  - Added server.host: '0.0.0.0'
  - Added server.watch.usePolling: true for Docker HMR support
  - Added server.port: 5173

## Verification
- docker-compose.yml syntax validated successfully
- All files follow reference project pattern
- Ready for use with: make up

## Usage
1. Copy .env.example to .env and add CLOUDFLARE_TUNNEL_TOKEN
2. Run 'make up' to start services
3. Access app at http://localhost:5173
4. Cloudflare tunnel URL will be shown if configured

**2026-02-25T21:54:45Z**

README.md updated with Docker setup instructions:
- Added Docker prerequisites
- Added Quick Start with Docker section
- Added Cloudflare Tunnel setup instructions
- Added Docker commands reference
- Kept local development instructions

File: /home/felix/idle-mmo-profiter/README.md (updated)
