---
slug: hooks-kill-architecture-the-price-of-sacrificing-classes
authors: [fabfog]
date: "2025-11-03"
tags: [use-less-react]
---
# Hooks Kill Architecture: The Price Of Sacrificing Classes

The introduction of Hooks in React was presented as a revolution, freeing us from the complexity of classes and their lifecycle methods. We willingly accepted the trade-off: cleaner code, less boilerplate.

But in this process, we imposed a set of rules upon ourselves — often not fully grasped — that have effectively rendered entire categories of Design Patterns **unused**, and in some cases **impossible**.

We accepted the price of sacrificing classes, a core feature of the language we're using, and this is something I must admit I overlooked, back in the day. Now I'm asking myself how could that happen. The paradox is clear: the world's most popular UI library abruptly failed to support a core language feature, thereby crippling the expressive potential available to engineers. How could the front-end community think this was a good idea, from an architectural standpoint?

By the way, this is not a debate about "classes vs functions": it is a warning about what we lost at a structural level.

<!-- truncate -->

## The Great JavaScript Class Omission: The Contamination of Logic

The transition from Class Components to Hooks felt like salvation. It solved undeniable problems with boilerplate and the complexity of the `this` context. However, this apparent rescue came with a fatal flaw: the **total contamination of business logic by UI-specific APIs.**

We accepted the marginalization of Classes because React needed to optimize for a single, critical task: **predictable UI rendering.** The problem wasn't the complexity of the Class lifecycle, but React’s own inability to manage its internal state persistence across functional component instances without strict rules.

Instead of providing a robust, clear **architectural boundary** between pure JavaScript logic and React's rendering engine, the library introduced Hooks, actually saying:

> "We cannot manage state reliably in functions unless you use our proprietary APIs (`useState`, `useEffect`...) and adhere to our strict, non-negotiable rules (the Order Invariance)."

This was a mistake:

1.  **The API Pervasion:** Every piece of logic that needs internal state or side effects must now import and consume the React API. A simple authentication flow or a complex payment strategy is no longer a pure **POCO** (*Plain Old Class Object*); it is a **Hook**, or a **Context**, intrinsically tied to the lifecycle of the component that calls it.
2.  **The Testing Crisis:** This contamination made unit testing of business logic cumbersome. Instead of testing a pure method (`manager.login()`), we are forced to simulate the entire React rendering environment, using tools like `act` or `waitForNextUpdate`, just to verify that a state change occurs. The business domain is no longer independent.

**The issue is not that we "confused" the two; the issue is that React's design forced the contamination, making a clear separation architecturally infeasible.** We traded classic, testable, framework-agnostic architecture for syntactic sugar and "automagic" UI updates.

-----

## An Example: The Impossibility of the Strategy Pattern

The Strategy Pattern is a pillar of software engineering. Its purpose is simple: define a family of algorithms, encapsulate them, and make them **interchangeable** at runtime without the the *consumer* knowing the concrete implementation.

In an OOP context, a `PaymentManager` doesn't know if it's using a `CreditCardStrategy` or a `PayPalStrategy`; it only knows that it executes `strategy.execute()`.

### The Structural Failure of Hooks

If we try to implement the Strategy Pattern using Hooks, we immediately stumble upon React's **Most Sacred and Inviolable Rule**:

> **The Rules of Hooks:** Do not call Hooks conditionally, or outside of a React function component or a Custom Hook.

This prohibition, necessary for React to associate state (`useState`) with a functional instance that lacks a `this`), makes the true implementation of the Strategy Pattern architecturally impossible:

#### 1\. The "Ideal" Code (A Real Strategy)

For the strategy to work, we should call a Hook *only* when necessary:

```javascript
// WARNING: this code is NOT CORRECT!
const PaymentComponent = ({ strategyType }) => {
  let paymentState;

  // The IF makes the call conditional: RULE VIOLATION!
  if (strategyType === 'CreditCard') {
    paymentState = useCreditCardLogic(); 
  } else {
    paymentState = usePayPalLogic(); 
  }
  // ...
}
```

