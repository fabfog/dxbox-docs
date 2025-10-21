# `@Notifies`

## Overview

The `@Notifies` decorator is used to automatically trigger updates for one or more reactive properties in a class that extends `PubSub` or `PubSubMixin`.  
When a method decorated with `@Notifies` executes, the specified properties are re-evaluated, and subscribers (e.g., React components using `useReactiveInstance`) are notified of any changes.

This allows developers to focus on business logic without worrying about manually calling `notify()` for reactive updates.

---

## Example

```ts
class Counter extends PubSub {
  count = 0;

  @Notifies("count")
  increment() {
    this.count++;
  }

  @Notifies("count")
  reset() {
    this.count = 0;
  }
}

// Usage in React
const { state } = useReactiveInstance(() => new Counter(), ["count"]);
```

When `increment()` or `reset()` is called, any subscribed components will automatically re-render with the updated `count` value.

---

import NotifiesPlayground from '../../playgrounds/notifies';

<NotifiesPlayground />

---

## Parameters

| Parameter | Type | Description |
|------------|------|-------------|
| `keys` | `(keyof TClass)[]` | One or more property names to notify when the method executes. |

---

## When not to use `@Notifies`: conditional notifications

You should not use `@Notifies` when properties should be notified conditionally. For example:
```ts
class Counter extends PubSub {
  count = 0;

  @Notifies("count")
  setCount(value: number) {
    if (value > 0) {
      this.count = value;
    }
  }
}
```
Here, `@Notifies("count")` will trigger an unnecessary re-render if `setCount` is called with negative values. In this case, just call the `notify` method conditionally:
```ts
class Counter extends PubSub {
  count = 0;

  setCount(value: number) {
    if (value > 0) {
      this.count = value;
      this.notify("count");
    }
  }
}
```

## When not to use `@Notifies`: batched conditional notifications

Another example:
```ts
class SomeClass extends PubSub {
  propertyA = 0;
  propertyB = 0;

  @Notifies("propertyA", "propertyB")
  setProperties(a: number, b: number) {
    if (a > 10) {
      this.propertyA = a;
    }
    if (b < 11) {
      this.propertyA = b;
    }
  }
}
```
This last example requires the developer to keep an array of notified properties and call `notify` at the end of the method.

In fact, calling `notify` multiple times would cause unnecessary intermediate renderings:
```ts
class SomeClass extends PubSub {
  propertyA = 0;
  propertyB = 0;

  setProperties(a: number, b: number) {
    if (a > 10) {
      this.propertyA = a;
      this.notify("propertyA"); // not "wrong", but causes unnecessary re-rendering
    }
    if (b < 11) {
      this.propertyA = b;
      this.notify("propertyB"); // not "wrong", but causes unnecessary re-rendering
    }
  }
}
```

Instead, the most correct and efficient solution is:
```ts
class SomeClass extends PubSub {
  propertyA = 0;
  propertyB = 0;

  setProperties(a: number, b: number) {
    const propertiesToNotify: (keyof this)[] = [];
    if (a > 10) {
      this.propertyA = a;
      propertiesToNotify.push("propertyA");
    }
    if (b < 11) {
      this.propertyA = b;
      propertiesToNotify.push("propertyB");
    }
    if (propertiesToNotify.length) {
      this.notify(...propertiesToNotify);
    }
  }
}
```

---

## Notes

- The decorator works only on classes that extend or use `PubSub` (or its mixin).   
- It can notify multiple reactive properties if the method affects more than one field.  
- Notifications are synchronous by default.
- Works seamlessly with the `useReactiveInstance` hook in React.

---

## See Also

- [`@DependsOn`](./decorators.md#dependson-decorator)
- [`PubSub`](./pubsub.md)
- [`useReactiveInstance`](./useReactiveInstance.md)
