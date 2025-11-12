---
slug: cqrs-complete-exploring-the-potential-of-use-less-react-new-querybus
authors: [fabfog]
date: "2025-11-13"
tags: [use-less-react]
---

# CQRS Complete: exploring the potential of `use-less-react`'s new QueryBus

We've reached a significant milestone. With the foundational work on the **CommandBus** and the recent completion of our **QueryBus**, we now have the full architectural toolkit to explore **Command Query Responsibility Segregation (CQRS)** in our complex frontend applications.

While keeping alive the experimental spirit of `use-less-react`, we are adopting the well-known CQRS pattern. Although our implementation is new, this widely battle-tested best practice promises to consolidate our work, guaranteeing enhanced performance and superior complexity management across the board.

<!-- truncate -->

## What CQRS Offers Us: Decoupling Read from Write

In traditional applications, a single component handles both modifying state (Writes) and retrieving data (Reads). This tight coupling often forces Reads to use models optimized for Writes (which are often too complex, or normalized).

CQRS in the frontend allows us to decouple these responsibilities:

| Component | Responsibility | Focus | Benefit |
| :--- | :--- | :--- | :--- |
| **Command Bus** | Mutating State (Writes) | Consistency & Transactionality | Ensures business rules are always followed. |
| **Query Bus** | Retrieving State (Reads) | Performance & View-Specific Data | **Tailors data structures specifically for the UI.** |

Our new QueryBus standardizes how we read data, ensuring every Read Model is perfectly shaped for the consuming component.

---

## Why the QueryBus Centralizes Control in Complex React Apps

In a typical complex React application, the biggest challenge is the lack of a unified, controlled layer for data access and caching management.

While excellent libraries like **TanStack Query** (which we highly recommend for caching and synchronization) mitigate network issues, the logical flow often remains scattered: many components individually decide *which* query to run and *when*. This leads to:

* **Scattered Logic:** Difficulty in tracking down all queries (e.g., to enforce logging or change caching strategies).
* **Loss of Architectural Control:** It's hard to enforce standards when data fetching is distributed across many components.

The CQRS pattern, enforced by the **QueryBus**, solves this by giving us **absolute central control** over the Read side: 

1.  **Unified Entry Point:** Every read operation in the application flows through one central service: the QueryBus.
2.  **Abstraction of Data Source:** The QueryBus and its Handlers abstract away the mechanics of data retrieval (be it `fetch`, TanStack, GraphQL, or local cache). The component only knows the **Contract** (the Query class).

This clear separation ensures maintainability, enforces architectural standards, and makes future migrations simpler.

### Concrete Use Cases Where this Decoupling Helps

| Application Type | Challenge Solved by QueryBus |
| :--- | :--- |
| **Complex Dashboards** | Using specific handlers to query highly denormalized, pre-aggregated data for charts, bypassing slower transactional APIs. |
| **E-commerce Checkout** | Fast, light queries for display-only information (e.g., product image, total price) while isolating the complex **Write** logic (stock check, fulfillment) in the Command Bus. |
| **WYSIWYG Editors** | Separating the high-frequency state updates (Commands) from the periodic, optimized Read Model refreshes (Queries). |
| **Multi-Step Forms/Wizards** | Standardizing the retrieval of form data snapshots, ensuring consistency across complex navigation steps. |

---

## Easy to Extend

The architecture might seem heavy initially, but **once you get a grasp of it**, adding new features becomes incredibly predictable and robust.

Adding a new data requirement requires three simple, highly cohesive steps:

### Step 1: Define the Query Contract

You define the required input (`payload`) and the expected output (`result type`). This creates a type-safe contract used across the application.

```typescript:Example Query Definition:packages/app/queries.ts
export class GetUserProfileQuery extends Query<
  "GetUserProfileQuery",
  // Query Payload: what the handler needs to know
  { userId: string },
  // Query Result Type (Read Model): what the consumer expects
  {
    id: string;
    fullName: string;
    avatarUrl: string;
    email: string;
  } | null
> {
  get type(): "GetUserProfileQuery" {
    return "GetUserProfileQuery";
  }
}
```

### Step 2: Implement the Handler Logic

The Handler contains the concrete implementation, deciding *how* to fetch the data (e.g., call a REST endpoint, query a GraphQL client, or read from a local cache).

```typescript
import { QueryHandlerInterface, QueryResult } from "@dxbox/use-less-react/classes";
import { GetUserProfileQuery } from "./queries";

class GetUserProfileQueryHandler
  implements QueryHandlerInterface<GetUserProfileQuery>
{
  // Dependency injection can happen here (e.g., REST client, GraphQL client)
  constructor(/* private readonly apiClient: ApiClient */) {}
  
  // The handle method is responsible for fulfilling the contract
  async handle(
    query: GetUserProfileQuery,
  ): Promise<QueryResult<GetUserProfileQuery>> {
    // 💡 This is where we encapsulate the data source logic
    // This could integrate TanStack Query, or call an API client.

    // ...now we will just return mocked data
    return {
      id: query.payload.userId,
      fullName: "Jane Doe",
      avatarUrl: "...",
      email: "email@example.com",
    };
  }
}
```

### Step 3: Consume in the View Model

The View Model remains clean, only interacting with the Bus and benefiting from automatic type inference.

```typescript:Example View Model Consumption:packages/app/view-model.ts
// Assuming QueryResult, QueryBusInterface, and PubSub are imported
import { QueryResult, QueryBusInterface, PubSub } from "./types"; 
import { GetUserProfileQuery } from "./queries";

export class UserViewModelPort extends PubSub {
  // TypeScript knows this is of type { id: string, fullName: string, ... } | null
  public userProfile: QueryResult<GetUserProfileQuery> = null;
  public loading: boolean = false;
  public error: Error | null = null;

  constructor(private queryBus: QueryBusInterface) {
    super();
    this.makeReactiveProperties("loading", "userProfile", "error");
  }

  public async loadUserProfile(userId: string): Promise<void> {
    this.loading = true;
    await this.batchNotifications(async () => {
      this.error = null;
      try {
        const query = new GetUserProfileQuery({ userId });
        this.userProfile = await this.queryBus.dispatch(query); 
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error);
      } finally {
        this.loading = false;
      }
    })
  }
}
```

---

## The CQRS Payoff: A Future-Proof Frontend

By adopting the QueryBus, we are not just cleaning up components; we are establishing a robust foundation that provides five critical advantages for the future:

* **Scalability:** the separation of the Read side allows us to optimize data fetching performance independently, scaling up the ability to consume data without impacting transactional consistency.
* **Testability:** because the View Models only depend on the `QueryBusInterface`, handlers can be easily mocked, making unit testing the View Model's state logic simple, fast, and isolated from network concerns.
* **Observability (Monitoring):** the QueryBus is the single choke point for all reads, making it the perfect place for our integrated `QueryBusMonitoringPortInterface` to measure latency and track every infrastructure error.
* **Flexibility:** handlers are interchangeable. We can switch a data source from a mocked API to REST, then to GraphQL, and finally integrate with a local state manager (like TanStack Query) without altering the consuming View Models.
* **Portability:** the core logic—the Commands, Queries, and Handlers—is pure TypeScript and decoupled from React components. This architecture is inherently portable and can be reused easily across different environments (e.g., traditional browser rendering, server-side rendering (SSR), or even a backend Node service).

The QueryBus is our ticket to developing complex, high-performance applications with predictable, maintainable architectures.

## Final note

The abovesaid features are available from [v0.10.0](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.10.0).

Tech details [here](/docs/use-less-react/api/prefabs/query-bus).
