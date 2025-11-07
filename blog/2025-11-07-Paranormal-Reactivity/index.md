---
slug: paranormal-reactivity
authors: [fabfog]
date: "2025-11-07"
tags: [use-less-react]
---

# Paranormal Reactivity 👻

I'm afraid it's a little bit late for Halloween, but I do have a spooky update for you. 

Our beloved `PubSub`-based reactive system has two new features. They're designed to eliminate manual boilerplate, guarantee data integrity (even in asynchronous scenarios) and optimize performance.

The new key functionalities are: **`makeReactiveProperties`** (for a cleaner syntax and less boilerplate) and **`batchNotifications`** (for maximum efficiency).

These features are available immediately from [v0.7.0](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.7.0).

---

## 1. Zero boilerplate: `makeReactiveProperties`

Until now, making a property reactive often required using decorators or manual *getters/setters*, asking developers to call `this.notify('propName')` every time a value changed. While this is the responsibility of a reactive layer implementing a PubSub pattern, I realize it can be tedious and repetitive.

The new feature **`makeReactiveProperties`** eliminates this friction, allowing you to write your class properties naturally, delegating the complex notification setup to the framework's core unless you have very specific needs that require manual calls to `notify`.

### Before (manual notification boilerplate)

```typescript
class MyStore extends PubSub {
  counter: number = 0;

  setCounter(value: number) {
    this.counter = value;
    this.notify("counter");
  }
}
```

or, using the decorator

```typescript
class MyStore extends PubSub {
  counter: number = 0;

  @Notifies("counter")
  setCounter(value: number) {
    this.counter = value;
  }
}
```

or, equivalently

```typescript
class MyStore extends PubSub {
  private _counter: number = 0;

  get counter() {
    return this._counter;
  }

  set counter(value: number) {
    this._counter = value;
    this.notify("counter");
  }
}
```

Each case has its own pros and cons, but they all require (in a way or another) to write a bit more code than we'd want to, when working with reactive properties. At least in the general case.

### New syntax

The `GenericPubSub` base class now offers a `makeReactiveProperties` method that leverages the robust `Object.defineProperty` internally at construction time to transform declared fields into self-notifying setters.

It doesn't replace the existing options (decorator and `notify` method), but it's a powerful alternative for the most common cases, and it's super-concise.

It's intended to be used inside the constructor, as the last instruction.

```typescript
class MyStore extends PubSub {
  counter: number = 0;
  message: string = "Hello";

  constructor() {
    super();
    // Transform the following keys into reactive properties
    this.makeReactiveProperties('counter', 'message'); 
  }

  // Direct mutations, no explicit notify calls needed
  increment() {
    // The setter automatically calls this.notify('counter')
    this.counter++; 
  }
}
```

This change results in a significantly improved **Developer Experience (DX)**, allowing you to focus purely on business logic rather than reactivity plumbing.

---

## 2\. Maximum efficiency: `batchNotifications`

A critical issue in highly reactive systems is the **"Notification Storm."** If a method updates 10 reactive properties in rapid succession, the system sends 10 separate notifications, potentially triggering 10 redundant UI updates and wasting CPU cycles.

The new asynchronous method **`batchNotifications`** solves this by introducing a **Batching** system that is highly resilient to asynchronous operations and nesting.

### How batching works

1.  **Reference counting:** we use a reference counter to keep track of "open" batches.
2.  **Support for async:** every call to `batchNotifications` increments the reference counter. Any subsequent call to `this.notify()` (either manual or via reactive setters) only **adds** the modified key to a `pendingNotifications` set, if the reference counter is larger than zero.
3.  **Final flush:** only when the last batch function completes (and the reference counter returns to zero), a notifications flush is executed. This clears the pending notifications set, sending **a single notification** for all unique modified keys.

This robust mechanism prevents race conditions caused by asynchronous interleaving (e.g., when an `await` yields control to the Event Loop).

### Usage Example

```typescript
async updateAll(data: { x: number, y: number }) {
  // open a new batch: all notifications triggered inside will be batched
  await this.batchNotifications(async () => {
    // first mutation: 'x' is queued
    this.x = data.x; 

    // suspension: the Event Loop can now run other code (e.g., another batch call)
    await someAsyncOperation(); 
    
    // second mutation: 'y' is queued
    this.y = data.y;
  }); 
  // end of the batch: flush is executed and a single notification is sent for ['x', 'y']
}
```

Of course, this also supports conditional notifications:

```typescript
async updateAll(data: { x: number, y: number }) {
  await this.batchNotifications(async () => {
    this.x = data.x;
    if (someCondition) {
      this.y = data.y;
    }
  }); 
  // end of the batch:
  // - if someCondition was met, "x" and "y" are notified
  // - if someCondition was not met, only "x" is notified
}
```

-----

## Final considerations

`use-less-react` is rapidly moving from a simple proof-of-concept to a full-fledged architectural layer, aspiring to become a robust and clean solution for the View-Model communication layer.

While still an experimental library, I believe it's already showing its potential. Its core design is specifically focused on reconciling the unique reactivity requirements of the View with the complex data management needs of the Model.

Most importantly, the library is achieving this without creating contamination between the two layers, thereby strictly enforcing the Separation of Concerns (SoC) principle.
