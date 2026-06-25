# OnLah .NET Backend Skill

You are building the OnLah C# .NET backend. Apply every rule below without exception. If a rule conflicts with a user request, flag the conflict before proceeding.

---

## Stack & Runtime

- **.NET 10** — do not downgrade target framework
- **C# Minimal API** (no MVC controllers)
- **PostgreSQL** via `Npgsql` / `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Entity Framework Core 10** for data access
- No ORM other than EF Core — no Dapper, no raw ADO unless EF cannot express it

---

## Project Layout

```
apps/backend/
  src/
    OnLah.Api/           → Entry point, DI wiring, middleware, route registration
    OnLah.Application/   → Use cases, service interfaces, DTOs
    OnLah.Domain/        → Entities, value objects, domain events, repository interfaces
    OnLah.Infrastructure/→ EF Core DbContext, repositories, LTA HTTP client, external integrations
  tests/
    OnLah.UnitTests/     → Pure domain and application layer tests (no I/O)
    OnLah.IntegrationTests/ → EF Core + real DB tests, HTTP handler tests via WebApplicationFactory
```

Never put business logic in `OnLah.Api`. Route handlers delegate immediately to an application service.

---

## Architecture Rules

- **Clean Architecture layers** — dependencies point inward only: Api → Application → Domain; Infrastructure → Domain.
- **Dependency inversion** — every external concern (DB, HTTP, clock) is hidden behind an interface defined in `Domain` or `Application`.
- **No static state** — no `static` fields or singleton service locator patterns.
- **Result pattern over exceptions for expected failures** — use a `Result<T>` / `Error` type for domain-level failures; reserve exceptions for truly unexpected conditions.
- **No anemic domain model** — entities own their invariants; services orchestrate, they do not replicate entity logic.
- **DTOs do not leak into the domain** — map at the application layer boundary.

---

## TDD Workflow

Follow this cycle for every new feature or bug fix — no exceptions:

1. **Red** — write a failing test that describes the desired behaviour.
2. **Green** — write the minimum production code to make it pass.
3. **Refactor** — clean up without breaking tests.

### Test Rules

- Tests live in `tests/` mirroring the `src/` structure.
- Unit tests have **zero** I/O — no file system, no network, no real database.
- Fake dependencies with hand-rolled fakes or `NSubstitute`; do not use `Moq`.
- Integration tests use `WebApplicationFactory<Program>` and a real PostgreSQL instance (via Testcontainers).
- Every public method on a service or use case must have at least one happy-path and one failure-path test before the PR is merged.
- Test method naming: `MethodName_StateUnderTest_ExpectedBehaviour` (e.g., `GetArrivals_InvalidStopCode_ReturnsValidationError`).
- Arrange / Act / Assert sections separated by a blank line — no inline comments labelling them.

---

## Dependency Discipline

Before adding **any** NuGet package or changing a package version:

1. Check if the standard library or an already-present package covers the need.
2. Evaluate: license, maintenance status, CVE history, binary size impact.
3. Prefer packages that ship with .NET 10 or are published by Microsoft / the EF team.
4. Record the decision rationale in a comment on the `<PackageReference>` in the `.csproj` file if the choice is non-obvious.

Never add a package just because it is popular. Minimise the dependency surface.

---

## Security Rules (non-negotiable)

### Secrets & Configuration
- **Never** hardcode secrets, connection strings, API keys, or tokens in source code.
- Load all secrets from environment variables or `dotnet user-secrets` (dev) / a secrets manager (prod).
- The LTA `AccountKey` must only exist in environment config — never in any committed file, log line, or response body.

### Input Validation
- Validate all inputs at the API boundary using `FluentValidation` or built-in minimal API validation before they reach the application layer.
- Bus stop codes are always `string` — reject non-numeric strings and strings outside the valid length range before calling LTA.
- Reject requests that exceed defined size / rate limits at the middleware level.

### SQL & Data Access
- Use EF Core parameterised queries exclusively — never string-concatenate user input into a query.
- Raw SQL (`FromSqlRaw`, `ExecuteSqlRaw`) is banned unless absolutely unavoidable; if used, always use `FromSqlInterpolated` or explicit `SqlParameter` objects.

### HTTP & External APIs
- All outbound HTTP clients are registered via `IHttpClientFactory`.
- Set explicit `Timeout` on every `HttpClient`.
- Never log full response bodies from external APIs — they may contain PII or keys.
- Validate TLS certificates — do not disable SSL validation in any environment.

### Error Responses
- Never expose stack traces, internal exception messages, or EF query details in API responses.
- Use a global exception handler middleware that maps exceptions to RFC 9457 `ProblemDetails` responses.
- Log the full exception server-side; return only a correlation ID to the caller.

### Headers & CORS
- Set security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- CORS policy must explicitly list allowed origins — never use wildcard `*` in production config.

---

## Code Style

- **C# 13 features** are fine; use them when they improve clarity, not just novelty.
- `record` types for DTOs and value objects; `class` for entities with identity.
- `required` keyword on mandatory DTO properties instead of constructor overloads.
- `async`/`await` all the way down — no `.Result` or `.Wait()` calls.
- `CancellationToken` propagated to every async method signature and passed to EF / HTTP calls.
- `var` for local variables when the type is obvious from the right-hand side; explicit type when not.
- No magic strings — use `const` or `static readonly` or strongly-typed enums.
- No `#region` blocks.
- XML doc comments on public interfaces and domain types only — not on every method.
- Max method length: 20 lines. If it grows longer, extract a private method or a collaborator.
- Max file length: 200 lines. If it grows longer, split the type.

---

## Logging

- Use `ILogger<T>` injected via DI — never `Console.WriteLine`.
- Use structured logging with named parameters: `_logger.LogInformation("Fetching arrivals for stop {StopCode}", stopCode)`.
- Log levels:
  - `Debug` — internal flow details (dev only)
  - `Information` — significant business events (request received, external call made)
  - `Warning` — recoverable failures (LTA timeout, retry triggered)
  - `Error` — unhandled exceptions, data integrity issues
- Never log user-supplied input at `Information` or higher without sanitising it first.

---

## API Design

- Route prefix: `/api/v1/`
- Return `ProblemDetails` (RFC 9457) for all error responses.
- Use HTTP status codes correctly: `200`, `201`, `204`, `400`, `404`, `422`, `500` — no `200` with an error body.
- Endpoints are thin: validate → call application service → map result → return.
- All endpoints accept and return `application/json`.
- Do not expose internal entity IDs in public routes where a stable public key can be used instead.

---

## LTA Integration Rules

- All LTA calls originate in `OnLah.Infrastructure` — never in `Application` or `Api`.
- Always use the **v3** Bus Arrival endpoint.
- The `AccountKey` is injected via `IOptions<LtaOptions>` — never passed as a raw string through the call stack.
- Wrap LTA calls in a typed `ILtaBusClient` interface so tests can substitute a fake.
- Handle LTA error responses (non-200, malformed JSON) explicitly — do not let them bubble as unhandled exceptions.

---

## What NOT to Do

- No `[ApiController]` or MVC controllers — Minimal API only.
- No `static` helper classes with business logic.
- No `.ConfigureAwait(false)` in application/domain layers — only in infrastructure where needed.
- No `Thread.Sleep` or `Task.Delay` in production code paths.
- No hardcoded environment checks (`if (env == "Production")`) in business logic.
- No commented-out code committed to the repo.
- No `TODO` or `FIXME` comments merged to `main` without a linked issue.
- No `dynamic` or `object` types in service or domain code.
