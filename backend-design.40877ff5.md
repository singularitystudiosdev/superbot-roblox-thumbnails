# Ouroboro backend: tooling, terminology, data model, flows, build order

Design reference only. No code, no deploy. Every figure from the prototype UI is mock and non-binding except the four effort stops and the "nothing to connect" positioning, both of which are real.

Legend: **[PRODUCT DECISION]** a choice only you can make. **[MEASURE]** a number that must come from telemetry before it can be written down. **[MOCK]** appears in the UI and is not binding. **[RISK]** a legal, security or feasibility flag.

---

## 0. What is actually real in the prototype

| UI element | Source | Status |
|---|---|---|
| Effort slider, 4 stops `low/medium/high/max` | [composer.854d0793.js:16](sidebars.bdeb2397/composer.854d0793.js:16) | Real. One capability control. |
| "nothing to connect" app categories | [publish.6c0fd59e.js:5](sidebars.bdeb2397/publish.6c0fd59e.js:5) | Real positioning. |
| `{{slot}}` template + questions array | [publish.6c0fd59e.js:113](sidebars.bdeb2397/publish.6c0fd59e.js:113) | Real schema shape. |
| Credit balance, pack sizes, auto-reload threshold, earn rates | Settings/parts copy | Mock. |
| Ratings + reviews on automation detail | [automation-detail.71c311e9.js:65](sidebars.bdeb2397/automation-detail.71c311e9.js:65) | Shape real, numbers mock. |

---

## 1. Architecture at a glance

```
Client (web / desktop shell)
  |  WebSocket (resumable)          Reconnect: last_event_id
  v
API Gateway  (Kong or Cloudflare; JWT from Auth0/Clerk; per-user rate limit in Redis)
  |
  +--> Realtime Fanout     (Centrifugo or Ably)      token stream, step events, live frames
  +--> Core API            (TypeScript, Fastify)     chats, runs, automations, billing reads
  +--> Run Orchestrator    (Temporal)                durable run workflow, one per run
         |
         +--> Agent Harness Worker (per-run, isolated)  plan->act->observe loop
         |      +--> Model Router  (LiteLLM / Bedrock)  effort -> reasoning budget
         |      +--> Browser Sandbox (Playwright, Firecracker/gVisor microVM)
         |      +--> Desktop Bridge (macOS Accessibility, ScreenCaptureKit, CGEvent)
         +--> Billing Worker   ledger holds + settlement (Postgres, outbox)
         +--> Analytics Worker ClickHouse events -> ranking features
```

**Named products**

| Concern | Product |
|---|---|
| Durable workflow | Temporal Cloud (or self-hosted Temporal Server) |
| Queue + rate-limit counters | Redis 7 + BullMQ for short jobs, Temporal for long runs |
| Primary DB | PostgreSQL 16 (RDS or Aurora), row-level multi-tenancy by `account_id` |
| Object storage | S3 (or GCS) with SSE-KMS; CloudFront signed URLs for playback |
| Event analytics | ClickHouse Cloud (ranking features, cost dashboards) |
| Search / discovery | OpenSearch for automation search; pgvector for memory + embeddings |
| Model access | Bedrock / Anthropic API / OpenAI behind LiteLLM gateway |
| Browser automation | Playwright + Chrome, inside Firecracker microVMs |
| Desktop control | macOS Accessibility API, ScreenCaptureKit, CGEvent |
| Realtime | Centrifugo (self-host, resumable channels) |
| Billing | Stripe Billing + Payment Intents, Stripe Tax, Stripe Invoicing |
| Payouts | Stripe Connect Express |
| Observability | OpenTelemetry to Tempo (traces), Mimir/Prometheus (metrics), Loki (logs), Sentry (errors) |
| Feature flags + kill switch | Unleash or LaunchDarkly |
| Secrets on our side | AWS KMS + Secrets Manager; short-lived signed tokens to client |

