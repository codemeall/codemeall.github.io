---
title: "Agents Are Unreliable Microservices"
category: "AI Engineering"
tags: [AIAgents, DistributedSystems, Observability, OpenTelemetry, Evals, MobileEngineering, SoftwareArchitecture]
description: "An agent is a caller that retries and a planner that improvises at runtime. Run it like any unreliable service with side effects: idempotent tools, a gateway that owns retries, budgets, sagas, one trace per run and evals as tests."
read_time: "8 min read"
author: "Nova"
---

Picture a support agent with three tools: look up an order, issue a refund, send an email. A customer asks for a refund. The agent calls `issue_refund`. The payment provider is slow, the call times out after 30 seconds, and the framework reports a failure. The model, reasonably, tries again. The first call had actually succeeded. The customer is refunded twice, and the trace says only "tool error, retried."

Now take the model out of the story. Swap the agent for a mobile app with a retry button and you get the same double refund: a slow dependency, a client timeout, a blind retry of a write. The agent is just the caller that retried. The real defect is a refund tool that is not idempotent, and no system prompt fixes a missing idempotency key.

The failures in this post are illustrative. Each is an ordinary distributed systems bug, not a report from a specific production system.

## What an agent adds

So is an agent just a flaky client? Not quite. A flaky client retries the call it already made. An agent can choose a different call. Its control flow is picked by a model at runtime: which tool, in what order, with which arguments, and whether to retry or give up. The same input can produce a different sequence of calls on every run, including sequences you never tested.

That is the property to design around. With a normal service you can read the code and list the call paths. With an agent the path does not exist until the model writes it. So the guarantees cannot live in the model or the prompt. They live in deterministic layers around it: an orchestrator that owns the run and a tool gateway that owns every side effect. The model proposes. Code you control decides what happens.

A production agent is a **non-deterministic service with side effects**. Everything we know about unreliable services still applies, except that there is no caller code path to review.

Mobile makes this sharper, so it belongs here, not in an appendix. An agent feature in a phone app has an unreliable caller on each side of your backend: the model, which retries and improvises, and the device, which drops connections, gets suspended by the OS and lets users tap twice.

## How agents fail

- **Runaway loops.** The model keeps calling a tool that returns nothing useful, or two agents hand work back and forth forever.
- **Partial writes.** A five-step task fails at step four. Steps one to three already created a ticket, reserved inventory and posted a message.
- **Stale context.** The agent acts on a record it read ten turns ago, which someone has since changed.
- **Prompt drift.** A prompt edit, model upgrade or new tool description quietly changes behavior on tasks nobody re-checked.
- **Cost blowups.** Long contexts, retries and sub-agents multiply spend. One bad request can cost more than a day of normal traffic.
- **Lost clients.** The phone loses signal. The app assumes failure and starts a second run while the first is still executing.

Each has a backend analogue. The agent-specific part is that a model chooses the path, so loops, drift and spend have no natural bound unless you impose one.

## Who is allowed to retry

**Idempotent tools.** Every write tool accepts an idempotency key, and the orchestrator generates it, not the model. Otherwise a retrying model mints a fresh key and defeats the point. Derive it from the run and the logical action (run ID plus "refund order 4417"). Stripe's API is the standard reference: the client sends an `Idempotency-Key`, Stripe saves the result of the first request, and retries with the same key get that saved result back. Stripe also rejects a reused key with different parameters, which catches a model that "retries" with changed arguments. Without such a feature downstream, keep a dedupe table in the gateway.

**Timeouts end in "unknown," and the gateway enforces it.** Put a timeout on every tool call and on the run. A write that timed out did not fail; its outcome is unknown, and the correct next step is to check before retrying. But who stops the model from retrying anyway? Not the prompt. The model sees an error and will try again. Two mechanisms close the gap:

1. The orchestrator attaches the same idempotency key to every attempt at the same logical action, whatever the model does.
2. The gateway records the write as `unknown` and blocks further calls to that tool for that target until a status read (`get_refund_status`) resolves it. The model gets a structured "outcome unknown, reconciling" result instead of a bare error.

Replay the opening scenario with both in place: the second `issue_refund` either returns the first call's saved result or waits for reconciliation. One refund.

**Budgets.** Hard limits per run on steps, tokens, wall-clock time and money, enforced by the orchestrator, not requested in the prompt. Some platforms now offer spend caps (see the sidebar); enforce your own anyway.

