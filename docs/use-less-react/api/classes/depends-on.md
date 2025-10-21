# `@DependsOn`

### Overview
The `@DependsOn` decorator establishes **reactive dependencies** between getters of a class that extends `PubSub` or `PubSubMixin`.  
When one or more dependent properties are updated and notified, all computed properties that depend on them are automatically notified as well.

This makes it possible to define reactive relationships **declaratively** within the class, improving consistency and reducing boilerplate code.

### Example

Let's say you have a derived attribute based on the values of other attributes, and calculated via a `get` method, for example:
```ts
export class Person extends PubSub {
  constructor(public firstName: string, public lastName: string) {
    super();
  }

  @Notifies("firstName")
  public setFirstName(firstName: string) {
    this.firstName = firstName;
  }

  @Notifies("lastName")
  public setLastName(lastName: string) {
    this.lastName = lastName;
  }

  // fullName is a derived value of firstName and lastName
  public get fullName() {
    return [this.firstName, this.lastName].join(" ")
  }
}
```
In this case, you don't want to add `fullName` to the `Notifies` decorators of `setFirstName` and `setLastName`. It would work, of course, but it's repetitive and it requires `setFirstName` and `setLastName` to know what are the derived values that depend upon them. This is conceptually wrong: it's a responsibility of the derived value to know on what base values it depends on, not vice versa.

So in these cases, just use the `DependsOn` decorator:

```ts
export class Person extends PubSub {
  // ...

  @DependsOn("firstName", "lastName")
  public get fullName() {
    return [this.firstName, this.lastName].join(" ")
  }
}
```
By doing so, whenever `firstName` or `lastName` will be notified, also `fullName` will be notified.

### Properties
| Property | Type | Description |
|-----------|------|-------------|
| dependencies | `(keyof TClass)[]` | The list of class properties or getters this property depends on. |

### Notes
- Works only on classes extending or mixing in `PubSub`.
- Dependency tracking is stored in a shared `WeakMap` to avoid memory leaks.
- Circular dependencies must be avoided, as they can cause infinite notification loops.

## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
- [`PubSubMixin`](/docs/use-less-react/api/classes/pubsub-mixin)
