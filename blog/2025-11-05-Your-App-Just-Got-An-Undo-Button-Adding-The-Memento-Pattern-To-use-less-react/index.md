---
slug: your-app-just-got-an-undo-button-adding-the-memento-pattern-to-use-less-react
authors: [fabfog]
date: "2025-11-05"
tags: [use-less-react]
---

# Your App Just Got an Undo Button: Adding the Memento Pattern to use-less-react

I'm thrilled to announce that the **Memento Pattern** is now officially supported and deeply integrated into the core of `use-less-react`! (from [v0.6.0](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.6.0))

Read the technical documentation <a href="/docs/use-less-react/api/prefabs/memento" target="_blank">here</a>!

This means adding robust "Undo" and "Redo" functionality to your complex state managers has never been easier, allowing your users to step back in time with a single click.

## Wait, What is the Memento Pattern?

Imagine you're designing a complex graphics editor, a state-heavy spreadsheet, or even just a simple text input. Your user makes a mistake. They expect to hit `Ctrl+Z` (or `Cmd+Z`) and revert their action.

<!-- truncate -->

The **Memento Pattern** is the design magic that makes this happen. It works with:

1.  an **Originator**: the object whose state needs to be saved (e.g., your `Document` class or `Counter` logic).
2.  a **Memento** (*actually a lot of them*): the snapshot of the Originator's state at a given moment in time.
3.  a **Caretaker**: the history manager. It decides *when* to save the Memento and keeps a chronological stack of all Mementos, handling the logic for moving the pointer back (Undo) and forward (Redo).

And know what? The Caretaker never sees the internal structure of the Originator's state, preserving encapsulation!

## Two Flavors of Time Travel: Base vs. Diff

When designing an Undo/Redo mechanism, you face a trade-off between **simplicity** and **performance**. `use-less-react` provides a generic solution for both:

### 1. Base Memento (The Versatile Snapshot)

* **How it works:** The `BaseOriginator` uses the generic type `TMemento` for history.
    * **Default Behavior:** If you omit the type, `TMemento` defaults to the full state (`TState`), creating a simple **full state snapshot**.
    * **Advanced Use:** You can specify `TMemento` to be a **subset** of the state (omitting data not necessary for history) or a **superset** (adding metadata, like a timestamp). It's the simplest method for most applications.
* **Best for:** Simple and medium-sized states, where the speed of implementation outweighs minor memory overhead.

### 2. Diff Memento (The High-Performance Delta)

* **How it works:** The Memento saves only the **difference (the delta or "diff")** between the current state and the previous state.
* **Best for:** Massive state objects (e.g., a complex JSON tree). By only saving the small change, you drastically save memory and make history navigation **ultra-fast**.

---

## 🔥 Look How Easy This Is: Memento in Action

Thanks to our abstract base classes (`BaseOriginator`, `DiffCaretaker`, etc.), adding Memento support requires only implementing two or three specific methods on your state class.

### Example A: Simple Text Editor (Using Base Memento)

Here, we extend `BaseOriginator` and use the full state as the Memento (default snapshot behavior).

```typescript
import { BaseCaretaker, BaseOriginator, RestoreMementoAction } from "@dxbox/use-less-react";

// 1. Define the State
export interface TextEditorState {
  text: string;
}

// 2. Implement the Originator (Responsible for state capture/restore)
// TMemento is not specified, therefore it's defaulted to TextEditorState
export class TextEditorOriginator extends BaseOriginator<TextEditorState> {
  // Internal state
  _text: string = "";

  set text(v: string) {
    this._text = v;
    this.notify("text");
  }

  override getState(): TextEditorState {
    // Crucial for immutability: returns a new object.
    return { text: this.text };
  }

  // 3. Base Memento: The Memento is the full state itself (snapshot).
  // This is the default TMemento behavior.
  override getMemento(state: TextEditorState): TextEditorState {
    return state;
  }

  // 4. Restore: Simply replace the state with the snapshot.
  public restoreMemento(memento: TextEditorState): void {
    this.text = state.text;
  }
}

// 5. The Caretaker: Just instantiate the generic BaseCaretaker!
export class TextEditorCaretaker extends BaseCaretaker<
  TextEditorState,
  TextEditorOriginator
> {
  constructor(originator: TextEditorOriginator) {
    super(originator);
  }}
```

### Example B: High-Performance Counter (Using Diff Incremental)

This demonstrates using the `DiffOriginator` and an external library (`jsondiffpatch`) to save only the byte-level changes between states, making history ultra-lightweight.

