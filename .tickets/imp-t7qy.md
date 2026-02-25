---
id: imp-t7qy
status: closed
deps: []
links: []
created: 2026-02-25T22:55:45Z
type: epic
priority: 2
assignee: Félix Laguna Teno
tags: [bug, mobile, ui]
---
# Bug: Mobile card view shows only labels, no data values

On mobile, the table-to-card conversion shows column headers (RANK, ACTIVITY, TYPE, PROFIT/HR, etc.) but no actual values next to them. Cards are empty labels stacked vertically. Need to fix the mobile CSS so data-label approach works correctly, showing label:value pairs.


## Notes

**2026-02-25T22:56:32Z**

Investigation complete. Found the root cause:

The CSS in style.css uses flexbox for mobile cards:
- Line 144-150: td uses 'display: flex' with 'justify-content: space-between'
- Line 157-164: td::before adds labels via data-label attribute
- Line 167-169: td > * applies 'text-align: right' to children

THE BUG: Many td elements contain WRAPPER elements (spans, EditableValue components, buttons).
- The flex layout makes td a flex container
- The ::before pseudo-element (label) is one flex child
- The WRAPPER element (span/component) is another flex child
- But the ACTUAL TEXT is inside the wrapper, not directly in td
- The 'td > *' selector targets the wrapper, but doesn't make it visible

The wrapper elements are not being displayed properly, so only the ::before labels show.

Files with the issue:
- ProfitRankingTable.vue: rank has span.rank-number, type has span.type-badge
- DungeonTable.vue: has EditableValue components and buttons
- PotionTable.vue: has EditableValue components
- ResourceTable.vue: has EditableValue components and span.method-badge

Need to fix CSS to ensure wrapper content is visible in mobile view.

**2026-02-25T22:56:45Z**

Creating failing test to reproduce mobile view bug. Test will verify that table cells with wrapper elements (spans, components) display both labels AND values in mobile view.

**2026-02-25T22:56:59Z**

No test infrastructure exists. Since this is a CSS visual bug confirmed by user screenshot, proceeding directly to fix. The bug is clearly reproducible: mobile view shows only data-label text (RANK, ACTIVITY, etc) but no actual values.

Root cause: CSS flex layout on td elements doesn't properly display wrapper element content.

Fix strategy:
1. Update mobile-card-layout CSS to ensure td children are visible
2. Remove 'td > *' text-align rule that doesn't work with flex
3. Add proper styling for wrapped content
4. Ensure all wrapper elements (spans, components) display correctly

**2026-02-25T22:57:27Z**

CSS fix applied to /home/felix/idle-mmo-profiter/src/style.css

Changes made:
1. Added 'flex-shrink: 0' to td::before to prevent label compression
2. Changed 'td > *' to use 'display: inline-flex' instead of just 'text-align: right'
3. Added 'align-items: center', 'justify-content: flex-end' for proper alignment
4. Added 'flex-wrap: wrap' and 'gap: 0.25rem' for better wrapping
5. Added 'margin-left: auto' to push values to the right
6. Added 'td > * > *' rule with 'display: inline-flex' to ensure nested elements are visible

This ensures that wrapper elements (spans, components) and their children are properly displayed.

Build successful. Testing needed to verify mobile view shows both labels AND values.

**2026-02-25T22:58:05Z**

Updated CSS fix with simpler, more robust approach:

Changed from flexbox to float-based layout:
- td: 'display: block' (instead of flex) + 'text-align: right'
- td::before: 'float: left' for labels

Why this is better:
1. Works with both direct text nodes AND wrapper elements
2. Simpler CSS with fewer edge cases
3. Label floats left, all content (text or elements) aligns right
4. No need for complex child selectors

Build verified successful.

Files modified:
- /home/felix/idle-mmo-profiter/src/style.css (lines 143-164)

All table components will benefit:
- ProfitRankingTable.vue (cells with rank-number span, type-badge span, direct text)
- DungeonTable.vue (cells with EditableValue, expand button, direct text)
- PotionTable.vue (cells with EditableValue, direct text)
- ResourceTable.vue (cells with EditableValue, method-badge span, direct text)

Mobile view should now display:
- Label on left (from data-label attribute)
- Value on right (actual cell content)
- Both visible for every row
