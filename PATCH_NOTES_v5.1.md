# v5.1 — Faculty Staff Category Dependency Fix

The ADSE now seeds missing Faculty Staff Categories before importing Faculty.

## Behaviour

1. Reads unique `staffCategory` values from `runtime/imports/Faculty.csv`.
2. Opens **Faculty Management → Staff Categories**.
3. Detects categories that already exist.
4. Creates only missing categories.
5. Verifies every created category.
6. Proceeds to Faculty import only after the dependency stage succeeds.
7. Stops with a precise error if the Faculty validation wizard still reports missing categories.

For the reported dataset, the expected categories are:

- Admin
- Commerce
- Humanities
- IT
- Science
