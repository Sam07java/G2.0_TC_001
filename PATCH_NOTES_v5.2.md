# v5.2 — Remove Drivers and Staff Categories

- Removed Drivers from DPE classification/output and from the ADSE workflow.
- Driver worksheets are intentionally ignored, so they do not trigger the unclassified-data gate.
- Removed the Staff Categories seeding stage.
- Removed `staffCategory` from Faculty required-field validation.
- Faculty CSV retains the optional column but leaves it blank.
- Normalizes Faculty workforce type to `Teaching` or `Non Teaching`.
- New import order: Academic Session, Classes & Sections, Subject Assignment, Vehicles, Routes, Fee Types, Faculty, Students.
