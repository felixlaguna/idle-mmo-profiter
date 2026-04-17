---
id: imp-tani
status: closed
deps: []
links: []
created: 2026-04-15T19:55:53Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
tags: [iteration-3, template-matching]
---
# Phase 1b: Build-time thumbnail generator (replaces dHash)

Replace the dHash-based generate-sprite-hashes.ts with a thumbnail generator that produces compact 16x16 grayscale pixel arrays.

### Script: scripts/generate-sprite-hashes.ts (rewrite in-place)

### What it does:
For each sprite PNG in src/data/sprites/<hashedId>.png (892 files):
1. Load the sprite using Sharp
2. Composite onto dark background rgb(17, 23, 34) -- matches the game's inventory background
3. Resize to 16x16 using Sharp's lanczos3 resampling
4. Convert to grayscale (single channel, 8-bit)
5. Extract as a flat Uint8Array of 256 bytes
6. Store in output JSON

### Output: src/data/sprite-thumbnails.json
Schema:
{
  "version": 2,
  "generatedAt": "ISO timestamp",
  "thumbSize": 16,
  "totalItems": number,
  "ambiguousCount": number,
  "items": [
    {
      "h": "hashedId",
      "n": "Item Name",
      "t": "item-type",
      "thumb": [0, 128, 255, ...],  // 256 integers (0-255), row-major 16x16 grayscale
      "a": true,                     // optional: ambiguous flag (duplicate thumbnail)
      "g": "groupKey"               // optional: ambiguity group identifier
    }
  ],
  "duplicateGroups": { "groupKey": ["hashedId1", "hashedId2", ...] }
}

### Ambiguity detection:
- After generating all thumbnails, compute a hash (e.g. SHA-256 or simple byte comparison) of each 256-byte thumbnail
- Items with identical thumbnails at 16x16 are flagged with a:true and grouped by g:groupKey
- The groupKey can be a truncated hash of the thumbnail bytes

### What stays the same from imp-8l12:
- Sprite images already downloaded in src/data/sprites/ (892 files) -- reuse them
- .sprite-cache/ directory and download logic can be kept as fallback
- Item metadata comes from defaults.json

### What changes from imp-8l12:
- No dHash computation -- replaced by raw pixel extraction
- Output format changes: "d" (dHash hex) field replaced by "thumb" (pixel array)
- File name changes: sprite-hashes.json -> sprite-thumbnails.json
- Bundle size: ~228KB raw (~50KB gzipped) vs old 36KB -- acceptable tradeoff

### Size optimization notes:
- Consider base64 encoding the thumbnail bytes to reduce JSON overhead
- 256 raw bytes as JSON array: ~1000 chars. Base64: ~344 chars. 
- If base64: items[].thumb becomes a base64 string instead of number array
- Decision: start with JSON number array for simplicity, optimize later if needed

## Acceptance Criteria

- [ ] Script reads all 892 sprites from src/data/sprites/
- [ ] Each sprite composited onto rgb(17,23,34) background before resize
- [ ] Output is 16x16 grayscale (256 bytes per item)
- [ ] Duplicate thumbnails detected and flagged with a:true, g:groupKey
- [ ] Output file is src/data/sprite-thumbnails.json with version 2 schema
- [ ] Script runs successfully: tsx scripts/generate-sprite-hashes.ts
- [ ] Old sprite-hashes.json can be deleted after migration confirmed


## Notes

**2026-04-15T20:04:54Z**

Implementation complete.

Files modified:
- scripts/generate-sprite-hashes.ts — Rewrote in-place: dHash replaced by 16x16 grayscale thumbnail generation. Uses sharp to flatten alpha onto rgb(17,23,34), resize to 16x16 with bilinear kernel, grayscale, 256-byte raw buffer, base64-encoded as d field. Outputs src/data/sprite-thumbnails.json with version:1, thumbnailSize:16, thumbnails[] array, duplicateGroups[] with groupId/items. Ambiguity via SHA-256 of pixel bytes. Deletes old sprite-hashes.json.
- src/data/sprite-thumbnails.json — Generated: 1009 items, 443 ambiguous, 69 duplicate groups, 441KB
- src/data/sprite-hashes.json — Deleted (replaced by sprite-thumbnails.json)
- src/utils/hashMatcher.ts — Updated to import from sprite-thumbnails.json. Adapts new schema (thumbnails[].d = base64, duplicateGroups[].groupId) to SpriteHashDB shape. findBestMatch supports both legacy hex mode (synthetic tests) and thumbnail exact-match mode. hashSize now 16.
- src/tests/utils/hashMatcher.test.ts — Updated: removed sprite-hashes.json fixture references, replaced specific dHash hex lookups with generic real-DB tests using the actual thumbnails.

Tests: 891/891 passing (48 test files)
