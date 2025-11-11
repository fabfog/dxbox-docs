---
slug: how-the-use-less-react-hybrid-event-bus-will-improve-your-front-end-architecture
authors: [fabfog]
date: "2025-11-10"
tags: [use-less-react]
---

# How the `use-less-react` Hybrid Event Bus will improve your Front-End architecture

If you develop complex **React** applications, you know how hard it is to make distant components communicate without tightly coupling them. Often, the result is a horrible **"state monolith"** (a single, massive Store or Context) that becomes impossible to understand and - therefore - to maintain. Also, this makes the components difficult to test, because of the abovesaid dependency on a big Store/Context that must be mocked. When this happens, you will dread changes and you won't sleep well.

The fun fact is 99% of the times you don't even really need global state. In such cases, an *elegant weapon for more civilized times* is an **Event Bus**, an abstraction that implements the **Mediator** pattern, bringing Event-Driven Architecture (EDA) directly into your browser.

Using an Event Bus is kinda like getting state updates via the Pub/Sub pattern, but without creating a complex, tangled mess of dependencies across your application. The Event Bus acts purely as a **Mediator**, decoupling the logic of different application parts. Their only "contract" is the event: more specifically its type and its small, focused payload.

<!-- truncate -->

Crucially, listening to events mean you will never need to know the "shape" of a global state; logics will only depend on a small, specific piece of data (the event). This completely prevents the common issue that arises with Redux or with large Context stores, where a component depends on a huge store just to access a couple fields. 

This high level of isolation means any application segment can be cleanly separated from the rest at any time — even for focused unit testing — and will continue to function perfectly as long as it's supplied with the granular events it needs.

## How it works

To demonstrate usage, we will use the base class `DomainEvent` and the interface `HybridEventBusInterface` from `use-less-react`: they are available from [`v0.8.0`](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.8.0).

Full tech docs [here](/docs/use-less-react/api/prefabs/event-bus).

### 1\. Extension of abstract classes: creating specific events

When your domain has a new event, you define it by extending the generic, abstract `DomainEvent` class.

```typescript
// Payload for ThemeChangedEvent
interface ThemeChangedPayload {
  newTheme: 'light' | 'dark';
}

/**
 * Local Event: is handled only in-memory
 */
export class ThemeChangedEvent extends DomainEvent<
  "ThemeChanged",
  ThemeChangedPayload
> {
  // overridden method, used to ensure the correct value for the event type
  get type(): "ThemeChanged" {
    return "ThemeChanged";
  }
}

// Payload for UserProfileUpdatedEvent
interface UserProfileUpdatedPayload {
  userId: string;
  name: string;
}

/**
 * Hybrid Event (Local + Remote)
 */
export class UserProfileUpdatedEvent 
  extends DomainEvent<
    "UserProfileUpdated", 
    UserProfileUpdatedPayload
  >
  // implement this interface only if the event is meant to be sent remotely
  implements RemoteDomainEventMarkerInterface
{
  get type(): "UserProfileUpdated" {
    return "UserProfileUpdated";
  }
  // says this event is not just local
  isRemote = true as const;
}
```

### 2\. Publishing events

Then you can publish the abovesaid events like this:

```typescript
import { eventBus } from "@/event-bus";
// A ViewModel for a React component (e.g., a settings form)
export class SettingsViewModel {
  constructor(private eventBus: HybridEventBusInterface) {}

  // Method called by the UI (e.g., a "Save" button)
  async updateProfile(userId: string, newName: string) {
    const event = new UserProfileUpdatedEvent({
      payload: {
        userId, 
        name: newName 
      }
    });

    // Publishes the event, without knowing who will handle it
    await this.eventBus.publish(event); 
}

  // Method called by a local action (e.g., a theme switch)
  async changeTheme(theme: 'light' | 'dark') {
    const event = new ThemeChangedEvent({
      payload: { newTheme: theme }
    });
    await this.eventBus.publish(event);
  }
}
```

### 3\. Listening to events in other classes

Who's on the other end of the line?

In the next example we'll define another class listening for updates on the event bus.

```typescript

// A component that reacts to the profile update
export class ToasterViewModel {
  toastText = "";

  constructor(private eventBus: HybridEventBusInterface) {
    this.makeReactiveProperties("toastText");
  }

  private subscribeToProfileEvents() {
    const unsubscribeProfileUpdated = this.eventBus
      .registerLocalHandler<"UserProfileUpdated", UserProfileUpdatedPayload>(
        "UserProfileUpdated",
        (userEvent) => {
          // userEvent is correctly typed and you can use its payload
          this.toastText = `${user.payload.userId} changed name into ${user.payload.name}`;
        }
      );

    return () => {
      unsubscribeProfileUpdated();
    }
  }
}
```

