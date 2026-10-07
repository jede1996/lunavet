---
name: api-contract
description: Designs, generates, and enforces strict OpenAPI, Zod, and JSON schemas for robust client-server contracts.
---

# API Contract Generator & Validator

Defines immutable contracts between frontend and backend prior to business logic coding.

## Directives
1. Define request and response schemas using Zod or OpenAPI 3.1 specifications.
2. Ensure status codes adhere to REST standards (200, 201, 400, 401, 403, 404, 422, 500).
3. Validate error response structures with standardized `{ success: false, error: { message, code, details } }`.
4. Validate payload serialization, date formats (ISO 8601), and currency rounding (MXN).
