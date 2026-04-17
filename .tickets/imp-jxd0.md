---
id: imp-jxd0
status: closed
deps: [imp-egtg]
links: []
created: 2026-04-15T19:56:31Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
tags: [iteration-3, template-matching]
---
# Phase 5b: Update pipeline composable for NCC matcher

Update useScreenshotImport.ts to use the new NCC-based thumbnail matcher instead of dHash.

### File: src/composables/useScreenshotImport.ts

### Changes needed:
1. Replace imports:
   - OLD: import { computeDHash } from '../utils/imageHash'
   - OLD: import { loadHashDatabase, findBestMatch } from '../utils/hashMatcher'
   - NEW: import { extractCellThumbnail } from '../utils/thumbnailExtractor'
   - NEW: import { loadThumbnailDatabase, findBestMatch } from '../utils/thumbnailMatcher'

2. Update the per-cell processing logic:
   - OLD flow: cell ImageData -> computeDHash(imageData) -> findBestMatch(hash, db)
   - NEW flow: cell ImageData -> extractCellThumbnail(imageData) -> findBestMatch(thumbnail, db)

3. Update database loading:
   - OLD: loadHashDatabase() (loads sprite-hashes.json)
   - NEW: loadThumbnailDatabase() (loads sprite-thumbnails.json)

4. Update any type references:
   - SpriteHashDB -> SpriteThumbnailDB (if exposed in composable types)
   - MatchResult type may have slightly different fields

### What stays the same:
- Overall pipeline flow: detect grid -> process cells -> match items -> extract quantities
- Batch processing with event loop yielding
- Reactive state management (processing, results, errors refs)
- Integration with useCharacterTracker().setItemQuantity()
- Ambiguous item handling (status: 'ambiguous' with duplicateGroup)
- Error handling patterns

### This is a surgical replacement:
The composable is an orchestrator. The matching step is one function call in the pipeline.
The change should be ~10-15 lines of import/call-site changes.

## Acceptance Criteria

- [ ] Composable imports from thumbnailExtractor and thumbnailMatcher (not imageHash/hashMatcher)
- [ ] Pipeline calls extractCellThumbnail then findBestMatch
- [ ] All existing composable tests updated and passing
- [ ] Ambiguous item flow still works correctly
- [ ] No references to dHash, computeDHash, or sprite-hashes.json remain

