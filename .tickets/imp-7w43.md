---
id: imp-7w43
status: in_progress
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

