---
type: blog
title: "I asked the model to read a pharma table. It did. Mostly."
date: April 20, 2026
url: "/blog/vigil-ch7-asked-model-to-read-pharma-table"
description: GPT-4o read a 60-row demographics table in 8 seconds and got 54 rows right. The 6 it got wrong are exactly the 6 a tired human would miss at 11pm on page 47. Here's what we learned about prompt design for clinical tables.
tags: ["vigil-devlog", "prompt-engineering", "gpt-4o", "azure-openai", "rag", "extraction", "clinical-ai", "build-in-public"]
category: Engineering
---

The first extraction test was a demographics table. Four treatment arms, a placebo, a total column, sixty rows. Standard structure for a Phase III trial. The kind of table a trained reviewer reads in four minutes.

GPT-4o read it in eight seconds and returned structured JSON for fifty-four of the sixty rows.

Six rows were wrong. Not missing — wrong. Values transposed between treatment arms, a subtotal attributed to the wrong column, a footnote-referenced value substituted with the unmodified number. The model was confident about all of it.

That 90% accuracy rate sounds reasonable until you consider what the remaining 10% contains.

---

## The Problem With "Just Extract This"

The first prompt was straightforward. Pass the extracted table text from Azure Document Intelligence, ask the model to return JSON with the fields we needed, specify the field names. Simple instruction, structured output format.

The model complied. It also invented field names that weren't in the instruction, collapsed multi-level column headers into a flat structure, and silently dropped rows where the text extraction had formatting artefacts — whitespace between a number and its percentage, a merged cell that ADI had split into two adjacent cells with partial content.

The output was JSON. It was not the JSON we needed.

The failure mode wasn't the model being incapable. It was the model being underspecified. "Extract this table and return these fields" is an instruction about the output format. It says nothing about the structure of the input — how to interpret merged cells, how to handle multi-level headers, which row type corresponds to which field in the schema.

The model inferred what it could and guessed the rest. Guessing, at clinical document precision, is not good enough.

---

## What Makes Pharma Tables Hard

A standard adverse events listing in a Phase III trial has a structure that is immediately clear to a trained statistician and genuinely complex to parse programmatically.

**Multi-level column headers.** Treatment arms are subdivided: Treatment A / Low Dose / N=118, Treatment A / High Dose / N=120, Placebo / N=119. The relationship between the top-level header and the sub-columns is implied by visual spanning — a merged cell in the PDF that Azure Document Intelligence has to reconstruct from bounding boxes. Sometimes it gets this right. Sometimes a merged cell becomes two adjacent cells with identical or partial content, and the model sees ambiguity where the original document had none.

**Row type differentiation.** An adverse events table has at least three row types: category headers (System Organ Class), individual events (Preferred Term), and totals or subtotals. The visual distinction is typography — bold for headers, indented for individual events, bold again for totals. ADI extracts text; it doesn't reliably preserve typographic hierarchy. The model has to infer row type from content and position.

**Footnote references.** A superscript `a` after a value means something. Sometimes it means the value is statistically significant. Sometimes it modifies the denominator. Sometimes it means the cell was imputed. The model reads the value and may or may not incorporate the footnote's meaning — and the footnote text is typically at the bottom of the page, possibly outside the table's bounding box in the extraction.

**RTF source documents.** Pharma reporting uses RTF extensively. Azure Document Intelligence handles PDFs well; RTF is messier. Table cell boundaries are less reliable. Whitespace and formatting characters appear inline with values. The model receives noisier input for RTF-sourced tables and produces noisier output accordingly.

None of this is unsolvable. Each failure mode has a mitigation. The question is which mitigations are worth building and which are accepted as reviewer workload.

---

## The Schema Is the Input, Not Just the Output

The insight that changed the extraction quality: the schema isn't just a format constraint on the output. It's a structural description of what to look for in the input.

A master schema for an adverse events listing doesn't just define the fields to return. It encodes the document structure: this table has a system organ class level and a preferred term level. The treatment arm columns follow this naming pattern. The N values are in this header row. Total rows are identifiable by this characteristic. Percentage values are presented alongside counts.

When this schema is part of the prompt, the model isn't guessing at structure. It has a map. The extraction task becomes: find the values that fit this map, rather than infer the map from the document and then extract.

The prompt structure shifted to three components:

