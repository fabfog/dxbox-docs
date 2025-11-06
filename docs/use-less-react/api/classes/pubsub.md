# PubSub and GenericPubSub

Lightweight reactive event emitter designed for fine-grained UI reactivity and class-based data models.

`GenericPubSub<T>` is just a generic version of PubSub, for when you need to explicitly define the notifiable keys.

---

## Overview

`PubSub` implements a minimal **publish/subscribe** mechanism that allows any class to notify observers when one or more of its properties change.  
It’s the core of the reactivity model used in **use-less-react**, enabling efficient data flow between stores and UI components without redundant renders.

## Define a class extending PubSub

```ts
import { PubSub } from '@dxbox/use-less-react/classes';

class Counter extends PubSub {
  count = 0;

  increment() {
    this.count++;
    // you can use the notify method from PubSub or a decorator (see next)
    this.notify('count');
  }
}

const counter = new Counter();
```

## Connect the class to a React component via the useReactiveInstance hook

```ts
import { useReactiveInstance } from '@dxbox/use-less-react/hooks';

function CounterComponent({ counter }: { counter: Counter }) {
  const { state: count } = useReactiveInstance(
    counter,
    (instance) => instance.count,
    ['count'],
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
    </div>
  );
}
```

import PubSubPlayground from '../../playgrounds/pubsub';

<PubSubPlayground />

---

### Notify changes on attributes

```ts
counter.notify("count"); // notify single attribute
sprite.notify("x", "y"); // notify multiple attributes
```

### Subscribe to changes

```ts
sprite.subscribe((propNames) => {
  // do something with the notified propNames, i.e.
  if (propNames.includes("x")) {
    const x = sprite.x; // retrieve value
    // do something with x
  }
});
```
The `subscribe` method returns all the notified attributes. It doesn't return values, you have to get them manually if you need them.

### Use onNotify

```ts
sprite.onNotify(["x"], ({ x }) => {
  // do something with x
});
```
The `onNotify` method returns all the notified attributes in a key-value object.

### Notify a derived value calculated via a get method

Let's say you have a class using a get method like this:

```ts
export class Sprite extends PubSub {
  private x = 0;
  private y = 0;

  public get position() {
    return { x: this.x, y: this.y };
  }

  @Notifies("position")
  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
```
When `setPosition` notifies `position`, everything will work like with a standard class attribute. So you can define derived values, notify them, and let `useReactiveInstance` know their value has changed, like any other attribute.

## Notes

- `PubSub` is **agnostic** to the UI layer — it can be used in React, Node.js, or any JS runtime.
- Use decorators like `@Notifies` and `@DependsOn` to integrate smoothly with reactivity systems.
- Combine with the `@ImmutableClass` decorator for safer state updates in development.
