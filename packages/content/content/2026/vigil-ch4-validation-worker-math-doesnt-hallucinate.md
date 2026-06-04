---
type: blog
title: "The validation worker exists because math doesn't hallucinate"
date: March 30, 2026
url: "/blog/vigil-ch4-validation-worker-math-doesnt-hallucinate"
description: The AI returned a number. The model was confident. The number was wrong. This is the story of why we built a separate Python validation worker — and why it's a separate service.
tags: ["vigil-devlog", "ai-validation", "python", "fastapi", "deterministic", "clinical-ai", "build-in-public"]
category: Engineering
---

The AI returned a number. The model was confident. The number was wrong.

The failure wasn't dramatic. The model hadn't invented a field or hallucinated a patient population from nothing. It had copied a subtotal row from a demographics table and misidentified it as the grand total. The output was schema-valid. The value was plausible. The arithmetic didn't hold.

This is the specific character of LLM errors in clinical documents: not wholesale invention, but small, confident mistakes. A percentage off by a rounding decision. A denominator applied to the wrong numerator. A column total that the model read correctly but sourced from the wrong row.

These are the errors that pass a human eye at 11pm on page 47. The AI was supposed to fix that problem — not reproduce it at machine speed.

---

## The First Instinct: Trust the Schema

The schema constraint from Chapter 3 felt like the solution. Force the model to output structured JSON. If the structure is right, the data is right.

The schema tells the model what fields to extract — treatment arm counts, adverse event totals, safety population denominators. The model outputs a JSON object with values in the right places. The schema validates that the output is parseable and complete.

What the schema doesn't validate: whether the numbers are internally consistent.

A perfectly schema-conformant JSON object can contain adverse events per treatment arm that don't sum to the adverse events total. A percentage that doesn't match the numerator divided by the denominator. A safety population that appears in two places in the same document — both values extracted, both present in the output, both different.

Schema validation is structural. It confirms the shape of the output. It says nothing about whether the numbers make sense.

---

## The Friction: Confidence Has No Correlation With Correctness

The specific failure that made this concrete: a demographics table. Four treatment arms, a placebo column, a total. The model extracted every cell correctly — verified manually against the source document. The column totals were also extracted. They also matched the source.

The column subtotals did not add up to the total. The model had read the correct grand total from the document but had misread which row it belonged to — a subtotals row with similar formatting to the grand total row. The output was confident. The number was wrong.

This is the problem with model confidence as an acceptance criterion. Confidence isn't calibrated to correctness for arithmetic. The model has no reliable way to distinguish "I'm certain this value is right" from "I'm certain this is the number I read" — and when a complex table has four rows that look like totals, certainty about which one was read doesn't help if it was the wrong one.

The check that catches this is a `for` loop. Sum the column values. Compare to the extracted total. Flag the discrepancy. That's not a language model problem. It's arithmetic.

---

## The Insight: Different Tools for Different Jobs

The cleanest way to say it: language models are good at reading documents. Python is good at checking math. These are not the same job. The tools are not interchangeable.

A language model brings probabilistic inference to a structured extraction problem. Given a table with conditional formatting, footnote references, and merged cells, it can identify which row is the safety population, which column is the treatment arm, and which values are percentages versus counts. That is genuinely hard. It requires understanding document structure, clinical terminology, and pharma reporting conventions. A regex can't do it. A rules engine would require per-table-type maintenance indefinitely.

Python brings determinism to an arithmetic verification problem. Given extracted values, it can check that column sums are correct, that row totals match sub-group sums, that percentages match their components within a specified tolerance. This requires no inference. It requires a tolerance check and a loop.

The separation makes the failure modes independent. When a validation check fails, you know whether it's an extraction error (the model read the wrong value) or a validation bug (the Python logic is wrong). Merge the two concerns and you lose that clarity.

---

## What the Worker Actually Checks

The Python validation worker is a separate FastAPI microservice. It receives the AI gateway's JSON output from the Document Intelligence Service and returns the same object annotated with validation results.

**Column sum checks.** For any set of values that should sum to a total — treatment arm counts, adverse event sub-categories — sum them and compare to the extracted total. Difference beyond the tolerance threshold: flag the total field.

**Percentage consistency checks.** If the JSON contains a numerator, a denominator, and a computed percentage, verify: `abs((numerator / denominator * 100) - percentage) <= tolerance`. Tolerance is configurable per document type — standard clinical reporting uses 0.1% for two-decimal-place values.

**Cross-field totals.** Some TFL types report subtotals and grand totals in the same table. The subtotals should sum to the grand total. If they don't, one or more values were extracted incorrectly.

**Within-document population consistency.** If the safety population N appears in multiple fields of the same extracted JSON — in the summary row and in each sub-category — they should agree. Disagreement means the model read the same value inconsistently across different parts of the table.

None of these checks requires a language model. All of them require precision the language model cannot provide reliably.

---

## The Output: Annotated JSON

The worker returns the input JSON with field-level annotations. A field that passed validation gets `validation: { status: "pass" }`. A field that failed gets `validation: { status: "fail", expected: <computed_value>, delta: <difference>, rule: "column_sum" }`.

The orchestrator writes the annotated object to `document_db`. The reviewer interface reads the annotations and renders them inline: clean fields are shown without markup; flagged fields are highlighted with the discrepancy visible.

The reviewer sees not just what the AI extracted, but where the arithmetic doesn't hold — before they accept or reject a single finding.

---

## Why It's a Separate Service

The validation logic could live as a function inside the Document Intelligence Service. Simpler to deploy. One fewer service to operate.

The reason it doesn't: the failure mode of a validation bug should be visible and isolated.

If validation logic lives inline in the orchestrator, a bug in the validation code produces results that look like AI extraction errors. The annotated output is wrong, but the trace leads into a shared codebase that mixes extraction logic with validation logic. Debugging requires disentangling both.

As a separate service, the validation worker has one responsibility and a defined interface: receive a JSON object, return an annotated JSON object. The input and output are versioned. It can be tested in complete isolation with known inputs and expected outputs — no LLM calls, no blob storage, no event subscriptions. A failing test tells you exactly where the validation logic broke.

The separation also makes the service independently deployable. If tolerance thresholds need adjusting or a new TFL type requires new checks, those changes ship on their own without touching the AI pipeline or the orchestrator. The other services don't know it changed.

Trade-off: one more service to operate, one more deployment to manage, one more network hop in the pipeline. In exchange: isolation, testability, and a failure mode that surfaces as its own signal rather than disappearing into another service's noise.

---

## What "Deterministic" Buys You

In a regulated workflow, the validation worker matters for a reason that goes beyond correctness.

21 CFR Part 11 requires that electronic records are trustworthy and accurate. An AI extraction is not, on its own, a trustworthy record — it's a probabilistic output. The audit trail entry for a finding that passed the validation worker records two things: the model extracted the value, and deterministic code verified the arithmetic. That second step is what makes the finding auditable.

"The AI said so" is not an audit entry. "The AI extracted N=238, and the validation worker confirmed that 238 is consistent with the sub-group totals across three treatment arms and a placebo" is a different kind of claim. One is probabilistic. One is verifiable.

The platform's value proposition depends on reviewers being able to trust what the AI surfaces. The validation worker is where that trust is built — not in the model.

---

→ Next: Chapter 5 — Permissions are a graph. We stored them like a list.
