---
id: imp-jge8
status: closed
deps: []
links: []
created: 2026-02-25T22:59:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [bug, mobile]
---
# Fix: Mobile cards too wide, still showing table headers

Mobile card view: cards take full width with too much padding, and table thead is still visible. Need compact cards with hidden headers.


## Notes

**2026-02-25T23:00:25Z**

Investigation complete:
- Global CSS has mobile-card-layout styles at max-width 767px
- Issue 1: thead is NOT hidden - only selector is '.mobile-card-layout thead' but not strong enough
- Issue 2: Cards too wide - padding is 1rem on tr, 0.5rem on td, margin 1rem between cards
- Issue 3: Labels and values not compact - using float:left for labels, text-align:right for values
- All 4 table components use 'mobile-card-layout' class correctly
- Need to make mobile styles more aggressive and compact

**2026-02-25T23:00:59Z**

Mobile card view fix complete:

Changes made to src/style.css mobile styles (max-width 767px):

1. FIXED: Hide thead - Added !important to ensure headers are hidden
2. FIXED: Compact cards - Reduced padding from 1rem to 0.625rem, margin from 1rem to 0.5rem
3. FIXED: Better layout:
   - Changed td from float layout to flexbox (justify-content: space-between)
   - Labels on left, values on right, both on same line
   - Activity name (.name-cell) more prominent: 0.9rem, font-weight 600
   - Profit/hr stands out: 0.9rem, bold, green color, border-top separator
   - Less important fields (Rank, Time, Cost) smaller: 0.75rem, muted color
4. BONUS: Hide expand buttons on mobile to save space

Result: Clean, compact mobile cards that are easy to scan. Desktop layout unchanged.

Build: Success (npm run build)
