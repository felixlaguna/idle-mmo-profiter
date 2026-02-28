---
id: imp-ukfp
status: closed
deps: []
links: []
created: 2026-02-28T18:54:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
---
# Task 1: Create refresh-market-prices.ts script skeleton

Create scripts/refresh-market-prices.ts with shared infrastructure: API config, delay helper, API key resolution from .env/CLI/prompt, main() stub that reads defaults.json and prints item counts, --limit=N and --dry-run flags. Reference: scripts/populate-hashed-ids.ts

## Acceptance Criteria

Script runs, prints item counts per category, recognizes --dry-run, resolves API key from .env


## Notes

**2026-02-28T18:54:14Z**

## Detailed Design

### File: `scripts/refresh-market-prices.ts`

Reuse the pattern from `scripts/populate-hashed-ids.ts`:

```typescript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// API Configuration (same as populate script)
const API_BASE_URL = 'https://api.idle-mmo.com/v1'
const MAX_REQUESTS_PER_MINUTE = 20
const REQUEST_DELAY_MS = (60 * 1000) / MAX_REQUESTS_PER_MINUTE + 100

// Types - minimal interface for the items we need to update
interface DefaultItem {
  id?: string
  name: string
  hashedId?: string
  price?: number
  marketPrice?: number
  isUntradable?: boolean
  [key: string]: unknown  // preserve other fields
}

interface DefaultData {
  materials: DefaultItem[]
  craftables: DefaultItem[]
  resources: DefaultItem[]
  recipes: DefaultItem[]
  resourceGathering: DefaultItem[]
  [key: string]: unknown  // preserve other top-level fields
}
```

### Helpers to copy from populate-hashed-ids.ts:
- `delay(ms: number): Promise<void>`
- `loadApiKeyFromEnv(): string | null`
- `getApiKey(): Promise<string>`

### CLI flags:
- `--limit=N` — process only first N items (for testing)
- `--dry-run` — print what would change but don't write file
- `--api-key=KEY` — provide API key directly

### main() stub:
1. Print banner
2. Resolve API key
3. Parse CLI flags
4. Read defaults.json
5. Count items with hashedId per category
6. Print summary and exit

**2026-02-28T18:57:45Z**

Script skeleton created successfully.

Files created:
- scripts/refresh-market-prices.ts

Features implemented:
- API key resolution from .env/CLI/prompt
- CLI flags: --limit=N, --dry-run
- Reads defaults.json and counts items
- Correctly identifies 417 tradable items (99 materials, 0 craftables, 7 resources, 311 recipes)
- Skips 34 untradable recipes
- Shows estimated runtime

Test run successful with --dry-run --limit=5
