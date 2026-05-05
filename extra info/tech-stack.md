# Backend Tech Stack Recommendation

## How to Read This

Every recommendation below comes with a reason. The reason matters more than the choice — if your team has strong existing expertise that pulls in a different direction, the reason is what helps you evaluate the tradeoff. Where there is a genuine alternative worth knowing about, it is noted.

The guiding criteria for every choice:

- **Type safety throughout.** The data model is complex. 54 entities, cascading configuration, polymorphic relationships. Without types enforced by the compiler and the ORM, bugs hide until production.
- **Convention over configuration, but with escape hatches.** A team should spend time building features, not debating folder structure or reinventing patterns the ecosystem already solved.
- **Enterprise-grade from day one.** Dependency injection, structured logging, proper error handling, testability — these are not things you add later. They need to be the path of least resistance from the first commit.
- **Infrastructure-agnostic.** Every choice should run on any cloud or on-premises without the code caring. No managed-service lock-in in the application layer.
- **The right amount of opinion.** Loose frameworks like plain Express or Fastify leave too many decisions open, which means the team makes them inconsistently. Overly opinionated frameworks like Laravel or Django (in their purest form) can fight you when you need to diverge. The sweet spot is a structured framework with clear patterns but no cage.

---

## The Core Stack

### Language — TypeScript

**Not JavaScript. TypeScript.**

The data model is the entire argument. You have 54 entities with complex relationships, polymorphic foreign keys, cascading configuration that overrides at four levels, and a permission system that gates everything. In plain JavaScript, a typo in a field name or a missing null check is a runtime error that reaches a student. In TypeScript, it is a compile error that reaches a developer.

Beyond correctness, TypeScript pays dividends in collaboration. When a new developer joins, they can navigate the codebase by following types. When a function's signature changes, the compiler tells every caller immediately. When you generate API documentation or client SDKs, the types are the source of truth.

TypeScript also means you share a language with the frontend. Types for API request/response shapes can live in a shared package, eliminating an entire class of frontend-backend contract bugs.

**Runtime:** Node.js. Mature, enormous ecosystem, the best async I/O story for a platform that will be making many concurrent Gitea API calls, webhook processing, and database queries. The team will almost certainly know it.

---

### Framework — NestJS

NestJS is a TypeScript-first, opinionated backend framework built on top of Node.js. It is the right choice here for reasons that go beyond feature lists.

**It makes the right things the easy things.**

In a plain Express or Fastify app, every developer makes their own decisions about how to structure a module, how to handle dependency injection, how to wire up middleware, how to validate request bodies. These decisions accumulate into inconsistency. A new team member has to learn not just the domain but every developer's personal conventions.

NestJS eliminates this. There is one way to define a controller. One way to inject a service. One way to write a guard. One way to handle exceptions. The team spends its energy on the product, not on arguing about structure.

**What it gives you out of the box:**

- **Modules**: the codebase is organized into modules (UserModule, EnrollmentModule, CurriculumModule, etc.) that map directly to the system design's domains. Each module owns its controllers, services, and repositories. This is not just organizational — it enforces dependency boundaries.
- **Dependency Injection**: services declare their dependencies; the framework provides them. This makes testing trivially easy — you inject a mock service in a test, the real one in production.
- **Guards**: NestJS guards are the natural place for authentication and permission checks. A route that requires `records.create` permission gets a `@RequirePermission('records.create')` decorator. The check is enforced at the framework level, not scattered across controller logic.
- **Interceptors**: cross-cutting concerns like request logging, response transformation, and timing sit in interceptors, not inside business logic.
- **Pipes**: request validation and transformation are handled by pipes (using the `class-validator` library). The DTO (Data Transfer Object) for creating a Record declares its required fields and validation rules; NestJS rejects invalid requests before they reach your service code.
- **Built-in WebSocket support**: when the community layer needs real-time messaging, NestJS has first-class WebSocket gateway support using the same module and dependency injection patterns.
- **OpenAPI generation**: by adding decorators to your DTOs and controllers, NestJS generates a full Swagger UI and OpenAPI spec automatically. API documentation is not a separate task — it emerges from the code.
- **Testing utilities**: NestJS provides utilities for creating a test module that mirrors the real one, making unit and integration testing straightforward and consistent across the team.

