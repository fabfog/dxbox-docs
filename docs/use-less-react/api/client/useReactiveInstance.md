# useReactiveInstance

> Lightweight reactive event emitter designed for fine-grained UI reactivity and class-based data models.

---

## Overview

`PubSub` implements a minimal **publish/subscribe** mechanism that allows any class to notify observers when one or more of its properties change.  
It’s the core of the reactivity model used in **use-less-react**, enabling efficient data flow between stores and UI components without redundant renders.

---

## Example

```ts
class Counter extends PubSub {
  count = 0;

  increment() {
    this.count++;
    this.notify("count");
  }
}

const counter = new Counter();

counter.onNotify(["count"], ({ count }) => {
  console.log("Count changed:", count);
});

counter.increment(); // → "Count changed: 1"
```

---

## Constructor

```ts
new PubSub()
```

Creates a new `PubSub` instance with an empty listener registry.

---

## Properties

| Name | Type | Description |
|------|------|-------------|
| `listeners` | `Map<string, Set<Function>>` | Internal map of event names to sets of subscriber callbacks. |

---

## Methods

### `subscribe(event: string, callback: Function): void`

Registers a listener for a given event name.

```ts
pubsub.subscribe("update", data => console.log(data));
```

| Param | Type | Description |
|-------|------|-------------|
| `event` | `string` | The event name. |
| `callback` | `Function` | The function to invoke when the event is triggered. |

---

### `unsubscribe(event: string, callback: Function): void`

Removes a previously registered listener.

---

### `notify(event: string, payload?: any): void`

Invokes all listeners associated with the given event.

```ts
pubsub.notify("update", { foo: 42 });
```

| Param | Type | Description |
|-------|------|-------------|
| `event` | `string` | The event name. |
| `payload` | `any` | Optional data passed to subscribers. |

---

## Notes

- `PubSub` is **agnostic** to the UI layer — it can be used in React, Node.js, or any JS runtime.
- Use decorators like `@Notifies` and `@DependsOn` to integrate smoothly with reactivity systems.
- Combine with the `@ImmutableClass` decorator for safer state updates in development.

<!-- ---

## See Also

- [`@Notifies`](./decorators#notifies)
- [`@DependsOn`](./decorators#dependson)
- [`PubSubMixin`](./mixins.md#pubsubmixin)
- [`ImmutableClass`](./decorators#immutableclass) -->
