# `SerializableClass`

### Overview
The `@SerializableClass` decorator is a **meta-decorator** used to mark classes as serializable.  
It does not modify runtime behavior, but serves as a **developer hint and validation tool** to ensure the class implements `hydrate` and `dehydrate` methods correctly.

### Example

```ts
@SerializableClass()
class UserStore {
  name = "John";

  hydrate(data) {
    this.name = data.name;
  }

  dehydrate() {
    return { name: this.name };
  }
}
```

If the class is missing either `hydrate` or `dehydrate`, a warning or error can be triggered at runtime or build time, depending on configuration.

### Properties
| Property | Type | Description |
|-----------|------|-------------|
| — | — | This decorator takes no arguments. |

### Notes
- Purely declarative — used for static analysis or runtime validation.
- Encourages consistent serialization patterns across the app.
- Useful in combination with `createHydrationContext` to rehydrate data from the server.

## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
- [`PubSubMixin`](/docs/use-less-react/api/classes/pubsub-mixin)