---

## 2. Agent execution and the run lifecycle

### Components
- **Run Orchestrator (`RunWorkflow` in Temporal).** Owns the run's whole life. Every model call, tool call and frame is an activity. Survives websocket drops and worker restarts by construction: the client is only a viewer.
- **Harness worker.** Deterministic loop: build prompt, call model, parse tool call, execute tool, append observation, repeat until `done`, `stop` or budget exhausted.
- **Browser sandbox.** One Chrome per run inside a microVM. Playwright drives it; `page.screencast` sends JPEG frames to the client; user input injected as CDP `Input.dispatch*`.
- **Desktop Bridge.** Local helper on the user's machine exposing `read_ax_tree`, `screenshot`, `click`, `type`, `scroll`, `key`. The agent talks to it over a mutual-TLS WebSocket. The helper enforces an allowlist of apps and windows it will act on.

### Take-over semantics
- Client sends `takeover`; orchestrator sets `run.control_owner = 'user'` and pauses the agent's next step (a Temporal signal, checked at step boundaries).
- User input goes through the same `Input.dispatch*` or Bridge channel the agent uses, so there is one audit trail.
- "Return control" resumes the agent. Every takeover is a `run_event` row.
- **[RISK]** Two input sources on one desktop can race. The Bridge serializes input with a single-writer lease held by whoever owns control.

### Surviving a dropped socket
The client reconnects to Centrifugo with `last_event_id`, gets replay from the channel's bounded history, then goes live. The run never depended on the socket in the first place.

### Failure and retry
Temporal retries activities. A sandbox that dies mid-run marks the run `failed`, with a resume-from-last-step option because agent state lives in `run_checkpoints`. **[PRODUCT DECISION]** whether resume is user-facing.

---

## 3. Model access and effort

- One model family (Claude, via Bedrock or direct API). Effort maps to **reasoning-token budget** plus **max output tokens**, not to a different model.

| Effort | reasoning budget | max output | run token cap **[MEASURE]** | run $-cap **[MEASURE]** |
|---|---|---|---|---|
| low | 0 (thinking off) | 4k | TBD | TBD |
| medium | 4k | 8k | TBD | TBD |
| high | 16k | 16k | TBD | TBD |
| max | 64k | 32k | TBD | TBD |

Budgets are the starting proposal, not measured. Fill the caps only after you have per-tier run cost in ClickHouse.

- **Model upgrades are an operator config change** (`model_router` table or Unleash flag), versioned, so every run records `model_version`.
- **A cheaper model is a separate user setting**, `account.model_tier`, shown as its own control. The effort slider never silently switches models. A fallback to another vendor on provider outage changes quality and must surface as a visible `run.model_fallback` event, not a silent substitution.

**[PRODUCT DECISION]** Which vendor(s) you hold keys for, and the fallback policy on provider outage.

---

## 4. Billing in credits

### Price book
Never hardcode credits. Each effort level has a `price_book_version` carrying:
- `input_usd_per_mtok`, `output_usd_per_mtok`, `reasoning_usd_per_mtok` (provider cost, measured),
- `credits_per_usd` (user-facing exchange rate),
- `markup_bps`,
- `min_charge_credits` (floor per run).

Cost formula per run:

```
provider_cost_usd = (in_tok*in_rate + out_tok*out_rate + reasoning_tok*reasoning_rate) / 1e6
price_credits     = ceil( provider_cost_usd * (1 + markup_bps/10000) * credits_per_usd )
price_credits     = max(price_credits, min_charge_credits)
```

Effort caps are **`cap_credits(effort)` derived from measured p99 provider cost at that effort, not a round number.** **[MEASURE]** Run 1,000 synthetic tasks per tier, record the cost distribution, set the cap at p99 plus margin.