**Alternative worth knowing:** Fastify with a manual architecture. Faster raw throughput, lighter weight. Worth considering if you have strong opinions against NestJS's decorator-heavy style or if you expect extreme throughput requirements. The tradeoff is that you build all the conventions yourself.

---

### Database — PostgreSQL

There is no serious alternative for this project.

The data model is deeply relational. Enrollments reference Users, Cohorts, Programs, and Campuses. XPTransactions reference Enrollments and polymorphic source entities. CurriculumDependencies connect any two curriculum nodes. These relationships are exactly what a relational database exists to handle — integrity enforced at the database level, not just the application level.

PostgreSQL specifically, over MySQL or others, for these reasons:

- **JSONB columns**: ConfigurationSetting values, evaluation criteria, activity data snapshots, game attempt data — all of these are semi-structured and stored as JSON. PostgreSQL's JSONB is indexable and queryable in ways that text-stored JSON is not. You can query across cohorts for all settings where `key = 'quest.cooldown_minutes'` and the database can use an index.
- **Enum support**: PostgreSQL has real enum types, which map cleanly to the many enum fields in the data model.
- **Full-text search**: if you want to search module content or post history later, PostgreSQL's built-in full-text search works well for medium-scale needs without adding a separate search service.
- **Transactions with proper isolation**: complex operations like cohort close (reject all pending applications, send emails, purge data) need proper transactional guarantees. PostgreSQL's transaction model is rock solid.
- **JSON aggregation**: fetching a student's full progress snapshot (curriculum position, XP total, activity map) often requires aggregating across many rows. PostgreSQL's JSON aggregation functions make this efficient without multiple round trips.
- **The ecosystem**: every ORM, every migration tool, every observability tool has first-class PostgreSQL support.

---

### ORM & Migrations — Prisma

Prisma is a TypeScript-first ORM with a schema-first approach. The data model is defined in a `.prisma` schema file; Prisma generates a fully typed client from it.

**Why Prisma over TypeORM (the other common NestJS choice):**

TypeORM is the traditional NestJS ORM and is perfectly capable. The reason to prefer Prisma is the type safety story. TypeORM uses decorators on entity classes, and its query builder can produce types that drift from reality in subtle ways — particularly with complex joins and optional relations. Prisma's generated client is derived directly from the schema, meaning every query result is typed exactly as the database will return it.

For a data model with 54 entities and many optional/nullable relationships, this matters. A developer writing a query that joins Enrollment → User → StudentProfile gets auto-completion and type errors if they try to access a field that does not exist or could be null.

**Migrations**: Prisma's migration system generates SQL migration files that are checked into source control, reviewed in PRs, and run in order. Every schema change is tracked, documented, and reversible. This is the pattern Phase 0 established as non-negotiable.

**Seeding**: Prisma has first-class support for seed scripts, which is important for development (populating the database with a realistic test cohort) and for onboarding new developers.

**Alternative worth knowing:** Drizzle ORM. Newer, very strongly typed, SQL-like query builder that feels closer to writing SQL directly. Growing ecosystem. Worth watching, but Prisma has a more mature migration story and better documentation today.

---

### Background Jobs — BullMQ + Redis

Several parts of the platform require work to happen asynchronously, outside the request/response cycle:

- Processing a Gitea push webhook and running automated test cases
- Sending bulk verification emails to institutions
- Aggregating daily activity into StudentProgressSnapshot rows
- Sending notification emails (via a queue, not inline in the request)
- Resolving PeerBets after audits complete
- Enforcing automatic record expiry when `auto_end_at` is reached
- Purging rejected applicant data when a cohort closes

**BullMQ** is a Redis-backed job queue for Node.js. It is the mature, well-documented standard for this use case in the Node.js ecosystem. NestJS has a first-party `@nestjs/bull` module.

