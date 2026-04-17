---
id: imp-8l12
status: closed
deps: []
links: []
created: 2026-04-15T10:25:09Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 1: Build-time sprite hash database generator script

Create a Node.js script (scripts/generate-sprite-hashes.ts) that:

1. Reads all items from defaults.json (materials, craftables, resources, recipes, allItems)
2. For each item with a hashedId, fetches the sprite image from the API (image_url from /item/search or /item/{id}/inspect)
3. Draws each sprite onto a Canvas (using node-canvas or sharp) at a normalized size (e.g., 32x32 grayscale)
4. Computes a perceptual hash (dHash recommended: fast, good for small sprites, 64-bit)
5. Detects DUPLICATE SPRITES: items that produce the same hash get flagged and EXCLUDED from the recognition database
6. Outputs src/data/sprite-hashes.json containing:
   - Array of { hashedId, name, dHash (hex string), type }
   - A separate 'duplicateSprites' array listing excluded items and what they collide with
7. Respects API rate limits (20 req/min) -- reuse existing apiClient pattern
8. Supports --dry-run, --limit, --api-key flags (same pattern as populate-all-items.ts)
9. Caches downloaded images locally in a temp directory to avoid re-fetching on reruns

### dHash Algorithm (difference hash):
- Resize image to 9x8 grayscale
- Compare each pixel to its right neighbor
- Produces 64-bit hash (8x8 = 64 comparisons)
- Hamming distance < 5 = likely same sprite

### Duplicate Detection:
- After hashing all items, group by identical hash
- Any hash shared by 2+ items: mark ALL items in that group as duplicates
- Also check near-duplicates (hamming distance <= 3) and flag those too
- Output a report of duplicates found

### Image URL Pattern:
- API search endpoint returns image_url (e.g., https://cdn.idle-mmo.com/images/moose-antler.png)
- API inspect endpoint returns image field
- Need to fetch these during the script run

### Output Format (sprite-hashes.json):
```json
{
  "version": 1,
  "generatedAt": "ISO timestamp",
  "totalItems": 1200,
  "uniqueItems": 1100,
  "duplicatesExcluded": 100,
  "hashes": [
    { "h": "hashedId", "d": "abcdef0123456789", "n": "Item Name" }
  ],
  "duplicates": [
    { "hash": "abcdef...", "items": ["Item A", "Item B"] }
  ]
}
```
Short keys (h, d, n) to minimize JSON size since this ships to the client.

### Dependencies:
- sharp (Node.js image processing, no native Canvas needed)
- Existing apiClient from src/api/client.ts

## Acceptance Criteria

- Script runs successfully with tsx scripts/generate-sprite-hashes.ts
- sprite-hashes.json is generated in src/data/
- Duplicate sprites are detected and excluded
- Script respects rate limits and supports --dry-run
- Output JSON is compact (short keys) for bundle size
- At least 90% of items have hashes generated successfully


## Notes

**2026-04-15T10:30:42Z**

## Iteration: Include duplicates with ambiguity flag (user feedback)

**Change**: Do NOT strip duplicate-sprite items from the output. Instead, include ALL items and mark ambiguous ones.

### Updated output format for sprite-hashes.json:
```json
{
  "version": 1,
  "generatedAt": "ISO timestamp",
  "totalItems": 1200,
  "hashes": [
    { "h": "hashedId", "d": "abcdef0123456789", "n": "Item Name" },
    { "h": "hashedId2", "d": "abcdef0123456789", "n": "Dupe Item", "a": true, "g": "abcdef0123456789" }
  ],
  "duplicateGroups": [
    { "hash": "abcdef...", "items": ["Item A", "Item B"] }
  ]
}
```

### New fields on hash entries:
- `a` (boolean, optional) -- true if this item has a duplicate/ambiguous sprite
- `g` (string, optional) -- the duplicate group identifier (the shared dHash), so the client can see which items collide

### What stays the same:
- [x] Still detect duplicate sprites (same hash or hamming distance <= 3)
- [x] Still group them and report in `duplicateGroups`
- [x] Still output short keys for bundle size

### What changes:
- [ ] Do NOT remove duplicates from the `hashes` array
- [ ] Add `a: true` flag to every item that shares a sprite with another item
- [ ] Add `g` field with the group's canonical hash so the client can correlate them
- [ ] Remove the `uniqueItems` and `duplicatesExcluded` top-level counts (no longer meaningful since nothing is excluded)
- [ ] Add `ambiguousCount` top-level field instead (how many items are flagged)

### Rationale:
The frontend needs to know about ALL items, including ambiguous ones, so it can:
1. Skip matching against them during recognition
2. Show users which items were skipped and why

**2026-04-15T10:39:13Z**

Implementation complete.

Files created/modified:
- scripts/generate-sprite-hashes.ts (new) - the hash generator script
- src/data/sprite-hashes.json (new) - sample output (20 items, will be regenerated for all 891)
- package.json - added sharp@0.34.5 and @types/sharp as devDependencies

Key implementation decisions:
- Image URLs come from the API inspect endpoint (/item/{hashedId}/inspect) since defaults.json does not store image_url
- Two-level cache: .sprite-cache/<hashedId>.url (image_url string) + .sprite-cache/<hashedId>.png (image bytes)
- CDN does NOT need Authorization header - sending it causes 400; fixed
- Union-Find with path compression for grouping near-duplicate hashes (Hamming <= 3)
- All items included in output; ambiguous ones get a: true and g: groupHash fields
- Rate limiting handled by existing apiClient (20 req/min)

Verified on 20 items: 5 duplicate groups detected correctly (membership packs, tokens, eggs etc.)
All 743 existing tests pass.

**2026-04-15T19:55:27Z**

SUPERSEDED: dHash approach abandoned due to Sharp/Canvas grayscale incompatibility. Replaced by new ticket for template matching thumbnail generator. The sprite download/cache infrastructure from this ticket is reused.
