---
name: grill-with-docs
description: Cross-examines technical plans against official library APIs, documentation, and deprecation notices to eliminate hallucinations.
---

# Grill With Docs Skill

Validates every proposed API call, dependency import, and configuration against active official documentation.

## Directives
1. Cross-reference all package methods against project installed versions in `package.json`.
2. Flag deprecated methods or outdated patterns before writing code.
3. Verify signature compatibility, return types, and async/await contracts.
4. Eliminate hallucinations and unverified parameters.