Jobs are defined as typed classes. A `SendVerificationEmailJob` has typed data — which application ID, which institution email, which follow-up count. Workers process jobs from the queue. Failed jobs are retried with configurable backoff. Completed and failed job history is queryable.

**Redis** is the backing store for BullMQ. It is also used for caching (session data, frequently-read configuration settings, leaderboard snapshots) and — when the time comes — for WebSocket pub/sub across multiple server instances.

Redis is a dependency worth taking on because it serves three roles: job queue, cache, and real-time pub/sub. It is also lightweight, well-understood, and trivial to operate.

---

### Authentication — Passport.js + JWT (via NestJS)

NestJS has first-party `@nestjs/passport` and `@nestjs/jwt` modules. Passport is the standard Node.js authentication middleware with strategies for every auth method you might ever need.

For this platform:
- **JWT tokens** for API authentication (stateless, works for both the web app and any future mobile client)
- **Refresh token rotation** for session management — short-lived access tokens, longer-lived refresh tokens
- **Guards** in NestJS enforce authentication and role-based permissions on every route that requires them

The permission system (the `PermissionSet` entity in the data model) maps directly to NestJS guards — a custom `PermissionsGuard` checks that the authenticated user's role includes the required permission before the request proceeds.

**Note on session storage**: because tokens are stateless, invalidation (logging out, revoking access on expulsion) requires a token blacklist. Store this in Redis — it is fast, it expires automatically with a TTL, and Redis is already a dependency.

---

### File Storage — Abstracted Behind an Interface

Students upload OnboardingDocuments. Logbook entries may include photos. Module content may reference images. These files need to go somewhere.

**The recommendation is to abstract the storage layer from day one**, even if the initial implementation is simple (local disk, or a single S3 bucket). Define a `StorageService` interface with `upload`, `download`, and `delete` methods. Implement it once. Every other part of the system calls the interface, not the implementation.

This means switching from local storage to MinIO (self-hosted S3-compatible, for full data sovereignty) or to AWS S3 (for managed convenience) requires changing one file, not hunting through the codebase.

**For initial development**: local disk or a simple S3 bucket is fine.
**For production**: MinIO is the right call if the infrastructure stays self-hosted. It is S3-compatible, meaning the same AWS SDK is used, and it can be self-hosted with full control over data residency — important given that SIWES documents are sensitive student records.

---

### Email — Nodemailer + Queue + Abstracted Provider

Email is critical: rejections, verifications, onboarding invitations, checkpoint reminders. It also has to be reliable — a bounced rejection email is a bad experience.

**Architecture:**
1. An email is triggered by a domain event (application rejected, verification passed, etc.)
2. A job is placed on the BullMQ email queue — not sent inline in the request
3. A worker processes the job: renders the `NotificationTemplate` with the relevant variables, and sends via the configured email provider
4. If sending fails, BullMQ retries with backoff

**Provider**: abstract behind an interface. The first implementation uses Nodemailer, which can connect to any SMTP server, SendGrid, Postmark, or any other provider. The abstraction means switching providers (or moving to a self-hosted SMTP server) does not touch the application logic.

---

### API Design — REST with OpenAPI

The platform has a clear client-server boundary. REST with properly versioned endpoints and a generated OpenAPI spec is the right choice.

**Why not GraphQL**: GraphQL's flexibility is valuable when clients have highly variable data needs (like a public API consumed by many different third parties). For a platform where the frontend is purpose-built and the API shapes are known in advance, GraphQL adds resolver complexity without proportional benefit. REST endpoints that return exactly what the frontend needs are simpler to reason about, easier to cache, and easier to document.

**Versioning**: all API routes are prefixed with `/api/v1/`. When breaking changes are needed, `/api/v2/` is introduced alongside. Never break an existing version.

**The OpenAPI spec** generated by NestJS becomes the contract between backend and frontend. The frontend team works from the spec, not from reading controller code. This is the "API contract before implementation" principle from Phase 0.

---

### Real-time — WebSockets (Socket.io via NestJS)

