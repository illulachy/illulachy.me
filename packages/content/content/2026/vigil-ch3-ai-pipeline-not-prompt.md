---
type: blog
title: "We gave the AI a pipeline, not a prompt"
date: March 23, 2026
url: "/blog/vigil-ch3-ai-pipeline-not-prompt"
description: The naive approach is one big prompt asking the AI to review a clinical document. The right approach is a 9-step async pipeline where the AI extracts structure, Python validates math, and the two never need to agree on who's in charge.
tags: ["vigil-devlog", "ai-pipeline", "azure-openai", "fastapi", "async", "clinical-ai", "build-in-public"]
category: Engineering
---

The naive approach to AI document review is a single prompt.

"Here is a clinical study report. Review it for protocol deviations, endpoint selection bias, and statistical anomalies. Return your findings as JSON."

We tried this. It doesn't work — not because the model isn't capable, but because "review" is not a single task. It's a sequence of tasks with different input requirements, different failure modes, different validation strategies, and different output consumers.

A pipeline makes the sequence explicit. Each step has one job. When a step fails, you know exactly which step failed and why. You can retry a single step without reprocessing the entire document. You can parallelize steps that don't depend on each other. You can replace a step without rewriting the whole review flow.

Nine steps. Here's what each one does.

---

## The Pipeline

```
TFL_UPLOADED → Document Intelligence → OCR → Schema Extraction → 
AI Gateway → Python Validation → Findings DB → Anchor Store → REVIEW_DONE
```

**Step 1: TFL_UPLOADED**
A user uploads a Tables, Figures, and Listings (TFL) package — the statistical output of a clinical trial. The Document Service stores the raw file, publishes a message to the broker.

**Step 2: Document Intelligence**
Azure Document Intelligence analyzes the uploaded files. It identifies: page layout, table boundaries, figure captions, section headers, reading order. Output: a structured JSON representation of the document's physical layout.

This step is deterministic. Same document, same output (barring model updates). It's the foundation that everything else builds on.

**Step 3: OCR**
Azure OCR converts the visual representation into text, preserving the table structure from step 2. Tables are critical — a 200-row table where column headers are misidentified invalidates everything downstream. We run table reconstruction as a separate pass over the OCR output, using the layout from step 2 to verify that row/column counts match the identified table boundaries.

**Step 4: Schema Extraction**
The OCR output is raw text. Step 4 turns it into structured data: which sections contain what types of content, where the primary endpoint tables are, what statistical tests were used, what the patient population breakdown looks like.

This is the first step that uses the AI model. The prompt is narrow: "Given this text and this layout, extract the following schema fields." The model isn't asked to evaluate. It's asked to find and structure.

---

## The Handoff: AI Extracts, Python Validates

Step 5 is where the extraction pipeline hands off to the validation pipeline.

The AI gateway receives the structured schema from step 4 and runs the primary extraction: identifying protocol deviations, surfacing endpoint inconsistencies, flagging unusual statistical patterns. This is where the model does its highest-value work — applying medical and statistical knowledge to structured data.

Step 6 is a Python validation worker. This is the architectural choice that matters most.

The AI model is good at pattern recognition. It's unreliable at arithmetic. A table where 47.3% of patients had an adverse event in the treatment arm and 31.2% had one in the control arm — the model can recognize that this difference might be clinically significant. It cannot reliably verify that 47.3 / (47.3 + 52.7) = 0.473, or that the Fisher's exact test p-value matches what the table reports.

The Python validation worker does the math. It gets the structured extraction from step 5, recomputes every percentage, re-derives every test statistic, and flags any discrepancy beyond a configurable tolerance (we use 0.5% for percentages, 3 decimal places for p-values). The output is a set of validation findings: mathematical discrepancies between what the document reports and what can be computed from the raw numbers.

These two finding sources — AI extraction and Python validation — are additive. The AI finds pattern problems. Python finds arithmetic problems. The union of their findings goes to step 7.

---

## Why Not Have the AI Do the Math?

