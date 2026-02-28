---
id: imp-z77x
status: closed
deps: []
links: []
created: 2026-02-28T23:14:30Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-rgz3
tags: [docker, hygiene]
---
# Add .dockerignore file

Create a .dockerignore to exclude unnecessary files from the Docker build context, reducing image size and build time.

## Design

Create /home/felix/idle-mmo-profiter/.dockerignore with standard exclusions:

```
node_modules
dist
.git
.gitignore
.env
.env.*
!.env.example
*.md
.github
.tickets
Idlemmo.xlsx
idle-mmo-docs.html
.vscode
.idea
*.log
```

This is a standalone file with no code dependencies.

## Acceptance Criteria

- [ ] .dockerignore exists at project root
- [ ] Excludes: node_modules, dist, .git, .env, *.md, .github, .tickets, Idlemmo.xlsx, idle-mmo-docs.html, .vscode, .idea
- [ ] Docker build still works correctly (make build passes)
- [ ] Image size is smaller than before (or at least not larger)

