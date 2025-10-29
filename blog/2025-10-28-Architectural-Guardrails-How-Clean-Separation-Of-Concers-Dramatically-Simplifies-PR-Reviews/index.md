---
slug: architectural-guardrails-how-clean-separation-of-concerns-dramatically-simplifies-pr-reviews
title: "Architectural Guardrails: How Clean Separation of Concerns Dramatically Simplifies PR Reviews"
authors: [fabfog]
date: "2025-10-28"
tags: [use-less-react]
---
# Architectural Guardrails: How Clean Separation of Concerns Dramatically Simplifies PR Reviews

## Introduction: The High Cost of *Unconstrained* Complexity

In software development, the true cost of a feature is measured not just by the time it takes to write, but by the time it takes to debug, change, and — last but not least — **review**. When logic is unconstrained, a simple feature often turns into a complex pull request (PR) that demands deep, time-consuming investigation.

This post contrasts two architectural approaches to demonstrate how **Separation of Concerns**, enforced by a class-based Domain Model (like in `use-less-react`), dramatically simplifies the PR review process.

---

## Scenario 1: Hooks-based implementation

Imagine a PR submitted by a junior developer for a new feature. The core logic is housed in a single component file, putting together data and logics from different hooks.

### Code Example: The Coupled Component

```tsx
// feature-component.tsx
const FeatureComponent = ({ initialFilters, withAutoUpdate }) => {
  const { filters, setFilters, filtersItems } = useItemFilters(initialFilters); 
  const { data, isLoading, error } = useAsyncData(filters);

  const isReady = !isLoading && data;
  
  // intensive memoization of array and/or objects to prevent rendering issues
  const memoizedData = useMemo(() => processData(data), [data]); 

  // component taking care of side-effects on behalf of the "data-fetching layer"
  useEffect(() => { 
    if (isReady) logActivity('data-loaded', memoizedData);
  }, [isReady, memoizedData]); 
  
  if (error) return <ErrorView error={error} />;

  return (
    <div>
      <FiltersForm onUpdate={setFilters}>
        {filtersItems}
      </FiltersForm>
      {isReady && <DataList items={memoizedData} />}
    </div>
  );
};
````

### 🧠 The Reviewer's Journey: High Cognitive Load

The senior reviewer cannot simply glance at this file. The review process becomes a detailed **inspection** spanning multiple files:

1.  **Inspect `feature-component.tsx`:** The reviewer must trace the flow of state between `useItemFilters` and `useAsyncData`. Is the `filters` reference stable, or will it trigger many re-renders and potentially many unnecessary API calls from `useAsyncData`?
2.  **Inspect `useItemFilters`:** The reviewer discovers this hook returns the UI of rendered filters (`filtersItems`). **STOP:** A hook violating SoC by mixing logic and rendering is a red flag. Did you see that? Poor naming for `filtersItems` may let this issue go unnoticed. But the possibility itself to have mixed logics and pieces of UI returned by a hook is the root of the problem. You have to spend extra attention to understand what should be state/logics and what should be UI, and this produces **high cognitive load**.
3.  **Inspect `useEffect`:** The reviewer should notice that a component is taking care of rendering UI, fetching data, and even log an event whenever new data is fetched. What if another component fetches the same data, but forgets to log it? Is it correct to have a component orchestrate this logic?
4.  **The Core Problem:** Since a custom hook returns fragments of UI, the reviewer cannot assess the domain logic without simultaneously verifying the visual output and lifecycle dependencies. **The scope of inspection is boundless.**

**Review Time Estimate:** 45+ minutes, highly susceptible to missed lifecycle bugs.

-----

## Scenario 2: Class-based implementation

In this scenario, the junior developer uses `use-less-react`. All filtering, data fetching, and processing logic is encapsulated within a class (`ItemsManager`).

### ✅ Code Example: The Decoupled Component

```tsx
// File: items-manager.ts (pure logic)
export class ItemsManager<TApiService extends ApiService> extends PubSub {
    private _filters: FiltersType = {};
    private _data: DataType | null = null;    
    private _error: Error | null = null;

    public isLoading = false;

    constructor(private apiService: TApiService) {
      super();
    }

    get data() {
      return this._data;
    }

    get error() {
      return this._error;
    }

    get filters() {
      return this._filters;
    }

    @Notifies("filters")
    setFilters(...) {
      // ...
    }
    
    async fetchItems() {
      this.isLoading = true;
      this.notify("isLoading");
      // delegates the actual fetch to the injected service
      try {
        const result = await this.apiService.getItems(this._filters);
        this._data = result.data;
        this._error = null;
      } catch (err) {
        this._data = null;
        this._error = err;
      } finally {
        this.isLoading = false;
         // or just use @Notifies("isLoading", "error", "data") on top of the method
        this.notify("isLoading", "error", "data");
      }
    }
    
    // everytime data gets notified, also processedData will be notified...
    // ...but it will be actually recalculated only if someone has subscribed to it!
    @DependsOn("data")
    public get processedData() {
      if (!this._data) return null;
      return processData(this._data);
    }
}

