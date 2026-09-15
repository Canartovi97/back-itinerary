# Architecture diagrams

Reference diagrams for the backend. Keep these updated when a ticket adds a
new service, port, adapter, or event — see the [backend-hexagonal skill](../.claude/skills/backend-hexagonal/SKILL.md)
for the conventions these diagrams describe.

## Component diagram

```mermaid
graph TB
    subgraph Client
        FE[Frontend<br/>Angular]
    end

    subgraph Backend["back-itinerary monorepo"]
        AS[Airport Service<br/>:3001]
        IS[Itinerary Service<br/>:3000]
        NF[Notification Function<br/>:3002 local]
    end

    PG[(PostgreSQL<br/>itinerary_db)]
    MQ{{RabbitMQ}}
    SQLITE[(SQLite<br/>notifications.db)]
    EXT[api-colombia.com]

    FE -->|HTTP| AS
    FE -->|HTTP| IS
    IS -->|HTTP GET /airports/:id<br/>validate existence| AS
    AS -->|HTTP, via circuit breaker + retry| EXT
    IS -->|TypeORM| PG
    IS -->|publish ItineraryCreated| MQ
    MQ -->|consume ItineraryCreated| NF
    NF -->|persist| SQLITE

    style FE fill:#4a90d9,color:#fff
    style AS fill:#5b9e5b,color:#fff
    style IS fill:#5b9e5b,color:#fff
    style NF fill:#5b9e5b,color:#fff
    style EXT fill:#999,color:#fff
```

**Rule enforced by this diagram:** the frontend never calls `api-colombia.com`
directly (SCRUM-14/"Frontend consume solo servicios internos"), and no service
reaches into another service's database — `notification-function`'s SQLite
store is private to it, same as `itinerary-service`'s Postgres instance.

## Event flow: itinerary creation → notification

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant IS as Itinerary Service
    participant AS as Airport Service
    participant PG as PostgreSQL
    participant MQ as RabbitMQ
    participant NF as Notification Function
    participant DB as SQLite (notifications)

    User->>FE: fill itinerary form
    FE->>IS: POST /itineraries
    IS->>IS: validate domain rules<br/>(RN-02, RN-03, RN-04)
    IS->>AS: GET /airports/:originId
    IS->>AS: GET /airports/:destinationId
    AS-->>IS: 200 OK (airport exists)
    IS->>PG: INSERT itinerary
    IS->>MQ: publish ItineraryCreated<br/>(exchange itinerary.events)
    IS-->>FE: 201 Created
    MQ-->>NF: deliver ItineraryCreated
    NF->>NF: build Notification from event
    NF->>DB: INSERT notification
```

If Airport Service is unreachable (`AirportProviderUnavailableError` /
circuit breaker open), Itinerary Service's validation call fails and the
itinerary is **not** persisted — no event is published, so no ghost
notification is ever generated (RN-06).

## Backlog dependency graph (Sprint-planning aid)

Which epics/tickets block which — use this to sequence remaining work instead
of picking tickets in CSV order. Arrows mean "must exist before this can be
meaningfully implemented or tested end-to-end."

```mermaid
graph LR
    subgraph E1["Gestión de Aeropuertos"]
        A1[Consultar aeropuertos]
        A2[Integrar API Colombia]
        A3[Patrón Adapter]
        A4[Consultar por ID]
        A5[Resiliencia ✅ SCRUM-17]
        A6[Caché TTL]
        A7[Hexagonal/DDD]
    end
    subgraph E2["Frontend Aeropuertos"]
        F1[Mapa interactivo]
        F2[Solo servicios internos]
    end
    subgraph E3["Gestión de Itinerarios"]
        I1[Crear itinerario]
        I2[Consultar itinerarios]
        I3[Actualizar itinerario]
        I4[Eliminar itinerario]
        I5[Validar aeropuertos existen]
        I6[Reglas de negocio]
        I7[Hexagonal/DDD]
    end
    subgraph E4["Persistencia"]
        P1[BD relacional propia]
        P2[Migraciones versionadas]
    end
    subgraph E5["Eventos"]
        V1[Publicar ItineraryCreated]
        V2[Broker de mensajería]
        V3[Procesar evento async]
    end
    subgraph E6["Notificaciones"]
        N1[Generar notificación]
        N2[Función Serverless]
        N3[Historial de notificaciones]
    end
    subgraph E7["Infra/DevOps"]
        D1[Dockerizar]
        D2[Docker Compose]
        D3[Pipeline CI/CD]
    end

    A2 --> A3 --> A1
    A3 --> A4
    A2 --> A5
    A2 --> A6
    A7 -.-> A1
    A1 --> F1 --> F2
    I7 --> I1
    I1 --> I5
    A4 --> I5
    I6 --> I1
    P1 --> P2 --> I1
    I1 --> V1 --> V2 --> V3 --> N1
    N1 --> N2 --> N3
    D1 --> D2 --> D3

    style A5 fill:#5b9e5b,color:#fff
```

Practical read: the Airport Service epic (A2/A3/A4/A5, already mostly built)
gates both the frontend map and the itinerary-creation validation flow — it
was the right epic to start with. The next highest-leverage gap is closing
**A6 (caché TTL)** since it's a small, isolated addition to the same adapter
touched in SCRUM-17, followed by **I5/I6** (already scaffolded in
`itinerary-service`, mostly needs the failure-path test called out in
SCRUM's "Validar existencia de aeropuertos" acceptance criteria) before
moving into the Eventos/Notificaciones chain, which already has a working
skeleton end-to-end.
