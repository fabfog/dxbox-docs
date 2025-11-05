---
slug: the-paradox-of-use-less-react-getting-more-from-react-by-using-less-react
authors: [fabfog]
date: "2025-11-06"
tags: [use-less-react]
---

# The Paradox of `use-less-react`: getting more from React by using less React

Given that `use-less-react` deliberately employs an object-oriented philosophy distinct from React's functional-hook paradigm, it might seem that the two tools are in opposition, and that `use-less-react` wants to "fight" React.
In reality, the opposite is true: `use-less-react` is designed to **simplify and lighten React.** Its core mandate is to free complex business logic from the constraints of UI-centric APIs. Specifically, Hooks.

By integrating classic OOP patterns for domain management, we gain immediate and important benefits:

* **True Dependency Injection (DI):** solving the complex problem of service management that React handles poorly.
* **Intuitive testability:** shifting complex state management and side-effects out of functional component lifecycles (where testing is often heavy and unintuitive) into pure, easily testable classes.
* **Elimination of boilerplate:** eradicating common frustrations like **Stale Closures** and the overuse of **`useCallback` / `useMemo`** required merely to appease the dependency array linter.

Thus, by minimizing the use of React-specific API for your state, a paradox unfolds: by using less React, **React can ultimately be used more.** By adopting `use-less-react`'s philosophy, our code not only gains in terms of scalability, but it also becomes accessible to a broader range of developers (including Node.js back-end developers), and it becomes viable for more sophisticated project types where the current limitations of Hooks severely restrict front-end expressiveness.

---

## React: between dominance and perceived decline

React is not in crisis. It is in a phase of **maturity and fragmentation**.

### 1. The undisputed dominance

In terms of pure usage and market presence, React is the absolute king.

* **Usage and Adoption:** Surveys like the **"State of JS"** consistently place React at the top for "Usage." The vast majority of companies using a front-end technology, use React.
* **Ecosystem and Jobs:** React's ecosystem (Next.js, React Native, millions of NPM packages) and the number of job openings are unmatched. From this perspective, it is the safest and most stable choice on the market.

### 2. The erosion of hype and satisfaction

This is where the "perceived decline" lies. The community's enthusiasm is shifting.

* **Satisfaction and interest:** The same "State of JS" surveys show that developer **satisfaction** and **interest** in React have been declining for several consecutive years.
* **The competitor allure:** Alternatives like **Svelte** and **SolidJS** boast extremely high satisfaction and interest rates. Many developers find these tools simpler, faster, and inherently free of the complexity (Hooks, V-DOM overhead, dependency arrays) that plague modern React development.

### 3. The true source of friction: internal complexity

React's real problem is not external competitors, but the **increasing complexity** introduced by its own team and partners (Next.js/Vercel).

* **From simple library to complex framework:** The introduction of **React Server Components (RSC)** and the App Router has fragmented the philosophy. React has ceased to be "just a UI library," becoming a paradigm that mixes server and client logic in a confusing way, steepening the learning curve.
* **The abandonment of simplicity:** React's original promise — simple, declarative UI — has been replaced by a complex architecture focused also on server-side performance.

The frustrations we feel today stem from this conflict: **a powerful system that has become significantly harder to use correctly.**

---

## The historical flaw: why OOP failed in Class Components

To understand why `use-less-react` works, we must first understand why OOP (within React) was abandoned in the first place.

The old **Class Components** model was an an OOP implementation that had huge problems for **UI description**:

* **Wrapper hell:** To reuse stateful logic, developers had to rely on **Higher-Order Components (HOCs)** or **Render Props**, creating an unreadable, layered, and difficult-to-debug DOM tree.
* **The mental model of the lifecycle:** Methods like `componentDidMount` forced developers to think in terms of **time**, not **state**. This imposed an imperative, rather than declarative approach. Logic for a single feature often had to be scattered across many different methods, making the code fragile.

Hooks solved these UI problems by embracing a model of **functional composition**.

---

## The new pains: why Hooks are the current issue

The paradox arises: React abandoned OOP because it was problematic **for the UI**, but in doing so, it forced us to use the Hooks API (born for the UI) also for **Business Logic**, where OOP actually excels. 

We needed a clear line between UI and Business Logics to delimit the realm of hooks, but there's no such line. Hooks are a mediocre tool for domain and global state logic. Their misuse is the root of React's three biggest architectural pain points:

### 1. Dependency hell and stale closures

Hooks live within closures and "capture" state and prop values as they were at the time of their creation.

