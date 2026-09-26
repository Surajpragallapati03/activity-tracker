Run all quality gates for the current project and report results.

First detect the project language by checking for these files in order:
- `go.mod` → Go
- `package.json` → Node / JavaScript / TypeScript
- `pyproject.toml` or `requirements.txt` → Python
- `Cargo.toml` → Rust
- `pom.xml` → Java (Maven)
- `build.gradle` or `build.gradle.kts` → Java (Gradle)

Then run the appropriate gates in order:

**Go:**
1. `go test ./...` — all tests must pass
2. `go test -race ./...` — no race conditions
3. `go vet ./...` — no static analysis issues
4. `golangci-lint run` — no lint errors
5. `gofmt -l .` — no unformatted files (fix with `gofmt -w .`)
6. `go build ./...` — must compile cleanly

**Node / JavaScript / TypeScript:**
1. `npm test` — all tests must pass
2. `npm run lint` — no lint errors
3. `npm run build` — must compile/bundle cleanly

**Python:**
1. `pytest` — all tests must pass
2. `ruff check .` — no lint errors
3. `ruff format --check .` — no formatting issues (fix with `ruff format .`)

**Rust:**
1. `cargo test` — all tests must pass
2. `cargo clippy -- -D warnings` — no lint warnings
3. `cargo fmt --check` — no formatting issues (fix with `cargo fmt`)
4. `cargo build` — must compile cleanly

**Java (Maven):**
1. `mvn test` — all tests must pass
2. `mvn package -DskipTests` — must build cleanly

**Java (Gradle):**
1. `./gradlew test` — all tests must pass
2. `./gradlew build -x test` — must build cleanly

For each failure, explain what is wrong and provide the exact command to fix it.
Only confirm ready-for-PR when all gates pass.
