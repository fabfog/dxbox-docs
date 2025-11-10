# State (Finite State Machine)

The FSM suite provides the contracts and context implementation necessary to apply the **State Design Pattern** to complex flows (such as authentication or onboarding). This approach ensures clear, separate, and highly testable logic.

---

## 1. FSM Types (Logic Contracts)

These types define the contract that your FSM must respect, guaranteeing Type Safety throughout the entire flow.

### `FSMStateConfig<TName, TPayload>`

This is the base configuration type that defines the entire set of states and associated actions.

| Parameter | Description |
| :--- | :--- |
| `TName` | The literal union (string) of all possible state names (e.g., `'login' \| 'authenticated'`). |
| `TPayload` | The union of all *payloads* (objects) that can be sent to the `dispatch` method for that state. |

### `FSMState<TStateConfig>`

This is the contract that **every concrete state class** (e.g., `LoginState`, `AuthenticatedState`) must implement.

| Member | Type | Description |
| :--- | :--- | :--- |
| `name` | `TName` (Literal) | The unique name of the state (e.g., `'login'`). |
| `isFinal` | `boolean` | Indicates whether the state is terminal. |
| `handleNext` | `(context, payload) => Promise<void>` | **The core of the logic.** Defines how the current state responds to a payload. It is the only place the state can call `context.transitionTo(newState)`. |
| `onEnter?` | `(context) => Promise<void>` | **(Optional)** Executed immediately and asynchronously when entering the state. Ideal for loading data or executing immediate validations. |

### `FSMContext<TConfig>`

This is the contract that defines the state machine's control capabilities, implemented by the `FSMContextManager` class.

| Member | Type | Description |
| :--- | :--- | :--- |
| `dispatch<T>(payload)` | `(payload) => Promise<void>` | Method used to send an action (or "event") to the FSM. Generic typing (`T`) ensures the *payload* is correct for the state. |
| `transitionTo(state)` | `(state) => void` | Internal method used by `handleNext` or `onEnter` to change the state. |

---

## 2. The `FSMContextManager` Class

The `FSMContextManager` class is the concrete runtime of the FSM. It inherits from `PubSub` for reactivity and implements the `FSMContext` contract.

### Declaration

```typescript
export class FSMContextManager<
    TConfig extends FSMStateConfig<PropertyKey, unknown>,
  >
  extends PubSub
  implements FSMContext<TConfig>
{ /* ... */ }
````

### Members and Methods

#### Constructor

```typescript
constructor(initialState: FSMState<TConfig>)
```

The constructor is **synchronous**; it sets the initial state and the `isInitialized` flag to `false`.

#### `initialize(): Promise<this>`

This **asynchronous** method must be called immediately after instantiation.

  * It initiates the transition flow by calling `transitionTo(initialState)`, ensuring that the initial state's potential `onEnter` is executed asynchronously.
  * It sets `this.isInitialized = true` to prevent multiple initializations.

```typescript
// Example usage:
const manager = new FSMContextManager();
// Essential call to start the FSM
await manager.initialize(); 
```

or, since initialize returns `this`:

```typescript
const manager = await new FSMContextManager().initialize();
```

#### `dispatch<T extends keyof TConfig>(payload: TConfig[T]): Promise<void>`

The *gateway* of the state machine. It delegates the action handling to the `handleNext` method of the **current state** (`this._currentState`). The use of `TConfig[T]` ensures the payload sent is correct for the specified action type.

#### `transitionTo(state: FSMState<TConfig>): Promise<void>`

This method handles the state change:

1.  Updates `this._currentState`.
2.  Executes the decorator **`@Notifies("currentState")`**, making the state change visible to all `PubSub` consumers (like `useReactiveInstance`).
3.  If the new state has an **`onEnter`** method, it executes it and awaits its completion.
