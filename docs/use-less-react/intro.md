# Introduction

`use-less-react` was born out of a simple question: **can we use React purely as a reactive layer**, without letting it invade the logics of our applications?

The core idea is to trim React down to the absolute bone, strictly confining it to the reactive display of things in the UI. All the logics — from business rules to pure utility functions — is deliberately moved into vanilla JavaScript/TypeScript classes.

This strategic separation has one clear goal: to let the codebase get back to embracing classic Object-Oriented Programming (OOP) principles and the full spectrum of design patterns. These are all things that the conventional, "hooks-heavy" approach in React development often ends up heavily constraining.

Modern React applications often end up using the React API to handle data, logics and rendering, in a way that forces developers into a rigid "React mindset", instead of letting them freely express domain logic independently of the chosen UI library.

`use-less-react` wants to tackle what is, essentially, the elephant in the room: **if React is a UI library**, and emphatically not a framework, **why should we be forced to write our application's core logics inside React hooks**, instead of using pure classes?

---

## ⚙️ Philosophy

The core idea behind `use-less-react` is that **classes should be first-class citizens in React**. Instead of replacing them with hooks or complex state management libraries, this package allows you to:

- Define **reactive** and - optionally - **serializable classes** using familiar OOP principles.
- Use them **directly in your components** through a single hook.
- Keep React **dumb and declarative**, while your logics live elsewhere.

In short: *React renders; classes think.*

---

## 🧩 Key Advantages

- **Zero boilerplate** – No reducers, no global stores, no signals. Just classes.
- **Reactivity built-in** – Classes notify components when relevant properties change, and components will just react to changes via a **single** generic hook.
- **Serializable and Hydratable** – Perfect for SSR/SSG scenarios, with simple JSON serialization patterns.
- **Immutability safety** – Optional deep immutability decorator prevents accidental state mutations. And you can disable it in production, to avoid performance loss.
- **Decorator-based syntax** – Expressive, readable, and minimal.
- **Easy to test** – Test your logics without having to install specific libraries for testing hooks.
- **Tiny footprint** – Less than 8kB minified and gzipped.

---

## 🚀 Expected Benefits

- Reduced cognitive load for developers.
- Cleaner boundaries between UI and logics.
- Easier migration from vanilla JS apps to React.
- Easier to integrate vanilla JS libraries into React, without having to write a separated, specific wrapper library (...or having to wait that someone else writes it)
- Fewer re-renders — only properties that truly change the DOM will trigger UI updates.
- Natural integration with SSR/CSR hydration cycles.

---

## 🧰 Ideal Use Cases

- **Complex domains** with class-based models (finance, physics, simulations, editors of any kind, etc.).
- **Strongly-typed codebases** where TypeScript interfaces and classes shine.
- **Next.js** apps requiring **SSR rehydration** of class instances.
- **Reactive OOP architectures** that avoid the overhead of MobX, and the risk of ending up with Redux state monoliths... we all know them, right?

---

## 🧭 TLDR;

> `use-less-react` lets you write your logics in JavaScript/TypeScript classes and use a minimal amount of React hooks and contexts to make your components reactive do data changes.

