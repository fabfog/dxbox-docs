# Memento

The Memento Pattern implementation in `use-less-react` (from [v0.6.0](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.6.0)) is split into two core strategies: **Base (Snapshot)** and **Diff (Incremental)**. Both implementations rely on abstract classes for the **Originator** (the state holder) and the **Caretaker** (the history manager).

---

## 1. Core Types

These types define the foundational structure for history management actions and caretaker properties.

| Type | Description |
| :--- | :--- |
| `TState` | The complete, internal state of the `Originator`. |
| `TMemento` | The object saved in history. **Defaults to `TState`**. Can be a subset, superset, or a diff object (delta). |
| `Originator` | The concrete `Originator` instance being managed. |

### `RestoreMementoAction`

This enum is crucial for the `Diff` strategy, indicating the direction of the state change.

```typescript
export enum RestoreMementoAction {
  Undo = "undo",
  Redo = "redo",
}
```

### `AbstractCaretakerProps`

Defines the core read-only properties available on any concrete Caretaker instance.

```typescript
interface AbstractCaretakerProps<TMemento, Originator> {
  history: TMemento[];       // The array of saved Memento objects.
  historyPointer: number;    // The current index in the history stack. -1 if empty or before the first state.
  originator: Originator;    // Read-only reference to the managed Originator.

  // Getter methods based on historyPointer and history. Depend on Base/Diff implementation
  canUndo: boolean;          
  canRedo: boolean;
}
```

### `AbstractOriginatorProps`

```typescript
export interface AbstractOriginatorProps<TState, TMemento>
  extends Subscribable {
  getState(): TState;
  restoreMemento(memento: TMemento, action: RestoreMementoAction): void;
}
```

-----

## 2\. Originator Classes

The Originator is responsible for deciding *what* to save (`getMemento`) and *how* to restore it (`restoreMemento`).

### 🅰️ `BaseOriginator<TState, TMemento>` (Snapshot)

This is the simpler interface, designed for saving full state copies (a simple snapshot), partial state copies (if you want to exclude some attributes from being tracked into the history) or a superset of state copies (if you want to add let's say a timestamp or some other metadata).

| Method | Signature | Description |
| :--- | :--- | :--- |
| `getState()` | `(): TState` | Returns a copy of the current internal state. |
| `getMemento(state: TState)` | `(state: TState): TMemento \| null` | **Required.** Generates the Memento object from the current state (e.g., returns the full state or a subset). |
| `restoreMemento()` | `(memento: TMemento, action: RestoreMementoAction): void` | **Required.** Restores the state from the Memento. |

### 🅱️ `DiffOriginator<TState, TMemento>` (Incremental)

This interface is designed for saving only the change between successive states (`delta`) and requires access to the previous state.

| Method | Signature | Description |
| :--- | :--- | :--- |
| `getMemento(state: TState, prevState: TState \| null)` | `(state, prevState): TMemento \| null` | **Required.** Calculates the difference (`diff`) between the current state and the previous state (`prevState`). Returns `null` if no change occurred. |
| `restoreMemento()` | `(memento: TMemento, action: RestoreMementoAction): void` | **Required.** Applies the `memento` (the delta) to the current state. Must contain conditional logic based on `action` (`Undo` vs `Redo`) to apply the delta forward or backward. |

-----

## 3\. Caretaker Classes

The Caretaker manages the history stack, pointer, and the `undo`/`redo` operations. It is automatically reactive using the `@Notifies` decorator.

### 🅰️ `BaseCaretaker<TState, Originator, TMemento>` (Snapshot)

Manages history composed of full state snapshots.

| Method | Description |
| :--- | :--- |
| `constructor(originator: Originator)` | Initializes the caretaker and calls `saveState()` once. |
| `saveState()` | Calls `originator.getMemento(currentState)` and pushes the snapshot to history, cutting off any `redo` history if the pointer is not at the end. |
| `undo()` | Decrements `historyPointer` and calls `originator.restoreMemento(memento, RestoreMementoAction.Undo)`. |
| `redo()` | Increments `historyPointer` and calls `originator.restoreMemento(memento, RestoreMementoAction.Redo)`. |

### 🅱️ `DiffCaretaker<TState, Originator, TMemento>` (Incremental)

Manages history composed of delta objects. It internally tracks `_previousState` to assist the `DiffOriginator`.

| Method | Description |
| :--- | :--- |
| `constructor(originator: Originator)` | Initializes, tracks the initial state, and calls `saveState()`. |
| `saveState()` | Calls `originator.getMemento(currentState, _previousState)` and pushes the resulting delta to history. **Updates `_previousState` for the next diff calculation.** |
| `undo()` | Decrements `historyPointer` and calls `originator.restoreMemento(memento, RestoreMementoAction.Undo)`. |
| `redo()` | Increments `historyPointer` and calls `originator.restoreMemento(memento, RestoreMementoAction.Redo)`. |
