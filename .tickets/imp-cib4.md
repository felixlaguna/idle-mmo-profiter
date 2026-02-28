---
id: imp-cib4
status: closed
deps: []
links: []
created: 2026-02-25T21:51:10Z
type: epic
priority: 2
assignee: Félix Laguna Teno
tags: [cloudflare, deployment, future]
---
# Cloudflare Pages Deployment

Deploy the IdleMMO Profit Calculator to Cloudflare Pages for production hosting.

## Context
This is a future epic -- not to implement now. The project is a static Vue 3 + Vite SPA that builds to a dist/ folder, making it a perfect candidate for Cloudflare Pages.

## What this will involve (future planning)
- Configure Cloudflare Pages project (connect to GitHub repo or use direct upload)
- Set up build command: npm run build (which runs vue-tsc && vite build)
- Set output directory: dist/
- Configure custom domain (if desired)
- Set up preview deployments for branches/PRs
- Consider environment variables for any build-time configuration

## Prerequisites
- Epic imp-3net (Docker Compose + Cloudflare Tunnel) should be completed first
- The app should be stable and tested via the dev tunnel setup
- A Cloudflare account with Pages access

## Notes
- The current dev workflow uses Cloudflare Tunnel (from epic imp-3net) to expose the Vite dev server
- This epic is for the PRODUCTION deployment, which would serve the built static files
- Cloudflare Pages has a generous free tier (500 builds/month, unlimited bandwidth)
- No child tasks yet -- this is a placeholder epic for future planning


**2026-02-28T23:39:01Z**

Superseded: Project deploys to GitHub Pages instead (deploy.yml workflow). No Cloudflare Pages needed. Closing.
