# QueryBus

The `QueryBus` is a core infrastructural component in our frontend CQRS (Command Query Responsibility Segregation) architecture. It centralizes the dispatching and handling of read operations (Queries), ensuring strong type safety and clean separation between the consuming View Models and the data retrieval logic.

---

## 1. Core Interfaces and Abstractions

The entire system relies on three fundamental types, ensuring type safety from the Query definition to the final result.

### Query

The base class for all read messages. It establishes the input (`TPayload`) and, crucially, the expected output (`TResult`) via the `__resultType` property, which enables powerful type inference.

```typescript
export abstract class Query<TType extends string, TPayload, TResult> {
  readonly id: string;
  readonly timestamp: Date;
  readonly payload: TPayload;
  abstract get type(): TType;

  // Crucial for type inference by QueryResult utility type
  readonly __resultType!: TResult; 

  constructor(payload: TPayload, id?: string);
}

// Example Implementation
export class GetUserProfileQuery extends Query<
  "GetUserProfileQuery",
  { userId: string },
  { id: string; fullName: string } | null
> {
  get type(): "GetUserProfileQuery" {
    return "GetUserProfileQuery";
  }
}
```

### QueryResult\<TQuery\>

A utility type used to extract the exact return type (`TResult`) from any given Query class. This simplifies the definition of Handlers and the usage of the Dispatch method.

```typescript
export type QueryResult<TQuery> =
  TQuery extends Query<string, unknown, infer U> ? U : never;

// Usage: type Profile = QueryResult<GetUserProfileQuery>; // is { id: string, fullName: string } | null
```

### QueryHandlerInterface\<TQuery\>

Defines the contract for the service responsible for executing the Query and returning the Read Model. Note that the expected return type is automatically inferred via `QueryResult<TQuery>`.

```typescript
export interface QueryHandlerInterface<TQuery extends UntypedQueryType> {
  handle(query: TQuery): Promise<QueryResult<TQuery>>;
}
```

-----

## 2\. QueryBus Implementation

The `QueryBus` class is responsible for routing a Query instance to its corresponding registered handler.

### Class Definition

```typescript
export class QueryBus implements QueryBusInterface {
  private handlers = new Map<string, QueryHandlerInterface<UntypedQueryType>>();
  private monitoringService: QueryBusMonitoringPortInterface;
  
  constructor({ monitoringService }: QueryBusConstructorProps = {});
  
  // ... methods ...
}
```

### 2.1. registerHandler(queryType, handler)

Registers a specific handler instance to a unique Query type string.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `queryType` | `T["type"]` (`string` literal) | The unique, immutable identifier for the Query (e.g., `"GetUserProfileQuery"`). **This string is used as the reliable lookup key, preventing issues with code minification.** |
| `handler` | `QueryHandlerInterface<T>` | The concrete service instance that implements the handling logic. |

```typescript
// The function signature ensures type alignment between the handler and the queryType
public registerHandler<T extends UntypedQueryType>(
  queryType: T["type"],
  handler: QueryHandlerInterface<T>,
): void;

// Example Usage:
queryBus.registerHandler(
  "GetUserProfileQuery",
  new GetUserProfileQueryHandler()
);
```

### 2.2. dispatch(query)

Sends a Query instance through the Bus. It automatically looks up the correct handler based on `query.type` and executes the `handle` method.

Crucially, the return type (`R`) is **inferred** directly from the Query class provided, providing type-safe asynchronous data retrieval.

```typescript
public async dispatch<
    TQuery extends UntypedQueryType,
    R = QueryResult<TQuery>, // R is automatically inferred
>(
    query: TQuery,
): Promise<R>;

// Example Usage:
const query = new GetUserProfileQuery({ userId: '456' });

// TS knows 'profile' will be { id: string; fullName: string } | null
const profile = await queryBus.dispatch(query); 
```

### Error Handling and Monitoring

The `dispatch` method includes comprehensive logic for:

1.  **Handler Not Found:** Throws an error if `query.type` is not registered.
2.  **Execution Failure:** Catches errors thrown by the `handler.handle()` method and re-throws a standardized execution failure error.
3.  **Monitoring:** Integrates with the `QueryBusMonitoringPortInterface` to track:
      * `QUERY_EXECUTION_TIME` (metric for performance).
      * `HANDLER_NOT_FOUND` (infrastructure error).
      * `QUERY_EXECUTION_FAILED` (execution error).

---

## 3\. Best Practices Summary

| Practice | Description | Reason |
| :--- | :--- | :--- |
| **Decouple Data Source** | The Query Handler is the *only* place that should know about `fetch`, API clients, or caching libraries (like TanStack Query). | Provides maximum **flexibility and testability**. The consuming View Model is fully decoupled from the transport layer. |
| **Strict Type Inference** | Rely on `QueryResult<TQuery>` for type definitions in Handlers and View Models. | Enforces a strict contract between the Read Model producer (Handler) and the consumer (View Model), eliminating runtime type errors. |