**Circuit breakers.** As Martin Fowler describes the pattern, a breaker monitors failures on a call and, past a threshold, returns an error without making the call at all. Put one in front of each external tool so the agent gets a clear "tool unavailable" result to plan around instead of a stream of timeouts to retry.

**Queues.** Run agent work as jobs on a durable queue, not inside a request handler. Whole-run retries belong to the queue, with exponential backoff and a dead-letter destination: one retry policy written in code, not one improvised by the model.

**Sagas.** Multi-step tasks across systems cannot share one transaction. The saga pattern, introduced by Garcia-Molina and Salem in 1987, models a long-lived transaction as local steps, each paired with a compensating action. Each write tool declares its undo (`cancel_reservation` for `reserve_inventory`), and the orchestrator runs compensations when a run aborts. The model proposes the plan; the saga engine guarantees the cleanup.

**Fresh reads before writes.** Treat the model's context as a cache. Before any write, re-read the target and check a version or ETag, so a stale view fails loudly instead of overwriting newer data.

## The phone is the second retrying caller

The same rule holds on the client: a reconnect is not a retry.

Start the run on the server, return a run ID immediately, and let the client reconnect and resume. Server-Sent Events support this directly: the HTML standard defines a `Last-Event-ID` header the client sends on reconnect, so the server can replay what was missed.

Operating systems limit background work. Apple's documentation says an app moving to the background gets only a short window before suspension unless it asks for extra time. Android recommends WorkManager for work that must survive app exit or reboot. So the agent's lifetime cannot be tied to the app's. The phone is a viewer and an approver, not the runtime.

Stream state, not raw tokens. Send typed events (`step_started`, `tool_pending_approval`, `step_completed`, `run_failed`) with sequence numbers, and render from a reducer over that log. Gate destructive actions behind an explicit confirmation, and give the confirmation the action's idempotency key, so a double tap on a bad connection approves once.

## A reference architecture

```text
Client (web / mobile)
  |  start run -> run_id ; subscribe(run_id, last_event_id)
  v
API + Run Queue ---------------------------+
  |                                        |
  v                                        v
Orchestrator (agent loop)          Event Stream (SSE)
  | - budgets: steps, tokens, time, $      ^
  | - idempotency key per action           |
  | - saga log + compensations             |
  | - emits OTel spans                     |
  v                                        |
Tool Gateway ------------------------------+
  | - schema validation, authz
  | - dedupe by idempotency key
  | - timeouts, circuit breakers
  | - "unknown" writes blocked until reconciled
  v
Downstream services / APIs

State Store: runs, steps, tool results, versions (replayable)
Eval Loop:   golden tasks + replayed traces -> CI gate -> deploy
```

The orchestrator owns control flow, budgets and keys. The gateway owns side effects, including the decision to retry.

## Observability: one trace per run

You cannot debug a non-deterministic system from final outputs. Emit one trace per run, with a span for each model call, tool call, retry and budget check.

OpenTelemetry maintains GenAI semantic conventions for this, with operation names such as `invoke_agent` and `execute_tool` and attributes such as `gen_ai.conversation.id`, `gen_ai.tool.name`, `gen_ai.tool.call.id` and `gen_ai.usage.input_tokens`. Tool arguments and results are opt-in and flagged as potentially sensitive. They are still evolving, but vendors are adopting them, so use them instead of inventing names. Default to metadata only and turn on full content deliberately.

1. **Structured tool-call logs:** tool name, call ID, idempotency key, latency, outcome (including `unknown`) and redacted arguments.
2. **Replayable runs:** persist inputs, model and prompt versions and every tool result to re-run a failed trajectory against a new prompt offline.
3. **Correlation:** propagate trace context from the client through the orchestrator into every tool, so an agent step sits in the same trace as the write it caused.

## Evals are the test suite

If traces are your logs, evals are your tests:

- **Golden tasks** with checkable outcomes: right tool sequence, right final state, no forbidden calls. Seed them from real failures.
- **CI gates** on every change to prompts, tool schemas or models.
- **Cost and latency assertions.** Same accuracy at double the tokens is a regression.
- **Repeated trials.** The path varies, so track pass rates, not single results.

## Tradeoffs

