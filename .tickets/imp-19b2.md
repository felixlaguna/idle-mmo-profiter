---
id: imp-19b2
status: closed
deps: []
links: []
created: 2026-03-04T18:53:37Z
type: bug
priority: 1
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Fix reactivity: dungeon profits not updating when MF changes


## Notes

**2026-03-04T18:53:50Z**

Root cause identified: App.vue computed dungeonProfits passes magicFind.value to calculateDungeonProfits(). Vue's reactivity doesn't track nested property access inside function parameters. Need to access properties directly in the computed to establish dependencies.

**2026-03-04T18:54:35Z**

Test shows Vue IS tracking nested properties. Need to investigate if the issue is elsewhere - perhaps the watch in useMagicFindConfig or the singleton pattern.

**2026-03-04T18:54:50Z**

Hypothesis: mutating magicFind.value.dungeon inside a watch callback might not trigger reactivity. Need to verify by checking if assigning a new object works better.

**2026-03-04T18:56:48Z**

Fix implemented:
1. Modified App.vue dungeonProfits computed to explicitly access each magicFind property to establish reactive dependencies
2. Modified useMagicFindConfig watch to use object spread (...magicFind.value) when updating dungeon count
These changes ensure Vue's reactivity system properly tracks changes to Magic Find settings.
All 584 tests passing.
