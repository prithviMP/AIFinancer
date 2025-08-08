# AI Features Plan and TODO

Last updated: (auto)

## Context
- App status
  - Uploads working; files saved to `uploads/` and `core.models.Document` rows created.
  - OCR runs and populates `Document.ocr_text`.
  - AI wired via `server/services/ai_service.py` (LangChain). Falls back to stubbed responses if `OPENAI_API_KEY` is not set.
  - Analytics endpoints live; `trends` needs date normalization.
- Recent fixes
  - Initialize `ConversationBufferMemory` before chat chain to avoid attribute error.
  - Lenient MIME + filename validation for uploads.
  - Frontend View opens documents in a new tab.
- Config
  - Dev DB: SQLite (`sqlite:///./app.db`).
  - Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env` to enable real LLMs.
- References
  - Requirements: `/home/runner/workspace/attached_assets/` (to be distilled into stories + tests).

## Objectives
- Reliable extraction from OCR text into structured fields (invoice/contract/receipt/etc.).
- Natural language Q&A over user documents with sources and confidence.
- Conversational assistant grounded in user docs.
- Solid analytics for quality and throughput.

## Roadmap

### Phase 1 — Stabilize and Prepare
- [x] Ensure AI chains don’t crash when key missing; graceful stubs.
- [x] Initialize memory before chat chain.
- [ ] Normalize analytics trends date handling (avoid `'str'.strftime`).
- [ ] Feature flags/config in `settings` (AI on/off, OCR on/off, provider).
- [ ] Review `/attached_assets` → user stories + prioritized backlog.

### Phase 2 — Extraction Pipeline
- [ ] Define canonical extraction schema in `core/schemas.py` (entities, totals, items, dates, currency).
- [ ] Harden `AIService.analyze_document` prompt + JSON parsing (strict schema, retry once on invalid JSON).
- [ ] Persist extracted fields onto `Document` (`document_type`, `extracted_data`, `total_value`, `processed_at`).
- [ ] Reprocess endpoint: `POST /api/v1/documents/{id}/reprocess` (re-run OCR+AI; idempotent; status updates).
- [ ] Metrics: confidence/token usage in logs + analytics.

### Phase 3 — Natural Language Querying
- [ ] Build retrieval context from `ocr_text` + `extracted_data` (chunking, simple ranking first).
- [ ] Implement `/documents/query` using `QueryRequest`; return answer + sources + confidence.
- [ ] Frontend: query box + answer view with source snippets.

### Phase 4 — Chat with Context
- [ ] Session memory and grounding tools to fetch relevant doc snippets.
- [ ] Streaming responses (SSE) to UI.
- [ ] Safety rails: abstain on low evidence.

### Phase 5 — Providers and Config
- [ ] Switchable LLM providers (OpenAI/local); controls for model, temperature, top_p.
- [ ] Prefer structured outputs (JSON mode/function calling) when available.

### Phase 6 — UX & Reporting
- [ ] Viewer panel with extracted key fields and “Explain this”.
- [ ] CSV/JSON export and monthly summaries.

## TODAY’s TODO (active sprint)
- [ ] Normalize dates in `analytics_service.get_processing_trends` to fix 500.
- [ ] Tighten AI JSON parsing fallback in `AIService.analyze_document`.
- [ ] Draft extraction schema and align prompts.

## Notes / Decisions
- Without an API key, AI endpoints return stubs to keep UX functional.
- Start with simple retrieval (keyword + window) before embeddings for lower infra.

## Update process
- We will check off items as completed and append short notes/dates.
- We’ll add new tasks based on discoveries and the `/attached_assets` requirements.
