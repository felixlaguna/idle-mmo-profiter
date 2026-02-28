# Filter & Ranking Sync Test

## Test Case 1: Re-rank when filters change

### Before Fix (FAILING)

1. Load the profit ranking table
2. Observe the rankings (e.g., #1 = Dungeon A, #2 = Potion B, #3 = Resource C, #4 = Dungeon D)
3. Disable "Dungeons" filter
4. **EXPECTED**: Remaining items re-numbered as #1 = Potion B, #2 = Resource C
5. **ACTUAL (BUG)**: Items still show #2 = Potion B, #3 = Resource C (original ranks)

### After Fix (PASSING)

1. Load the profit ranking table
2. Observe the rankings (e.g., #1 = Dungeon A, #2 = Potion B, #3 = Resource C, #4 = Dungeon D)
3. Disable "Dungeons" filter
4. **RESULT**: Items correctly re-numbered as #1 = Potion B, #2 = Resource C

---

## Test Case 2: Hero "Best Action" reflects filters

### Before Fix (FAILING)

1. Load the page
2. Observe hero section shows "Best Action: Dungeon A" (assuming it's #1 overall)
3. Disable "Dungeons" filter in the table below
4. **EXPECTED**: Hero updates to show "Best Action: Potion B" (the best among filtered results)
5. **ACTUAL (BUG)**: Hero still shows "Dungeon A" (ignores filters)

### After Fix (PASSING)

1. Load the page
2. Observe hero section shows "Best Action: Dungeon A"
3. Disable "Dungeons" filter
4. **RESULT**: Hero correctly updates to "Best Action: Potion B"

---

## Test Case 3: Filter state persisted in localStorage

### Before Fix (FAILING)

1. Load the page
2. Disable "Dungeons" filter
3. Refresh the page
4. **EXPECTED**: "Dungeons" filter remains disabled
5. **ACTUAL (BUG)**: All filters reset to enabled (default state)

### After Fix (PASSING)

1. Load the page
2. Disable "Dungeons" filter
3. Refresh the page
4. **RESULT**: "Dungeons" filter remains disabled

---

## Additional Edge Cases

### All filters disabled

1. Disable all three filters (dungeons, potions, resources)
2. **EXPECTED**: Show empty state message "No activities found"
3. **EXPECTED**: Hero section should either hide or show "No action available"

### Enable/disable combinations

1. Try various combinations (only dungeons, only potions+resources, etc.)
2. **EXPECTED**: Rankings always start from #1 for visible items
3. **EXPECTED**: Hero always shows best among visible items

---

## Manual Verification Checklist

- [ ] Filtered items always re-rank starting from #1
- [ ] Hero "Best Action" updates when filters change
- [ ] Filter state persists across page reloads
- [ ] All three filters can be toggled independently
- [ ] Empty state shows when all filters disabled
- [ ] Mobile and desktop layouts not broken
- [ ] Sort functionality still works with filters
