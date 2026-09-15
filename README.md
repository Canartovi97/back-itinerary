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

The initial migration (`CreateItinerariesTable`) creates the `itineraries` table.

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

## Known gaps / TODOs

- No integration or e2e tests yet (only pure unit tests at the domain/use-case level).
- No authentication/authorization on any endpoint.
- Notification Function's SQLite storage is for local dev only; a real Lambda
  deployment would swap `NotificationRepositoryPort` for a DynamoDB adapter.
- `itinerary-service` does not auto-run migrations on startup; this is intentional
  (avoids surprise schema changes) but must be done manually or via a deploy step.
