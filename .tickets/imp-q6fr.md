---
id: imp-q6fr
status: closed
deps: []
links: []
created: 2026-02-25T21:50:21Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-3net
---
# Phase 1: Dockerfile for Vite dev server

Create a Dockerfile that builds and runs the Vite development server for the Vue 3 + TypeScript app.

## Files to create
- /home/felix/idle-mmo-profiter/Dockerfile

## Specification

Use node:22-alpine as the base image (matches the project's modern Vite 7.x / Vue 3 stack).

Dockerfile steps:
1. FROM node:22-alpine
2. WORKDIR /app
3. Copy package.json and package-lock.json first (for Docker layer caching)
4. RUN npm ci (clean install from lockfile)
5. Copy the rest of the source code
6. EXPOSE 5173
7. CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

The --host 0.0.0.0 flag is CRITICAL: by default Vite only listens on localhost, which is unreachable from outside the container. This flag makes it listen on all interfaces so Docker port mapping and the Cloudflare tunnel can reach it.

## Notes
- Keep it simple -- no multi-stage build needed since this is a dev server setup
- The dev server will serve on port 5173 inside the container
- Volume mount in docker-compose will handle live reload (source code changes)

## Acceptance Criteria

- Dockerfile exists at project root
- docker build succeeds
- Container runs vite dev server accessible on port 5173
- Uses --host 0.0.0.0 so it is reachable from outside the container


**2026-02-25T21:52:51Z**

Dockerfile created using node:22-alpine base image. Configured with:
- WORKDIR /app
- npm ci for dependency installation
- Exposes port 5173
- CMD runs 'npm run dev -- --host 0.0.0.0' for Docker networking

File: /home/felix/idle-mmo-profiter/Dockerfile
