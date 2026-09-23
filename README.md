# back-itinerary

Backend monorepo for a distributed itinerary-planning system. Built as the initial
scaffolding for a graduate architecture course project.

See [docs/architecture.md](docs/architecture.md) for the component diagram, the
itinerary-creation event flow, and a backlog dependency graph for sequencing
upcoming tickets. See [.claude/skills/backend-hexagonal](.claude/skills/backend-hexagonal/SKILL.md)
for the conventions to follow when implementing a new ticket (Claude Code
loads this automatically when working in this repo).

## Monorepo structure

npm workspaces host three independent, deployable NestJS/TypeScript applications:

```
apps/
  airport-service/         # Port 3001 - exposes airport data (sourced from api-colombia.com)
  itinerary-service/       # Port 3000 - manages itineraries (PostgreSQL + RabbitMQ)
  notification-function/   # Port 3002 (local) - consumes ItineraryCreated events, meant for Lambda later
tsconfig.base.json         # Shared TypeScript compiler options
package.json               # Root workspace wiring, shared scripts
docker-compose.yml         # Local infra: postgres, rabbitmq, and the three services
```

Each app is fully independent (its own `package.json`, `Dockerfile`, `.env.example`)
so it can be built, tested, and deployed on its own.

## Hexagonal / DDD folder convention

Every app follows the same layering:

- `src/domain` — entities, value objects, domain errors, and outbound **ports**
  (interfaces) that the domain depends on. No framework or infrastructure code here.
- `src/application` — use cases that orchestrate domain logic against the ports.
  This is where business workflows live (e.g. `CreateItineraryUseCase`).
- `src/infrastructure/adapters` — concrete implementations of the outbound ports
  (HTTP clients, message broker clients, etc).
- `src/infrastructure/controllers` — inbound adapters: REST controllers.
- `src/infrastructure/persistence` — database entities, repositories, migrations.

Dependencies always point inward: infrastructure depends on application, application
depends on domain, domain depends on nothing. Ports defined in `domain/ports` are
implemented by adapters in `infrastructure/adapters` and wired together in each app's
`app.module.ts` via NestJS dependency injection tokens (`Symbol`s).

## Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (for `docker-compose up`)
- A running PostgreSQL instance (only needed for `itinerary-service` if not using Docker)
- A running RabbitMQ instance (needed for `itinerary-service` and `notification-function` if not using Docker)

## Running locally (without Docker)

1. Install all workspace dependencies from the repo root:

   ```bash
   npm install
   ```

2. Copy each app's `.env.example` to `.env` and adjust values as needed:

   ```bash
   cp apps/airport-service/.env.example apps/airport-service/.env
   cp apps/itinerary-service/.env.example apps/itinerary-service/.env
   cp apps/notification-function/.env.example apps/notification-function/.env
   ```

3. Start each service in its own terminal, using npm workspace filters:

   ```bash
   npm run start:dev --workspace=apps/airport-service
   npm run start:dev --workspace=apps/itinerary-service
   npm run start:dev --workspace=apps/notification-function
   ```

   Or use the root convenience scripts: `npm run start:airport`, `npm run start:itinerary`,
   `npm run start:notification`.

4. Swagger docs:
   - Airport Service: http://localhost:3001/api/docs
   - Itinerary Service: http://localhost:3000/api/docs
   - Notification Function health check: http://localhost:3002/health

## Running with Docker Compose

From the repo root:

```bash
docker-compose up --build
```

This starts Postgres, RabbitMQ (with the management UI at http://localhost:15672,
guest/guest), and all three services on a shared `itinerary-net` bridge network.
`itinerary-service` waits for Postgres and RabbitMQ health checks before starting.

Note: `itinerary-service` does not run migrations automatically on boot (by design,
since `synchronize` is disabled). Run migrations manually (see below) against the
Dockerized Postgres, or exec into the container and run `npm run migration:run`.

## Database migrations (itinerary-service)

`itinerary-service` uses TypeORM against PostgreSQL with `synchronize: false`.
Schema changes are managed exclusively through migrations:

```bash
cd apps/itinerary-service

# generate a new migration from entity changes
npm run migration:generate -- src/infrastructure/persistence/migrations/SomeChange

# apply pending migrations
npm run migration:run

# revert the last migration
npm run migration:revert
```

Two migrations exist: `CreateItinerariesTable` and `CreateUsersTable` (see
"Authentication" below). Migration commands use `typeorm-ts-node-commonjs`
(TypeORM's own bin for exactly this decorator + ts-node + npm-workspaces
combination) rather than reaching into `node_modules/typeorm/cli.js`
directly, which breaks under workspace hoisting since apps here have no
per-app `node_modules`.

## Building and testing