```typescript
import {
  DiffCaretaker,
  DiffOriginator,
  Notifies,
  RestoreMementoAction,
} from '@dxbox/use-less-react/classes';

import { Delta, diff, patch, unpatch } from 'jsondiffpatch';

// 1. Define the State and the Memento (The Diff object)
export interface TextEditorState {
  text: string;
}

export interface TextEditorMemento {
  delta: Delta; // Delta is the type used by jsondiffpatch for the difference object
}

// 2. Implement the Originator (Responsible for diff calculation and patching)
export class TextEditorOriginator extends DiffOriginator<TextEditorState, TextEditorMemento> {
  _text: string = '';

  get text() {
    return this._text;
  }

  set text(v: string) {
    this._text = v;
    this.notify('text');
  }

  override getState(): TextEditorState {
    return { text: this.text };
  }

  // 3. Diff Memento: Calculate the structural difference between current and previous states.
  override getMemento(
    state: TextEditorState,
    _prevState: TextEditorState | null,
  ): TextEditorMemento | null {
    const previousState = _prevState ?? { text: '' };
    const delta = diff(previousState, state);
    
    // Only save history if there was an actual difference (delta is defined).
    if (!delta) return null; 
    
    return { delta };
  }

  // 4. Restore: Use unpatch for UNDO (revert the change) and patch for REDO (re-apply the change).
  override restoreMemento(memento: TextEditorMemento, action: RestoreMementoAction): void {
    if (action === RestoreMementoAction.Undo) {
      // UNDO: Revert the delta from the current state.
      const newState = unpatch(this.getState(), memento.delta) as TextEditorState;
      this.text = newState.text;
    } else {
      // REDO: Apply the delta to the current state.
      const newState = patch(this.getState(), memento.delta) as TextEditorState;
      this.text = newState.text;
    }
  }
}

// 5. The Caretaker: Manages history and exposes a convenience setter.
export class TextEditorCaretaker extends DiffCaretaker<
  TextEditorState,
  TextEditorOriginator,
  TextEditorMemento
> {
  constructor(originator: TextEditorOriginator) {
    super(originator);
  }
}
```

### Final Step: UI Integration (React)

This React component shows how to consume the `TextEditorCaretaker` using the `useReactiveInstance` hook, binding a text area to the state and enabling the Undo/Redo buttons by checking `canUndo` and `canRedo`.

Look how easy it is.

```typescript
'use client';

import { useReactiveInstance } from '@dxbox/use-less-react/client';
import { FC, useRef } from 'react';
import {
  TextEditorCaretaker,
  TextEditorOriginator,
} from '@/modules/text-editor/text-editor.classes';

export const TextEditorConnector: FC = () => {
  const originator = useRef(new TextEditorOriginator());

  const {
    state: { canUndo, canRedo },
    instance: textEditor,
  } = useReactiveInstance(
    () => new TextEditorCaretaker(originator.current),
    ({ canUndo, canRedo }) => ({
      canUndo,
      canRedo,
    }),
    ['canUndo', 'canRedo'],
  );

  // Originator is a distinct PubSub instance, so we listen to it separately!
  const {
    state: { text },
  } = useReactiveInstance(
    originator.current,
    ({ text }) => ({
      text,
    }),
    ['text'],
  );

  return (
    <div className="grid grid-cols-3">
      <textarea
        className="border"
        placeholder="write here..."
        value={text}
        onChange={(e) => (textEditor.originator.text = e.target.value)}
      />
      <div className="">
        <button className="mx-2 border p-2" type="button" onClick={() => textEditor.saveState()}>
          save
        </button>
        <button
          className={`mx-2 border p-2 ${!canUndo && 'opacity-50'}`}
          type="button"
          disabled={!canUndo}
          onClick={() => textEditor.undo()}
        >
          undo
        </button>
        <button
          className={`mx-2 border p-2 ${!canRedo && 'opacity-50'}`}
          type="button"
          disabled={!canRedo}
          onClick={() => textEditor.redo()}
        >
          redo
        </button>
      </div>
    </div>
  );
};
```
Of course this is a super-basic example. Go ahead and implement automatic saveState on blur, with a debounce, or whatever you like!

## Ready to Give Your Users an Undo Button?

With the Memento Pattern fully integrated into `use-less-react`, you can now focus purely on your application logic, letting the framework handle the heavy lifting of history management.

**Just try it\!** Implement an `Originator` and attach a `Caretaker`. Your users (and their ability to recover from mistakes) will thank you.
