Review the PR on the current branch as a senior engineer with full context from the Jira spec and architecture docs.

Arguments: $ARGUMENTS
(Format: JIRA-KEY [confluence-page-id-or-url ...])

## Phase 1 — Context Gathering

### Git / PR
1. Run `git branch --show-current` to get the current branch name
2. Use the GitHub MCP tool to find the open PR for this branch in the current repo
3. Fetch the full PR diff — this is the primary artifact under review

### Jira
Fetch the Jira issue (first argument). Extract:
- Summary, description, acceptance criteria, definition of done
- Labels, priority, linked issues
- Any referenced services, components, or external systems

### Confluence
For each Confluence argument (all arguments after the Jira key):
- Fetch the page
- If empty or no useful content → fetch its child pages and read those instead
- Extract: architecture decisions, data models, API contracts, design patterns mandated by the team, non-functional requirements

### Codebase (via Mempalace)
Search mempalace with targeted queries based on what you found above:
- Types, interfaces, and services touched by the diff
- Existing patterns in layers affected by the PR (e.g. "repository pattern", "middleware", "event handler")
- How similar features were previously implemented

### External Repos / Frameworks
If the Jira issue, Confluence pages, or PR description references an external repo, SDK, or framework:
- Fetch the relevant part of that repo (README, key interfaces, usage examples) using the GitHub MCP tool
- Do NOT skip this step — missing external context leads to incorrect review conclusions

## Phase 2 — Review

Act as a senior engineer who cares deeply about correctness, maintainability, and architectural integrity.
Anchor every finding to a specific file and line from the diff.

Evaluate each dimension below. For each finding: state the problem, quote the relevant code snippet, explain why it is an issue, and give a concrete suggestion or corrected example.

### 2.1 Requirement Fulfillment
- Does the implementation address every acceptance criterion in the Jira issue?
- Are there any acceptance criteria that are missing, partially implemented, or misunderstood?
- Does the PR description accurately reflect what was built?

### 2.2 Architecture Alignment
- Does the change follow the layered structure already present in this codebase (as found via mempalace)?
- If architecture Confluence pages were provided, does the implementation adhere to those decisions?
- Does the PR introduce new abstractions or layers not present elsewhere — and if so, are they justified?
- Are cross-cutting concerns (auth, logging, tracing, error wrapping) handled consistently with the rest of the codebase?

### 2.3 SOLID Principles
Evaluate each principle only where it is relevant to the changed code:
- **SRP**: Does each struct / class / function have one clear reason to change?
- **OCP**: Are extension points used rather than modifying existing logic to add behaviour?
- **LSP**: If interfaces are implemented, do the implementations honour all contracts?
- **ISP**: Are interfaces lean, or are callers forced to depend on methods they don't use?
- **DIP**: Do high-level modules depend on abstractions rather than concrete implementations?

### 2.4 Design Patterns & System Design
- Are appropriate patterns applied (Repository, Factory, Strategy, Observer, Decorator, etc.)?
- Is there a simpler or more idiomatic pattern that would achieve the same goal?
- Are there signs of anti-patterns (God object, tight coupling, leaky abstractions, primitive obsession)?
- For any distributed system concerns touched (queues, caches, retries, idempotency): are they handled correctly?

### 2.5 Code Quality & Conventions
- Naming: are names clear, consistent with the existing codebase, and free of abbreviations?
- Error handling: are errors wrapped with context, propagated correctly, and not swallowed?
- Logging: are log levels appropriate? Is sensitive data logged?
- Comments: is the intent of complex logic explained where the code alone is insufficient?
- Dead code, unused imports, or leftover debug statements?

### 2.6 Test Coverage & Quality
- Are the new or changed behaviours covered by tests?
- Do tests cover happy paths, error paths, and edge cases?
- Are tests meaningful (asserting behaviour, not implementation details)?
- Is there anything that looks difficult to test because of structural issues in the production code?

### 2.7 Security
- Are inputs validated at system boundaries?
- Is there any risk of injection (SQL, command, SSRF, etc.)?
- Are secrets or credentials handled safely?
- Are authorization checks present where required?

### 2.8 Performance
- Are there obvious N+1 queries, unnecessary allocations, or missing indexes?
- Are expensive operations (network calls, heavy computation) performed in hot paths?

## Phase 3 — Review Report

Produce the full review in this structure:

---

## PR Review — [PR title]

**Jira**: [JIRA-KEY] — [summary]
**Branch**: [branch name]
**Verdict**: `APPROVE` | `REQUEST CHANGES` | `NEEDS DISCUSSION`

### Summary
One paragraph describing what the PR does and the overall quality assessment.

### Critical Issues (must fix before merge)
For each issue:
> **[Category]** `path/to/file.go:NN`
> _Problem_: …
> _Suggestion_: …
> ```[lang]
> // corrected or improved code snippet
> ```

### Non-Critical Issues (should fix, but not blocking)
Same format as above.

### Suggestions (optional improvements)
Patterns, design alternatives, or refactors worth considering.

### What's Done Well
Briefly call out what is implemented correctly — good reviews acknowledge strengths.

---

Do not post the review to GitHub automatically. Present it in the conversation so the user can review and decide whether to post it.
