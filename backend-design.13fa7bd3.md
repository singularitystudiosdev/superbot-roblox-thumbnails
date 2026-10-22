# Ouroboro backend: tooling, terminology, data model, flows, build order

Design reference only. No code, no deploy. Legend: **[PRODUCT DECISION]** yours to make. **[MEASURE]** a number only telemetry can set. **[MOCK]** appears in the UI, not binding. **[RISK]** legal, security or feasibility flag. **[DONE]** already exists on this machine. **[PROPOSED]** not built.

Base of the last full design: [backend-design.40877ff5.md](backend-design.40877ff5.md). This version supersedes it on effort, model, caching, realtime, security and on the setup list. Read against the prototype at `localhost:5297/sidebars.bdeb2397/view.html?chat=pricewatch`.

---

## 0. What is real in the prototype

Recon of [sidebars.bdeb2397](sidebars.bdeb2397):

| Real, keep | Where |
|---|---|
| Four effort stops Low / Medium / High / Max, composer slider, default Medium | `EFFORTS` in [composer.854d0793.js](sidebars.bdeb2397/composer.854d0793.js) |
| "No connectors to set up" positioning | composer plus menu |
| Live view of the agent's computer, step ledger ("Ouroboro's steps show up here"), Activity panel | [live.e61b4e86.js](sidebars.bdeb2397/live.e61b4e86.js), [chatview.bdeb2397.js](sidebars.bdeb2397/chatview.bdeb2397.js) |
| Automations catalogue with apps, thumbnails, one-click start | [automations-data.6f6580a5.js](sidebars.bdeb2397/automations-data.6f6580a5.js), `automations/apps/*` |
| Credit chip, Billing page shape | [settings-billing.bdeb2397.js](sidebars.bdeb2397/settings-billing.bdeb2397.js) |

| Mock, replace from ledger | Value in prototype |
|---|---|
| Balance | `left: 12_483_920` |
| Packs | 5M / 20M / 100M credits |
| Auto-reload | off, reload below 5M up to 15M |
| Exchange rate | `PER_MILLION = 1` |
| Card | Visa 4242 |

All **[MOCK]**.

---

## 1. Architecture at a glance

```
 Client (web + desktop helper)                         Cosmos app (Mac)  [DONE]
   |  WebSocket resume (last_seq)                          Observation feed  ws  127.0.0.1:8790
   |                                                       Input gateway     ws  127.0.0.1:8791   (mTLS later)
   v
 Cloudflare  (DNS, WAF, Turnstile, Tunnel -> origin, R2)  Rate Limiting Rules
   |
 API  (Fastify + tRPC, TS)      Auth: Clerk     per-route Zod + quotaguard
   +-- Realtime  Centrifugo (resumable history)   channels user:{id} run:{id} chat:{id}
   +-- Core      Postgres 16 (Supabase-managed or RDS/Aurora) + RLS
   +-- Media     R2 signed URLs (frames, recordings), LiveKit (optional live video)
   |
 Run Orchestrator  Temporal  RunWorkflow (one per run)
   +-- Agent Harness Worker  (per run, Firecracker microVM or Fly Machines)
   |     Model Router (LiteLLM) -> Anthropic (one model family)
   |     Browser Sandbox (Playwright + Chromium in the VM)         headless path
   |     Desktop Bridge client -> Cosmos app on the user's Mac     native path
   +-- Billing Worker   ledger holds + settlement (outbox)
   +-- Events           ClickHouse Cloud -> ranking features, cost dashboards
 Observability: OpenTelemetry -> SigNoz (or Grafana Cloud), Sentry, Axiom logs
 Flags / kill switch: Unleash
```

**Named products per subsystem**

| # | Subsystem | Product / standard |
|---|---|---|
| 1 | Agent execution | Temporal (durable), Firecracker microVMs (runner), Playwright + Chromium, Chrome DevTools Protocol for frames and input injection, LiveKit WebRTC (optional) |
| 1 | Desktop control | Cosmos app: `cosmos-observation.13fa7bd3` on `127.0.0.1:8790` (frames, window dump, a11y tree, open-url) **and** `cosmos-input-gateway.13fa7bd3` on `127.0.0.1:8791` (click, type, key, scroll, clipboard) **[DONE]**, macOS Accessibility (AXUIElement), ScreenCaptureKit, CGEvent |
| 2 | Model access | Anthropic Claude on the first-party API behind LiteLLM proxy; model pinned by an operator config row |
| 3 | Billing | Stripe Payments + Billing + Tax + Invoicing; Postgres double-entry ledger; Stripe Connect Express for publishers; Form 1099-NEC via Stripe Tax reporting |
| 4 | Marketplace | Postgres, R2 for thumbnails, OpenAI Moderation + a human queue |
| 5 | Revenue share | Stripe Connect Express accounts, `publisher_earnings` ledger, nightly settlement job |
| 6 | Ranking | ClickHouse Cloud for events; Redis for counters; offline scoring in a Python job |
| 7 | Agent harness | Anthropic Messages API (`output_config.effort`, `task_budget` beta, prompt caching with `cache_control`), pgvector for long-term memory, pgmq or Redis Streams for compaction jobs |
| 8 | Security | Apple Secure Enclave + Keychain on device (cosmosd), AWS KMS / Cloudflare Secrets Store on our side, mTLS device identity, optional AWS Nitro Enclave later |
| 9 | Realtime / storage | Centrifugo, Postgres (+RLS), ClickHouse, R2, Supabase Storage policy, Postgres PITR |
| 10 | Ops | Temporal schedules, Unleash, SigNoz, Sentry, Grafana dashboards, pgBackRest or managed PITR, Vanta/Drata later for SOC 2 prep |

---

## 2. Agent execution and the run lifecycle

