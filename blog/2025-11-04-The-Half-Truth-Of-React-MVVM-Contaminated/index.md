---
slug: the-half-truth-of-react-mvvm-contaiminated
authors: [fabfog]
date: "2025-11-04"
tags: [use-less-react]
---
# The Half-Truth of React: MVVM Contaminated

React is often categorized as an **MVVM (Model-View-ViewModel)** framework. This classification is based on two core principles it perfectly enforces:

1.  **Unidirectional Data Flow:** State flows strictly from Model to View (M → VM → V). The View does not directly mutate the Model; it sends commands back to the ViewModel/Component.
2.  **Conceptual Separation:** The code conceptually separates the **Logic (VM)** from the **Presentation (V)**.

However, this is only half the truth. The full truth is that React's design, particularly with Hooks, enforces a critical architectural fusion that undermines the pattern's primary benefit—**pure testability**:

* **View (V):** Your JSX output.
* **ViewModel (VM):** The logic that exposes state and actions.

The fundamental issue is that Hooks mandate the fusion of the **VM** into the **V**. Your functional component contains the JSX, but it also becomes the seat of the ViewModel (via `useState`, `useEffect`, etc.). This fusion is the root of **contamination**: it forces business logic to become dependent on React's rendering APIs, effectively getting in the way of testability and killing separation of concerns.

<!-- truncate -->

## The Solution: Pure Presentation Model

The `use-less-react` philosophy does more than just decoupling logic; it transforms React's imperfect pattern into a superior architectural model, often identified as the **Presentation Model (PM)**.

The Presentation Model is a more pure form of MVVM where the equivalent of the "ViewModel" is **totally agnostic** of the View. The View (the React component) merely renders the PM's state and sends commands, without ever knowing the PM's internal logic. The PM is totally agnostic of the technology used by the View - in our specific case, this means it doesn't use its API, like hooks.

The differences between **MVVM (Model-View-ViewModel)** and **Presentation Model (PM)** are subtle but crucial, revolving around how tightly coupled the "brain" of the application (the ViewModel/PM) is to the view technology.

---

## The Core Distinction: View Awareness

Both MVVM and PM are architectural patterns aiming to separate **Business Logic (Model)** from the **User Interface (View)**. The key difference lies in the **View's Contract** and the **ViewModel/PM's awareness** of the UI framework.

| Characteristic | MVVM | Presentation Model (PM) |
| :--- | :--- | :--- |
| **View Knowledge** | **Soft Coupling:** The ViewModel might have references or knowledge of the View's lifecycle (e.g., specific framework events) or the data binding mechanism. | **Zero Coupling:** The **Presentation Model is completely UI-agnostic**. It knows nothing about React, Angular, or the DOM. |
| **Interaction** | Often relies on **Data Binding** where the View directly exposes properties and receives updates from the VM. | Exposes **only State (data) and Commands (methods)**. The link to the View is always *indirect* via an adapter or "bridge." |
| **Focus** | **Reactivity** and ease of integrated framework binding. | **Testability** and **Architectural Integrity** (decoupling). |

---

## MVVM's Contamination

In the contaminated version of MVVM seen with React Hooks, the "ViewModel" (`useState`, `useEffect`) is forced to live **inside** the View component. This means the ViewModel must import and adhere to the View's APIs, making it **impossible to unit-test** the business logic without simulating the entire React environment. The ViewModel makes no sense by itself, it can "live" only within the API used to render the View.

## The PM Solution (The `use-less-react` Approach)

The Presentation Model solves this by defining a strict boundary:

1.  **The PM is a Plain Old Class Object:** Your `AuthManager` class (the PM) is a **Pure Class**. It's pure OOP. It doesn't know about the UI. 
2.  **The Adapter is the Key:** Because the PM is ignorant of React, an adapter — our `useReactiveInstance` Hook — must be introduced. This Hook acts as the **bridge**, subscribing to the PM's state changes and triggering re-renders.

By adopting the PM, you achieve the goal of **maximum isolation**. The logic layer can be tested, maintained, and even ported to a different environment (i.e. server side in Next.js, or in a different frontend framework) without modification, proving its architectural purity.

### 1. Our Presentation Model: The Pure Class

The core of the solution is that our business logic is defined as a **Pure Class**. This serves as our decoupled Presentation Model:

* **No Hooks:** the Pure Class contain no `useState` or `useEffect`. It is standard, framework-agnostic JavaScript/TypeScript code.
* **No Rendering**: the Pure Class does not return any rendered piece of UI (JSX), just "raw" data.
* **Just Logic:** all state transitions, data fetching, and data manipulation logic reside entirely within these classes, independent of any UI framework.

* **Decoupling via DI:** we use a **Dependency Injection (DI)** pattern to inject services (like `HttpClient` or `Logger`) directly into the Pure Class constructor. This is vital: it decouples our manager not only from the View, but also from its own complex dependencies.

> **Result:** our Presentation Model is 100% testable as a standard "vanilla" class. We can execute all scenarios without simulating a single React render, `act`, or the DOM, because the logic remains pure.

### 2. The Reactive Bridge: The Minimalistic `useReactiveInstance` Hook

If our Presentation Model is pure and oblivious to React, how does state reach the browser?

This is the role of the `useReactiveInstance` hook, which acts as a pure **Data Binding** layer — the sole point of contact between the two worlds.

1. **Observability:** The Presentation Model uses an Observer/PubSub pattern that takes the responsibility to notify subscribers when internal state changes. It knows nothing about the "nature" of subscribers: they could be UI components via `useReactiveInstance`, or other pure classes.
2. **The Bridge:** The `useReactiveInstance` Hook subscribes to this notification. When the Presentation Model notifies a change, the Hook executes a "dummy" state update internally, forcing React to perform the necessary **re-render**.
3. **Dumb Component:** The React component becomes a **Pure View** that simply reads state from the Manager and delegates commands back to it. And it's damn easy to keep it simple and stupid, because there's a clear separation line between the View (functional component) and the PM (class). So you're always aware of what you're writing... because you have to choose **where** to write it. **Structure defines function**, like in Biology: this is true Separation of Concerns. Mixing state, logics, HTML and styles inside a single entity called "Component" is a recipe for spaghetti code.

```tsx
// File: profile.tsx
const ProfileComponent = () => {
  const { state: { userName }, instance: manager } = useReactiveInstance(
    () => new AuthManager(new AuthService()),
    ({ user } => ({
      userName: user.name,
    })),
    ["userName"]
  ); 
  
  return (
    <div>
      <p>Welcome, {userName}</p>
      <button onClick={() => manager.logout()}>Logout</button>
    </div>
  );
}
```
Could you simplify it further?

## Conclusion

Adopting the Presentation Model philosophy with `use-less-react` means:

  * **Respecting the View:** React returns to being the highly efficient JSX rendering engine it was designed to be. And nothing else.
  * **Empowering the ViewModel:** Our PM becomes a mature, scalable OOP entity, based on principles of isolation and purity. It's testable, reusable, powerful, and clean.

We just turned React's flawed architecture into a total, clear separation between business logic and the presentation layer.
