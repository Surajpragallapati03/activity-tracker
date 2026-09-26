Implement the feature described in the spec using the SDD workflow.

Arguments: $ARGUMENTS
(Format: JIRA-KEY [confluence-page-id-or-url ...])

## Phase 1 — Context Gathering

### Jira
Fetch the Jira issue (first argument). Extract:
- Summary, description, acceptance criteria
- Labels, priority, linked issues, referenced component or service names

### Confluence
For each Confluence argument (all arguments after the Jira key):
- Fetch the page
- If the page is empty or has no useful content → fetch its child pages and read those instead
- Extract: data models, service decisions, architecture patterns, API contracts, field definitions

### Codebase
Search mempalace with targeted queries based on what you found in the spec:
- Types, interfaces, and services mentioned
- Patterns relevant to the change (e.g. "repository pattern", "middleware", "event handler")

If any framework, library, or pattern referenced in the spec is unclear:
- Search mempalace for how it is used in this codebase before forming any opinion
- Do NOT guess — get context first

## Phase 2 — Layered Plan

Build a plan in the following layers, each tied to a specific requirement from the spec:

| Layer | Scope |
|---|---|
| 1. Models / Types | new or modified types, structs, interfaces |
| 2. Repository / Data | data access changes, queries, migrations |
| 3. Service / Domain | business logic changes |
| 4. API / Handler | endpoint or transport changes |
| 5. Tests | what to test and how, targeting ≥ 80% coverage |
| 6. PR | title and description referencing the spec |

For each layer state:
- Files to create or modify
- Types or functions to add or change
- Rationale tied back to the spec requirement

Present the complete layered plan to the user.

## Phase 3 — Approval Loop

After presenting the plan:
1. Ask: "Approve this plan, suggest changes, or ask questions?"
2. If changes requested → revise the plan and re-present
3. Repeat until the user gives explicit approval
4. Do NOT write any code until approved

## Phase 4 — Implementation

Implement each layer in order following the approved plan:
- Read a file only immediately before editing it
- Match existing naming, error handling, and logging conventions exactly
- Do not add scope beyond the spec

## Phase 5 — Quality and PR

1. Run `sdd mine` to update the knowledge graph
2. Run `sdd quality` to execute all quality gates
3. Create a PR with a clear description referencing the Jira issue key

Do not proceed past the plan step without explicit approval.
Do not open any file for reading unless you are about to edit that specific file.
