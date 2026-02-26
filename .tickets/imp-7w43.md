---
id: imp-7w43
status: closed
deps: [imp-dv3t]
links: []
created: 2026-02-25T18:30:40Z
type: epic
priority: 2
assignee: Félix Laguna Teno
parent: imp-jug7
---
# Epic 2: API Integration Layer (Rate-Limited Client)

Build the API client for IdleMMO's public API with aggressive rate limiting protection. The API has a 20 req/min limit shared across all keys for a user. The client must cache responses, queue requests, and allow the app to function fully offline with default/cached data.

Key API endpoints needed:
- GET /v1/item/search (paginated, search by name or type)
- GET /v1/item/{hashed_item_id}/inspect (detailed item info including recipes)
- GET /v1/item/{hashed_item_id}/market-history (price history, listings/orders)

Authentication: Bearer token, stored in localStorage
Required headers: Authorization, Accept: application/json, User-Agent
Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

CRITICAL: No API key will be provided until user reviews the code. App must work 100% with default data (no API calls) until user explicitly enters their key.


## Notes

**2026-02-26T08:59:09Z**

## Code Review: NEEDS FIXES

Build: PASS (vue-tsc + vite build, 0 errors)
Tests: PASS (118/118 tests passing across 6 test files)
Linter: FAIL (4 errors)

---

### Files reviewed:
- /home/felix/idle-mmo-profiter/src/api/client.ts
- /home/felix/idle-mmo-profiter/src/api/cache.ts
- /home/felix/idle-mmo-profiter/src/api/services.ts
- /home/felix/idle-mmo-profiter/src/api/mock.ts
- /home/felix/idle-mmo-profiter/src/api/index.ts
- /home/felix/idle-mmo-profiter/src/storage/persistence.ts
- /home/felix/idle-mmo-profiter/src/storage/index.ts
- /home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue
- /home/felix/idle-mmo-profiter/src/components/DataProviderStatus.vue
- /home/felix/idle-mmo-profiter/src/composables/useApiKeyValidation.ts
- /home/felix/idle-mmo-profiter/src/types/index.ts

---

### CRITICAL BUG: localStorage key mismatch for API key (Integration Failure)

Three different subsystems use three different localStorage key patterns to read/write the API key. The API key entered by the user through the UI will never be found by the API client or the data provider.

1. ApiKeyInput.vue (line 6) stores the key via useStorage('apiKey', null), which writes to localStorage key 'idlemmo:apiKey' (prefix 'idlemmo:' defined in useStorage.ts line 3).

2. client.ts (line 81) reads the key from localStorage key 'idlemmo-settings' and expects it inside a JSON object at property 'apiKey': JSON.parse(localStorage.getItem('idlemmo-settings')).apiKey

3. persistence.ts (line 13) uses a third prefix 'immo-profit:settings' for its StorageManager settings, which also has an apiKey field.

These are all different keys and will never see each other's data. The user saves a key through the UI, but client.ts looks for it under a completely different localStorage key. The tests for mock-provider.test.ts and DataProviderStatus.test.ts set 'idlemmo-settings' directly to match what client.ts expects, which masks the bug.

Suggestion: Unify on a single storage key strategy. Either have client.ts read from the same key that useStorage writes (idlemmo:apiKey), or have ApiKeyInput.vue write to the same structure that client.ts reads (idlemmo-settings). The StorageManager in persistence.ts should also be reconciled, since it has its own apiKey field at 'immo-profit:settings'. Ideally there is one source of truth.

---

### BUG: Request deduplication will fail on second consumer

File: /home/felix/idle-mmo-profiter/src/api/client.ts
Lines: 330-335, 366-378

When two callers request the same URL concurrently, the deduplication logic (line 331) returns the same Promise<Response> to both callers. However, in get<T>() (line 378), each caller calls response.json() on the result. A Response body can only be consumed once. The second caller will get an error: 'body already consumed' or 'Failed to execute json on Response: body stream already read'.

