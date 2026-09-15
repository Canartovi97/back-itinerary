---
name: backend-hexagonal
description: Conventions for adding features to the back-itinerary NestJS monorepo (airport-service, itinerary-service, notification-function) — hexagonal/DDD folder layout, ports/adapters, migrations, events, testing, and how to pick up the next Jira/backlog ticket. Use whenever implementing, reviewing, or planning a backend ticket in this repo.
---

# Backend hexagonal/DDD conventions (back-itinerary)

This repo is a course project demonstrating microservices, Hexagonal Architecture,
DDD, the Adapter pattern, event-driven architecture, and Serverless. Every backlog
ticket should reinforce those patterns, not bypass them.

## Repo map

```
apps/
  airport-service/         port 3001 — reads airports from api-colombia.com
  itinerary-service/       port 3000 — itinerary CRUD, Postgres, publishes events
  notification-function/   port 3002 (local) — consumes events, meant for Lambda
docs/architecture.md       C4-ish component diagram + event-flow sequence diagram
README.md                  setup, docker-compose, migrations
```

Each app is a self-contained NestJS project with its own `package.json`,
`Dockerfile`, `.env.example`. Build/test one app at a time with
`npm run build --workspace=apps/<app>` / `npm run test --workspace=apps/<app>`,
or `npm run build` / `npm test` from root for all three.

## The layering, every app, no exceptions

```
src/
  domain/                  entities, value objects, domain errors, PORTS (interfaces)
    ports/*.port.ts         outbound interfaces the domain depends on
    errors/*.ts             domain-specific Error subclasses
  application/              use cases — one class per use case, orchestrates ports
    *.use-case.ts
    *.use-case.spec.ts       pure unit test, fakes for every port, NO NestJS TestingModule
  infrastructure/
    adapters/               concrete implementations of domain ports (HTTP, MQ, DB clients)
    controllers/            inbound REST controllers (or MQ consumers for notification-function)
    persistence/            TypeORM entities, repositories, migrations
    dto/                    class-validator request/response DTOs
    filters/                exception filters mapping domain errors -> HTTP status
    logging/                StructuredLogger (airport-service has the reference impl)
```

Dependency rule: `domain` depends on nothing. `application` depends only on
`domain` (via injected ports, using the `@Inject(SOME_TOKEN)` Symbol pattern —
see `AIRPORT_PROVIDER`, `AIRPORT_CACHE` for the pattern). `infrastructure`
depends on both. Never import a NestJS/TypeORM/axios type into `domain/`.

## Adding a new use case (the repeatable recipe)

1. If it needs a new outbound capability (calling another service, a queue, a
   store), add a port: `domain/ports/<name>.port.ts` — an interface plus an
   exported `Symbol` DI token, e.g. `export const X_PORT = Symbol('X_PORT')`.
2. Write the use case in `application/<name>.use-case.ts`: `@Injectable()`,
   constructor-inject ports via `@Inject(TOKEN)`, one public `execute(...)` method.
3. Write `application/<name>.use-case.spec.ts` FIRST or alongside: hand-written
   fake classes implementing the ports (see `list-airports.use-case.spec.ts` or
   `get-airport-by-id.use-case.spec.ts` for the pattern), no mocking libraries
   needed, no Nest bootstrapping. This is what "domain tested in isolation from
   infrastructure" means in this project — don't skip it.
4. Implement the concrete adapter in `infrastructure/adapters/<name>.adapter.ts`
   implementing the port.
5. Wire it in `app.module.ts`: `{ provide: X_PORT, useClass: XAdapter }`.
6. If it's reachable over HTTP, add/extend a controller in
   `infrastructure/controllers/`, with a DTO in `infrastructure/dto/` using
   `class-validator` decorators, and `@nestjs/swagger` decorators
   (`@ApiOperation`, `@ApiOkResponse`, etc.) — both airport-service and
   itinerary-service expose Swagger at `/api/docs`.
7. Map any new domain error to an HTTP status via a filter in
   `infrastructure/filters/`, registered with `app.useGlobalFilters(...)` in
   `main.ts` (see `AirportProviderUnavailableFilter` and `DomainErrorFilter`
   for the two existing patterns — one filter per error type is fine here).

## Cross-service calls

Itinerary Service validates airports by calling Airport Service over plain
HTTP through `HttpAirportValidationAdapter`, base URL from `AIRPORT_SERVICE_URL`.
Follow this pattern for any new cross-service call: define the outbound port in
the caller's domain, implement an HTTP adapter in the caller's infrastructure,
never let a service reach into another service's database.

## Events (RabbitMQ)

- Publishing: define what you publish through an `EventPublisherPort`
  (`domain/ports/event-publisher.port.ts` in itinerary-service), implement with
  `RabbitMqEventPublisherAdapter`. Publish only after the state change that
  makes the event true has actually committed (see `CreateItineraryUseCase`:
  validate -> persist -> publish, in that order).
- Consuming: `notification-function`'s `RabbitMqItineraryCreatedConsumer` is the
  reference pattern for a queue consumer wired through `app.module.ts` instead
  of a controller.
- Any new event needs an entry in `docs/architecture.md`'s event table
  (exchange/queue name, payload shape, publisher, consumer(s)).

## Resilience patterns (reuse, don't reinvent)

`airport-service`'s `ApiColombiaAirportAdapter` is the reference for calling a
flaky external dependency: timeout + manual retry (`requestWithRetry`), wrapped
in a `CircuitBreaker` (`infrastructure/resilience/circuit-breaker.ts`) that
fails fast via a domain `*UnavailableError` once tripped. Reuse `CircuitBreaker`
as-is for any new outbound integration that needs the same protection — it's
already framework-agnostic and unit-tested (`circuit-breaker.spec.ts`).

## Structured logging

Use `StructuredLogger` (`airport-service/src/infrastructure/logging/`) as the
template if a service needs JSON logs: `app.useLogger(new StructuredLogger())`
in `main.ts`, then log via plain NestJS `Logger` instances passing an object
(not a string) so it serializes with named fields. Currently only
airport-service has this wired — extend the same file into other apps rather
than inventing a second logging format.

## Database changes (itinerary-service only, for now)

`synchronize` is OFF. Every schema change is a migration:

```bash
npm run migration:generate --workspace=apps/itinerary-service -- src/infrastructure/persistence/migrations/<Name>
npm run migration:run --workspace=apps/itinerary-service
npm run migration:revert --workspace=apps/itinerary-service
```

Migrations are TypeScript files in `infrastructure/persistence/migrations/`,
committed to git, run explicitly (not on container boot — see README's "Known
gaps" section for why).

## Before committing any ticket

1. `npm run build --workspace=apps/<app>` for every app you touched.
2. `npm run test --workspace=apps/<app>` — all suites must pass, and a new
   use case/domain rule needs a new spec, not just green existing tests.
3. `npm run lint --workspace=apps/<app>` — let ESLint autofix Prettier nits.
4. If you touched `docker-compose.yml` or added new env vars, update the
   relevant `.env.example` and `docs/architecture.md`.
5. One commit per ticket, message referencing the Jira ID, e.g.
   `feat(itinerary-service): add SCRUM-XX ...`. Branch name
   `feature/SCRUM-XX-short-slug` off `main`, PR back into `main`.

## Picking the next ticket

Cross-reference the CSV backlog against what already exists in this repo before
assuming a ticket is unstarted — several "Task" tickets under an epic whose
"Story" ticket is already implemented (e.g. most of the Gestión de Aeropuertos
epic) may only need a gap-closing pass (a missing test, a doc note) rather than
new code. Check `docs/architecture.md` for what's already wired before scoping
a new ticket.
