---
id: imp-05x6
status: closed
deps: [imp-o6lg]
links: []
created: 2026-03-04T20:18:54Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Iteration 2b: Create populate-all-items.ts build-time script

Create a new CLI script that fetches ALL game items from the IdleMMO API and adds them to defaults.json. This replaces the runtime API search with a build-time approach.

## Script: /home/felix/idle-mmo-profiter/scripts/populate-all-items.ts

### Pattern
Follow the exact pattern of /home/felix/idle-mmo-profiter/scripts/refresh-market-prices.ts:
- API key resolution: CLI arg (--api-key=<key>) > process.env.IDLE_MMO_SECRET_KEY_CLI > .env file > interactive prompt
- apiClient.configure({ baseUrl: 'https://api.idle-mmo.com/v1', apiKey })
- CLI flags: --limit=N (for testing), --dry-run (preview only)
- Read/write /home/felix/idle-mmo-profiter/src/data/defaults.json
- Progress logging to console

### Algorithm
1. Configure API client
2. Read current defaults.json
3. Build a Set of all existing hashedIds across all categories (materials, craftables, resources, recipes, craftableRecipes) to avoid duplicates
4. Call searchItems('', undefined, page) starting at page 1 with empty query string
   - The API endpoint is /item/search - see /home/felix/idle-mmo-profiter/src/api/services.ts searchItems() function
   - Use the existing searchItems function from services.ts (it handles caching and rate limiting)
   - BUT: since this is a build-time script, we should use apiClient.get() directly to avoid browser caching. Actually, the cache is in-memory only so it's fine for script usage.
   - Actually: just call apiClient.get<ItemSearchResponse>('/item/search', { page }) directly, since the services.ts searchItems function uses the browser cache layer. For the script, bypass the cache.
5. Read pagination.last_page from the first response
6. Iterate through all pages (page 2 through last_page)
7. For each item in each page's results:
   - Skip if hashedId already exists in the existing items Set
   - Otherwise add to a new 'allItems' array
8. Store the allItems array in defaults.json as a new top-level key

### Data structure for allItems entries
```typescript
interface AllItem {
  hashedId: string    // from hashed_id in API response
  name: string        // from name in API response
  type: string        // from type in API response (e.g., 'material', 'equipment', etc.)
  vendorPrice: number | null  // from vendor_price in API response
}
```

### API response format (from services.ts ItemSearchResponse)
```typescript
{
  items: Array<{
    hashed_id: string
    name: string
    description: string
    image_url: string
    type: string
    quality: string
    vendor_price: number | null
  }>
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}
```

### Rate limiting
- The apiClient already handles 20 req/min rate limiting with its queue
- Use apiClient.get() directly which will auto-queue requests
- Show progress: 'Page X/Y - N items so far'

### Console output
- Show total pages discovered on first request
- Show progress per page
- Show count of new items vs already-known items
- Show estimated time remaining
- Final summary: total new items added, total already known, total in allItems

### Run command
```bash
tsx scripts/populate-all-items.ts
tsx scripts/populate-all-items.ts --dry-run
tsx scripts/populate-all-items.ts --limit=5  # only first 5 pages
```

## Acceptance Criteria

- Script runs successfully with: tsx scripts/populate-all-items.ts
- Fetches all pages from /item/search endpoint
- Adds new 'allItems' array to defaults.json
- Each entry has hashedId, name, type, vendorPrice
- Does not duplicate items already in materials/craftables/resources/recipes
- Respects rate limits (uses apiClient)
- --dry-run flag works
- --limit=N flag works
- Progress output shown in console
- defaults.json is valid JSON after write


## Notes

**2026-03-04T20:24:32Z**

Build-time script created successfully.

Script location: /home/felix/idle-mmo-profiter/scripts/populate-all-items.ts

Features:
- Follows refresh-market-prices.ts pattern exactly
- API key resolution: CLI arg > process.env > .env > interactive prompt
- Fetches all items from /item/search endpoint with pagination
- Deduplicates against existing items in all categories
- Supports --limit=N and --dry-run flags
- Shows progress and estimated time remaining
- Adds allItems array to defaults.json

Data structure:
- hashedId: string
- name: string
- type: string
- vendorPrice: number | null

Run command: npx tsx scripts/populate-all-items.ts
Test run successful with --dry-run --limit=2 flags.