Suggestion: Either clone the response before returning (response.clone()), or cache the parsed JSON result rather than the raw Response promise for deduplication. Alternatively, make the deduplication return a Promise<T> (the parsed data) rather than a Promise<Response>.

---

### BUG: Double cleanup of inFlightRequests map

File: /home/felix/idle-mmo-profiter/src/api/client.ts
Lines: 312-313, 356-358

The inFlightRequests map is cleaned up in two places:
1. processQueue() finally block (line 312-313): this.inFlightRequests.delete(request.url)
2. request() method (line 356-358): requestPromise.finally(() => this.inFlightRequests.delete(url))

This double-delete is not directly harmful (deleting a non-existent key is a no-op), but it indicates confused ownership. More importantly, the processQueue finally block deletes the entry when the inner fetch resolves, which could happen before the outer promise resolves, creating a window where a new identical request would not be deduplicated.

Suggestion: Remove the delete in processQueue (line 312-313) and let the requestPromise.finally handle cleanup exclusively.

---

### LINT ERROR: Missing URLSearchParams in ESLint globals

File: /home/felix/idle-mmo-profiter/src/api/client.ts, line 370
Error: 'URLSearchParams' is not defined (no-undef)

URLSearchParams is a browser global that is not listed in the eslint.config.js globals.

Suggestion: Add URLSearchParams: 'readonly' to the globals in eslint.config.js.

---

### LINT ERROR: Use of 'any' type in three places

File: /home/felix/idle-mmo-profiter/src/api/mock.ts
Lines: 101, 272, 391
Error: @typescript-eslint/no-explicit-any

The DataProvider interface and MockProvider/ApiProvider use 'Promise<any | null>' for the checkAuth() method return type.

Suggestion: Replace 'any' with 'AuthCheckResponse' since that is the actual return type. The import for AuthCheckResponse already exists in services.ts. Change lines:
  line 101:  checkAuth(): Promise<AuthCheckResponse | null>
  line 272:  async checkAuth(): Promise<AuthCheckResponse | null>
  line 391:  async checkAuth(): Promise<AuthCheckResponse | null>

---

### STYLE: Hardcoded color values in DataProviderStatus.vue

File: /home/felix/idle-mmo-profiter/src/components/DataProviderStatus.vue
Lines: 77-95

