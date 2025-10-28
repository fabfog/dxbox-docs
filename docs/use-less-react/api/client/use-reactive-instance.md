# `useReactiveInstance`

## Overview

`useReactiveInstance` is a React hook that binds a reactive class (extending `PubSub` or `PubSubMixin`) to a React component. It allows your UI to automatically update when one or more reactive properties of the class change.

This hook bridges the gap between **object-oriented state management** and React’s declarative rendering model — without relying on dedicated state libraries or context boilerplate.

It uses [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) under the hood to ensure reactivity of the returned values and avoid [tearing](https://github.com/reactwg/react-18/discussions/69).

It should be given an array of dependencies as last param to make sure that updates from your reactive instances propagate to React only when relevant data changes, minimizing unnecessary re-renders and improving performance.

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
  const { state: count, instance } = useReactiveInstance(
    () => new Counter(),
    (instance) => instance.count,
    ["count"] // the dependencies of the getSnapshot function
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => instance.increment()}>+</button>
    </div>
  );
}
```

In this example:
- The `Counter` class is reactive because it extends `PubSub` and uses the `@Notifies` decorator.
- The React component listens to updates for the `count` key.
- When `increment()` is called, `useReactiveInstance` automatically triggers a re-render of the component.

import PubSubPlayground from '../../playgrounds/pubsub';

<PubSubPlayground />

---

## Parameters

```ts
const { state, instance } = useReactiveInstance<
  TClass extends Subscribable,
  K extends (keyof TClass)[],
  RType extends SnapshotProps,
>(
  instanceGetter: TClass | (() => TClass),
  getSnapshot: GetSnapshot<TClass, RType>,
  dependencies: K,
);
```

| Parameter | Type | Required | Description |
|------------|------|-----------|-------------|
| `instanceGetter` | `TClass \| (() => TClass)` | ✅ | An instance, or a function returning a new instance of your reactive class. If a function is passed, it’s invoked only once per component lifecycle.|
| `getSnapshot` | `GetSnapshot<TClass, RType>` | ✅ | A function returning a state made of primitive values (`string`, `number`, `boolean`, `symbol`, or objects and arrays made of primitive or composed values. TLDR: don't return class instances here)
| `keys` | `(keyof TClass)[]` | ✅ | The list of reactive property keys you want the component to listen to. |

---

## Return type

| Property | Type | Description |
|-----------|------|-------------|
| `state` | `RType extends SnapshotProps` | The snapshot returned by the function specified in the second argument. |
| `instance` | `TClass` | The original instance of the reactive class (generic `TClass`). Use it to call methods, or read non-reactive fields.|

---

## Notes

- `useReactiveInstance` does **not** modify the class itself — it only listens to property notifications emitted by the instance.
- You can safely use multiple instances of the same reactive class in different components; each will have isolated reactivity.
- The hook internally uses React’s `useState` and `useEffect` to maintain synchronization, ensuring full compatibility with concurrent rendering and SSR environments.
- Works seamlessly with `ImmutableClass` and `DependsOn` decorators.
