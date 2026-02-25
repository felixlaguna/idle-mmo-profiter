---
id: imp-q6nm
status: closed
deps: []
links: []
created: 2026-02-25T18:31:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dv3t
---
# Scaffold Vite + TypeScript project

- Run: npm create vite@latest . -- --template vanilla-ts
- Configure tsconfig.json with strict mode
- Set up ESLint + Prettier
- Add .gitignore for node_modules, dist
- Verify dev server starts with: npm run dev
- Add basic index.html shell with dark theme (bg: #111722, text: #e5e7eb)
- Add Inter font from Google Fonts (matches IdleMMO)

## Acceptance Criteria

Project builds and runs, dev server shows dark-themed page


## Notes

**2026-02-25T18:45:45Z**

Scaffolding complete. Created Vite + Vue 3 + TypeScript project with:
- package.json with dev, build, preview, lint, format scripts
- vite.config.ts with Vue plugin and path aliases
- tsconfig.json with strict mode
- ESLint + Prettier configuration
- .gitignore for node_modules, dist
- Dark theme CSS matching IdleMMO palette (bg: #111722)
- Inter font from Google Fonts
- App.vue shell with header/footer layout
- Dev server verified working (starts on http://localhost:5173)
