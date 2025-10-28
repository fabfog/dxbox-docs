---
slug: introducing-use-less-react
title: "Introducing @dxbox/use-less-react"
authors: ["fabfog"]
date: "2025-10-20"
tags: ["use-less-react"]
---

# Introducing `@dxbox/use-less-react`: React, without...

There’s beauty in simplicity.  
We build software on layers of abstractions, patterns, and libraries — and sometimes, we forget what all of that complexity was supposed to achieve in the first place.

**@dxbox/use-less-react** was born out of a simple question: **can we use React purely as a reactive layer, without letting it invade the logics of our applications?**

Or, if I may simplify:

> What if React state management could be done in plain JavaScript?

<!-- truncate -->

## Why another state management library?

Because this one is *less*.
Less configuration.  
Less boilerplate.  
Less mental overhead.

React already gives you an elegant component model — what if we stopped fighting it and just made our *classes* reactive?

With `use-less-react`, you don’t need to learn a new state paradigm, memorize hook signatures, or wire up stores and selectors.
You just write classes, like in vanilla TypeScript or JavaScript, and make them reactive by extending a base class called `PubSub`.

That’s it.

---

## A new (old) way to think about reactivity

In `use-less-react`, your business logic lives in classes — clean, easy to test, self-contained.  
Your React components will simply *observe* them and... well, do their job: *react* to changes.

The library connects the two worlds: when your class updates, your component automatically re-render.  
No context juggling, no memoization gymnastics, no endless `useEffect` chains.

It’s **object-oriented reactivity** and it feels powerful, because you are able to use the full spectrum of OOP principles and design patterns.

---

## The philosophy

React has always been about *declarative views*.  
But as our apps grow, our state logic gets tangled between hooks, reducers, effects, and external stores. Lots of APIs to learn, lots of dependencies. Libraries wrapping other libraries to make them usable in React.

**`use-less-react`** brings focus back to **clarity and maintainability**:
- You model your domain as classes.
- You decide when a field gets notified (meaning its value has changed).
- You let the UI update itself.

No framework magic. No rebuild of React’s internals.  
Just predictable, testable, maintainable code.

---

## Why developers will love it

- ⚡ **Fast and lightweight** – only ~1.6 kB minified and gzipped
- 🧠 **Zero learning curve** – just use classes and, optionally, a couple decorators
- 💬 **Framework agnostic logic** – your classes work even outside React
- 🔄 **Truly reactive UI** – components update *only* when they need to
- 🧩 **Plug-and-play contexts** – hydrate instances, share data, and keep types safe
- 🧍‍♂️ **Less code, more thinking space** – the way it should be

---

## The bottom line

`@dxbox/use-less-react` isn’t about replacing React — it’s about **making React do its job** without giving it too much responsibilities.  
It strips away the layers we’ve built on top of it and brings back a sense of immediacy between your logic and your UI.

If you love the idea of writing *less React code* while keeping *full reactivity*, this library might just become your new favorite tool.

---

### Get started
The full documentation and examples are available [here](https://dxbox-docs.vercel.app/docs/use-less-react/intro)