```bash
# from repo root - builds all three apps
npm run build

# from repo root - runs all three apps' test suites
npm test

# or per app
npm run build --workspace=apps/airport-service
npm run test --workspace=apps/itinerary-service
```

## Airport Service resilience (api-colombia integration)

`ApiColombiaAirportAdapter` consumes two endpoints from https://api-colombia.com/api/v1:
`GET /Airport` and `GET /Airport/{id}`. Each call goes through:

1. A 5s request timeout with up to 2 retries (300ms/600ms backoff) for transient failures.
2. A circuit breaker (`CIRCUIT_BREAKER_FAILURE_THRESHOLD`, default 3 consecutive
   failures; `CIRCUIT_BREAKER_RESET_TIMEOUT_MS`, default 30s) that fails fast once
   tripped instead of piling up slow requests against a degraded upstream, and
   probes with a single trial request (half-open) once the reset timeout elapses.
3. A 404 from api-colombia resolves as "not found" and never counts as a circuit
   failure or triggers a retry — it's a valid response, not an outage.

When the breaker is open or retries are exhausted, the adapter throws a domain-level
`AirportProviderUnavailableError`, mapped by `AirportProviderUnavailableFilter` to an
HTTP 503. All failure/circuit-state logging is emitted as structured JSON via
`StructuredLogger` (one JSON object per line, e.g. `{"timestamp","level","event","url",...}`)
so it can be parsed by a log aggregator.

## Structured logging and correlation IDs

Every service now logs JSON (one object per line: `timestamp`, `level`, `context`,
`correlationId` when present, plus the message/fields) via each app's own
`StructuredLogger`. A correlation ID traces one logical request across all three
services:

1. `CorrelationIdMiddleware` (airport-service, itinerary-service) reuses the
   `x-correlation-id` request header if the caller sent one, otherwise mints a new
   UUID, stores it for the request's lifetime via `RequestContext`
   (an `AsyncLocalStorage` wrapper), and echoes it back on the response header.
2. `itinerary-service`'s `HttpAirportValidationAdapter` forwards that same header
   when it calls airport-service to validate an airport.
3. `itinerary-service`'s `RabbitMqEventPublisherAdapter` attaches it as the
   standard AMQP `correlationId` message property when publishing `ItineraryCreated`.
4. `notification-function`'s consumer reads `msg.properties.correlationId` and runs
   the rest of that message's processing inside the same `RequestContext`, so its
   logs carry the identical ID.

Net result: grepping one correlation ID across all three services' logs shows the
full lifecycle of a single itinerary creation, from the original HTTP request
through the async notification. `RequestContext`/`CorrelationIdMiddleware`/
`StructuredLogger` are intentionally duplicated per app (small, ~30-60 lines each)
rather than factored into a shared library, matching this monorepo's current
no-shared-code convention — see the [backend-hexagonal skill](.claude/skills/backend-hexagonal/SKILL.md).

## Authentication (JWT)

`itinerary-service` owns the user store (it already has Postgres) and is the
only service that issues tokens:

- `POST /auth/register` — `{ email, password }` → creates a user (bcrypt-hashed
  password), `409` if the email is already registered.
- `POST /auth/login` — `{ email, password }` → `{ accessToken }`, a JWT signed
  with `JWT_SECRET` (`sub` = user id, `email`), `401` on wrong credentials.
- All `/itineraries` endpoints require `Authorization: Bearer <token>`
  (`JwtAuthGuard`), returning `401` if it's missing/invalid/expired. Airport
  Service's read endpoints stay publicly browsable (RF-01/RF-02) — no ticket
  calls for authentication there.
- The token is propagated on itinerary-service's internal call to
  airport-service (`HttpAirportValidationAdapter`, carried via
  `RequestContext.getAuthToken()`) and airport-service has its own
  `JwtAuthGuard` (same shared `JWT_SECRET`) ready to verify it — not currently
  applied to any route there, since none of its endpoints are sensitive yet,
  but tested and available for when one is added.
- `JWT_SECRET` must be identical across `itinerary-service` and
  `airport-service` (see each app's `.env.example`) — itinerary-service is the
  only issuer, but both need the same secret to verify a token.

Frontend counterpart: `front-intinerary`'s `correlationIdInterceptor` mints the
correlation ID (this app is the real first entry point), and a new
`AuthService`/`authInterceptor` pair handles login/registration and attaches
the stored JWT to every request — see that repo's README.

## Known gaps / TODOs

- No integration or e2e tests yet (only pure unit tests at the domain/use-case level).
- No authentication/authorization on any endpoint.
- Notification Function's SQLite storage is for local dev only; a real Lambda
  deployment would swap `NotificationRepositoryPort` for a DynamoDB adapter.
- `itinerary-service` does not auto-run migrations on startup; this is intentional
  (avoids surprise schema changes) but must be done manually or via a deploy step.
