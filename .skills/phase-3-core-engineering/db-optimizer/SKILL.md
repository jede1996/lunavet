---
name: db-optimizer
description: Audits database schemas, SQL queries, indexes, migrations, and ORMs to prevent N+1 issues and guarantee high performance.
---

# Database Optimizer Skill

Optimizes relational schemas, connection pools, and query performance for PostgreSQL / SQLite / MySQL.

## Directives
1. **N+1 Prevention**: Ensure all related entities are batch-loaded or joined in a single query.
2. **Index Optimization**: Validate that foreign keys, lookup columns (e.g. `folio`, `fecha`, `mascota_id`), and unique constraints are indexed.
3. **Transaction Safety**: Wrap multi-step mutations (e.g. inventory adjustments, controlled medicine logs) in ACID transactions.
4. **Regulatory Audit**: Ensure SENASICA compliance fields (batch, expiry, lot, veterinarian license) are strictly validated and preserved.
