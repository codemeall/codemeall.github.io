---
title: Agents Are Unreliable Microservices
date: 2026-10-16 07:37:00 +0000
category: AI Engineering
tags:
  - AIAgents
  - DistributedSystems
  - Observability
  - OpenTelemetry
  - Evals
  - MobileEngineering
  - SoftwareArchitecture
description: "A production AI agent is a non-deterministic service with side
  effects. Treat it with the same discipline as any backend service: idempotent
  tools, budgets, sagas, tracing and evals as tests."
read_time: 8 min read
author: Nova
---
Picture a support agent with three tools: look up an order, issue a refund, send an email. A customer asks for a refund. The agent calls `issue_refund`. The payment provider is slow, the call times out after 30 seconds, and the agent framework reports a failure. The model, reasonably, tries again. The first call had actually succeeded. The customer is refunded twice, receives two emails, and the trace shows nothing more than "tool error, retried."

This scenario is hypothetical, but every part of it is ordinary, and none of it is a prompt problem. No system prompt fixes a missing idempotency key.

## The thesis

An agent in production is a service. It takes requests, calls other services, mutates state and returns results. What makes it unusual is that its control flow is chosen at runtime by a model, so the same input can produce a different sequence of calls on every run.

That makes an agent a **non-deterministic service with side effects**. We already have mature patterns for running unreliable services that touch money and data. The mistake is treating the agent as a clever text box instead of as one more unreliable node in a distributed system.

## How agents fail

The failure modes are familiar once you name them:

- **Runaway loops.** The model keeps calling a tool that returns an unhelpful result, or two agents keep handing work back and forth. Each step looks plausible. Together they never terminate.
- **Partial writes.** A five-step task fails at step four. Steps one to three already created a ticket, reserved inventory and posted a message. Nothing rolls them back.
- **Stale context.** The agent read a record ten turns ago and acts on that snapshot. Meanwhile a human or another process changed it.
- **Prompt drift.** A prompt edit, a model upgrade or a new tool description quietly changes behavior on tasks nobody re-checked.
- **Cost blowups.** Long contexts, retries and recursive sub-agents multiply token spend. Without a ceiling, one bad request can cost more than a day of normal traffic.

Each has a direct analogue, and a known remedy, in backend engineering.

## Backend patterns, applied

**Idempotent tools.** Every tool that writes should accept an idempotency key, and the orchestrator, not the model, should generate it per logical action. Stripe's API is the standard reference: a client sends an `Idempotency-Key`, and retries with the same key return the saved result instead of performing the operation twice. If a downstream API lacks one, add a dedupe table in your tool layer.

**Timeouts and cancellation.** Set a timeout on every tool call and on the run as a whole. A timeout must lead to a defined state ("unknown, check before retrying"), not an automatic retry of a write.

**Budgets.** Give each run explicit limits on steps, tokens, wall-clock time and money, and enforce them outside the model. Platforms are starting to ship this as a primitive. For example, Anthropic's release notes describe a hard spend cap on Claude Managed Agents sessions that pauses the session when reached (August 7, 2026). Enforce your own limits regardless, because you own the bill.

**Circuit breakers.** As Martin Fowler describes the pattern, a breaker wraps a call, counts failures and, past a threshold, fails fast instead of calling the struggling dependency again. Put one in front of each external tool. When it opens, the agent should receive a clear "tool unavailable" result it can plan around, rather than a stream of timeouts it will retry.

**Queues and retries.** Run agent work as jobs on a durable queue, not inside a request handler. Retries belong to the queue, with exponential backoff and a dead-letter destination for runs that keep failing. You also get backpressure for free.

**Sagas.** Multi-step tasks that span systems cannot use a single transaction. The saga pattern, first described by Garcia-Molina and Salem in 1987, models a long-lived transaction as a sequence of local steps, each paired with a compensating action. For an agent, that means each write tool declares its undo (`cancel_reservation` for `reserve_inventory`), and the orchestrator runs compensations when a run aborts. The model proposes the plan. The saga engine guarantees the cleanup.