### Double-entry ledger
- **Accounts:** `user_credit` (liability), `revenue_recognised`, `provider_cost_expense`, `publisher_payable`, `platform_revenue`, `refund_clearing`, `stripe_cash`, `publisher_reserve`.
- **Journal lines** are the only source of truth for balances. `account_balances` is a materialized view, never written directly.
- Every entry balances: sum(debits) = sum(credits) per `journal_entry_id`, enforced by a deferred constraint.
- Append-only. Corrections are reversing entries, never `UPDATE`.

### Holds and settlement
1. On run start: **hold** = `cap_credits(effort)`, posted to `pending_hold` (a reservation, not a debit). A run cannot start if `available = balance - sum(open holds) < cap`.
2. During the run: each model step accrues an estimate. If the estimate exceeds the cap, either pause and ask the user or fail. **[PRODUCT DECISION]**
3. On success: release the hold, post actual charge to `user_credit` against `provider_cost_expense` and `platform_revenue`.
4. On failure: release the hold, charge only the cost incurred up to failure (charge partial actual cost, no markup, by default). **[PRODUCT DECISION]**
5. On timeout or crash: hold auto-expires once the workflow reaches a final state; a sweeper releases orphaned holds.

Holds live in a Postgres table with `expires_at`. Settlement is idempotent by `run_id` (unique `journal_entries.idempotency_key = 'run:' || run_id`).

### Stripe packs and auto-reload
- **Packs:** Stripe Payment Intent (one-time) with metadata `credits=N`. The `payment_intent.succeeded` webhook posts the credit journal entry. Never credit from the client.
- **Auto-reload:** user sets `threshold` and `topup_amount`. A worker checks available balance after every settlement; if `available < threshold` and no auto-reload intent is open in the last N minutes, it creates a Payment Intent with `off_session: true`. Failure notifies the user and disables auto-reload after three consecutive failures. **[MOCK]** the mock threshold and pack sizes are placeholders.
- **Invoices:** Stripe Invoicing for receipts, plus a `credit_purchases` row for reconciliation. Stripe Tax handles VAT and sales tax.
- **Disputes and refunds:** a refund posts a `refund_clearing` debit and a `user_credit` credit; clawing back spent credits is a negative adjustment, never deletion. A chargeback (`charge.dispute.created`) puts a `dispute_hold` journal on the account and queues it for ops. Never auto-ban.

### Terms risk
Credits are a **prepaid access instrument** in many jurisdictions. **[RISK]** Expiry dates, non-refundable language and consumer-protection rules vary by state and country. Auto-reload can read as a recurring charge in some jurisdictions. Get counsel before shipping auto-reload in the EU and UK.

---

## 5. Automations marketplace

### Publish flow
1. User drafts title, description, thumbnail, a `template` with `{{slot}}` tokens, `questions[]` (one per slot: label, type, required, placeholder), and `apps[]` categories.
2. **Validation:** every `{{slot}}` in `template` must have exactly one question and every question must be used. Unknown tokens are rejected.
3. **Moderation gate:** automated pre-screen (classifier plus pattern checks for prompt injection and credential harvesting), then a human review queue. The automation is `pending_review` until it passes. **[PRODUCT DECISION]** SLA, and whether trusted publishers skip the queue.
4. **A published version is immutable.** `automation_versions` rows are insert-only. An edit creates a new semver version; older versions stay runnable for in-flight runs.
5. **Attribution:** every run started from an automation stores `automation_version_id`; credits and success attribute to the publisher at settlement, using the price book in force at that moment.

### Report / unpublish
- Any user can report with a category. A report creates an `automation_reports` row and moves the automation to `under_review` once count or severity crosses a threshold.
- A publisher can withdraw at any time; live runs continue, new runs are blocked.
- Ops can force-unpublish with a reason. Every transition is audited.

### Reviews
A review requires a completed successful run by that user against that version. One review per user per automation; edits are allowed and their history is kept. Reviews enter ranking at capped weight (see §7) to limit review bombing.

---

## 6. Revenue share