Then, in the related view:

```tsx
const ToasterView: FC = () => {
  // instantiate the ViewModel class
  const viewModelRef = useRef(new ToasterViewModel(eventBus));

  const {
    state: {
      toastText, // get the reactive property from a state slice
    },
  } = useReactiveInstance(
    viewModelRef.current,
    ({ toastText }) => ({ toastText }),
    ["toastText"],
  )

  useEffect(() => {
    // call the subscription method from the ViewModel
    const unsubscribe = viewModelRef.current.subscribeToProfileEvents();
    return unsubscribe; // IMPORTANT: always perform cleanup to avoid memory leaks
  }, []);

  return (
    // render the reactive property
    <ToasterUI message={toastText} />
  )
}
```

The reason we subscribed inside the `useEffect` is: **cleanup**. We cannot simply subscribe to the event bus in the class constructor and call it a day, or we'll introduce memory leaks. 

By subscribing to events inside the useEffect, we can guarantee the cleanup function is called on component unmount. And this is the only no-nonsense responsibility a component should have in this kind of logics.

**Note**: for this simple example, we assumed the ViewModel and the Event Bus stay in the same "place" (same repo, or same "app" if using a monorepo). If they live in different packages, just pass `eventBus` to the ViewModel constructor as an injected dependency. You can use a Generic Context to provide the Event Bus to the whole app, and pass it to the ViewModel from the View, should the necessity arise.

## Why "Hybrid" in the Frontend?

The term "Hybrid" means that the Event Bus manages two critical paths in parallel:

1.  **Local reactions:** Fast UI updates or in-memory state changes.
2.  **Remote persistence:** Sending to the backend (API) to save or synchronize data.

This separation is crucial. A server error (e.g., 500) intercepted by the remote path **DOES NOT** prevent the execution of local handlers. 

## The benefits of Total Decoupling: location independence

The total decoupling achieved by the Event Bus offers a strategic advantage that is virtually impossible to replicate with state-centric architectures like Redux or React Context: **the ability to seamlessly relocate logic between the client and a remote server.**

### The Contract, not the location

In an Event-Driven Architecture, the Services (the Handlers) only care about the **Contract** of the event — its `type` and `payload`. They do not know, nor do they need to know:

1.  **Who** generated the event (e.g., a button click in React, or a scheduled job on a server).
2.  **Where** the event was generated (Client-side ViewModel vs. a Serverless Function).

### How it enables flexibility

If a piece of logic becomes too complex, too resource-intensive, or requires access to sensitive data, you can move it on the backend.

1.  **Move the logic to the Backend:** take the complex piece of logic that was executed in a local handler, and instead of registering it in the frontend's in-memory bus, run it on a server (e.g., a Node.js worker or a Serverless Function). If the logic published an event when running on the client side... it will just do the same when running server side! The remote event bus can route the event to our client application via a socket, for example.
2.  **The client doesn't change:** all the remaining parts of the application that stay on the client will just naturally react to the events being sent by the server and received via the `receiveFromRemote` method of the Hybrid Event Bus.

This **location independence** allows for fine-grained performance tuning and security improvements without requiring sweeping refactors of the client-side components that depend on the outcome.

## Key Takeaways for Clean Architecture

The Event Bus radically simplifies application architecture by enforcing the Dependency Inversion Principle, where components rely only on abstractions, not concrete implementations. This achieves several crucial benefits:

* **Eliminates Global State Dependency:** the Event Bus ensures that the View, ViewModels, and Services are entirely decoupled from the application's internal state implementation. Instead of creating dependencies on a large, volatile global store (like Redux or a bulky Context), components only rely on listening for **granular data events**. This prevents the classic anti-pattern where a component connects to a massive store simply to access one small, specific field.
* **Enforces Mediator Pattern:** the Bus acts as the sole mediator. This eliminates the need for ViewModels and Services to create complex, tangled dependency graphs between their methods. It allows for a straightforward Pub/Sub communication model without forcing components to know about each other's existence or internal APIs.
* **Facilitates Isolation and Testing:** because each "piece" (Service or ViewModel) only needs the Bus abstraction to communicate, it can be cleanly isolated and swapped out at any time. This dramatically simplifies unit testing, as you only need to mock the `HybridEventBusInterface` to test the logic of the component, rather than setting up an entire mocked global state tree. 
