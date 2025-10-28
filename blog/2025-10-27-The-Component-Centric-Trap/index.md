---
slug: the-component-centric-trap-why-domain-logic-needs-its-own-lifecycle
title: "The Component-Centric Trap: Why Domain Logic Needs Its Own Lifecycle"
authors: [fabfog]
date: "2025-10-27"
tags: [use-less-react]
---
# The Component-Centric Trap: Why Domain Logic Needs Its Own Lifecycle

## Introduction

The prevalence of React Hooks has anchored application state and logic firmly within the concept of **Component**. While this simplifies local UI state, it creates a fundamental architectural problem for complex applications: the **subordination of core business logic to the React Component Lifecycle.**

Logic packaged in a custom hook is intrinsically tied to where it is executed — it only "lives" as long as the component that uses it is mounted, and its execution is dependent on the component's render cycle.

This is the core argument for elevating state and logic into independent, **vanilla Domain Entities**.

---

## 1. Subordination to the Component Lifecycle

A custom hook, by definition, must adhere to the Rules of Hooks. This dependency means that the lifecycle of the data and the logic it contains is entirely governed by the `useEffect` and `useLayoutEffect` calls within its composition.

<!-- truncate -->

### The Hooks Dependency

* **Logic Lifespan:** A hook's logic is instantiated, executed, and cleaned up based solely on the component's mounting and unmounting. If ten different components need the same piece of domain logic (e.g., a real-time WebSocket connection), that logic must either be:
    * Duplicated (inefficient).
    * Moved to an external Provider, but even then, the consumer hook is still tied to the component tree. (See also: [The Boilerplate Tax 💸](/blog/the-boilerplate-tax))
* **The Component as Orchestrator:** The component, which should only be responsible for rendering, is forced to become the **orchestrator** of domain logic. It must manage memoization (`useCallback`, `useMemo`) to ensure that references remain stable, preventing unwanted re-runs of effects or unnecessary re-renders. This is an effort dedicated to React's performance constraints, not business value.

## 2. Promoting Logic to Independent Domain Entities

By utilizing simple TypeScript Classes, we assert that **state and logic have their own dignity**, separate from the view layer. You think about state and logics first, then you ask yourself how to render your state on the UI, and how to bind user events to certain actions. You don't start from the component and try to implement logics and state on top of it. If you want to implement and test your business cases, you don't start from choosing a UI library.

### Decoupling Lifecycles

Placing logic in a class achieves **decoupling** at the highest level:

| Feature | Custom Hook Logic | Class-Based Domain Logic |
| :--- | :--- | :--- |
| **Lifespan** | Tied to the Component's mounting/unmounting. | **Independent.** Can live outside a React component, i.e. a Node application. |
| **Instantiation** | Re-instantiated/re-evaluated on every component re-render. | **Stable Instance.** Constructed once. |
| **Logic Purpose**| Subordinate to the view layer's needs. | **Independent Entity.** Focuses solely on business invariants and data integrity. |

The class instance becomes a **stable service or entity** that can persist across different component mounts, navigations, or even entire application state resets, providing a unified source of truth for its domain.

The core architectural limitation of placing business logic within React Hooks is that the logic's life and execution become subordinated to the component lifecycle and render phases. A custom hook intrinsically lacks autonomy; it is instantiated, executed, and cleaned up solely based on the mounting of its parent component. This intertwines presentation concerns (like memoization for rendering stability) with domain concerns (like data integrity), making the logic brittle and challenging to test in isolation. 

By contrast, isolating logic and state into a vanilla class instance provides a decoupled, autonomous Domain Entity whose lifecycle is managed explicitly by the application, asserting its own dignity and persistence outside of React's render loop.

## 3. The Entity-Centric View

This approach shifts the architectural perspective from **"Component Composition"** to **"Entity Composition and Interaction."**

* **Entity First:** An entity, i.e. a `CartManager` is not a collection of hooks; it is a single, cohesive entity responsible for calculating totals, managing inventory constraints, and persisting data. Its existence is justified by the business domain, not the UI structure. Its integrity is guaranteed by its own structure, not by the fact some component "collects" and orchestrates several hooks in one place.
* **Decoupling from Rendering:** Since the class logic operates independently, it can perform complex or expensive operations (like data fetching, heavy calculation, or managing external resource subscriptions) **outside of the React render cycle**. The component merely uses a simple reactive hook (like `useReactiveInstance`) to "subscribe" to the final, computed state of that stable entity.

## Conclusion

When building scalable applications, core domain logic must be treated as an independent asset. By embracing the power of vanilla TypeScript Classes and using React simply as a mechanism to subscribe to their state, developers gain:

1.  **True Isolation:** Logic is fully testable and decoupled from the React runtime.
2.  **Stable Lifecycles:** Entities can persist outside the component tree, simplifying state sharing and management of long-lived connections.
3.  **Architectural Clarity:** The separation enforces that components are for rendering, and classes are for managing the domain.

Please note **this is not a step backward** to the old React Class components. In fact, while those components were implemented as classes, they were nonetheless tightly coupled to the UI framework and intrinsically responsible for the rendering lifecycle.

Our approach, instead, is a deliberate step forward to a pattern where Domain Logic holds its rightful place at the top of the architectural hierarchy, residing in classes whose sole responsibility is state and logic management, entirely decoupled from the rendering process.
