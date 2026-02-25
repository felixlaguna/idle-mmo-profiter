---
id: imp-0bo7
status: closed
deps: []
links: []
created: 2026-02-25T21:50:41Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-3net
---
# Phase 3: .env.example and .env setup

Create .env.example with placeholder values and update .gitignore to exclude .env files.

## Files to create
- /home/felix/idle-mmo-profiter/.env.example

## Files to modify
- /home/felix/idle-mmo-profiter/.gitignore (add .env to ignored files)

## Specification

### .env.example contents:
```
# ==============================================================================
# IdleMMO Profit Calculator - Environment Variables
# ==============================================================================
# Copy this file to .env and fill in the values:
#   cp .env.example .env

# Cloudflare Tunnel (for HTTPS access from internet)
# Get your token from Cloudflare Zero Trust > Networks > Tunnels
CLOUDFLARE_TUNNEL_TOKEN=your-cloudflare-tunnel-token-here
```

### .gitignore additions:
Add the following lines to the existing .gitignore:
```
# Environment files
.env
.env.local
.env.*.local
```

## Notes
- The user will provide the actual CLOUDFLARE_TUNNEL_TOKEN later
- The .env.example serves as documentation for required environment variables
- Currently .gitignore does NOT exclude .env files, so this is important to add BEFORE any .env with secrets is created

## Acceptance Criteria

- .env.example exists with documented CLOUDFLARE_TUNNEL_TOKEN placeholder
- .gitignore includes .env exclusion rules
- No actual secrets are committed


**2026-02-25T21:52:51Z**

.env.example and .gitignore updated. Changes:
- Created .env.example with CLOUDFLARE_TUNNEL_TOKEN placeholder
- Updated .gitignore to exclude .env, .env.local, .env.*.local files

Files modified:
- /home/felix/idle-mmo-profiter/.env.example (created)
- /home/felix/idle-mmo-profiter/.gitignore (updated)
