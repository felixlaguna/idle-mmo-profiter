---
id: imp-ed6v
status: closed
deps: [imp-q6fr, imp-0bo7]
links: []
created: 2026-02-25T21:50:33Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-3net
---
# Phase 2: docker-compose.yml with Cloudflare tunnel

Create a docker-compose.yml modeled after opos-alvaro's pattern, but simplified for this frontend-only project. Only two services: the Vite app and Cloudflare tunnel.

## Files to create
- /home/felix/idle-mmo-profiter/docker-compose.yml

## Specification

### Service 1: app
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: idlemmo_app
    volumes:
      - .:/app
      - /app/node_modules   # Anonymous volume to preserve container's node_modules
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=development
    restart: unless-stopped
```

Key design decisions:
- Volume mount `.:/app` enables live reload -- edit files on host, Vite HMR picks them up instantly
- Anonymous volume `/app/node_modules` prevents the host bind mount from overwriting the container's node_modules (which were installed during docker build). This is a standard Docker + Node.js pattern.
- Port 5173 exposed for direct local access

### Service 2: cloudflared
```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: idlemmo_cloudflared
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    depends_on:
      - app
```

This mirrors opos-alvaro exactly:
- Uses cloudflare/cloudflared:latest image
- command: tunnel run
- Token from .env via ${CLOUDFLARE_TUNNEL_TOKEN}
- restart: unless-stopped
- depends_on: app

## Reference
The opos-alvaro project's cloudflared service (lines 127-135 of its docker-compose.yml) is the exact pattern to follow.

## Acceptance Criteria

- docker-compose.yml exists at project root
- Has exactly 2 services: app and cloudflared
- app service builds from Dockerfile, mounts source for live reload
- cloudflared service uses CLOUDFLARE_TUNNEL_TOKEN from environment
- docker compose up starts both services
- Vite dev server accessible at http://localhost:5173


## Notes

**2026-02-25T21:53:10Z**

docker-compose.yml created with two services:

1. app service:
   - Builds from Dockerfile
   - Runs 'npm run dev -- --host 0.0.0.0'
   - Volume mounts source code for HMR
   - Named volume for node_modules to avoid conflicts
   - Exposes port 5173
   - Interactive mode (stdin_open, tty)

2. cloudflared service:
   - Uses cloudflare/cloudflared:latest
   - Runs 'tunnel run' command
   - Reads TUNNEL_TOKEN from .env file
   - Restart policy: unless-stopped
   - Depends on app service

File: /home/felix/idle-mmo-profiter/docker-compose.yml
