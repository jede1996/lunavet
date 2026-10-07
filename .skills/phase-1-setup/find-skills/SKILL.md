---
name: find-skills
description: Dynamically discovers, validates, and loads relevant skills, rules, and plugins matching the current task requirements.
---

# Find Skills

Automates the discovery and activation of project skills before any coding or planning starts.

## Workflow
1. Analyze the user prompt to identify relevant domains (backend, frontend, DB, security, testing).
2. Inspect `.skills/` and local agent rules.
3. Select the minimal high-impact set of skills needed for the phase.
4. Output the active skill set and trigger recommendations.