### Rule
A publisher earns a share of **spend** on their automation only when:
- the run **succeeded**,
- the run was **not self-run** (`run.user_id != automation.publisher_id`),
- the run was **not loss-making**: `price_credits >= cost_credits * (1 + min_margin_bps)`.

Condition three means some successful runs earn the publisher nothing. Surface that in the publisher dashboard with a "below payout threshold" status or you will get support complaints. **[PRODUCT DECISION]**

### Settlement
- A daily batch aggregates eligible run revenue per `(publisher, day)` into `publisher_earnings`.
- The publisher balance is the sub-ledger account `publisher_payable`.
- **Payouts:** Stripe Connect Express, released after `payout_delay_days` (default 30, **[PRODUCT DECISION]**) to cover the dispute window, above a minimum threshold.
- **Tax:** Stripe Connect Express issues 1099-NEC or 1099-K as required in the US and runs platform-level KYC. Your own corporate tax obligations remain yours; Stripe Tax does not cover them.
- **Dispute clawback:** chargebacks land after payouts, so hold a **reserve** (default 5%, **[PRODUCT DECISION]**) in `publisher_reserve` for `reserve_days`. Claw back from the reserve first, then carry a negative publisher balance forward.
- **Reciprocal-farming and abuse detection:**
  - Build run edges `(runner -> automation -> publisher)`; flag cycles where A and B run each other's automations above baseline.
  - Flags: reciprocity coefficient above threshold, identical resolved slots clustered on one pair, device/IP/card fingerprint reuse across a runner-publisher pair.
  - Dedupe by `hash(resolved_slots + automation_version_id)` per user per day.
  - Ladder: auto-hold earnings at 3x baseline reciprocity, ops review, reversing journal for clawback. Never auto-delete.

**[RISK]** Stripe Connect has restricted-business terms. A marketplace that pays people to have an agent operate accounts may attract review. Read the restricted-business list before launch.

---

## 7. Ranking and recommendation

### Per-run signals
| Signal | Definition | Source |
|---|---|---|
| success | run reached `succeeded` | run |
| completion | user did not cancel or abandon | run_event |
| use_time | wall clock start to done | run |
| credits_burned | settled credits | ledger |
| cost | provider cost | ClickHouse |
| second-run retention | user ran another automation within 7d | events |
| impressions | listing views before starts | impressions |

### Metrics per automation version, 30-day window
- `success_rate = successes / starts`
- `completion_rate = 1 - abandoned / starts`
- time metrics: **mean, median and p90 of successful runs**. Report median and p90 to users; mean alone hides the tail.
- `credits_per_run_median`, `cost_per_run_median`

Computed hourly in ClickHouse, snapshotted into Postgres for serving.

