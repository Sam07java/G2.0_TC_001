# Repository structure

- `pages/`: Playwright Page Object Model classes.
- `tests/`: Login, workflow, smoke and future module tests.
- `utility/`: Shared configuration, CSV, logging and retry helpers.
- `src/`: Stable DPE and ADSE implementation retained from the accepted v5.2 baseline.
- `config/`: Module schemas, aliases and workflow order.
- `templates/`: Current GyanSetu import templates. Driver import is intentionally excluded.
- `input/raw/`: Raw institutional workbooks placed locally; ignored by Git.
- `runtime/imports/`: Validated files staged for browser import.
- `output/`: Generated files, reports, logs, screenshots and videos.