The component uses hardcoded hex colors (#10b981, #6b7280, #059669, #4b5563) instead of the CSS custom properties (var(--success), var(--text-secondary)) that are used consistently throughout the rest of the app (e.g., ApiKeyInput.vue uses var(--success), var(--text-secondary), etc.).

Suggestion: Replace hardcoded colors with CSS custom properties for consistency and proper theme support.

---

### STYLE: ApiKeyInput uses alert() and confirm() for user feedback

File: /home/felix/idle-mmo-profiter/src/components/ApiKeyInput.vue
Lines: 25, 35, 40, 45

The component uses native browser alert() and confirm() dialogs. While functional, these block the main thread and look jarring in a polished SPA. This is acceptable for an MVP, but worth noting for future improvement.

---

### Summary of required fixes (ordered by priority):

1. [CRITICAL] Unify localStorage key for API key across client.ts, ApiKeyInput.vue/useStorage, and persistence.ts. This is a real integration failure -- the API client will never find the user's API key.
2. [BUG] Fix request deduplication to handle Response body consumption (clone response or cache parsed JSON).
3. [BUG] Remove double cleanup of inFlightRequests in client.ts.
4. [LINT] Add URLSearchParams to ESLint globals.
5. [LINT] Replace 'any' with 'AuthCheckResponse' in mock.ts DataProvider interface and implementations.
6. [STYLE] Replace hardcoded colors in DataProviderStatus.vue with CSS custom properties.

**2026-02-26T08:59:30Z**

Review found 6 issues: 2 critical bugs (localStorage key mismatch, request dedup body consumption), 1 bug (double cleanup), 2 lint errors, 1 style issue. Sending to fixer agent.

**2026-02-26T09:00:16Z**

Starting fixes for 6 code review issues:
1. CRITICAL: localStorage key mismatch for API key
2. BUG: Request deduplication breaks response.json()
3. BUG: Double cleanup of inFlightRequests
4. LINT: Missing URLSearchParams in ESLint globals
5. LINT: Use of 'any' type in mock.ts
6. STYLE: Hardcoded colors in DataProviderStatus.vue

**2026-02-26T09:03:31Z**

All 6 code review issues fixed successfully:

✓ Issue 1 (CRITICAL): localStorage key mismatch
  - Updated ApiKeyInput.vue to use storageManager.getSettings()/saveSettings()
  - Updated client.ts to read API key from storageManager instead of 'idlemmo-settings'
  - Updated all tests to use correct key 'immo-profit:settings'
  - Files: ApiKeyInput.vue, client.ts, 3 test files

✓ Issue 2 (BUG): Request deduplication breaks response.json()
  - Changed deduplication to cache parsed JSON Promise<unknown> instead of raw Response
  - Moved deduplication logic from request() to get() method
  - Now clones are not needed, each caller gets the same parsed JSON promise
  - File: client.ts

✓ Issue 3 (BUG): Double cleanup of inFlightRequests
  - Removed delete in processQueue() finally block
  - Cleanup now handled exclusively in get() method's promise.finally()
  - File: client.ts

✓ Issue 4 (LINT): Missing URLSearchParams in ESLint globals
  - Added URLSearchParams: 'readonly' to eslint.config.js globals
  - File: eslint.config.js

✓ Issue 5 (LINT): Use of 'any' type in mock.ts
  - Replaced all 'Promise<any | null>' with 'Promise<AuthCheckResponse | null>'
  - Updated DataProvider interface and both implementations (MockProvider, ApiProvider)
  - Added AuthCheckResponse import
  - File: mock.ts

✓ Issue 6 (STYLE): Hardcoded colors in DataProviderStatus.vue
  - Replaced #10b981, #059669 with var(--success)
  - Replaced #6b7280, #4b5563 with var(--text-secondary)
  - Removed dark mode media query (CSS custom properties handle theme)
  - File: DataProviderStatus.vue

Verification:
- npm run build: PASS (0 errors)
- npm test: PASS (118/118 tests)
- eslint: PASS (0 errors)

**2026-02-26T09:03:51Z**

All 6 review issues fixed: localStorage key mismatch unified on StorageManager, request dedup now caches parsed JSON, double cleanup removed, ESLint globals updated, any types replaced, hardcoded colors replaced with CSS vars. Build PASS, 118/118 tests PASS, Lint PASS.

**2026-02-26T10:48:22Z**

User Review: CORS error when calling IdleMMO API from browser. Need to set up a proxy.

**2026-02-26T10:49:25Z**

Fixed CORS error when calling IdleMMO API from browser.

Changes made:
1. Updated vite.config.ts: Added proxy configuration under server.proxy to forward /api requests to https://api.idle-mmo.com with changeOrigin and path rewrite
2. Updated src/api/client.ts: Changed BASE_URL from hardcoded 'https://api.idle-mmo.com/v1' to configurable 'import.meta.env.VITE_API_BASE_URL || /api/v1' to use proxy in dev
3. Updated .env.example: Added VITE_API_BASE_URL documentation for production configuration

How it works:
- In development: Vite dev server proxies /api/* requests to https://api.idle-mmo.com/*, avoiding CORS
- In production: Can be configured via VITE_API_BASE_URL env var (defaults to /api/v1 for proxy setup)

Verification:
- npm run build: SUCCESS (all files built without errors)
- npm test: SUCCESS (118 tests passed)

Files modified:
- /home/felix/idle-mmo-profiter/vite.config.ts
- /home/felix/idle-mmo-profiter/src/api/client.ts
- /home/felix/idle-mmo-profiter/.env.example

**2026-02-26T11:44:15Z**

User Review: Perfect - all API integration work approved
