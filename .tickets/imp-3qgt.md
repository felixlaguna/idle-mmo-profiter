---
id: imp-3qgt
status: open
deps: []
links: []
created: 2026-02-25T18:32:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-7w43
---
# Build rate-limited API client with request queue

Create src/api/client.ts:

- ApiClient class that wraps fetch() with rate limiting
- Request queue: max 20 requests per 60-second window (matching API limit)
- Track remaining requests via X-RateLimit-Remaining and X-RateLimit-Reset headers
- If near limit (< 3 remaining), pause queue until reset time
- Exponential backoff on 429 responses (start 5s, max 120s)
- All requests include required headers:
  - Authorization: Bearer {apiKey}
  - Accept: application/json
  - User-Agent: IdleMMO-ProfitCalc/1.0
- Singleton instance, reads API key from localStorage
- Methods: get<T>(path, params?), isConfigured(), getRateLimitStatus()
- Error types: RateLimitError, AuthError, NotFoundError, NetworkError
- Request deduplication: if same URL is already in-flight, return the existing promise

## Acceptance Criteria

API client respects rate limits, queues requests, handles errors gracefully

