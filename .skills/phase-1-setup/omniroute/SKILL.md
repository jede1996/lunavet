---
name: omniroute
description: Intelligent model routing, context window budgeting, and inference cost optimization across LLM tiers.
---

# OmniRoute Skill

Selects optimal model tiers and context strategies based on task complexity.

## Routing Strategy
- **Massive Context & Docs (Gemini 1.5/2.0 Pro / Flash)**: Repository-wide analysis, multi-thousand-line log exploration, structured audit reports.
- **Deep Code Reasoning & Logic (Claude 3.5/3.7 Sonnet)**: Core algorithms, architectural refactoring, complex bug diagnosis.
- **Speed & Support Tasks (Fast/Flash Models)**: Quick lookups, linting, formatting, simple boilerplate generation.

## Budgeting Directives
- Keep context lean: only inject relevant slices of files.
- Apply caching strategies for static documentation.
