# `useReactiveInstance`

## Overview

`useReactiveInstance` is a React hook that binds a reactive class (extending `PubSub` or `PubSubMixin`) to a React component. It allows your UI to automatically update when one or more reactive properties of the class change.

This hook bridges the gap between **object-oriented state management** and React’s declarative rendering model — without relying on dedicated state libraries or context boilerplate.

It uses [`use-immer`](https://www.npmjs.com/package/use-immer) under the hood to ensure immutability of the returned values, in order to guarantee reactivity.

It ensures that updates from your reactive instances propagate to React only when relevant data changes, minimizing unnecessary re-renders and improving performance.

---

## Example

```tsx
import { useReactiveInstance } from "use-less-react";
import { PubSub, Notifies } from "use-less-react";

class Counter extends PubSub {
  count = 0;

  @Notifies("count")
  increment() {
    this.count++;
  }
}

export function CounterComponent() {
  const { state, instance } = useReactiveInstance(() => new Counter(), ["count"]);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => instance.increment()}>+</button>
    </div>
  );
}
```

In this example:
- The `Counter` class is reactive because it extends `PubSub` and uses the `@Notifies` decorator.
- The React component listens to updates for the `count` key.
- When `increment()` is called, `useReactiveInstance` automatically triggers a re-render of the component.

---

## Return type

| Property | Type | Description |
|-----------|------|-------------|
| `state` | `Pick<TClass, TDep>` | A snapshot of the reactive properties specified in the second argument. React components can safely read from it without causing extra reactivity. |
| `instance` | `TClass` | The original instance of the reactive class (generic `TClass`). Use it to call methods, or read non-reactive fields.|

---

## Parameters

```ts
const { state, instance } = useReactiveInstance<T>(
  instanceGetter: instanceGetter: TClass | (() => TClass),
  keys: (keyof TClass)[]
);
```

| Parameter | Type | Required | Description |
|------------|------|-----------|-------------|
| `instanceGetter` | `TClass | (() => TClass)` | ✅ | An instance, or a function returning a new instance of your reactive class. If a function is passed, it’s invoked only once per component lifecycle.|
| `keys` | `(keyof TClass)[]` | ✅ | The list of reactive property keys you want the component to listen to. |

---

## Notes

- `useReactiveInstance` does **not** modify the class itself — it only listens to property notifications emitted by the instance.
- You can safely use multiple instances of the same reactive class in different components; each will have isolated reactivity.
- The hook internally uses React’s `useState` and `useEffect` to maintain synchronization, ensuring full compatibility with concurrent rendering and SSR environments.
- Works seamlessly with `ImmutableClass` and `DependsOn` decorators.

---

## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
- [`PubSubMixin`](/docs/use-less-react/api/classes/pubsub-mixin)