### Score (v1, weighted)
```
quality = 0.35*success_rate + 0.25*completion_rate + 0.20*(-log1p(p90_time_norm))
        + 0.10*review_score_norm + 0.10*(-log1p(median_cost_norm))
score   = quality * bayesian_shrink(head_stats, category_prior, m=20) * freshness_decay(age)
```
- **Bayesian shrinkage** stops an automation with 1 of 1 successes from beating one with 950 of 1000.
- **Cold start:** below `m=20` starts, rank on a curated prior (category average quality, publisher's own historical quality, editorial boost for the first 14 days), not on measured quality.
- **Exploration/exploitation:** contextual bandit (Thompson sampling or LinUCB). **[PRODUCT DECISION]** default ε = 0.1 for the first 90 days, then Thompson. Cap the exploration budget at roughly 15% of impressions per surface.
- **Guards:** eligibility needs success above 60% and no open abuse flag; below three successful runs shows the "New" label the UI already has ([automation-detail.71c311e9.js:46](sidebars.bdeb2397/automation-detail.71c311e9.js:46)).

### Evolution
- **Phase 1:** weighted score with shrinkage. Enough to launch.
- **Phase 2:** collaborative filtering (implicit ALS on `user x automation` run counts) once you have more than 10k runs and 2k users.
- **Phase 3:** learning-to-rank (LambdaMART or a small DCN) past 100k runs, with a feature store (Feast) and a ranker service.

Do not skip ahead. LTR does not beat the weighted score without volume.

---

## 8. Agent harness: reasoning, memory, caching, compaction

### Loop
`plan -> act (tool) -> observe -> reflect` per step. The model sees the system prompt, pinned context, working memory, session summary, retrieved long-term memories and the last N steps.

### Memory tiers
- **Working:** the current step window, tool results, last 10 frames.
- **Session:** a rolling summary updated on compaction, plus pinned user facts.
- **Long-term:** pgvector embeddings of session summaries, user preferences and successful automation patterns, retrieved by similarity plus recency. Scoped per user, never cross-user.

### Prompt caching (a cost requirement, not an optimisation)
Providers cache a prefix up to a breakpoint. Anthropic uses explicit `cache_control` breakpoints; cache writes cost about 1.25x and reads about 0.1x of the input price. For a long-running agent, cache hit rate is the largest single lever on cost.

Layout for maximum hit rate:
```
[ system prompt ]            static, cached
[ tool definitions ]         static per run, cached
[ pinned context ]           rarely changes, breakpoint after
[ session summary ]          changes only on compaction
[ long-term memories ]       one block, cached, refreshed at compaction only
[ recent steps ]             uncached tail
```
**Where the cache is lost:**
- Anything before the breakpoint changes, for example injecting a timestamp into the system prompt.
- Tool definitions changing per turn.
- A model version change: the cache is model-scoped.
- Compaction rewriting earlier context: unavoidable, so compact less often and accept one miss per compaction.
- Mid-run inserts into pinned context.

**Design around it:** freeze the system prompt and tool schema per `harness_version`; keep volatile content in the tail; refresh retrieval only at compaction; record `cache_read_tokens / input_tokens` per run in ClickHouse. **[MEASURE]** Target a hit rate above 70%.

### Compaction and pinned context
- Trigger at about 80% of the context window.
- Summarise the oldest K steps into the session summary, preserving the goal, decisions, open questions, user constraints and file or URL state.
- **Pinned context** is never summarised: user constraints, safety rules, current objective.
- After compaction the summary sits immediately after pinned context so the model reads it first.

### Effort and harness
Higher effort adds plan-check steps, self-critique and a larger reasoning budget. It never switches models. The loop is the same at every level.

---

## 9. Security: computer access, sessions, and what "impossible to find" can mean

**[RISK]** throughout this section.

### What is achievable

**On the user's device (trusted):**
- The desktop Bridge runs locally, holds the OS grants (Accessibility, Screen Recording) and talks to us over mTLS. It acts only within a user-started session.
- The user's logged-in browser sessions have two patterns:
  1. **Local browser, remote-controlled (recommended).** A paired extension or the Bridge attaches Playwright to the user's own Chrome profile. Cookies never leave the device. Strongest security story; needs an extension install, which is not a "connector" in the sense of the positioning, but is a real step.
  2. **Cloud browser with transferred cookies.** A compromise by definition: you must store session cookies. If you ever do it, encrypt per user with a KMS data key and treat the store as a credential vault.
- **What a server breach reaches:** with pattern 1, run control but not cookies. With pattern 2, cookies once KMS is also compromised. Design so cookies are never on the server for the primary path.

**On our servers:**
- **KMS** protects data at rest against disk theft, snapshot copy, and enforces audit. A per-user data key makes a database dump useless without KMS access. It does **not** stop an attacker with application-server code execution who can call the KMS decrypt API as your service. That is the real limit.
- **AWS Nitro Enclaves or confidential computing** narrow it: the decrypt key releases only to an attested, signed binary and the host OS cannot read enclave memory. Real, but operationally heavy and constraining. A later phase.

### What "impossible to find" cannot mean
- You cannot promise a credential is unrecoverable if your own service must use it. A service that can act as the user can, under attacker control, be made to act.
- You cannot promise zero exposure of sessions held on your side. You can promise: they are never on your side on the primary path, and anything that is is per-user KMS-encrypted, decrypted only in a narrow service, never logged, and rotatable.
- **Honest wording for the contract:** "Your browser sessions stay on your Mac and we never receive your cookies in the normal path. If you choose the cloud-browser option, we hold them encrypted per user; a breach of our KMS together with code execution could expose them, which is why the local option is the default."

### Not deliverable as stated
- Operating against **another person's** sessions or accounts violates terms of service and is illegal in many jurisdictions. Scope desktop control to the signed-in user, their own machine, their own accounts.
- Bypassing site bot protections is a liability, not a feature (§12).

### Required handling
- No secrets in logs, traces or client payloads.
- One KMS CMK per environment, per-user data keys, every decrypt audited in CloudTrail.
- The client never receives a provider API key.

---

## 10. Realtime and storage

### Channels (Centrifugo)
- `user:{id}`: notifications, balance changes, auto-reload events.
- `run:{id}`: token deltas, step events, frame pointers. Frames themselves go over WebRTC or CDN-signed MJPEG, not Centrifugo JPEGs.
- `chat:{id}`: messages and the step ledger.
- History is bounded (say 24h); older replay comes from Postgres.

### Storage matrix
| Data | Store | Notes |
|---|---|---|
| users, accounts, settings | Postgres | RBAC, `account_id` everywhere |
| chats, messages | Postgres | partition by month once large |
| runs, run_events, run_checkpoints | Postgres (runs), ClickHouse (events) | events append-only |
| screenshots and recordings | S3 | 30d lifecycle for frames, 1y for recordings, signed URLs |
| memories, embeddings | Postgres + pgvector | per-user scope, strict RLS |
| automations and versions | Postgres | insert-only versions |
| reviews, reports, impressions | Postgres + ClickHouse | impressions fire-and-forget |
| ledger | Postgres | append-only, double-entry |
| price book, model router | Postgres, versioned | audited config changes |
| traces | Tempo | one trace per run, one span per step |

Key tables (abbreviated; all carry `id uuid`, `created_at`, and `account_id` where owned):

- `accounts`, `users`, `sessions`
- `chats`, `messages`
- `runs (user_id, chat_id, automation_version_id, effort, model_version, price_book_version, status, started_at, ended_at, credits_charged, provider_cost_usd)`
- `run_events (run_id, seq, type, payload jsonb)`, partitioned by day
- `run_steps (run_id, step, input_tokens, cache_read_tokens, output_tokens, cost_usd)`
- `run_checkpoints (run_id, step, state jsonb)`
- `artifacts (run_id, kind, s3_key, bytes)`
- `journal_entries (ref, idempotency_key)`, `journal_lines (entry_id, account, debit, credit)`
- `holds (run_id, account_id, credits, expires_at, released_at)`
- `credit_purchases`, `auto_reload_settings`
- `price_book`, `price_book_versions`
- `automations (publisher_id, current_version_id, status)`, `automation_versions (automation_id, version, template, questions jsonb, apps jsonb, thumb_s3, status)`
- `automation_reports`, `reviews`, `impressions`, `automation_metrics_snapshots`
- `publisher_earnings`, `publisher_payouts`, `publisher_reserve`
- `abuse_signals (subject_type, subject_id, signal, score, evidence jsonb)`
- `audit_log`

---

## 11. End-to-end flows

### A. A run
1. `POST /runs` with `{chat_id, effort, automation_version_id?, slots?}`.
2. Auth, quota check, `cap = cap_credits(effort)`.
3. Billing holds `cap`; insufficient returns 402 with the auto-reload prompt.
4. Create the `runs` row as `queued` and start Temporal `RunWorkflow`.
5. Worker spins the sandbox and streams steps and frames; the client subscribes to `run:{id}`.
6. Each step: model call under the effort budget, tool execution, `run_steps` and event rows, publish to the channel.
7. On end: aggregate cost, release the hold, post the settlement journal, update `runs.credits_charged`.
8. If a publisher is present and eligible, write a `publisher_earnings` row (settled nightly).
9. The UI estimate and the final charge come from the same price book.

### B. A payment
1. `POST /billing/checkout` with `pack_id`.
2. Server creates a Stripe PaymentIntent with metadata `{user_id, credits}`.
3. `payment_intent.succeeded` webhook, idempotency key `pi:{id}`, journal: debit `stripe_cash`, credit `user_credit`.
4. Publish `user:{id}` balance change.
5. Auto-reload check after every settlement; off-session PaymentIntent on breach; retry with backoff, then notify.
6. Refund: Stripe refund, reversing journal, recorded for audit.
7. Chargeback: `dispute_hold`, account flagged, ops notified, publisher reserve affected.

### C. A publish
1. `POST /automations/validate` runs slot coverage and a prompt-injection scan.
2. Thumbnail uploads to S3 by presigned PUT.
3. `POST /automations` creates version 0 as `pending_review`.
4. Automated pre-screen runs.
5. Human review approves or rejects with a reason.
6. An edit creates a new version `pending_review` while the current version stays live.
7. Reports move it to `under_review`; withdrawal and force-unpublish paths run from there.

### D. An earn
1. R1 runs A's automation successfully and is charged C credits.
2. Nightly: `net = C - cost`; if `net` clears `min_margin`, the publisher earns `C * publisher_rate_bps / 10000`.
3. Abuse checks: reciprocity, duplicate slots, device reuse.
4. Post credit to `publisher_payable` against `platform_revenue`.
5. Hold in reserve for `reserve_days`.
6. Past `payout_delay_days` and reserve, pay by Stripe Connect Express.
7. A chargeback inside the window claws back from reserve, else carries forward.

---

## 12. Scale, safety and operations

- **Queues:** Temporal for long units, BullMQ for short ones (webhooks, thumbnails, notifications). Provider rate limits via a Redis token bucket.
- **Rate limits:** per IP, per user, per account, per automation version (a popular automation gets concurrent-run limits).
- **Quotas and caps enforced server-side:** `available_credits >= cap`, `runs_per_day`, `concurrent_runs_per_user`, `max_run_duration`, all checked in the API and again in the workflow.
- **Abuse detection:** provider cost anomalies, sudden success-rate drops, account-creation velocity, prompt-injection attempts, login from a new device followed by a large run. Rules plus the `abuse_signals` table.
- **Kill switch:** global, per user, per automation. Temporal signal plus an API check for every start.
- **Observability:** one trace per run; dashboards for cost per run by effort and model version, cache hit rate, p50/p90/p99 latency, success rate, hold-release anomalies, ledger balance drift; Sentry for errors.
- **Backups and PITR:** RDS automated backups with 35-day PITR, S3 versioning, ledger journal exported nightly to an append-only bucket with a cross-account copy, quarterly restore drills.

### CAPTCHA, site automation, and the human
**[RISK]** Bulk automation against sites that prohibit it breaches most terms of service, and several US courts have treated large-scale automated access as a civil violation (Ticketmaster v. Prestige, Meta v. Bright Data and similar). Solving CAPTCHAs mechanically compounds the exposure. The safe design, which is also the better UX:

- The harness detects challenge pages (`/captcha/i`, `cf-chl`, `arkose`, `recaptcha`) and **pauses the run, handing control to the human**. It never solves the challenge itself.
- If the user clears it themselves in their own signed-in session, that is their action on their account, not our automated bypass.

**When human takeover is the right answer:** CAPTCHA, MFA or OTP, legal-agreement screens, payment confirmation above a user-set threshold, destructive actions (delete, transfer funds), terms acceptance, and any step where agent confidence is below threshold. Never auto-confirm a financial transaction.

---

## 13. Contradictions and flags, stated plainly

| Item in the brief | Problem | Resolution |
|---|---|---|
| "Max access to the whole computer" and "safe from a breach" | In tension: total access means a compromised agent or extension holds total access. | The local Bridge holds the grants; the server never holds long-lived device tokens; scope sessions; state the limitation in the contract. |
| "Credentials safe if we are breached" | Not absolute for anything the service must use. | Local-first path, KMS now, enclave later, honest scoping. |
| Cheaper model "as an explicit setting" alongside the effort slider | Fine and consistent. | Two controls: effort and model tier. Never merge them. |
| "Share of what people spend" and "only non-loss-making runs" | Some successful runs pay zero. | Show margin status to publishers; a subsidy floor is a product decision. |
| Effort caps | The mock numbers are not costs. | Caps come from measured p99. |
| Headless browser and the user's logged-in sessions | A headless browser cannot use those sessions without receiving cookies. | The local browser or paired extension is the only safe path. |
| "No connectors" | True for the user, but each app still needs working automation. | Keep the positioning; budget the per-app engineering honestly. |

---

## 14. Build order

**Phase 0, 2-3 weeks: accounts, ledger, chat.**
Auth (Clerk or Auth0), Postgres schema, double-entry ledger with holds, Stripe packs and webhooks, the chat itself with streamed mock runs. A fake run so billing and UI are real early.

**Phase 1, 3-4 weeks: one agent, one browser, one effort.**
Temporal, harness, model router, Playwright sandbox, run and step schema, Centrifugo channel, live frames, stop, reconnect. `low` effort only. Price book from measured cost. One app target to prove the path.

**Phase 2, 4 weeks: effort tiers and desktop bridge.**
Reasoning budgets per tier, cache layout and hit-rate metric, compaction, desktop Bridge with accessibility and input, takeover. Caps from measured p99 per tier.

**Phase 3, 3 weeks: automations v1.**
Publish, versions, moderation queue, runs from templates, slots, reviews. Metrics only, no payouts.

**Phase 4, 4 weeks: revenue share.**
Eligibility rules, publisher ledger, Stripe Connect Express, reserve, abuse detection, clawback, delayed payouts.

**Phase 5, 4 weeks: ranking.**
ClickHouse events, metrics, weighted score with shrinkage, cold start, bandit exploration. Collaborative filtering when volume permits; LTR later.

**Phase 6, ongoing: scale and security hardening.**
Per-user KMS, enclave feasibility study, abuse detection refinement, quotas, scoped kill switches, dashboards, PITR drills.

Order rationale: billing first so nothing leaks for free; then one real agent path because it is the hardest; then the desktop bridge because it is the differentiator; then marketplace, economics, and ranking last because it needs data.

---

## 15. Glossary

- **Harness:** the loop that turns a goal into steps.
- **Hold:** a reservation of credits, not a charge.
- **Settlement:** posting actual cost against credits.
- **Double-entry:** every debit has an equal credit; balances are derived, not stored.
- **Reasoning budget:** tokens reserved for internal thinking at an effort level.
- **Prompt cache:** provider-side reuse of a prompt prefix at a lower price.
- **Cold start:** ranking without enough run data.
- **Takeover:** the user temporarily assumes control of a running agent.
- **Reserve:** a delayed slice of publisher earnings held against chargebacks.

---

**[MOCK]** pack sizes, auto-reload thresholds, earn percentages and per-run credit estimates in the UI are placeholders. Everything else here is a proposal derived from the prototype's real controls and your stated constraints, marked **[PRODUCT DECISION]**, **[MEASURE]** or **[RISK]** where it depends on you, on data, or on counsel.
