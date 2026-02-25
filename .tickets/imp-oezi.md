---
id: imp-oezi
status: closed
deps: [imp-ed6v]
links: []
created: 2026-02-25T21:50:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-3net
---
# Phase 4: Makefile with Docker convenience commands

Create a Makefile with convenience targets for common Docker operations, modeled after opos-alvaro's Makefile but simplified for this frontend-only project.

## Files to create
- /home/felix/idle-mmo-profiter/Makefile

## Specification

```makefile
.PHONY: help up down restart logs build ps url

help:
	@echo "Available commands:"
	@echo "  make up       - Build and start all services"
	@echo "  make down     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - Follow docker compose logs"
	@echo "  make build    - Rebuild Docker images"
	@echo "  make ps       - Show running containers"
	@echo "  make url      - Show application URLs"

up:
	docker compose up -d --build
	@echo ""
	@echo "Services started!"
	@echo "  Local: http://localhost:5173"
	@echo ""
	@echo "Run 'make logs' to follow the logs."

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

ps:
	docker compose ps

url:
	@echo "Application URLs:"
	@echo "  Local: http://localhost:5173"
```

## Notes
- Follows the same pattern as opos-alvaro's Makefile (up, down, restart, logs, build, ps, url)
- Much simpler since there is no database, no Celery, no Django management commands
- The 'up' target includes --build to ensure the image is fresh

## Acceptance Criteria

- Makefile exists at project root
- make help shows all available targets
- make up builds and starts services
- make down stops services
- make logs follows logs
- All targets work correctly


**2026-02-25T21:53:38Z**

Makefile created with convenience commands following reference project pattern:

Commands:
- make up: Start all services (app + cloudflared), show URLs
- make down: Stop all services
- make restart: Restart services
- make logs: Show logs in follow mode
- make build: Rebuild Docker images
- make ps: Show running containers
- make url: Display application URLs (local + Cloudflare tunnel)
- make dev: Start only the app service (no tunnel)
- make install: Install npm dependencies in container
- make clean: Clean node_modules and dist folders
- make help: Show all available commands (default target)

File: /home/felix/idle-mmo-profiter/Makefile
