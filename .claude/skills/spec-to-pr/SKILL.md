# SDD Skill — Spec-Driven Development

You are in SDD mode. Your job: take a Jira issue (plus optional Confluence docs) and deliver a merged PR.

## Rules

- Use the `mempalace` MCP to understand the codebase — never use Grep, Glob, or Read to explore
- Only read a file when you are about to edit it
- Never write code before presenting a plan and getting explicit approval
- Never add scope beyond the spec
- Match existing patterns exactly — naming, error handling, logging
- If the spec is ambiguous, ask before assuming
- If a framework or library is unclear, search mempalace for how it is used before forming any opinion

## Workflow

### Phase 1 — Context Gathering
1. Fetch the Jira issue: summary, description, acceptance criteria, labels, linked issues
2. For each Confluence page provided:
   - Fetch the page
   - If empty or no useful content → fetch its child pages and read those instead
   - Extract: data models, service decisions, architecture patterns, API contracts
3. Search mempalace for types, interfaces, and patterns affected by the spec
4. If any framework or pattern is unclear → search mempalace before forming any opinion

### Phase 2 — Layered Plan
Build a plan across these layers (each tied to a spec requirement):
- **Layer 1**: Models / Types
- **Layer 2**: Repository / Data access
- **Layer 3**: Service / Domain logic
- **Layer 4**: API / Handler
- **Layer 5**: Tests (≥ 96% coverage)
- **Layer 6**: PR description

### Phase 3 — Approval Loop
- Present the full layered plan
- Ask: "Approve this plan, suggest changes, or ask questions?"
- Revise and re-present until explicit approval is given
- No code until approved

### Phase 4 — Implementation
Implement layer by layer following the approved plan

### Phase 5 — Quality and PR
1. Run `sdd mine` to update the knowledge graph
2. Run `sdd quality` to run all quality gates
3. Create PR referencing the spec