We tried. The results were inconsistent.

GPT-4o with tool use can execute Python code. We tried giving the model a Python interpreter and asking it to validate the statistics itself. The results were:
- Correct ~87% of the time for simple percentage calculations
- Correct ~71% of the time for Fisher's exact test p-values
- Correct ~64% of the time for Kaplan-Meier log-rank tests

In a clinical trial context, 64% accuracy for a statistical validation tool is not a validation tool. It's a first pass. You'd still need a human to check every finding.

The Python worker is 100% accurate for arithmetic (within floating-point precision). It doesn't require a human to verify its math. The combination of AI pattern recognition + Python arithmetic validation gives us a system where the AI does what it's good at and the math is always right.

---

## Steps 7–9: Findings, Anchors, Done

**Step 7: Findings DB**
Both the AI findings (step 5) and the validation findings (step 6) are written to the findings store in `admin_db`. Each finding has: a type, a severity, a description, a page reference (from step 2's layout), an evidence quote (from step 3's OCR), a source (AI or Python validation), and a status (pending reviewer action).

**Step 8: Anchor Store**
Cross-document consistency is a key review concern. A statistical table in the CSR should match the corresponding table in the SAP. A patient population count in the CSR should match the CONSORT diagram.

The anchor store is a searchable index of extracted values from all documents in a deliverable set. After each document completes the pipeline, its key values (patient counts, efficacy endpoints, safety event rates) are indexed. When a new document completes, its anchors are compared against the existing index. Discrepancies become cross-document consistency findings.

**Step 9: REVIEW_DONE**
The Admin Service publishes a `REVIEW_DONE` event. Reviewers are notified. The TFL is now in "AI reviewed" status. The reviewer opens the findings list and begins their work.

---

## The Async Contract

Each step in the pipeline publishes a message when it completes. The next step subscribes to that message.

This means: step failures are isolated. If the Python validation worker crashes on document 47, document 46 has already been written to the findings DB. Document 48 will be processed normally. Step 6's queue builds up, but steps 1–5 and 7–9 are unaffected.

Retry logic lives in the message broker configuration, not in application code. A failed step automatically retries 3 times with exponential backoff. After 3 failures, the message goes to a dead letter queue. Operations is notified. A human decides whether to retry or investigate.

This is the compliance benefit of async pipelines: every step transition is a durable, auditable message. The audit trail for a document review is: "message received at 10:00:01, step 4 completed at 10:00:08, step 5 started at 10:00:08, step 5 failed at 10:00:15, step 5 retried at 10:00:45, step 5 completed at 10:00:52..." The full processing history is a message log.

---

## What the Model Sees

The prompt for step 5 (AI extraction) is not "review this document." It's:

```
You are analyzing a clinical trial TFL package for protocol adherence and statistical integrity.

The following structured data was extracted from the document:
{schema_json}

The Statistical Analysis Plan specifies the following primary endpoints:
{sap_endpoints}

Analyze the TFL data for:
1. Protocol deviations (patient populations that don't match SAP specifications)
2. Endpoint selection anomalies (endpoints presented but not pre-specified)
3. Statistical presentation concerns (unusual presentation patterns that may obscure results)

For each finding, provide:
- finding_type: one of [PROTOCOL_DEVIATION, ENDPOINT_ANOMALY, PRESENTATION_CONCERN]
- severity: one of [HIGH, MEDIUM, LOW]
- description: specific description of the finding
- evidence: the specific text or values from the document that support this finding
- page_reference: the page number(s) where the evidence appears
```

No context on medical background. No "be thorough." No "check everything." One specific job, with a specific output schema. The model is a structured extractor, not a general reviewer.

---

## What Came Next

The pipeline ran. The findings appeared. But we had a problem nobody predicted: the math was right, the AI findings were right, and reviewers still didn't trust the output.

Not because the output was wrong. Because they couldn't see where the numbers came from.

The validation worker was the answer. But it needed a UI.

---

→ Next: Chapter 4 — The validation worker exists because math doesn't hallucinate
