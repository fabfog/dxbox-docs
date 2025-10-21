# `createGenericContext`

### Overview
`createGenericContext` is a generic utility that simplifies the creation of React contexts with full TypeScript type safety.  
It provides both a `Provider` component and a corresponding hook that ensures the context is only accessed within its own provider.

### Example

```tsx
const [UserProvider, useUser] = createGenericContext<{ user: User }>();

function App() {
  // if App runs client-side, we will use useRef to avoid creating instances of User at every render
  const userRef = useRef(new User());

  return (
    <UserProvider value={userRef.current}>
      <Profile />
    </UserProvider>
  );
}

// Use the context safely inside child components
function Profile() {
  const userInstance = useUser();

  // useReactiveInstance for reactivity
  const { state: user } = useReactiveInstance(userInstance, ["name", "age"]);

  return <div>{user.name} is {user.age} years old</div>;
}
```

You can also use `createGenericContext` for sharing any other kind of data: objects, arrays, numbers, strings, etc. For example:

```ts
// when defining the context
const [LogConfigProvider, useLogConfig] = createGenericContext<{ enableLog: boolean }>();

// when retrieving the context data in the component
const logConfig = useLogConfig();
```

But keep in mind that you have to be careful about how you pass the context value to the provider. You will probably need to use `useMemo` to share objects and arrays without changing their references at every render:

```ts
function App() {
  const logConfig = useMemo(() => {
    return {
      enableLog,
      otherValue,
      ...
    }
  }, [enableLog, otherValue, ...]);

  return (
    <LogConfigProvider value={logConfig}>
      // ...
    </LogConfigProvider>
  )
}
```
Just basic React here.

### Properties

| Property / Return | Type | Description |
|--------------------|------|--------------|
| `GenericContext` | `Context<T \| null>` | The internal context object created with `createContext`. |
| `GenericContextProvider` | `FC<PropsWithChildren<{ value: T }>>` | A provider component that exposes the context value to its children. |
| `useGenericContext()` | `() => T` | Hook to access the context value. Throws an error if called outside of its provider. |
| **Return value** | `[GenericContextProvider, useGenericContext]` | A tuple containing both the provider and the hook. |

### Notes
- The value passed to the provider should be stored inside a `useRef` if the reference should remain stable across renders.
- The hook enforces safety by throwing an error if called outside of its context provider.

## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
- [`PubSubMixin`](/docs/use-less-react/api/classes/pubsub-mixin)
