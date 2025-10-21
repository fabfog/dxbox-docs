# `@ImmutableClass`

### Overview

`ImmutableClass` is a utility decorator designed to **freeze all instance attributes** of a class immediately after construction.  
This helps enforce immutability and prevents accidental mutations to internal state — particularly useful in architectures where **state reactivity** (e.g. via React or other reactive systems) must remain predictable and consistent.

```ts
import { ImmutableClass } from "../utils/ImmutableClass";

@ImmutableClass()
class MyStore {
  data = { count: 0 };
}
```

### How it works

The decorator returns a subclass of your class that overrides its constructor.  
After calling `super(...)`, it iterates over all **own properties** of the instance and applies [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to each of them, recursively going deeper into nested structures.

This ensures that any objects, arrays, or maps defined as instance fields become immutable once the instance is created.

### Why it’s separate from `PubSub`

`ImmutableClass` exists as a standalone decorator rather than being built into the `PubSub` constructor because:

- When applied directly inside `PubSub`, the freezing would **only affect properties defined in `PubSub` itself**, not those introduced later by subclasses or mixins.
- As a decorator, it can be applied **after** all subclass fields have been initialized, guaranteeing that **every property** on the final instance gets frozen.

### When to use it

Use `ImmutableClass` when you want to:

- Enforce immutability of instance data to prevent accidental side effects.
- Ensure that logics relying on **reactive state** (e.g. React components observing class fields) isn’t broken by direct mutation.
- Add an extra layer of safety to your data flow without modifying the core logics of your base classes or mixins.

It’s completely optional — you can apply it to any class or leave it out, depending on your use case.

### Example

```ts
@ImmutableClass()
class Store {
  user = { name: "Alice" };
}

const store = new Store();

store.user.name = "Bob"; // ❌ TypeError: Cannot assign to read only property
```

### Notes and Considerations

- `ImmutableClass` performs a **deep freeze** — it freezes deeply nested structures.
- It’s meant as a **development safeguard**, not a performance optimization. Use it to catch unintended state mutations early.
- You can disable its behaviour without manually removing it from your code, for example

  ```ts
  @ImmutableClass({ disabled: process.env.NODE_ENV === "production" })
  class SomeClass extends PubSub {
    ...
  }
  ```
- You can safely compose it with other decorators or mixins, e.g.:

  ```ts
  @ImmutableClass()
  class SomeClass extends PubSubMixin(BaseClass) {
    ...
  }
  ```

## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
- [`PubSubMixin`](/docs/use-less-react/api/classes/pubsub-mixin)