A gateway and saga log add latency and code. Some actions (a sent email) cannot be compensated, only followed up. Budgets will cut off some legitimate long tasks. Full-content tracing creates sensitive data you must govern. Evals only cover what you thought to test. For a prototype, most of this is overhead. For an agent that writes to production or spends money, the first list below is the minimum.

## Checklist

**Must-have first** (before the agent touches production writes):

- [ ] Every write tool takes an orchestrator-generated idempotency key
- [ ] Timeouts on every tool call and every run, with an explicit "unknown" state
- [ ] The gateway blocks retries of "unknown" writes until a status read resolves them
- [ ] Hard budgets for steps, tokens, time and cost, enforced outside the model
- [ ] Re-read and version-check before every write
- [ ] One trace per run, using OpenTelemetry GenAI conventions, metadata only by default

**Add as you scale:**

- [ ] Circuit breakers on external tools, surfaced to the model as clear errors
- [ ] Durable run queue with backoff and a dead-letter path
- [ ] Multi-step writes modeled as sagas with compensating actions
- [ ] Persisted, replayable runs with recorded tool results
- [ ] Golden-task evals gating every prompt, tool and model change in CI, including cost and latency

Shipping a mobile client? Move "resume by run ID and event sequence, with idempotent approvals" into the first list.

**What a 2-engineer team should do first:**

1. Route every write through one gateway function. Nothing calls a write API directly.
2. In it, add the idempotency key, a dedupe table, a timeout and the "unknown, check first" rule.
3. Cap steps and spend per run in the agent loop.
4. Run agents on the server behind a run ID. Clients reconnect; they never restart a run.
5. Log every tool call, and run 10 to 20 golden tasks from real failures before each prompt or model change.

Better prompts make agents more capable. Engineering discipline makes them safe to depend on.

> **Sidebar: As of Oct 2026**
>
> These details will date quickly. The argument does not depend on them.
>
> - The OpenTelemetry GenAI semantic conventions live in a dedicated repository, and every attribute is still marked "Development."
> - On October 14, 2026, Anthropic launched OpenTelemetry export in beta on the Claude Platform, covering Messages API requests and Managed Agents sessions, with "metadata only" as the default content mode.
> - Claude Code v2.1.300, released the same day, added GenAI attributes such as `gen_ai.provider.name`, `gen_ai.conversation.id`, `gen_ai.tool.name` and `error.type` to its trace spans.
> - Since August 7, 2026, Claude Managed Agents sessions accept a budget: a hard spend cap that pauses the session with a `budget_reached` stop reason.

## Sources

- Stripe API reference, "Idempotent requests": <https://docs.stripe.com/api/idempotent_requests> (accessed October 17, 2026)
- Martin Fowler, "Circuit Breaker," March 6, 2014: <https://martinfowler.com/bliki/CircuitBreaker.html>
- Hector Garcia-Molina and Kenneth Salem, "Sagas," Proceedings of ACM SIGMOD 1987: <https://doi.org/10.1145/38713.38742>
- Chris Richardson, "Pattern: Saga," microservices.io: <https://microservices.io/patterns/data/saga.html> (accessed October 16, 2026)
- OpenTelemetry GenAI semantic conventions, agent spans and attribute registry (status: Development): <https://github.com/open-telemetry/semantic-conventions-genai> (accessed October 17, 2026)
- Claude Code v2.1.300 release notes, October 14, 2026: <https://github.com/anthropics/claude-code/releases/tag/v2.1.300>
- Claude Platform release notes (OpenTelemetry export beta, October 14, 2026; Managed Agents session budgets, August 7, 2026): <https://platform.claude.com/docs/en/release-notes/overview>
- Anthropic, "Agent observability on the Claude Platform," October 14, 2026: <https://claude.com/resources/articles/agent-observability-on-the-claude-platform>
- Claude docs, "OpenTelemetry for the Claude API" (content modes): <https://platform.claude.com/docs/en/manage-claude/opentelemetry> (accessed October 17, 2026)
- WHATWG HTML Living Standard, "Server-sent events" and the `Last-Event-ID` header: <https://html.spec.whatwg.org/multipage/server-sent-events.html> (accessed October 17, 2026)
- Apple Developer, "Extending your app's background execution time": <https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time> (accessed October 17, 2026)
- Android Developers, "Task scheduling" (WorkManager), last updated February 26, 2026: <https://developer.android.com/develop/background-work/background-tasks/persistent>