// File: feature-component.tsx (view only)
const FeatureComponent = () => {
  // the instance is likely to be shared via createGenericContext<ItemsManager>()
  const managerInstance = useItemsManagerProvider(); 
 
  // Simple declaration of state required for rendering this component
  const { state: { items, loading } } = useReactiveInstance(
    managerInstance,
    ({ filters, processedData, isLoading, error }) => ({
      filters,
      processedData,
      isLoading,
      error,
    }),
    ['processedData', 'isLoading', 'filters', 'error']
  );

  // The component is purely view logic
  if (loading) return <Spinner />;

  if (error) return <ErrorView error={error} />;

  return (
    <div>
      <FiltersForm filters={filters} onSubmit={managerInstance.fetchItems} />
      {processedData && <DataList items={processedData} />}
    </div>
  );
};
```

### 🧠 The Reviewer's Journey (Low Cognitive Load)

The review is split into two distinct, manageable phases with strict boundaries:

1.  **Inspect `feature-component.tsx` (the view):**
      * **Goal:** Verify that the component correctly maps domain state to UI elements.
      * **Check:** Are the dependencies in `useReactiveInstance` correct (`processedItems`, `isLoading`)? Of course they are: this is enforced by TypeScript. Is the `FiltersForm` correctly calling a **stable, external method** (`manager.fetchItems`)? Yes, it comes from a vanilla class. No `useCallback`s, no flying functions, no changing references.
      * **Conclusion:** The component is valid. Its responsibilities are met.

2.  **Inspect `items-manager.ts` (the domain):**

      * **Goal:** Verify business logic integrity, resource management, and dependency usage.
      * **Check:** Does the class use the injected `apiService`? Yes. Does it handle the state transition (`isLoading` set to true/false) correctly around the `await` call? Yes. Does it notify the updated properties when they change? Yes. The logic is clean.
      * **Conclusion:** The business logic is sound and testable. Its responsibilities are met.

**Review Time Estimate:** 15 minutes. The confidence in the correctness of the PR is much higher because of the explicit architectural boundaries.

-----

## 3\. Added Value: Testing Ease (Jest/Vitest)

The architectural benefits of decoupling are most evident when writing tests. The goal is to test business logic without needing to simulate a browser or the entire React environment.

### Testing the Hooks-based implementation

Testing the logic within `useAsyncData` (from Scenario 1) is difficult because the logic is enclosed within a React primitive (`useEffect`) and requires simulating the React execution environment, including state transitions via `act`.

```ts
// File: feature-component.test.tsx (Requires @testing-library/react-hooks)
import { renderHook, act } from '@testing-library/react-hooks';
import { useAsyncData } from '../feature-component';

test('useAsyncData should fetch and set data after initial render', async () => {
  // Mock the global fetch/API call for the hook. Kind of a "hack", if you ask me.
  global.fetch = jest.fn().mockResolvedValue({ json: () => ({ data: 'test-data' }) });

  // Must render the hook via a special utility to track lifecycle
  const { result, waitForNextUpdate } = renderHook(() => (
    useAsyncData({ id: 1 })
  ));

  // Assertion must be wrapped in 'act' for state changes to be processed correctly.
  await act(async () => {
    // Initial state check and wait for the async useEffect to complete
    expect(result.current.isLoading).toBe(true); 
    await waitForNextUpdate(); // Waits for the data fetch promise to resolve
  }); 

  // Assertion on the resulting state after all transitions are complete
  expect(result.current.isLoading).toBe(false);
  expect(result.current.data).toEqual({ data: 'test-data' });
});
```

**Cost of Testing:** High. The test code is polluted with React lifecycle utilities (`renderHook`, `act`, `waitForNextUpdate`), obscuring the business logic being tested. You end up testing the test because you're not sure whether you had to call for `waitForNextUpdate` or not . The test needs to mock a global API (`fetch`) which is a brittle form of dependency mocking, but was dependency injection - via hooks - really an option? And personally speaking, if I spend some time without writing this kind of tests, I'll have troubles remembering the syntax of all those testing utilities. Which makes me think "I *have to* write tests, but how long will it take?"

### Testing the Decoupled Domain (Pure Unit Tests via Dependency Injection)

Testing the logic within `ItemsManager` (from Scenario 2) is a simple unit test against a standard class. The use of **Dependency Injection** drastically simplifies mocking the API.

```ts
// File: items-manager.test.ts (Pure Jest/Vitest with Dependency Injection)
import { ItemsManager } from '../item-manager';

// Mock the specific API service interface - not the global fetch!
const mockApiService = {
  getItems: jest.fn().mockResolvedValue({ data: ['item1', 'item2'] }),
};

test('ItemsManager should fetch data and update state flags correctly', async () => {
  // Instantiate the class, injecting the mock service. Clean, no unexpected side-effects.
  const manager = new ItemManager(mockApiService);
  
  // Test business logic directly
  expect(manager.isLoading).toBe(false);

  const promise = manager.fetchItems({ filter: 'test' });
  
  // Synchronous assertion on the state transition
  expect(manager.isLoading).toBe(true); 
  // Verify the mock service was called correctly
  expect(mockApiService.getItems).toHaveBeenCalledWith({ filter: 'test' });

  await promise;

  // Assertion on the final state and computed properties
  expect(manager.isLoading).toBe(false);
  expect(manager.processedItems).toEqual(['item1', 'item2']); 
});
```

**Cost of Testing:** Low. The test file is flat, clean, fast to write, easy to understand, and completely free of React utilities. By using Dependency Injection, mocking is precise and local, guaranteeing that the business logic is tested in isolation from the external service implementation.

## Conclusion: Reducing the Scope of Inspection

The class-based domain model enforces a strict rule: **UI code belongs to the component; business logic belongs to the class.**

This strict separation of concerns reduces the **Scope of Inspection** during a code review and simultaneously enables a **pure unit-testing environment**:

  * **Reviewing a Component:** You only need to verify binding and presentation logic.
  * **Reviewing a Class:** You only need to verify business rules, state transitions, and resource cleanup.

This clarity significantly increases team velocity and the overall quality of the codebase. You could even define a "contract" and let part of the team work on the UI with mocked data, while another part of the team is implementing and testing the real logics.

And, it's worth remembering it, pure classes can be used in Next.js server side rendering, or even in an Express/NestJS server app. So they could be shared in a package (in a monorepo, for example), and used among different projects. With React hooks, you simply can't.
