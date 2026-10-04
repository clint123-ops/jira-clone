---
name: investigate-ticket
description: Investigate a ticket or reported problem and propose a fix for discussion before implementation.
---

Read the ticket and any supplied context, then thoroughly investigate the relevant code.
Split the ticket into separate claims (symptoms, conditions, suspected causes, expectations) and verify each one against the code, tests, and history instead of accepting the ticket's framing.
Follow the call path from the entry point to the line where the behaviour goes wrong, including every module it delegates to (workers, queues, frontend state, external APIs). Do not stop at the first plausible cause.
Before proposing a change to shared code, list its existing callers and check how each would be affected.
For bugs, write and run regression tests that reproduce the problem and fail against the current implementation. If a claim needs production or local database data to confirm, ask for it instead of querying.
Stop before implementing the fix until we have discussed and agreed on the approach.

## Report

The report is the deliverable. A developer who has not seen the code must be able to judge from it alone whether the proposed implementation makes sense, without redoing the investigation. A short summary is not an acceptable report. Write it in the user's language and use these sections:

1. **What is wrong** — plain-language explanation: what the user sees, who is affected, under which conditions, and why it happens. Explain the mechanism in words first, then point at the code.
2. **Ticket claims** — every claim from the ticket marked as confirmed, not confirmed, contradicted, or not verifiable, each with its evidence (`file:line`, test output, commit). Add relevant findings the ticket does not mention.
3. **Reproduction** — the test file and name, the command to run it, the relevant failing output, and the conditions it depends on (data, plan, flags, timing). If the problem did not reproduce, list what was tried and what that rules out. For non-bug tickets, show the current behaviour instead.
4. **Root cause** — the call path from entry point to faulty line with `file:line` at each hop, why that line is wrong, and when it was introduced if history explains it.
5. **Fix options** — for each option:
   - the concrete changes per file and function, including migrations, API or contract changes, and frontend changes;
   - why it removes the root cause rather than the symptom;
   - the affected callers and behaviour changes elsewhere;
   - what happens to existing data already in the bad state and whether it needs a backfill or cleanup;
   - risks and edge cases;
   - the tests to add or change;
   - the relative size of the change.

   End with a recommendation and its reasoning, and list the open questions that need a decision before implementation.
