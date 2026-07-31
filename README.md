# GyanSetu ADSE

GyanSetu's integrated **Data Preparation Engine (DPE)** and **Automated Data Seeding Engine (ADSE)**, organized for collaborative Playwright development using the Page Object Model.

## Accepted baseline

- Drivers are excluded because the portal module is unstable.
- Staff Categories are not generated, validated, seeded or required.
- Academic Session remains untouched.
- Current workflow: Classes and Sections → Subject Assignment verification → Vehicles → Transport Routes → Fee Types → Faculty → Students.
- The stable v5.2 implementation remains in `src/` and is not rewritten by the repository restructuring.

## Setup

```bash
cp .env.example .env
npm install
npm run install:browsers
```

Place the raw workbook in:

```text
input/raw/
```

## Commands

```bash
npm run prepare       # DPE only
npm run validate      # DPE + staging, no portal write
npm run adse          # Complete DPE + staging + portal import
npm test              # Playwright repository tests
npm run test:headed   # Playwright tests with browser UI
npm run test:workflow # Verify accepted workflow configuration
```

Portal writes require:

```env
CONFIRM_WRITE=true
```

## Architecture

```text
.github/workflows/  GitHub Actions CI
pages/              Page Object Model
pages/common/       Shared page navigation
src/                Stable DPE and ADSE runtime
config/             Workflow, aliases and schemas
templates/          GyanSetu import templates
tests/              Playwright test suites
utility/            Shared helpers
input/raw/           Local raw workbooks (Git-ignored)
runtime/imports/     Staged import files
output/              Reports and generated artifacts
```

See `docs/REPOSITORY_STRUCTURE.md` and `README_BASELINE_v5.2.md` for detailed baseline behavior.

## Git workflow

- `main`: accepted stable code
- `develop`: integration branch
- `feature/<module>`: isolated module work

Never commit `.env`, credentials, raw institutional data, generated reports or portal screenshots containing personal data.