### Components
- **RunWorkflow (Temporal).** Owns the run. Every model call, tool call, frame pointer and user control change is an activity or signal. The websocket is a viewer, never the run. Dropped socket = reconnect.
- **Harness worker.** One per run inside a microVM (Firecracker via `firecracker-go-sdk`, or Fly Machines / E2B for speed). Loop: assemble prompt, call router, parse tool call, execute tool, append observation.
- **Browser sandbox (headless path).** Chromium launched by Playwright inside the VM, per-user persistent profiles stored encrypted in R2 with a KMS data key, frames from `Page.startScreencast` (CDP) at 1-2 fps over WebSocket; user input via `Input.dispatch*` CDP calls. User takeover = the API flips `run.control_owner`, the worker stops dispatching its own input, and only user CDP input is accepted until "return control".
- **Desktop path (the differentiator).** The Cosmos app on the user's Mac is already the computer-control loop. The cloud harness talks to it through a **paired relay**: app dials out (outbound `wss`) to the relay; cloud sends `action` JSON to the input gateway; frames continue locally. Two ports, two surfaces: **observation** (read: frames, a11y tree, windows) and **input** (write: click/type/key/scroll) so a read-only watch mode is possible without granting input.

### Take-over semantics
- Signal `takeover` -> orchestrator sets `control_owner='user'`, every agent input is refused 409 for the duration.
- One audit row per input event in `run_events` regardless of source.
- **[RISK]** two writers on one desktop. A single-writer lease in Redis (`run:{id}:input_lock`) serializes them.

### Surviving a dropped socket
Centrifugo history plus a `last_seq` cursor. UI replays, then live. No run state lives only in the socket.

### Failure and retry
Temporal retries activities. Dead sandbox = `failed`, `run_checkpoints` holds resumable state. **[PRODUCT DECISION]** whether resume is a user-facing button.

---

## 3. Model access and effort

One model family (`claude-opus-5-5` at build start), one API key held server-side. No per-level model switching. The slider changes **a fixed request profile**, not a model.

| Prototype level | `output_config.effort` | `max_tokens` (output ceiling) | `output_config.task_budget.total` | Ledger hard cap `cap_credits(level)` |
|---|---|---|---|---|
| Low | `low` | 16 000 | 64 000 | **[MEASURE]** p99 cost x margin |
| Medium (default) | `medium` | 32 000 | 128 000 | **[MEASURE]** |
| High | `high` | 64 000 | 256 000 | **[MEASURE]** |
| Max | `max` | 128 000 | 512 000 | **[MEASURE]** |

Rules that cost money if broken:
- **Never send `thinking.budget_tokens`.** On `claude-opus-5-5` it is a 400 at every effort. Thinking is adaptive and always on; effort is the only knob. (If a Haiku 5.5 "cheaper model" setting is offered later, it also rejects `budget_tokens`; only the last-generation Haiku 4.5 still takes it, and that model is not the default.)
- Thinking `display` defaults to `omitted`. For the UI's "thinking" indicator set `thinking: {type: "adaptive", display: "summarized"}` explicitly, or the user sees a long silence.
- `task_budget` is a beta (`task-budgets-2026-03-13`) and needs **streaming** so a large `max_tokens` does not hit HTTP timeouts. Minimum `total` is 20 000.
- Effort is a **request profile pinned per run**, never varied mid-conversation as a "cheaper step": changing top-level `effort` invalidates the messages cache (see §7).
- Model upgrades are an operator config row `model_policy` (LiteLLM config + Unleash flag), versioned, and every run records `model_id`.
- **Cheaper model = an explicit user setting `account.model_tier`**, its own control, never behind the slider. Never a silent provider-outage substitution; a fallback emits a visible `run.model_fallback` event.
- Start at `effort` `medium`: the model default for `claude-opus-5-5` is `medium`, not `high`, so set it explicitly rather than relying on omission.

**[PRODUCT DECISION]** whether the "Max" stop maps to `max` or `xhigh` (cheaper, recommended for coding/agentic per vendor guidance; measure both against your eval).

---

## 4. Billing in credits

Price per token (vendor list, first-party API, verify at pricing page before launch): `claude-opus-5-5` $4 / $20 per million input / output; cache read $0.20; cache write ~1.25x input for 5-minute TTL, 2x for 1-hour TTL.

### Price book
`price_book_versions (id, model_id, input_usd_per_mtok, output_usd_per_mtok, cache_read_usd_per_mtok, cache_write_usd_per_mtok, credits_per_usd, markup_bps, min_charge_credits, cap_low, cap_medium, cap_high, cap_max, effective_from)`.
Every run records `price_book_version_id`. UI estimate and final charge read the same row.

```
cost_usd = (in*in_rate + out*out_rate + cache_read*cr_rate + cache_write*cw_rate) / 1e6
credits  = ceil(cost_usd * (1 + markup_bps/10000) * credits_per_usd)
credits  = max(credits, min_charge_credits)
```
Caps = measured p99 cost at that level x margin, not round numbers. **[MEASURE]**: run a benchmark set at each level, read the distribution.

### Double-entry ledger
Accounts: `user_credit` (liability), `stripe_cash`, `revenue_recognised`, `provider_cost_expense`, `publisher_payable`, `publisher_reserve`, `platform_revenue`, `refund_clearing`, `dispute_clearing`.
Append-only `journal_entries` + `journal_lines`; balances are a materialized view; one deferred constraint per entry (`sum(debit)=sum(credit)`); corrections are reversing entries. Holds are `holds` rows plus `available = balance - open holds`.

### Stripe
- **Packs** as Stripe Prices; Checkout Sessions or PaymentIntents with `metadata.user_id`, `metadata.credits`, idempotency key `pi:{id}`.
- **Webhooks**: `payment_intent.succeeded` -> journal credit; `charge.refunded`, `charge.dispute.created` -> `dispute_clearing` hold and account flag.
- **Auto-reload**: off-session PaymentIntent when `available < reload.below`, top up to `upTo`, `stripe.confirm = false` off-session, retry ladder, then notify. Server-side, never the UI's job.
- **Invoices**: Stripe Invoicing for monthly statements of credit purchases.
- **Tax**: Stripe Tax.
- **Credits are not money**; show the USD value at purchase, and state that unused credits are not redeemable for cash (see §13).

---

## 5. Automations marketplace