#### 2\. The "Non-Ideal" Adaptation (The Anti-Pattern)

To circumvent the Invariance Rule, we are forced to call **all Hooks** on every render, using conditional logic only on their *result*:

```javascript
// This code is ALLOWED... but breaks the Strategy Pattern.
const PaymentComponent = ({ strategyType }) => {
  // ❌ UNCONDITIONAL CALLS, ALWAYS EXECUTED
  const creditCardLogic = useCreditCardLogic(); 
  const payPalLogic = usePayPalLogic();         

  // The logic decides which *logic* to use, not which *resource* to allocate.
  const finalLogic = strategyType === 'CreditCard' ? creditCardLogic : payPalLogic;
  
  // ...
}
```

### The Hidden Cost: Impossible Conditional Resources

This is not just a syntax problem; it is an **Architecture and Performance** problem.

1.  **State Overhead:** If `usePayPalLogic` creates complex state or a `useEffect` that sets up a browser listener, **those resources are allocated, managed, and cleaned up by React on every render**, even when the user is using a credit card. We are forced to pay for resources we don't use.

2.  **Violated Isolation:** The component (`PaymentComponent`) can no longer be isolated. It must explicitly import, declare, and manage **all** concrete strategy implementations. It has lost its fundamental domain ignorance.

> **In summary:** Hooks force the Strategy Pattern to become a **Conditional Monolithic Hook**. It makes it impossible to **swap resource allocation** at runtime, forcing us to pay the price of all possible abstractions.

-----

## How To Bridge The Gap Between React And OOP

The true path forward is not to fight the rules of Hooks, but to **avoid them entirely** when writing business logic. This is the core principle of **`use-less-react`**.

### 1\. Zero Contamination

`use-less-react` formalizes the principle that **business logic must be pure OOP**, unaware of React's existence. Our core logic is written in TypeScript classes using Dependency Injection, Composition, and all sorts of patterns like Strategy, Command, Memento or State Machine. You name it. At some level, we recognize the need to make some properties "reactive" by using the `PubSub` pattern and calling `notify` on them. But it's a thin layer that does not pervade all our system: **it's just the outermost part of our logics**, right behind the curtains of the actual UI.

  * **Logic is easy to test:** since instances contain no Hooks, they are tested with simple `new Class()` and standard unit tests, eliminating the need for complex, environment-dependent tools like `act` or `waitForNextUpdate`.

  * **DI is unlocked:** because the classes are pure, we can use true Dependency Injection to swap services and mocks at a structural level, something the Hook Rules explicitly forbid.

### 2\. The Hook as a Pure Bridge

The magic lies in transforming every redundant monolithic Hook (`useAuth`, `useThis`, `useThat`...) into a single, generic bridge: `useReactiveInstance`.

This minimalistic hook has only one job: **to observe changes in the external OOP Manager and trigger a re-render when a mutation occurs.** It doesn't manage state; it *reads* state.

**Why React Should Embrace This Direction:**

1.  **Reduced Technical Debt:** by externalizing the complexity, React components become lighter, serving only as view templates. Logics are more re-usable, more flexible, easier to test, and even easier to design and to review, because they can leverage field-tested Design Patterns. And what about onboarding a new developer who doesn't know React, but knows OOP? It will be a breeze. You may even have a backend guy work on core logics while a frontend guy takes care of the actual UI, then wire them up. This drastically lowers technical debt, development time, and maintenance costs.

2.  **Compliance with SOLID Principles:** it respects the core principles of **Separation of Concerns (SoC)** and the **Open/Closed Principle (OCP)**, allowing developers to extend logic (like adding new strategies) without modifying existing, working code (the component).

3.  **Future-Proofing:** decoupling the business domain from the UI ensures that migrating to new technologies (e.g., moving logics to the backend, or switching to a different UI framework) requires minimal refactoring.

**This concept of "total contamination" — mixing state logic, effects, and view in one functional block — is ultimately an anti-pattern slowing down scaling efforts.** By accepting and formalizing the boundary between pure OOP logic and the functional constraints of the UI, we finally gain the architectural structure that any non-trivial application needs.
