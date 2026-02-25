---
id: imp-aorl
status: closed
deps: []
links: []
created: 2026-02-25T22:32:11Z
type: task
priority: 2
assignee: Félix Laguna Teno
tags: [bug, data]
---
# Bug: Incorrect vendor values for resources in defaults.json

Resource vendor values in defaults.json don't match the expected game values. Need to compare with Excel source and fix the extraction.


## Notes

**2026-02-25T22:32:55Z**

Investigation: Excel Profit sheet shows vendor values in column D (index 4 in 1-based). Script reads column 3 (0-based index) which should be correct. Need to verify column indexing.

**2026-02-25T22:33:24Z**

Root cause identified: The resources array is extracted from Market sheet (columns J-K) which only has marketPrice. Vendor values exist in Profit sheet (column D) but are not being added to the resources array. The script needs to match resources by name and add vendor values from Profit sheet.

**2026-02-25T22:33:48Z**

Failing validation created: scripts/validate-vendor-values.js confirms vendor values are missing from resources array

**2026-02-25T22:34:27Z**

Bug fixed successfully.

Root cause: The resources array was extracted from Market sheet (columns J-K) which only contained marketPrice. Vendor values exist in the Profit sheet (column D) but were not being added to the resources array.

Fix: Modified scripts/generate-defaults-json.js to add vendor values from Profit sheet to matching resources (excluding combined activities like 'full' and '+' entries).

Files modified:
- scripts/generate-defaults-json.js (lines 191-212, added vendor value mapping)
- src/data/defaults.json (regenerated with correct vendor values)
- scripts/validate-vendor-values.js (created for validation)

Validation: All 7 resources now have correct vendor values matching the Excel source:
- Coal: 1
- Stingray: 26
- Cooked Stingray: 65
- White shark: 41
- Cooked White Shark: 92
- Mystic Ore: 20
- Mystic Bar: 59

Build: npm run build passes successfully
Validation: scripts/validate-vendor-values.js passes
