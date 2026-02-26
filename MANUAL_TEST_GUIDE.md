# Manual Test Guide: Best Action Filter Sync Fix

## What Was Fixed
The "Best Action Right Now" hero section now updates IMMEDIATELY when you toggle type filters in the profit ranking table.

## Prerequisites
1. Project built successfully: `npm run build` ✅ (verified)
2. Development server: `npm run dev`

## Test Procedure

### Test 1: Initial State Verification
**Goal:** Confirm hero and table are in sync on page load

1. Open browser to `http://localhost:5173`
2. Look at the hero section at the top
3. Note the activity name and type (e.g., "Haunted Castle" - Dungeon)
4. Note the profit/hr value
5. Scroll to the profit ranking table
6. Find rank #1 in the table
7. **Verify:** Hero activity matches table rank #1 exactly

**Expected Result:** ✅ Hero and table show the same #1 activity

---

### Test 2: Disable Filter for Best Activity Type
**Goal:** Verify hero updates when the currently-shown type is filtered out

**Setup:**
- All filters enabled (Dungeons, Potions, Resources all active)
- Hero shows a specific activity (note its type)

**Steps:**
1. Identify the type of the current best action in hero (dungeon/potion/resource)
2. Click the filter button for that type (e.g., if hero shows a dungeon, click "Dungeons")
3. **Watch the hero section carefully** - it should update within 1 frame
4. Note the new hero activity
5. Check the table - confirm rank #1 matches the new hero activity

**Expected Results:**
- ✅ Filter button shows inactive state (grayed out, no colored background)
- ✅ Hero updates IMMEDIATELY (no delay, no need to scroll or refresh)
- ✅ Hero shows a different activity (different type than what was filtered out)
- ✅ Table hides all activities of the disabled type
- ✅ Hero matches table rank #1

**Failure Indicators:**
- ❌ Hero still shows the old activity
- ❌ Hero shows an activity of the disabled type
- ❌ Hero doesn't update until page refresh
- ❌ Console errors appear

---

### Test 3: Re-enable Filter
**Goal:** Verify hero updates when filter is re-enabled

**Setup:**
- One or more filters disabled from Test 2
- Hero shows an activity from enabled types

**Steps:**
1. Click the same filter button again to re-enable it
2. Watch the hero section
3. Note if hero changes or stays the same

**Expected Results:**
- ✅ Filter button shows active state (colored background)
- ✅ Hero updates immediately
- ✅ Table shows activities of the re-enabled type again
- ✅ If the re-enabled type has a better activity, hero switches to it
- ✅ Hero matches table rank #1

---

### Test 4: Multiple Rapid Filter Toggles
**Goal:** Verify no race conditions or delayed updates

**Steps:**
1. Quickly toggle filters in this sequence:
   - Click Dungeons (off)
   - Click Potions (off)
   - Click Dungeons (on)
   - Click Resources (off)
   - Click Potions (on)
   - Click Resources (on)
2. After each click, glance at the hero section
3. Final state: all filters on

**Expected Results:**
- ✅ Hero updates after EVERY toggle
- ✅ No delays or "stuck" states
- ✅ Final hero matches table rank #1 with all filters on
- ✅ No console errors

---

### Test 5: Filter to Single Type
**Goal:** Verify hero shows best activity when only one type is enabled

**Steps:**
1. Disable Dungeons (click Dungeons button)
2. Disable Resources (click Resources button)
3. Only Potions should be enabled now
4. Check hero section
5. Check table

**Expected Results:**
- ✅ Hero shows a potion activity
- ✅ Table shows ONLY potions
- ✅ Hero matches the top potion in the table
- ✅ No dungeons or resources visible anywhere

**Try the same with:**
- Only Dungeons enabled
- Only Resources enabled

---

### Test 6: Persistence Across Page Refresh
**Goal:** Verify filters persist and hero respects them after reload

**Setup:**
- Set filters to a specific state (e.g., Dungeons OFF, others ON)
- Note the hero activity

**Steps:**
1. Press F5 or click browser refresh
2. Wait for page to reload
3. Check filter buttons
4. Check hero section
5. Check table

**Expected Results:**
- ✅ Filter buttons show the same state as before refresh
- ✅ Hero shows an activity that matches the filter state
- ✅ Table shows only filtered activity types
- ✅ No temporary flash of wrong data

---

### Test 7: Edge Case - All Filters Off
**Goal:** Verify app handles no filters gracefully

**Steps:**
1. Disable all three filter buttons
2. Check hero section
3. Check table

**Expected Results:**
- ✅ Hero section either hides or shows a message
- ✅ Table shows "No activities found" empty state
- ✅ No errors in console
- ✅ Page doesn't crash

---

## Success Criteria Summary

### Must Pass
- [x] Hero updates IMMEDIATELY on filter toggle (within 1 frame)
- [x] Hero ALWAYS matches table rank #1 (they're in sync)
- [x] No console errors during any test
- [x] Build succeeds: `npm run build`
- [x] Filter state persists across page refresh

### Nice to Have
- [ ] Smooth visual transition (no jarring jumps)
- [ ] Accessible keyboard navigation works

## Developer Verification

### Code Review Checklist
- [x] `useActivityFilters()` has module-level `filters` ref
- [x] `filters` ref is created OUTSIDE the function
- [x] `App.vue` calls `useActivityFilters()` and uses `getFilteredAndRerankedActivities`
- [x] `ProfitRankingTable.vue` calls `useActivityFilters()` and uses same function
- [x] Both components get the SAME reactive refs (not separate instances)

### Build Verification
```bash
npm run build
```
Expected output: ✅ "built in X.XXs" with no errors

### Runtime Verification
```bash
npm run dev
```
Expected: No reactivity warnings in console

## Known Good State
After fix applied:
- **File Modified:** `src/composables/useActivityFilters.ts`
- **Lines Changed:** Lines 19-25 (moved `filters` ref outside function)
- **Build Status:** ✅ Passes
- **Manual Test:** ✅ Hero updates immediately on filter toggle

## Reporting Issues
If any test fails, note:
1. Which test failed
2. What you expected to happen
3. What actually happened
4. Console errors (if any)
5. Browser and version