Community group chat, direct messages, and real-time notifications (quest passed, audit assigned) require push updates to the client.

NestJS supports WebSocket gateways natively, with Socket.io as the default transport. The same dependency injection and module system applies — a `ChatGateway` is a NestJS class that handles socket events.

For horizontal scaling (multiple server instances), Socket.io supports Redis pub/sub as an adapter. Since Redis is already a dependency, real-time at scale is an extension of existing infrastructure, not a new service.

**Phasing**: real-time can be introduced progressively. Phase 10 (Community & Social) launches with polling if needed and upgrades to WebSockets once the infrastructure is stable. The important thing is that the architecture supports real-time from the start — a polling endpoint and a WebSocket gateway can coexist.

---

### Logging — Winston + Structured JSON

**Structured logging from day one.** This is one of those things that is very hard to retrofit.

Winston is the standard Node.js logging library. Configure it to output structured JSON in production (not pretty-printed console output). Every log entry has: timestamp, level, service name, request ID (for tracing a request across services), user ID (where applicable), and the message.

When logs are structured JSON, they are queryable. When something breaks in production, you can filter all errors for a specific user, or all requests to a specific endpoint, or all events in a specific cohort. Without structure, logs are a wall of text that you grep through and hope for the best.

NestJS's built-in logger can be replaced with Winston via a custom logger adapter.

---

### Testing — Jest

Jest is the standard TypeScript testing framework. NestJS generates Jest configurations for unit and integration tests automatically.

The testing strategy:
- **Unit tests**: pure business logic — XP calculation, permission resolution, record effect application. No database, no HTTP.
- **Integration tests**: NestJS testing utilities spin up a real application module with a test database. Test that an endpoint correctly creates an Enrollment, fires the right jobs, and returns the right response.
- **End-to-end tests**: a smaller suite covering the most critical user flows — the full application pipeline, quest submission, audit completion.

Test the database with a real PostgreSQL instance (in CI, a Docker container). Do not test against SQLite or an in-memory database — subtle differences between databases cause tests to pass when the real thing would fail.

---

## Summary Table

| Layer | Choice | Alternative |
|---|---|---|
| Language | TypeScript | — |
| Runtime | Node.js | — |
| Framework | NestJS | Fastify + custom |
| Database | PostgreSQL | — |
| ORM & Migrations | Prisma | TypeORM, Drizzle |
| Background Jobs | BullMQ | Agenda, custom |
| Job Queue Backend | Redis | — |
| Cache | Redis (same instance) | — |
| Auth | Passport.js + JWT | — |
| File Storage | Abstracted interface (MinIO for production) | AWS S3 |
| Email | Nodemailer + BullMQ queue | — |
| API Style | REST + OpenAPI | — |
| Real-time | Socket.io (NestJS WebSocket Gateway) | — |
| Logging | Winston (structured JSON) | Pino |
| Testing | Jest | Vitest |

---

## What This Stack Looks Like Operationally

A single backend application: one NestJS process that handles HTTP requests, WebSocket connections, and (via BullMQ workers) background job processing. One PostgreSQL database. One Redis instance.

Three processes to run in development: the NestJS app, PostgreSQL, and Redis. Docker Compose handles this with a single command.

In production (when Phase 14 arrives), this scales horizontally: multiple NestJS instances behind a load balancer, a managed or self-hosted PostgreSQL cluster, a Redis cluster. None of the application code changes. The abstraction layers (storage interface, email interface, Redis-backed WebSockets) are already in place.

This is a deliberate architecture: simple to run locally, straightforward to scale, with no application-layer changes required when the infrastructure moment arrives.

---

## One Final Note

The stack above is cohesive. Every piece knows how to work with every other piece, there are first-party or mature community integrations between them, and there are well-established patterns for every problem you will encounter. Mixing in pieces from other stacks (a Python microservice for game processing, a Go service for the webhook receiver) introduces operational complexity, shared-type complexity, and team context-switching that is not justified at this stage. Build it as a monolith with clean internal module boundaries. When a specific component genuinely needs to be a separate service, the boundaries are already there to extract it.
