.PHONY: help up down restart logs build ps url clean dev install

# Default target
help:
	@echo "Available commands:"
	@echo "  make up          - Start all docker services (builds if needed)"
	@echo "  make down        - Stop all docker services"
	@echo "  make restart     - Restart all docker services"
	@echo "  make logs        - Show docker logs (follow mode)"
	@echo "  make build       - Rebuild Docker images"
	@echo "  make ps          - Show running containers"
	@echo "  make url         - Show application URLs"
	@echo "  make dev         - Start dev server (app only, without tunnel)"
	@echo "  make install     - Install npm dependencies in container"
	@echo "  make clean       - Clean node_modules and dist"

# Start services (builds first if needed)
up:
	docker compose up -d
	@echo ""
	@echo "🚀 Services started!"
	@echo "   App:        http://localhost:5173"
	@if docker compose ps cloudflared --format '{{.State}}' 2>/dev/null | grep -q running; then \
		echo "   Cloudflare: Checking tunnel..."; \
		sleep 3; \
		HOSTNAME=$$(docker compose logs cloudflared 2>&1 | grep -oP 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com|https://[a-zA-Z0-9.-]+\.(xyz|com)' | head -1); \
		if [ -n "$$HOSTNAME" ]; then \
			echo "   Cloudflare: $$HOSTNAME"; \
		else \
			echo "   Cloudflare: Configure CLOUDFLARE_TUNNEL_TOKEN in .env"; \
		fi; \
	fi
	@echo ""

# Stop services
down:
	docker compose down

# Restart services
restart:
	docker compose restart

# Show logs (follow mode)
logs:
	docker compose logs -f

# Rebuild images
build:
	docker compose build
	@echo "✅ Docker images built"

# Show running containers
ps:
	docker compose ps

# Show application URLs
url:
	@echo "🌐 Application URLs:"
	@echo "   Local:      http://localhost:5173"
	@echo ""
	@if docker compose ps cloudflared --format '{{.State}}' 2>/dev/null | grep -q running; then \
		HOSTNAME=$$(docker compose logs cloudflared 2>&1 | grep -oP 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com|https://[a-zA-Z0-9.-]+\.(xyz|com)' | head -1); \
		if [ -n "$$HOSTNAME" ]; then \
			echo "   Cloudflare: $$HOSTNAME"; \
		else \
			echo "   Cloudflare: Not configured (set CLOUDFLARE_TUNNEL_TOKEN in .env)"; \
		fi; \
	else \
		echo "   Cloudflare: Tunnel not running"; \
	fi

# Start dev server only (without Cloudflare tunnel)
dev:
	docker compose up app

# Install npm dependencies
install:
	docker compose run --rm app npm install

# Clean generated files
clean:
	docker compose run --rm app rm -rf node_modules dist
	@echo "✅ Cleaned node_modules and dist"
