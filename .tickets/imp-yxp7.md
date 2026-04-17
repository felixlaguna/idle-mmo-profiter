---
id: imp-yxp7
status: closed
deps: [imp-o17d]
links: []
created: 2026-04-15T10:26:54Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-2n4q
---
# Phase 6: Screenshot import UI component

Create the UI component for the screenshot import feature and integrate it into CharacterTracker.vue.

### File: src/components/ScreenshotImport.vue

### UI Layout (3 states):

**State 1: Drop Zone (initial)**
- Large dashed-border drop zone area
- Text: 'Paste a screenshot (Ctrl+V) or drop an image here'
- Subtle camera/screenshot icon
- Must work with both clipboard paste AND file drag-and-drop
- Styled consistent with app design system (--surface-* tokens)

**State 2: Processing (after image received)**
- Show a thumbnail preview of the pasted screenshot
- Progress indicator with step name: 'Detecting grid...', 'Matching items (12/50)...'
- Animated progress bar

**State 3: Results Review (after processing)**
- Split view:
  - LEFT: Screenshot preview with grid overlay (colored boxes around detected cells)
    - Green border = matched with high confidence
    - Yellow border = matched with low confidence
    - Red border = unrecognized
  - RIGHT: Results list:
    - Each row: item name, quantity, confidence badge, [edit] [remove] buttons
    - Confidence badge: green (>0.8), yellow (0.5-0.8), red (<0.5)
    - Editable quantity field (in case OCR got it wrong)
    - Unrecognized items shown at bottom with '?' icon
- Action buttons at bottom:
  - 'Import X items to inventory' (primary)
  - 'Cancel' (secondary)
  - 'Re-scan' (tertiary, if user cropped differently)

### Integration into CharacterTracker.vue:
- Add a new button next to the item search bar: 'Import from Screenshot'
- Clicking opens the ScreenshotImport component (inline accordion or modal)
- When import completes, the items appear as pending changes in the character tracker
- User must still click 'Save Snapshot' to persist

### Paste Handler:
- Listen for `paste` event on the drop zone
- Also register a global paste handler when the component is mounted (so Ctrl+V works anywhere on the Characters tab)
- Clean up global handler on unmount

### Drag and Drop:
- Standard HTML5 drag events (dragover, dragleave, drop)
- Prevent default browser behavior (opening the image)
- Visual feedback on dragover (highlight border)

### Responsive Design:
- On mobile (<768px): Stack preview and results vertically
- Drop zone should be large enough for touch interaction
- Results list should be scrollable

## Acceptance Criteria

- Drop zone accepts both paste and drag-and-drop
- Processing state shows progress with step names
- Results review shows matched items with confidence badges
- Quantities are editable in the results view
- Import button applies items as pending changes in character tracker
- Cancel button discards results
- Responsive layout works on mobile (375px) and desktop (1440px)
- Styled consistent with existing app design system
- Global paste handler registered/cleaned up properly


## Notes

**2026-04-15T10:31:01Z**

## Iteration: Show ambiguous/skipped items in results UI (user feedback)

**Change**: The results review must surface items that were skipped due to sprite ambiguity, so users know what happened.

### Changes to State 3 (Results Review):

**Results list -- new row type for ambiguous matches:**
- [ ] Add an 'ambiguous' row style (orange/amber border or badge)
- [ ] Show text like: 'Could not distinguish between: Item A, Item B, Item C'
- [ ] List the duplicate group members so the user can manually pick the correct one
- [ ] Optionally let the user select the correct item from a dropdown of the conflicting items
- [ ] Ambiguous items appear in a separate section between matched items and fully unrecognized items

**Grid overlay -- new color for ambiguous cells:**
- [ ] Orange border = matched but ambiguous (sprite shared by multiple items)
- [ ] This sits between green (confident match) and red (unrecognized)

**Confidence badge additions:**
- [ ] New amber/orange badge for 'ambiguous' status
- [ ] Tooltip on the badge: 'This sprite is shared by multiple items'

### Updated legend:
- Green border = matched with high confidence
- Yellow border = matched with low confidence  
- Orange border = ambiguous (duplicate sprite, multiple possible items)
- Red border = unrecognized

### Rationale:
Users should see exactly which items could not be auto-matched and why, and ideally be able to resolve the ambiguity manually by picking the correct item from the conflict group.

**2026-04-15T10:54:48Z**

Implementation complete.

Files created/modified:
- src/components/ScreenshotImport.vue — new component (3 states: drop zone, processing, results review)
- src/components/CharacterTracker.vue — added import, showScreenshotImport ref, 'Import from Screenshot' button, Teleport-mounted modal, CSS for button/header
- src/components/__tests__/ScreenshotImport.test.ts — 41 tests covering all states, events, paste handler lifecycle

Tests: 863/864 passing (1 pre-existing skip). All new 41 tests green.