- **Prompt template** with `{{slot}}` placeholders. Backend validates: every slot has a question, questions are bounded, template compiles with no unknown variables.
- **A published version is immutable.** An edit creates `automation_versions` row `pending_review`; the live version stays.
- **One click** = `POST /runs` with `automation_version_id` and slot values filled from the question sheet.
- **Moderation gate before first publication**: automated (OpenAI Moderation, prompt-injection lint against slot fields, thumbnail hash match) then human queue in an internal reviewer app.
- **Reports**: user report -> `under_review`; automated unpublish on repeated reports + low success; publisher appeal path.
- **Attribution**: each `runs` row names the `automation_version_id`, the publisher's account, and whether it is a self-run.

---

## 6. Revenue share

- **Paid only on** `status='succeeded' AND consumer_account != publisher_account AND net_margin > 0 AND not flagged`.
- Rate `publisher_rate_bps` on the credits charged (not on cost), recorded against `platform_revenue` -> `publisher_payable`.
- **Reserve**: hold `reserve_days` (proposal 60) against chargebacks; payout delay `payout_delay_days`.
- **Payouts**: Stripe Connect Express onboarding (KYC, 1099-NEC at $600), `payout_batches` job.
- **Clawback**: chargeback inside window debits `publisher_reserve`; if reserve short, carry forward as a negative balance.
- **Abuse / reciprocal farming**: graph of `(runner, publisher, automation_version)`; flag cycles (A runs B's, B runs A's, same device/asn/payment fingerprint), duplicate template similarity (MinHash), one-account-many-automations run only by one account, velocity. Portfolio sweep to `abuse_signals`, payouts withheld on flag.

---

## 7. Ranking and recommendation

### Signals per run (all in `runs` / ClickHouse `run_events`)
`started_at, ended_at, duration_ms, status, steps, credits_charged, cost_usd, effort, tokens_in, tokens_out, cache_read_tokens, automation_version_id, slot_values_hash, user_id, device, source (catalogue|search|feed|direct)`.

### Metrics per `automation_version`, 30-day rolling
- **Average use time:** mean, median, p90 of `duration_ms` over `succeeded` runs.
- **Completion rate:** ended `succeeded` / started.
- **Success rate:** `succeeded` without reported error / started.
- **Credits burned:** mean, p90.
- **Cost:** mean `cost_usd`; converted margin.
- **Impressions -> starts -> successful runs funnel** from `impressions`.

### Score v1 (weighted, Bayesian-shrunk)
`score = (successes + alpha*prior) / (starts + alpha)` ranked against `w1*log(credits_p90+1)` cost penalty, `w2*completion`, `w3*median_time` recency, `w4*log(1+7d starts)`. All weights in `ranking_config` (versioned, off by default).