**Fresh reads before writes.** Treat the model's context as a cache. Before any write, re-read the target and use optimistic concurrency (a version or ETag check) so a stale view fails loudly instead of overwriting newer data.

## Observability: one trace per run

You cannot debug a non-deterministic system from final outputs. You need a trace per run with a span per step: each model call, each tool call, each retry, each budget check.

The OpenTelemetry project now maintains GenAI semantic conventions in a dedicated repository. They define operation names such as `invoke_agent` and `execute_tool`, and attributes such as `gen_ai.conversation.id`, `gen_ai.tool.name`, `gen_ai.tool.call.id` and `gen_ai.usage.input_tokens`. Tool arguments and results (`gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`) are opt-in and flagged as potentially sensitive. All of these are still marked "Development," so expect changes.

Vendors are converging on them. Claude Code v2.1.300 (released October 14, 2026) added GenAI semantic-convention attributes to its trace spans, including `gen_ai.provider.name`, `gen_ai.conversation.id`, `gen_ai.tool.name` and `error.type`. On the same day, Anthropic launched OpenTelemetry export in beta on the Claude Platform, covering Messages API requests and Managed Agents sessions. Its docs default to a "metadata only" content mode, with prompts and responses included only when you opt in. That default is the right one to copy in your own instrumentation.

Three practices make traces useful:

1. **Structured tool-call logs.** Log tool name, call ID, idempotency key, latency, outcome and a hash or redacted copy of arguments. Make them queryable.
2. **Replayable runs.** Persist the inputs, model and prompt versions, and every tool result. With recorded tool responses you can re-run a failed trajectory against a new prompt without touching production.
3. **Correlation.** Propagate trace context from the client request through the orchestrator into every tool, so an agent step appears in the same trace as the database write it caused.

## Evals are the test suite

If traces are your logs, evals are your tests. Treat them the same way:

- **Golden tasks.** A versioned set of representative tasks with checkable outcomes: the right tool sequence, the right final state, no forbidden calls. Seed it from real failures captured in traces.
- **CI gates.** Run the suite on every change to prompts, tool schemas or model versions. Block the merge on regressions, just as you would for a failing unit test.
- **Cost and latency budgets as assertions.** A change that keeps accuracy but doubles median tokens or p95 latency is a regression. Fail the build on it.
- **Repeated trials.** Because outputs vary, run each task several times and track pass rates, not single results.

## The mobile angle

Mobile clients make all of this sharper.

Networks are flaky, so the client must never assume a dropped connection means a failed run. Start the run on the server, return a run ID immediately, and let the client reconnect and resume. Server-Sent Events support this directly: the HTML standard defines a `Last-Event-ID` header the client sends on reconnect so the server can replay missed events.

Operating systems limit background work. Apple's documentation says a backgrounded iOS app is moved to the suspended state shortly after it leaves the foreground unless it requests limited extra time. Android recommends WorkManager for work that must survive app exit or reboot. So the agent's lifetime cannot be tied to the app's. The phone is a viewer and an approver, not the runtime.

Stream state, not raw tokens. Send typed events (`step_started`, `tool_pending_approval`, `step_completed`, `run_failed`) with sequence numbers, and render from a reducer over that log. Gate destructive actions behind an explicit user confirmation event, and make the confirmation itself idempotent so a double tap on a bad connection approves once.

## A reference architecture

```text
 Client (web / mobile)
   |  start run -> run_id ; subscribe(run_id, last_event_id)
   v
 API + Run Queue ----------------------------+
|  |
   v                                         v
 Orchestrator (agent loop)          Event Stream (SSE)
   | - budgets: steps, tokens, time, $       ^
| - saga log + compensations |
| - emits OTel spans |
   v                                         |
 Tool Gateway -------------------------------+
   | - schema validation, authz
   | - idempotency keys, dedupe
   | - timeouts, circuit breakers
   v
 Downstream services / APIs

 State Store: runs, steps, tool results, versions (replayable)
 Eval Loop:   golden tasks + replayed traces -> CI gate -> deploy
```

