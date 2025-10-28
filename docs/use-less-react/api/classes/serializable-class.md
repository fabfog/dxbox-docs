# `@SerializableClass`

### Overview
The `@SerializableClass` decorator is a **meta-decorator** used to mark classes as serializable.  
It does not modify runtime behavior, but serves as a **developer hint and validation tool** to ensure the class has a `serialName` static const and implements `hydrate` and `dehydrate` methods correctly.

### Example

```ts
@SerializableClass()
class UserStore {
  name = "John";

  static readonly serialName: string = "UserStore";

  static hydrate(data: object): UserStore {
    this.name = data.name;
  }

  dehydrate(): object {
    return { name: this.name };
  }
}
```

If the class is missing either `serialName`, `hydrate` or `dehydrate`, a warning or error will be triggered at build time.
Please note what follows:
1. the value of `serialName` can be whatever you want
2. you should define `serialName` as `readonly` so it cannot be changed by accident
3. you should define `serialName` as `string` or TypeScript will infer its value as its type (because it's static)
4. when adding a class to `serializableClassesRegistry`, use `serialName` as key (see below)

### Properties
| Property | Type | Description |
|-----------|------|-------------|
| — | — | This decorator takes no arguments. |

### Notes
- Purely declarative — used for static analysis or runtime validation.
- Encourages consistent serialization patterns across the app.
- Useful in combination with `createHydrationContext` to rehydrate data from the server.