### Cold start
Version with `< n_min` (say 30) successful runs rides a per-category prior (the publisher's account-level mean or the category median) plus a **forced exploration quota** (e.g. 10% of catalogue impressions round-robin by category), decaying as the version accrues data.

### Exploration / exploitation
Thompson sampling on the success rate per (version, category) after cold start; deterministic per user via a hash of `user_id`. Policy evolution: weighted score (v1) -> collaborative filtering once a user x automation matrix of ~10k+ successful runs exists (implicit ALS, `implicit` or LightFM) -> learning-to-rank (LightGBM LambdaRank) once click/success labels are abundant. Each step is an offline eval against a holdout, then an A/B with the previous policy.

---

## 8. Agent harness: loop, memory, caching, compaction

### Loop
Reason -> plan -> act -> observe -> update. One trace per run, one span per step. Tools: `browser.*` (Playwright), `desktop.*` (via gateway), `fs.*` (local helper), `memory.*`, `ask_user`, `done`.

### Memory tiers
- **Working:** current prompt window.
- **Session:** compacted summary pinned to the session (`sessions.summary`).
- **Long-term:** `memories` rows + pgvector embeddings, retrieved by similarity plus recency, scoped hard by `user_id` with RLS.

### Prompt caching (a cost requirement)
Cache is a prefix match: a single byte change at position N invalidates everything from N onward. Render order: **tools -> system -> messages**. Keep all stable content first, all volatile content after the last breakpoint.

Layout per run:
1. **tools** (frozen list, frozen order, sorted JSON keys) - breakpoint on last tool
2. **system** (static harness prompt, model policy, no date) - breakpoint after it (caches tools + system together)
3. **pinned context** (user facts, long-term memories selected at run start) - breakpoint after
4. **messages** - automatic top-level `cache_control` walks forward with the conversation (the 4th slot)

**Verified facts to design around:** at `claude-opus-5-5` a cache read is $0.20 vs $4 input (**5x cheaper**, and 20x vs $4 when compared to a fresh cache write), so in an agent loop where the system + tools + prior turns are re-sent every step, a cache miss multiplies run cost by a large factor. This is why caching is a requirement, not an optimisation.

**Where the cache is lost:**
| Cause | Fix |
|---|---|
| Timestamp / UUID / date in system prompt | move after last breakpoint or omit |
| Tool list reordered or mutated per step | freeze order; version tools via operator config |
| JSON serialized with unstable key order | canonical serialization |
| Top-level `effort` changed mid-conversation | pin effort per run; per-message effort beta only if a mid-run change is needed |
| Model switch mid-run | pin model per run; fallback is a new run |
| Deleting or rewriting an earlier message (compaction by rewriting history) | append-only edits; use turn-scoped `clear_at: "next_user_message"` system messages instead of inject-then-delete; server-side compaction blocks kept in history |
| Editing a prior tool result | never edit; append corrections |
| More than 20 positions added in one turn (long sequential tool loop) | intermediate breakpoint every ~15 positions |
| Cache TTL expiry on a long human-wait step | keep-alive: re-send previous request with `max_tokens: 0` before the 5-minute TTL, or 1-hour TTL if waiting is common |
| Prompt shorter than the model's minimum cacheable prefix (512-4096 tokens) | no cache; not worth fixing for tiny prompts |

**Hit-rate tracking:** every model call logs `cache_creation_input_tokens`, `cache_read_input_tokens`, `input_tokens`. Metric: `cache_read / (cache_read + cache_creation + input)` per run and per step index; alert when a run's step-2 hit rate drops below a threshold (a programmer error, not a model error).

### Compaction and pinned context
- Trigger when the context exceeds a level budget (e.g. 60% of window). Summarise earlier turns into a compaction block, keep the system + pinned context blocks intact.
- **Pinned context** (user's standing facts, safety rails) sit in the stable prefix with their own breakpoint, so compaction never touches them and never pays a cache write for them.
- **Second cache store**: the user's inserted pins are volatile? No - insert them in the pinned block at run start only; per-turn pins go into a system message mid-conversation (does not invalidate the cached history prefix).

### Batch discount
The Message Batches API is 50% on every token including cache reads and writes. Use it for eval runs, re-ranks, thumbnail moderation pre-screens, and offline summarisation jobs. Never for a live run.

---

## 9. Security: access to the whole computer and safe credentials

### What is achievable (honest)
| Asset | Where it lives | A breach of our servers gives |
|---|---|---|
| macOS Accessibility, Screen Recording grants | user's device, granted by the user | nothing |
| User's browser cookies / sessions, local-browser path | user's device only | nothing (cookies never reach us) |
| Typed passwords on the user's desktop | device keyboard; **must not enter our logs** (input gateway mask) | nothing if the gateway redacts secure fields before any cloud log |
| Model API keys | our KMS | keys once app code runs (KMS is not a wall against code execution) |
| User's memory of their work (long-term memory) | our Postgres, per-user KMS data key | ciphertext without KMS; with KMS access, plaintext |
| Sentinel remote input token for a paired Mac | our DB, KMS-encrypted, short TTL | ability to drive that Mac until the token expires (bounded by pairing revoke) |

- **The only truly protected side is the device.** Anything our server must use to act for the user can, under attacker code execution, be made to act. Say so.
- **KMS** protects at rest against disk/snapshot theft and gives audit; a per-user data key means a DB dump is useless without KMS. It stops an attacker *without application execution*, not one with it.
- **Confidential computing (AWS Nitro Enclaves)** can narrow the decrypt path to an attested signed binary. Real, heavy; phase 6 candidate.
- **Local-browser vs headless:** the cloud headless Chromium cannot use the user's logged-in sessions without being given cookies. The safe answer for session access is the local path: drive the user's own browser via the desktop helper or a paired extension. Headless is for public web and for the automation's own service accounts.
- **"Impossible to find" cannot mean** unrecoverable for a credential the service must use. It can mean: never on our side on the primary path; when on our side, per-user encrypted, decrypted only in a narrow service, never logged, rotatable, and audited.

### Device pairing
- Pairing code approved on device -> device generates key pair in **Secure Enclave / Keychain** (`kSecAttrTokenIDSecureEnclave`, non-exportable), registers public key with our API.
- Relay challenge-signed by the device key on every connection; short-lived session token bound to device + run.
- A pairing revoke from the user's Mac kills every server-side grant for that device.

### Not deliverable as stated
- Operating on **someone else's** accounts/sessions is illegal in many places and breaches ToS.
- Solving CAPTCHAs for the user is a liability. The harness detects (`/captcha/i`, `cf-chl`, `arkose`, `hcaptcha`) and hands control to the human.

---

## 10. Realtime and storage

### Channels (Centrifugo)
`user:{id}` (balance, runs changed), `run:{id}` (token deltas, step events, frame index pointers), `chat:{id}` (messages + step ledger), `automation:{id}` (metrics ticker for detail page). Frames themselves: pointer in Centrifugo + JPEG over the run's dedicated WebSocket to the VM, or LiveKit if you want smooth video. History bounded (24h) then replay from Postgres.

### Storage matrix
| Data | Store | Notes |
|---|---|---|
| users, accounts, settings | Postgres | RLS on `account_id` |
| chats, messages | Postgres | monthly partition later |
| runs, run_steps, run_checkpoints, run_events | Postgres; events also clickstream into ClickHouse | `run_events` partitioned by day, 30-day retention in PG |
| frames, recordings, artifacts | R2 | frames 30d, recordings 1y lifecycle, signed URLs |
| memories + embeddings | Postgres + pgvector | strict RLS |
| automations + versions | Postgres | insert-only versions |
| reviews, reports, impressions | Postgres; impressions to ClickHouse | fire-and-forget |
| ledger | Postgres | append-only, double-entry |
| price book, model policy, ranking config | Postgres | versioned + audited |
| traces | SigNoz / Tempo | one trace per run |

### Core tables (all have `id uuid`, `created_at`, `account_id` where owned)
```
accounts, users, sessions, devices (user_id, pubkey, last_seen, revoked_at)
chats (user_id, title), messages (chat_id, role, content jsonb, run_id)
runs (user_id, chat_id, automation_version_id, effort, model_id, price_book_version_id,
      status, started_at, ended_at, credits_held, credits_charged, cost_usd,
      tokens_in, tokens_out, cache_read_tokens, cache_write_tokens, control_owner)
run_steps (run_id, seq, kind, input_tokens, output_tokens, cache_read_tokens, cost_usd, latency_ms)
run_events (run_id, seq, type, payload jsonb)           -- DELETE for retention moves to CH
run_checkpoints (run_id, seq, state jsonb)
artifacts (run_id, kind, r2_key, bytes)
memories (user_id, kind, content, embedding vector(1536), last_used_at)
journal_entries (id, ref, idempotency_key), journal_lines (entry_id, account, debit, credit)
holds (run_id, account_id, credits, expires_at, released_at)
credit_purchases (user_id, stripe_pi, credits, usd_cents, status)
auto_reload_settings (user_id, enabled, below, up_to, pm_id)
price_book_versions (...)
automations (publisher_id, current_version_id, status)
automation_versions (automation_id, version, title, description, template,
                     questions jsonb, apps text[], thumb_r2_key, status, moderation jsonb)
automation_runs_index -> runs
reviews (automation_id, user_id, rating, body)
automation_reports (automation_version_id, reporter_id, reason, status)
impressions (automation_version_id, user_id, surface, ts) -- CH
automation_metrics_snapshots (version_id, date, mean_ms, median_ms, p90_ms,
                              completion_rate, success_rate, mean_credits, mean_cost)
publisher_earnings (publisher_id, run_id, credits, bps), publisher_payouts (stripe_transfer_id)
publisher_reserve (publisher_id, credits, releases_at)
abuse_signals (subject_type, subject_id, signal, score, evidence jsonb)
audit_log (actor, action, target, before jsonb, after jsonb, ip, ts)
```

---

## 11. End-to-end flows

### A. A run
1. `POST /runs {chat_id, effort, automation_version_id?, slots?}`.
2. Auth (Clerk JWT) -> quota check (`available >= cap`, `runs_today`, `concurrent`) -> `hold(cap_credits(effort))`. Insufficient: 402 with auto-reload prompt.
3. Insert `runs` `queued`; start `RunWorkflow(run_id)`; subscribe channel `run:{id}`.
4. Worker starts the VM; step loop: model call under effort profile -> tool -> `run_steps` + event -> Centrifugo publish -> frame pointer.
5. End: aggregate cost, release hold, post settlement journal, update `runs`, fire `run.completed`.
6. If automation version and publisher eligible, write `publisher_earnings`; nightly settlement.

### B. A payment
Checkout -> Stripe PaymentIntent -> webhook idempotent `pi:{id}` -> journal debit stripe_cash / credit user_credit -> Centrifugo `user:{id}` -> UI balance.
Insufficient -> auto-reload off-session charge inside the run-creation path? **No:** auto-reload is a standing job on every settlement, plus one on-demand attempt on 402, then prompt.

### C. A publish
Validate template -> upload thumbnail to R2 by presigned PUT -> create `automation_versions` `pending_review` -> automated moderation -> human queue -> approve -> `automations.status='live'`, `current_version_id` set.

### D. An earn
Nightly: for each successful run of the day: `net = credits - cost_share`; if eligible post journal platform_revenue -> publisher_payable x bps; run abuse checks; write `publisher_reserve` with `releases_at = now + reserve_days`. Payout job scheduled past reserve and delay.

### E. Takeover
`POST /runs/{id}/takeover` -> Temporal signal -> control_owner user -> frame stream stays -> `run_events` row. `POST /runs/{id}/release` resumes.

### F. Dropped socket
Reconnect with `last_seq` -> replay -> live.

---

## 12. Scale, safety, operations

- **Queues:** Temporal for runs and settlement; pgmq (Postgres) or Redis Streams for moderation, thumbnails, payouts, notifications.
- **Rate limits:** Cloudflare Rate Limiting Rules (edge), API token bucket per user/account/automation in Redis (server), Temporal concurrency per account.
- **Quotas server-side:** credits, runs/day, concurrent runs, max duration, max tokens per run, per-automation concurrent runs. Checked in API and re-checked in the workflow.
- **Abuse:** the `abuse_signals` table plus churn/velocity signals; the reciprocal-farming graph.
- **Kill switch:** Unleash global, per-account, per-automation, per-model-policy; Temporal signals in-flight runs; every start checks the flag.
- **Observability:** OTel spans per step; dashboards cost per run by effort and model, cache hit rate by step index, p50/p90/p99 latency, success rate, hold-release drift, ledger imbalance = 0, market score distribution; Sentry errors; cost budget alerts.
- **Backups:** managed Postgres PITR (Supabase Pro/Aurora 35d) + nightly ledger export to R2 with object lock + cross-account copy; quarterly restore drill.

---

## 13. Contradictions flagged plainly

| Brief | Problem | Resolution |
|---|---|---|
| Max access to the whole computer AND safe from breach | total access from a compromised agent = total access | observe/input split locally, owner-only scope, revocation, secure-field redaction in cloud logs |
| "Credentials safe from a breach" | not absolute for anything the service uses | state the limit; KMS now, enclave later |
| Headless browser + the user's logged-in sessions | headless cannot use them without receiving cookies | local browser path for sessions; headless only for public web |
| "No connectors" | true for onboarding; each app still needed engineering | keep positioning; budget per-app work |
| Credit figures etc. | mock | all derived from price book |
| Revenue share on "successful only" | some successful runs earn nothing (loss-making) | show margin eligibility to publishers; subsidy is a decision |

---

## 14. Build order

| Phase | Weeks | Scope | Gate |
|---|---|---|---|
| **P0 Accounts + ledger + chat** | 2-3 | Clerk, Postgres schema, double-entry ledger + holds, Stripe packs + webhooks, Centrifugo, chat with a fake closed run | a purchase credits the ledger; a fake run holds and settles |
| **P1 One real run, Low effort** | 3-4 | Temporal, harness, LiteLLM -> Anthropic, VM + Playwright, run_steps/events, live frames, stop, reconnect, takeover | one real task end to end without a mock |
| **P2 Effort tiers + desktop bridge** | 4 | per-level request profiles, cache layout + hit-rate dashboard, compaction, input/observation gateways wired to cloud relay, takeover on desktop | four levels measured, cache hit > 60% on step 5+ |
| **P3 Automations v1** | 3 | publish, versions, moderation queue, slot forms, reviews, metrics snapshots | a published automation starts a run in one click |
| **P4 Revenue share** | 4 | eligibility, publisher ledger, Connect Express, reserve, clawback, abuse graph | a payout in sandbox with a simulated chargeback |
| **P5 Ranking** | 4 | ClickHouse, metrics, weighted score + shrinkage, cold start, Thompson | offline eval beats catalogue order |
| **P6 Hardening** | ongoing | quotas, abuse, PITR drills, SOC 2 prep, enclave feasibility | restore drill passes |

Why this order: billing before anything leaks for free; then the single real run (hardest risk); then effort tiers and the desktop bridge (differentiator); then marketplace, then economics, then ranking (needs data). The desktop gateway is the riskiest external dependency and is already built, so **P2 is the schedule risk, not P1**.

---

## 15. Glossary

- **Harness:** the loop that turns a goal into steps.
- **Request profile:** the fixed (effort, max_tokens, task_budget, credit cap) tuple a slider level maps to.
- **Task budget:** advisory token ceiling the model paces against; distinct from `max_tokens`.
- **Hold / settlement:** reservation of credits, then the actual charge posted from the ledger.
- **Price book version:** the rate row a run is charged under.
- **Cache breakpoint:** a `cache_control` marker; everything before it must be byte-identical to hit.
- **Cold start:** ranking a version with too few runs.
- **Takeover:** the user assumes control of a running agent.
- **Reserve:** delayed slice of publisher earnings held against chargebacks.

---

## 16. What you must set up: click-by-click procurement

Where the earlier draft named a technology with no path, this section replaces it with the console, plan, price, commands and the thing you hand back.

Every row below is a purchase or an account you create. Each gives: **where** (exact console URL), **what plan**, **what it costs**, **the exact steps**, **what you hand back** (a key, an ID, or a resource name), and **the no-code alternative** where one exists. Prices fetched 2026-10-22; re-check the page at purchase time.

Ranked by when you pay. **You pay $0 through P0** (everything local or on a free tier).

### Tier 0: free, do today, no card

| # | Sign up at | Plan | Cost | Steps | Hand back |
|---|---|---|---|---|---|
| 0.1 | https://console.anthropic.com | Workspace API key | $0 to create, pay per token | Create workspace "ouro-prod"; Settings -> Limits: set a **monthly spend limit** for the workspace; Settings -> Usage report. Create an **Admin API key** separately (`sk-ant-admin...`) for cost reporting; create a **workspace key** for LiteLLM. | `ANTHROPIC_API_KEY`, `ANTHROPIC_ADMIN_KEY` into `keychain-vault` |
| 0.2 | https://supabase.com | Free project | $0 | New project "ouro-dev", region US East; copy the **pooler connection string** and the **anon** + **service_role** keys; SQL editor -> `create extension vector`. | `DATABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (local dev only) |
| 0.3 | https://dashboard.stripe.com | **Test mode** | $0 | Stripe is already a connected MCP in this chat, so the agent can create Products, Prices and Payment Links for you. You only verify. Also: Developers -> Webhooks -> add endpoint `https://api.<your-domain>/webhooks/stripe`. | `STRIPE_SECRET_KEY` (`sk_test_`), `STRIPE_WEBHOOK_SECRET` (`whsec_`) |
| 0.4 | https://clerk.com | Free (development) | $0 | New application; Authentication -> enable Email + Google; Sessions -> add JWT template named `api` with a custom claim `"account_id": "{{user.public_metadata.account_id}}"`. | `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` |
| 0.5 | https://sentry.io | Free Developer (5k errors/mo) | $0 | New project "ouro-api" (Node), "ouro-web" (React); copy DSNs. | `SENTRY_DSN` x2 |
| 0.6 | https://app.unleash.io | Free (2 projects, unlimited flags) | $0 | New project "ouro"; create flags `killswitch.global`, `killswitch.runs`, `market.live`, `ranking.v1`; copy the **client-side** API token (frontend) and **admin** token. | `UNLEASH_API_TOKEN`, `UNLEASH_CLIENT_TOKEN` |
| 0.7 | https://temporal.io/cloud | **Free trial: $150 credits / 90 days** | $0 now, then from $50 per million actions | Create namespace `ouro.prod`; region us-east; create an **API key** (Temporal Cloud UI -> API keys). | `TEMPORAL_API_KEY`, namespace `ouro.prod`, address `<ns>.tmprl.cloud:7233` |
| 0.8 | https://e2b.dev | **Hobby: $100 usage credit** (Pro is $150/mo + usage) | $0 now; then metered: $0.000056/s per 4 vCPU, $0.000018/s per 4 GiB | This is the sandbox runner. `pip install e2b` / `npm i e2b`; run the SDK with a browser template. **No Firecracker to install by hand**: E2B runs Firecracker microVMs for you. See 16.4 for the alternative if you want managed browsers instead. | `E2B_API_KEY` |
| 0.9 | https://clickhouse.cloud | **$300 credits / 30 days** | $0 now, then usage-based | Create service "ouro-events", region us-east; create database `ouro`; note the native connection string. | Host + password -> `CLICKHOUSE_URL` |
| 0.10 | https://livekit.io | **Build: $0** | $0 to start | Only for the optional live-video mode. Create project; copy keys. | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |
| 0.11 | https://resend.com | Free (3k emails/mo) | $0 | Add your domain; add SPF/DKIM records (Cloudflare will show them). | `RESEND_API_KEY` |
| 0.12 | https://fly.io | SIGN UP later (card required at sign-up) | from $2.19/mo per Machine | Defer until P1: you do not need it to build P0. | see 16.2 |
| 0.13 | https://platform.openai.com | Pay-as-you-go | Moderation is **free** for the `omni-moderation-latest` model | New API key with project scope = Moderation only. | `OPENAI_API_KEY` |

### Tier 1: Cloudflare, the fixed cloud

Create or log in at https://dash.cloudflare.com.

| # | Page | Plan | Cost | Steps | Hand back |
|---|---|---|---|---|---|
| 1.1 | Websites -> Add domain | Pro ($25/mo) recommended for WAF managed rules; Free works for dev | $0 dev / $25 prod | Add the domain, switch nameservers at your registrar. | domain live |
| 1.2 | DNS -> Records | included | $0 | A record `api` -> origin (proxy on), CNAME `app` -> Vercel/Pages, CNAME `rt` -> realtime host. | |
| 1.3 | Zero Trust -> Networks -> Tunnels | Free | $0 | Create tunnel `ouro-api-dev`; install connector; route `api-dev.<domain>` -> `http://127.0.0.1:8080`. You already run cloudflared for Cosmos, so this is the same pattern with a second tunnel. | tunnel token |
| 1.4 | R2 -> Create bucket | R2 Free: 10 GB storage, 1M class A and 10M class B ops/mo | $0 dev; then $0.015/GB storage, $0 egree | Buckets `ouro-frames` (Object Lifecycle: delete after 30d), `ouro-recordings` (delete after 365d), `ouro-thumbs` (public via custom domain `thumbs.<domain>`). R2 -> Manage API Tokens -> Create token: **Object Read & Write** on those buckets only. | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| 1.5 | Turnstile | Free (1M solves/mo) | $0 | Add widget `signup` and `report`; note the secret shows only once. | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| 1.6 | Security -> WAF -> Rate limiting rules | Pro+ needed for rate limiting rules (Free has a basic managed one) | included in Pro | Rules: `/api/auth/*` 20/min/IP; `/api/runs` 5/min/user key; `/api/reports` 10/hour/IP. | |
| 1.7 | Zero Trust -> Access -> Applications | Free up to 50 users | $0 | Application `moderation.<domain>` -> policy: emails of reviewers; Google IdP. | |
| 1.8 | Logs -> Logpush | $0.05/GB | low | Push to R2 bucket `ouro-edge-logs` or to Axiom. | |
| 1.9 | Security -> WAF -> Managed rules | Pro+ | included | Enable Cloudflare Managed Ruleset + OWASP. | |
| 1.10 | My Profile -> API Tokens | create scoped token | $0 | Template "Edit zone DNS" + add R2 permissions + Rules; scope to this zone only. | `CLOUDFLARE_API_TOKEN` |

No-code alternative: nothing in this tier needs code. The agent can drive it with `wrangler` (`npx wrangler login`, `npx wrangler r2 bucket create`) if you prefer CLI over dashboard.

### Tier 2: at P1, when the first real run must execute anywhere

**Option A: leased firecracker-style sandboxes (fastest path, no Linux to run)**
- **E2B** (already in 0.8). Copy: https://e2b.dev -> Dashboard -> API key; install locally `npm i e2b`; the template `code-interpreter-v1` has Python/Node but **no browser**, so build one: `npx e2b template build --dockerfile e2b.Dockerfile` from https://github.com/e2b-dev/e2b/tree/main/templates. Your Dockerfile is `FROM mcr.microsoft.com/playwright:v1.5x-jammy` + `python`. Cost: scaled by seconds, example: 1 vCPU/2 GiB for 60 s = ~$0.0037.
- **Browserbase** (https://www.browserbase.com/pricing) if you want a **managed Chromium** with sessions, no Dockerfile and live view included: Developer $20/mo (25 concurrent, 100 browser hours then $0.12/hr), Startup $99/mo (100 concurrent, 500 hours then $0.10/hr). Browserbase is Playwright-compatible via CDP; you connect with `browser.newContext({ wsEndpoint })`.
- **Browserless** (https://www.browserless.io/pricing) Prototyping $25/mo, 20k units. Cheapest managed Chromium, but no persistent contexts as good as Browserbase.

**Option B: your own Linux host running Fly Machines (more control, you pay for idle only by the second)**
1. `brew install flyctl` -> `fly auth signup` (card required, card on file). https://fly.io
2. `fly launch --no-deploy --name ouro-runner --region iad --vm-memory 2048 --vm-cpus 2 --image mcr.microsoft.com/playwright:v1.5x-jammy` (a Fly "Machine" is a microVM; Fly starts Machines on demand and bills per second while running: 2 vCPU/2 GiB ~ $13.39/mo if always on, a few cents per run if auto-stopped).
3. `fly machine list` -> note machine id; API: `fly machines run` from the Temporal activity using `flyctl` token or Machines REST API (`https://api.machines.dev/v1/apps/<app>/machines`).
4. Secrets: `fly secrets set E2B_API_KEY=...` (or the runner's own keys).

**Option C: AWS EC2 with real Firecracker (only if you need your own isolation layer)**
1. AWS account (https://console.aws.amazon.com), card. Create an **IAM role** via OIDC for CI, no long-lived keys.
2. Pick an instance from https://aws.amazon.com/ec2/instance-types/ family `c7i` or `m7i` in us-east-1. Set up https://firecracker-microvm.github.io/getting-started/ (kernel + rootfs or a distribution such as `Firecracker-containerd`).
3. Run Firecracker per run: one microVM = one run. This is 1-2 weeks of Linux plumbing; E2B does the same thing for a subscription.

**What "where to pay" means:** at P1, budget **$0 to start** on E2B's $100 credit. At ~1,000 60-second 2 vCPU runs/month you spend under $10 of sandbox compute plus Browserbase/E2B plan base fees. None of the runner tiers need to be purchased to build P0.

### Tier 3: production infra, at P3+

| Resource | Where | Plan | Cost |
|---|---|---|---|
| API host | Render (https://render.com/pricing): Pro $25/mo workspace + compute; or Fly.io | Pro | $25 + ~$7-25/mo for one API + one worker |
| Temporal | https://temporal.io/cloud | Pay-as-you-go | from **$50 per million actions**; a typical run is ~20-40 actions, so 1M actions ~= 25-50k runs |
| Postgres | Supabase Pro, https://supabase.com/pricing | Pro | **$25/mo** including $10 compute credit, 8 GB disk; or Aurora Serverless v2 on AWS |
| ClickHouse | https://clickhouse.cloud | Basic (usage) | small dev ~$30-80/mo at low volume |
| LiveKit | https://livekit.io/pricing | Ship | from **$50/mo** if video is on |
| Stripe | https://dashboard.stripe.com | Standard | 2.9% + 30c per charge, +0.5% Billing |
| Stripe Connect | https://dashboard.stripe.com/connect | Express | 0.25% + $0.25 **per payout** to a publisher; $2/mo per active connected account |
| Apple Developer | https://developer.apple.com/programs | Individual | **$99/yr** (required to sign and notarize the desktop helper for distribution) |
| E2B Pro | https://e2b.dev | Pro | **$150/mo** + usage, 100 concurrent sandboxes |
| Sentry | https://sentry.io | Team if over 5k errors | $26/mo |

### 16.2 Cloudflare: exact resource list (checklist for the dashboard work)

- [ ] Zone added, nameservers switched
- [ ] DNS: `api`, `app`, `rt`, `thumbs`, `moderation` (proxied where applicable)
- [ ] Tunnel `ouro-api-dev` for local API; tunnel `ouro-api-prod` only if hosting behind Cloudflare (Render/Vercel do not need it)
- [ ] R2: `ouro-frames` (30d), `ouro-recordings` (365d), `ouro-thumbs` (public), `ouro-edge-logs`
- [ ] R2 API token with Object Read & Write on only those buckets
- [ ] Turnstile widget for sign-up and for the report form
- [ ] Rate Limiting Rules for auth, run starts, reports
- [ ] WAF Managed Rules + OWASP (Pro)
- [ ] Cloudflare Access app for the moderation reviewer
- [ ] Logpush to R2
- [ ] Scoped API token for the agent (DNS + R2 + Rules)
- [ ] Custom domain on `ouro-thumbs` bucket

### 16.3 API keys to provide (and where they come from)

| Env var | Source console (page) | Scope | Put in |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console -> API Keys (workspace key) | Messages, Batches | keychain -> server env -> LiteLLM |
| `ANTHROPIC_ADMIN_KEY` | Console -> Admin keys | usage/cost reports only | keychain, CI |
| `STRIPE_SECRET_KEY` | Stripe -> Developers -> API keys | test then live | keychain -> server |
| `STRIPE_WEBHOOK_SECRET` | Stripe -> Developers -> Webhooks -> endpoint -> signing secret | verify only | keychain -> server |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe -> Settings -> Connect -> Connect platform -> OAuth | publisher onboarding | keychain -> server |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Clerk -> API keys | server / browser | server / client env |
| `DATABASE_URL` | Supabase -> Connect -> Session pooler URI | Postgres | server |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare -> R2 -> Manage API Tokens | bucket-scoped | server |
| `CLOUDFLARE_API_TOKEN` | Cloudflare -> My Profile -> API Tokens | DNS + R2 + Rules, one zone | CI |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare -> Turnstile | server verify | client / server |
| `TEMPORAL_API_KEY` | Temporal Cloud -> Namespace -> API keys | workflow only | server |
| `E2B_API_KEY` | E2B -> Dashboard -> API keys | sandbox | server |
| `CLICKHOUSE_URL`, `CLICKHOUSE_PASSWORD` | ClickHouse Cloud -> Connect | events | server |
| `OPENAI_API_KEY` | OpenAI -> API keys (project: Moderation) | moderation only | server |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | LiveKit Cloud -> Project -> Keys | video (optional) | server |
| `RESEND_API_KEY` | Resend -> API keys | email | server |
| `SENTRY_DSN` | Sentry -> Project -> Client keys | errors | server + client |
| `UNLEASH_API_TOKEN`, `UNLEASH_CLIENT_TOKEN` | Unleash -> Project -> Access | flags | server / client |
| `AWS_ACCESS_KEY_ID` etc. or `AWS_ROLE_ARN` (OIDC) | AWS IAM | only if Fly/AWS; use OIDC role not static keys | CI |
| `APPLE_TEAM_ID`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` | https://developer.apple.com/account -> Membership -> Team ID | notarize helper | CI secrets |

Never in a repo, never in the chat, never in the browser. Local: `keychain-vault` talent. Prod: AWS Secrets Manager or Cloudflare Secrets Store, read by an OIDC role; the Anthropic key is only ever mounted into LiteLLM, never into the API or the sandbox.

### 16.4 Access not currently granted (what blocks the agent today)

| # | Need | Status | Action for you |
|---|---|---|---|
| A1 | Anthropic key in keychain | unknown | Paste into `keychain-vault` as `anthropic/api-key` (Settings -> keychain-vault talent, or `security add-generic-password -s anthropic -a api-key -w`) |
| A2 | Stripe test key in keychain | Stripe MCP is connected, but the agent cannot read secrets from it | Add `stripe/test-secret-key` to keychain; payment triggers still need your approval per wallet policy |
| A3 | Supabase project + DB URL | none | Create at 16.1 #0.2, then add to keychain |
| A4 | Cloudflare scoped token | the account exists but no project-scoped token | Create at 16.1 #1.10 |
| A5 | GitHub MCP | **waiting on sign-in** | Click the Sign-in chip for GitHub in Cosmos |
| A6 | Sentry / Linear MCP | waiting on sign-in | same |
| A7 | Apple Developer membership | unknown | $99/yr, needed only for helper distribution (P2), not for local dev |
| A8 | Linux runner | none | Defer to P1 (E2B credit is $0) |
| A9 | This project's git repo | present (`singularitystudiosdev/...`) | none |
| A10 | Docker Desktop on this Mac | **check**: `docker version` in a shell | If missing: `brew install --cask docker` (or OrbStack) |

### 16.5 The five-minute start, order of operations

1. `docker version && node -v && npm -v`; install what is missing.
2. Anthropic key -> keychain (A1).
3. Stripe test key -> keychain (A2).
4. Create Supabase project -> paste URL -> keychain (A3).
5. Copy the Cloudflare token into keychain (A4), connect GitHub MCP (A5).
6. The agent builds P0 on docker-compose (Postgres, Centrifugo, LiteLLM, MinIO) and runs it against the Supabase DB.
7. At P1, create E2B (free credit), Temporal Cloud (free trial), ClickHouse (free credits) and hand the keys over.

Everything above with a $0 is enough to reach a working P0 and the first Low-effort run on E2B; you spend your own money only at P2 (Apple $99) and P3 (Render/Supabase Pro $50/mo combined).

---

**[MOCK]** pack sizes, thresholds, earn percentages and per-run estimates in the UI are placeholders; everything else is a proposal derived from the prototype's real controls and your stated constraints, marked where it depends on your decision, on measurement, or on counsel.

## Changes

**Per file:**
- [backend-design.13fa7bd3.md](backend-design.13fa7bd3.md) - revised setup section (section 16 rewritten as click-by-click procurement with plans, prices and exact steps); otherwise supersedes [backend-design.40877ff5.md](backend-design.40877ff5.md): per-level request profiles (`output_config.effort` + `max_tokens` + `task_budget`, no `budget_tokens`), current model/pricing/cache economics, cache-loss table, cache hit-rate metric, cluster of storage tables, flows A-F, build order with gates, and the setup list (tooling, keys, Cloudflare, missing access).
- No source files touched.