The orchestrator owns control flow and budgets. The tool gateway owns safety for side effects. The state store makes every run auditable and replayable. The eval loop turns production traces into tests that guard the next change.

## Tradeoffs

This discipline has costs. A tool gateway and saga log add latency and code. Compensating actions are hard to write, and some actions (an email already sent) cannot be undone, only followed up. Strict budgets will cut off some legitimate long tasks. Full-content tracing creates a sensitive data store you now have to govern. Evals take real effort to build and maintain, and they only cover what you thought to test.

For a prototype, most of this is overhead. For an agent that writes to production or spends money, it is the minimum.

## Checklist

- Every write tool takes an orchestrator-generated idempotency key
- Timeouts on every tool call and every run, with an explicit "unknown" state
- Hard budgets for steps, tokens, time and cost, enforced outside the model
- Circuit breakers on external tools, surfaced to the model as clear errors
- Agent runs execute on a durable queue with backoff and a dead-letter path
- Multi-step writes modeled as sagas with compensating actions
- Re-read and version-check before every write
- One trace per run, using OpenTelemetry GenAI conventions, metadata-only by default
- Runs are persisted and replayable with recorded tool results
- Golden-task evals gate every prompt, tool and model change in CI, including cost and latency
- Mobile clients resume by run ID and event sequence, and approvals are idempotent

Better prompts make agents more capable. Engineering discipline makes them safe to depend on.

## Sources

- Stripe API reference, "Idempotent requests": [https://docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests) (accessed October 16, 2026)
- Martin Fowler, "Circuit Breaker," March 6, 2014: [https://martinfowler.com/bliki/CircuitBreaker.html](https://martinfowler.com/bliki/CircuitBreaker.html)
- Hector Garcia-Molina and Kenneth Salem, "Sagas," Proceedings of ACM SIGMOD 1987: [https://doi.org/10.1145/38713.38742](https://doi.org/10.1145/38713.38742)
- Chris Richardson, "Pattern: Saga," microservices.io: [https://microservices.io/patterns/data/saga.html](https://microservices.io/patterns/data/saga.html) (accessed October 16, 2026)
- OpenTelemetry GenAI semantic conventions, agent spans and attribute registry (status: Development): [https://github.com/open-telemetry/semantic-conventions-genai](https://github.com/open-telemetry/semantic-conventions-genai) (accessed October 16, 2026)
- Claude Code v2.1.300 release notes, October 14, 2026: [https://github.com/anthropics/claude-code/releases/tag/v2.1.300](https://github.com/anthropics/claude-code/releases/tag/v2.1.300)
- Claude Platform release notes (OpenTelemetry export beta, October 14, 2026; Managed Agents session budgets, August 7, 2026): [https://platform.claude.com/docs/en/release-notes/overview](https://platform.claude.com/docs/en/release-notes/overview)
- Anthropic, "Agent observability on the Claude Platform," October 14, 2026: [https://claude.com/resources/articles/agent-observability-on-the-claude-platform](https://claude.com/resources/articles/agent-observability-on-the-claude-platform)
- Claude docs, "OpenTelemetry for the Claude API" (content modes): [https://platform.claude.com/docs/en/manage-claude/opentelemetry](https://platform.claude.com/docs/en/manage-claude/opentelemetry) (accessed October 16, 2026)
- WHATWG HTML Living Standard, "Server-sent events" and the `Last-Event-ID` header: [https://html.spec.whatwg.org/multipage/server-sent-events.html](https://html.spec.whatwg.org/multipage/server-sent-events.html) (accessed October 16, 2026)
- Apple Developer, "Extending your app's background execution time": [https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time) (accessed October 16, 2026)
- Android Developers, "Task scheduling" (WorkManager), last updated February 26, 2026: [https://developer.android.com/develop/background-work/background-tasks/persistent](https://developer.android.com/develop/background-work/background-tasks/persistent)

