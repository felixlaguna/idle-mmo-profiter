---
id: imp-defq
status: closed
deps: [imp-d4ny]
links: []
created: 2026-02-26T19:27:24Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-odkj
---
# Phase 2: Add hashed ID button to MarketTable item rows

Add a small, subtle button to each item row in MarketTable.vue that opens the HashedIdModal.

## Changes to: /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

### Script Section Changes:
1. Import HashedIdModal component
2. Add reactive state for modal:
   - hashedIdModalVisible: ref<boolean>(false)
   - hashedIdModalItem: ref<{ itemName, itemId, category, currentHashedId } | null>(null)
3. Add openHashedIdModal(category, item) function that sets modal state
4. Add saveHashedId(newHashedId) handler that calls dataProvider.updateHashedId()
5. Add toast notification on successful save

### Template Changes - Per-Row Button:
Add a small button in the Actions column (col-actions) next to the existing refresh button.
The button should be:
- A small '#' icon or link/chain icon (inline SVG, 14x14px like refresh button)
- Subtle: use --text-secondary color, only slightly visible
- On hover: show tooltip 'View/edit hashed ID'
- On click: call openHashedIdModal(category, item)
- Visually indicate if hashed ID is missing (e.g., orange/warning tint on the button)

The button must be added to ALL FOUR sections (materials, potions, resources, recipes).

### Template Changes - Modal:
Add HashedIdModal at the bottom of the template (alongside existing refresh estimate modal):
<HashedIdModal
  v-if='hashedIdModalItem'
  v-model:visible='hashedIdModalVisible'
  :item-name='hashedIdModalItem.itemName'
  :item-id='hashedIdModalItem.itemId'
  :category='hashedIdModalItem.category'
  :current-hashed-id='hashedIdModalItem.currentHashedId'
  @save='saveHashedId'
/>

### Style Changes:
- btn-hashed-id: small button matching btn-refresh-item size/style
- btn-hashed-id.missing: warning-tinted for items without hashed ID
- col-actions: may need width adjustment to fit 2 buttons (increase from 60px to ~100px)

### Key Implementation Detail:
The hashed ID for each item comes from the merged data (dataProvider.materials.value, etc.)
which includes user overrides. Access it as item.hashedId (may be undefined or empty string).

### Files to modify:
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

## Acceptance Criteria

- [ ] '#' button visible in each item row across all 4 sections
- [ ] Button is subtle/small and does not clutter the UI
- [ ] Clicking button opens HashedIdModal with correct item data
- [ ] Items with missing hashed ID show a visual indicator on the button
- [ ] Saving from modal updates the hashed ID via dataProvider.updateHashedId()
- [ ] Toast notification shown on successful save
- [ ] col-actions width accommodates both buttons without layout issues


## Notes

**2026-02-26T19:33:50Z**

Phase 2 complete - Hashed ID button added to all sections

Implementation details:
- Added HashedIdModal import to MarketTable.vue
- Added reactive state for modal (hashedIdModalVisible, hashedIdModalItem)
- Added openHashedIdModal() handler to open modal with item data
- Added saveHashedId() handler to save via dataProvider.updateHashedId()
- Added '#' button to all 4 sections (materials, potions, resources, recipes)
- Button uses hash/number icon (SVG with horizontal and vertical lines)
- Button has .missing class with warning color when hashedId is empty
- Toast notifications on save (success) and clear (info)
- Updated col-actions width from 60px to 100px to accommodate 2 buttons
- Updated col-actions to use flexbox with gap for proper button layout
- Added btn-hashed-id styles matching btn-refresh-item pattern
- Added responsive styles for mobile (buttons stack vertically)
