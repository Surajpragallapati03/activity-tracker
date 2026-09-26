# Claude Code Instructions

## Codebase Knowledge — Use Mempalace First

The `mempalace` MCP server is connected and contains a pre-indexed semantic knowledge graph of this codebase.

**Hard rules:**
- Call the `mempalace` MCP search tool for any question about the codebase — types, flows, patterns, interfaces, which file handles what
- Do NOT use `Explore`, `Grep`, `Glob`, `Read`, or `Bash` to explore the codebase
- Only `Read` a file when you are about to edit that specific file

**When to use each tool:**

| Need | Tool |
|---|---|
| Understand a flow or concept | `mempalace` MCP search |
| Find types, interfaces, packages | `mempalace` MCP search |
| Discover conventions or patterns | `mempalace` MCP search |
| Understand a framework or library | `mempalace` MCP search |
| Edit a specific file | `Read` → `Edit` |

## Language Conventions

- Match existing patterns exactly — naming, error handling, logging
- Do not introduce new abstractions not already present in the codebase
- Get user approval on the plan before writing any code