**System context** — the model is a clinical document analyst. It understands TFL structure, pharma reporting conventions, the relationship between tables in a deliverable set. The framing matters: a general-purpose extraction task produces general-purpose extraction quality.

**The master schema** — the full JSON template for this TFL type, with field names, expected types, structural annotations. Not a blank template to fill in — a described structure that orients the model before it sees any data.

**The document content** — the extracted text and layout from ADI, with the layout hints preserved: cell coordinates, row spans, column spans where available, footnote text appended with its reference markers.

The model processes all three together. The schema primes it with what it should find. The layout hints give it evidence for resolving ambiguity. The result is a JSON object that conforms to the schema because the model understood the schema before it read the document, not after.

---

## The Failure Modes That Remain

The schema-in-prompt design improved first-extraction accuracy substantially. It didn't eliminate errors.

**Merged cell ambiguity.** When ADI splits a merged cell into fragments, the model has to decide which fragment carries the value. It usually gets this right. When the fragments are nearly identical — two partial numbers, a split percentage — it sometimes picks the wrong one. The validation worker catches arithmetic consequences of this error; the structural misread itself requires reviewer attention.

**Large tables and context dilution.** A pharmacokinetics listing for a study with multiple dosing cohorts can have two hundred rows. GPT-4o has the context to hold this, but extraction quality degrades toward the end of large tables — the model has been processing dense numerical content for several thousand tokens and the precision of later rows is measurably lower than early rows. The mitigation: for tables above a row threshold, split the extraction into sections and merge the structured outputs.

**Confident misidentification.** The model sometimes decides a row is a total when it isn't, or assigns a value to the wrong treatment arm because two columns have similar headers. These errors are confident and schema-conformant — the output has the right structure, the values are in the wrong places. The validation worker checks arithmetic; it cannot check that a value was attributed to the right arm. That check requires a reviewer.

This is the design principle the platform is built on: AI identifies and extracts, human confirms. The platform is not a replacement for review. It's a first pass that a reviewer validates, not a result that ships without human eyes.

The 85% recommendation acceptance target — the goal from the original brief — accounts for this. Fifteen percent of AI findings will be wrong, flagged, or modified by reviewers. That's not a failure rate. That's the expected operating condition of an AI-assisted review workflow.

---

## The RAG Layer

The master schema library is where RAG enters the pipeline.

There are dozens of TFL types across the deliverable sets the platform processes. Demographics tables, adverse event listings, laboratory parameter summaries, pharmacokinetic profiles, efficacy outcomes, exposure-response analyses. Each has a different structure. Each has a different schema.

When the Document Intelligence Service processes an uploaded TFL, it first classifies the document type — a lightweight model call or a heuristic based on filename, document title, and structural signals from the ADI extraction. The classified type is used to retrieve the relevant master schema from the schema store.

This retrieval is the RAG step. Not retrieval of reference documents or prior extractions — retrieval of the structural template that grounds the extraction prompt. The schema store is a curated library maintained by clinical domain experts, updated when new TFL types are encountered or existing schemas need refinement.

The quality of the extraction is bounded by the quality of the schema. A schema that accurately describes the document structure produces accurate extraction. A schema with gaps or ambiguities produces extraction with the same gaps and ambiguities. Maintaining the schema library is ongoing work — not engineering work, but clinical expertise work. That distinction matters for who owns it and how it evolves.

---

## What the Model Is Actually Good At

After three iterations of prompt design and one rewrite of the schema format, the extraction pipeline does something genuinely useful.

It reads a demographics table with four treatment arms, sixty rows, merged column headers, and footnote references — and returns a structured JSON object with the right patient counts, the right percentages, the right treatment arm labels, in the right schema, in eight seconds.

Not always perfectly. But accurately enough, consistently enough, that a reviewer working from the AI's output is faster than a reviewer starting from scratch. The platform catches the table structure; the reviewer catches the errors the platform made.

That's the product. Not a perfect extractor. A fast first pass that makes the human's job smaller — and flags, explicitly, where the extraction was uncertain or where the validation worker found arithmetic that doesn't hold.

The model read the pharma table. Mostly right is useful. Partly wrong is visible. The reviewer decides.

---

→ Next: Chapter 8 — N=238 in one table. N=236 in another. One of them is lying.