* **The problem:** if you omit a value from a `useEffect` dependency array, the effect continues to use a **stale** version of that value, leading to unpredictable bugs.
* **The "solution":** by just curing the symptom, the `exhaustive-deps` lint rule forces us to include everything, which in turn causes the next problem...

### 2. The plague of memoization (`useMemo` and `useCallback`)

Since the dependency array is now filled with objects and functions, your `useEffect` re-runs on **every single render**, because in JavaScript, `{}` is never equal to `{}`.

* **The problem:** You are forced to wrap every non-trivial function and object in a `useCallback` or `useMemo` solely to "stabilize" the Hook dependencies.
* **The result:** Boilerplate code everywhere, consuming time and compute resources just to appease the React algorithm, not because your business logic requires it.

### 3. The absence of true Dependency Injection (DI)

React does not have a true Dependency Injection system. The official answer is `useContext`, but this is a *glorified service locator* with a couple flaws:

* any component consuming a context (`useContext(MyContext)`) re-renders every time **any** piece of data in that context changes, even if that component is only interested in an unchanged piece of data. This creates bad performance cascades
* you can’t really switch providers dynamically at runtime, as they’re inherently static

---

## An architectural antidote

**`use-less-react`** is the bridge that resolves these issues, allowing React and OOP to excel in their respective domains:

| Component | Role | Technology | Advantages |
| :--- | :--- | :--- | :--- |
| **Business Logic** | The "Brain": Domain management, rules, services. | OOP/VanillaJS Classes | True DI, Pure Testability, Classic Patterns. |
| **User Interface** | The "Face": Rendering, local event handling. | React Components (JSX, Hook) | Native V-DOM reactivity, UI composition. |
| **The Bridge** | Logic → UI Synchronization. | `useReactiveInstance` (built on `useSyncExternalStore`) | Selective notifications, optimized performance. |

Here is how the class-based architecture magically solves the three React pain points:

| React Pain Point | `use-less-react` Solution |
| :--- | :--- |
| **Stale Closures** | **No Stale Closures:** Class methods read `this`. `this` is always the current instance. The concept of "stale state" disappears. |
| **useMemo/useCallback Hell** | **No Memoization Boilerplate:** Your instance is created once. It is **stable by definition**. You can pass `store.addTodo` at any level without *ever* needing to wrap it in `useCallback`. |
| **Absence of True DI** | **True Dependency Injection:** Your classes are OOP. They can receive dependencies in their constructor (`new UserManager(authService)`), solving a problem that OOP solved 30 years ago. |

### The trade-off (notifications)

The only trade-off is the **manual notification management** via the `notify` method (or the `@Notifies` decorator). But this is nothing new: it’s just how any Observer pattern works. Actually, it’s a beneficial compromise:

* **it's explicit:** you know exactly which lines of code trigger reactivity. And you can test those lines like everything else, if it’s non-trivial and you want to be sure it works correctly.
* **it's limited:** this notification logic is confined to the **frontier layer** (the classes that "link" the pure logics with the UI). All internal logic remains clean.

---

## The paradoxical thesis: more React, with less React

**`use-less-react` doesn't kill React; it aids its longevity and development quality.**

* **Lightening the ecosystem:** it enables direct, wrapper-free integration with existing vanilla JavaScript libraries. So no more installing both `some-package` and `react-some-package`.
* **More accessibility:** it lowers the barrier to entry. Front-end developers coming from different frameworks (like Angular, Vue or Svelte), or Back-end developers (Node.js/TypeScript) can contribute directly to the business logic, isolated from the complexity of Hooks. From day one.
* **Easier to test:** forget UI-specific utilities like `act` and `waitForNextUpdate` that weigh down the tests even when you're testing non UI-specific logics.
* **Focus on the core:** it allows React to return to its most efficient role - a rendering engine for the V-DOM and a local UI state manager.
* **A sustainable choice:** by making business logic easier to test, manage, and write, you alleviate the primary sources of developer frustration that push teams toward competing frameworks.
* **Seamless integration:** `use-less-react` seamlessly integrates with data and logics coming from "standard" React API. These two worlds aren't mutually exclusive, they can effectively cooperate.

In conclusion, **`use-less-react` offers an elegant way out of React's current "friction."** By reintroducing powerful OOP patterns where they are most effective, you achieve a clearer, more testable, and more sustainable architecture.

**If you are seeking stability, testability, and code that is easier to maintain, don't be afraid to use less React logic to help your entire React project work better.**
