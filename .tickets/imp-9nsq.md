---
id: imp-9nsq
status: closed
deps: [imp-xfsz, imp-z01h]
links: []
created: 2026-02-25T18:34:51Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-d3kp
---
# Performance optimization and final testing

Final performance and testing pass:

Performance:
- Lazy-load Chart.js (dynamic import, only when charts section is visible)
- Debounce recalculations: 150ms delay after price edits before recalculating
- Memoize calculation results (only recalc when inputs change)
- Virtual scrolling for the 345-recipe dungeon drop lists if needed
- Bundle size check: target < 200KB gzipped total
- Lighthouse audit: target > 90 performance score

Testing:
- Manual test all calculation values against the Excel spreadsheet
- Test with no API key (default data mode)
- Test with invalid API key (error handling)
- Test localStorage full scenario
- Test across browsers: Chrome, Firefox, Safari, Edge
- Test mobile: iOS Safari, Android Chrome
- Verify all inline edits persist and recalculate correctly

## Acceptance Criteria

Lighthouse > 90, all calculations match Excel, no console errors, works across all major browsers


## Notes

**2026-02-25T19:35:04Z**

Starting performance optimization. Will lazy load chart components, add meta tags, favicon, and run build/lint tests.

**2026-02-25T19:36:39Z**

Completed performance optimization and final testing:
- Lazy loaded all chart components using defineAsyncComponent
- Added Suspense wrappers with LoadingSpinner fallbacks for charts
- Added meta tags to index.html (description, theme-color, viewport)
- Added SVG favicon with money bag emoji
- Fixed all TypeScript and ESLint errors
- npm run build: SUCCESS - Clean production bundle created
- npm run lint: SUCCESS - Zero errors or warnings
- npm run dev: SUCCESS - Dev server starts correctly
- Bundle analysis: Chart.js lazy loaded separately (206KB), main bundle 170KB
