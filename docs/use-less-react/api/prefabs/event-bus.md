# Event Bus

The Event Bus is the core of our application's Event-Driven Architecture (EDA), providing a decoupled mechanism for communication and state updates across client-side logic and remote persistence.

There are two versions of the Event Bus: `HybridEventBus` and `InMemoryEventBus`. We will show the hybrid version first, as it uses the in-memory one, which is just a more simple version. 

## 1\. Core Interfaces (`types.ts`)

These interfaces define the contracts for events, handlers, and the bus itself, ensuring type safety and dependency inversion.

### `DomainEventInterface<TType, TPayload>`

The base contract for any event in our domain.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the event (UUID). |
| `type` | `TType extends string` | The unique name of the event (e.g., `"UserCreated"`). |
| `timestamp` | `Date` | The exact time the event was created. |
| `payload` | `TPayload` | The immutable data relevant to the event. |

### `RemoteDomainEventMarkerInterface`

An empty marker interface used to let the `HybridEventBus` know that an event must be sent to the remote publisher (backend).

| Property | Type | Description |
| :--- | :--- | :--- |
| `isRemote` | `true` | Required boolean marker. |

### Other Event Types

| Type | Definition | Description |
| :--- | :--- | :--- |
| `UntypedDomainEventType` | `DomainEventInterface<string, object>` | The general type used for handlers that receive any event. |
| `LocalEventHandler<TType extends string, TPayload>` | `(event: DomainEventType<TType, TPayload>) => Promise<void>` | The function signature required for any local handler (Service/ViewModel) subscribing to the bus. |

### `RemotePublisherInterface`

Defines the contract for the service responsible for transporting events to the backend (e.g., via WebSockets or a REST endpoint).

| Method | Signature | Description |
| :--- | :--- | :--- |
| `sendRemote` | `(serializedEvent: string) => Promise<void>` | Sends the JSON string representation of the event to the remote destination. |

### `HybridEventBusInterface`

The main interface used for publishing events and registering handlers in the application layer (e.g., inside ViewModels and Services).

| Method | Signature | Description |
| :--- | :--- | :--- |
| `registerLocalHandler<TType extends string, TPayload>` | `(eventType: string, handler: LocalEventHandler<TType, TPayload>) => () => void` | Subscribes a handler function to a specific event type. Returns an unsubscribe function. |
| `unregisterLocalHandler` | `(eventType: string, handler: LocalEventHandler<string, object>) => void` | Removes a registered handler. |
| `publish` | `(event: UntypedDomainEventType) => Promise<PublishResultInterface[]>` | Publishes the event, triggering both local handlers and the remote path if applicable. |
| `receiveFromRemote` | `(rawEvent: string) => Promise<void>` | Used by the network layer (e.g., a WebSocket listener) to re-introduce events originating from the server into the local bus. |

-----

## 2\. Base Event Classes (`event.ts`)

These abstract classes implement the `DomainEventInterface` and provide standard event creation and initialization logic.

### `abstract class DomainEvent<TType, TPayload>`

This is the abstract base class for all local and remote events. New domain events **should** extend this class to ensure they have the necessary structural integrity (`id`, `timestamp`, `payload`).

**Usage Example (Local Event):**

```typescript
interface UserInteractionPayload {
  componentId: string;
}

class ButtonClickedEvent extends DomainEvent<
  "ButtonClicked",
  UserInteractionPayload
> {
  // The concrete event type is locked here
  get type(): "ButtonClicked" {
    return "ButtonClicked";
  }
}
// An instance of ButtonClickedEvent does NOT trigger remote publishing.
```

### Concrete Event classes extending `DomainEvent`

This class extends `DomainEvent` and implements the `RemoteDomainEventMarkerInterface` marker, forcing the `isRemote` property to `true`.

```typescript
interface UserDataUpdatedPayload {
  name: string;
}

class ProfileSavedEvent extends DomainEvent<
  "ProfileSaved",
  UserDataUpdatedPayload
> implements RemoteDomainEventMarkerInterface {
  get type(): "ProfileSaved" {
    return "ProfileSaved";
  }
  isRemote = true as const;
}
// An instance of ProfileSavedEvent WILL trigger remote publishing via the HybridEventBus.
```

-----

## 3\. The Hybrid Event Bus

The `HybridEventBus` orchestrates the local and remote paths, using dependency injection for its internal components.

It performs three main tasks:

1.  **Mediation:** delegates event handling to the `inMemoryBus`.
2.  **Routing:** checks if an event is a remote event and routes it to the `remotePublisher`.
3.  **Monitoring:** catches errors during both local handler execution and remote publishing.

## 4\. In-Memory Event Bus

The internal component of the `HybridEventBus` dedicated solely to managing local subscriptions and handler execution.

| Responsibility | Details |
| :--- | :--- |
| **Storage** | Uses an internal `Map<string, LocalEventHandler[]>` to store subscribers by event type. |
| **Execution** | Executes all registered handlers asynchronously using `Promise.all` but independently. |
| **Robustness** | Wraps handler execution in `try/catch` to ensure one failed handler does not stop the others (or the remote publish path) from executing. Errors are routed to the `MonitoringPortInterface`. |

Can be used by itself if you don't need remote event routing.