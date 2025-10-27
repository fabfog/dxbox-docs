---
slug: the-boilerplate-tax
title: The Boilerplate Tax 💸
authors: [fabfog]
date: "2025-10-24"
tags: [use-less-react]
---
# The Boilerplate Tax 💸

## How `use-less-react` finally fixes React's boilerplate tax and makes clean architecture practical.

You're a good developer. You believe in clean architecture. You've heard about separating your app into two "worlds":

1.  **the World of Presentation (the UI):** Your React components. The "Primary Adapter" that translates user clicks and keyboard tapping into application events.
2.  **the World of Logic (the Core):** Your business rules and application state. The pure TypeScript functions and classes that don't know or care about UI details.

You start building a new feature. Let's say, a simple dropdown menu.

*"This is just UI state,"* you think. *"It's simple. I'll just use `useState`."*

```tsx
function MyMenu() {
  const [isOpen, setIsOpen] = useState(false); // Local. Easy.

  return (
    <div>
      <button onClick={() => setIsOpen(o => !o)}>Toggle</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

This is clean & pragmatic. You're following the **"Principle of Least Height"**—keeping state as local as possible for as long as possible.

Then, a new requirement lands on your desk.

*"We're building a tutorial wizard, and it needs to be able to open that menu automatically to show the user where to click."*

**...And suddenly, your world falls apart.**

<!-- truncate -->

Your simple, local `isOpen` boolean is no longer local. It has to be shared. An external system (the tutorial) needs to control it.

You know what you're *supposed* to do. You have to "lift state."

## Lifting State

In "classic" React, lifting state usually isn't a small refactor. It's a rewrite that comes with boilerplate.

To share that *one boolean*, you now have to:

1.  Create a new file, let's say `menu-context.tsx`.
2.  Define an `interface` for the context's value.
3.  Call `createContext()`.
4.  Create a `MenuProvider` component that wraps `children` and manages the state.
5.  Create a custom `useMenu()` hook that consumes the context and checks for `undefined`.
6.  Go wrap your entire application in the new `<MenuProvider>`.
7.  Go back to your `MyDropdown` component and rip out `useState`, replacing it with `useMenu()`.

You just turned a single line of state into **30+ lines of code across 3-4 different files.**

We may call it the **Boilerplate Tax**.

It's so painful that most developers give up. They either 
1. violate the **YAGNI** ("You Ain't Gonna Need It") principle and put *everything* in a global state manager "just in case", or...
2. ...create a tangled mess of prop-drilling if the state must be lifted "just a little", or...
3. go copy an existing context because who the hell remembers the syntax and is willing to rewrite it all once again.

I'd pick option 4 and create a code generator with Plop, or something like that, but it's still sub-optimal, as it ends up introducing a good amount of lines of codes that are virtually identical from one context to another. It ends up violating the **DRY** ("Don't Repeat Yourself") principle in a way or another.

This is where `use-less-react` comes in.

## Refactoring Without the Friction

What if you could "lift state" without paying the tax? What if the refactor was so simple, you'd never hesitate to do it?

This is what `use-less-react` is designed for. It separates the **what** (your state & logics) from the **where** (your state's scope) and the **how** (the UI library that will consume your state and drive your logics).

### Step 1: Your Local State (the "before")

Let's start over. Instead of `useState`, we'll use `use-less-react` to define our state as a class.

```ts
// menu/menu-state.classes.ts
import { PubSub, Notifies } from '@dxbox/use-less-react/classes';

class MenuState extends PubSub{
  isOpen = false;

  @Notifies("isOpen")
  toggle() {
    this.isOpen = !this.isOpen;
  }
}
```

Easy to understand, right? Now let's connect it to the UI component:

```tsx
import { useReactiveInstance } from '@dxbox/use-less-react/client';

function MyDropdown() {
  // Create a LOCAL, reactive instance of this state.
  const { 
    state: isOpen,
    instance: menu,
    } = useReactiveInstance(
      () => new MenuState(),
      (instance) => instance.isOpen
      ["isOpen"]
    );

  return (
    <div>
      <button onClick={menu.toggle}>Toggle</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

This is just as clean as `useState`. It's local, it's simple, and it's fully self-contained.

### Step 2: The Refactor (The "After")

Now, the tutorial feature request comes in. We need to "lift" `MenuState`.

Watch how small the change is.

**1. Create a Generic Context:**
`use-less-react` gives you the building blocks. You just need to create a generic context for your state, and share it. Plug 'n' play.

```tsx
// menu-context.ts
import { createGenericContext } from '@dxbox/use-less-react/client';
import { MenuState } from './menu-state.classes';

const [MenuProvider, useMenu] = createGenericContext<MenuState>();

export { MenuProvider, useMenu };
```

**2. "Lift" the State in your app root:**
Move the instance creation from the component to the provider.

```tsx
import { MenuProvider } from './menu-context';
import { MenuState } from 'menu-state.classes.ts';

function MyApp({ Component, pageProps }) {
  const menu = useRef(new MenuState());
  return (
    // We provide the instance at the top.
    // The tutorial can now access this same instance.
    <MenuProvider value={menu.current}>
      ...
    </MenuProvider>
  );
}
```

**3. Change *one line* in your component:**
Swap the local hook for the context hook.

```tsx
import { useMenuState } from '../context';

function MyDropdown() {
  // Get the menu instance from useMenuState
  const menu = useMenuState();
  
   const { 
    state: isOpen,
  } = useReactiveInstance(
    menu, // pass the instance here instead of creating it via instance getter
    (instance) => instance.isOpen,
    ["isOpen"]
  );

  // The rest of the component is UNCHANGED.
  return (
    <div>
      <button onClick={menu.toggle}>Toggle</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

**That's it.**

We didn't write any boilerplate. We didn't create a custom provider. We didn't write a custom hook.

We just **moved the line of code that creates the instance** from the component to the provider. The component itself didn't need to know or care. It's now "controlled" from the outside, and the refactor took 30 seconds.

## Focus on What Matters: Your Architecture

This tiny change in tooling unlocks a massive change in mindset.

  * You can **fearlessly** start with local state, knowing the refactor to global state (or anything in-between) is trivial.
  * You can stop over-engineering and truly follow **YAGNI**.
  * You can create stateful logic as a simple, testable class and then decide *at what height* to share it, without the penalty of writing lots of code.

This philosophy extends to your entire architecture. By "automating" the boilerplate, you can finally focus on what matters: your application's logic, not the ceremonial plumbing of your codebase.
