# `@BatchNotifications`

## Overview

The `@BatchNotifications` decorator is an essential tool for ensuring **state consistency** and **performance optimization** within the ViewModel layer.

This decorator guarantees that any method altering reactive state is automatically wrapped in the `this.batchNotifications()` block. This groups all modifications to reactive properties into a **single notification** sent to the View, thereby preventing multiple, unnecessary *re-render* cycles.

---

## Usage

Simply apply `@BatchNotifications` to any ViewModel class method that modifies two or more reactive properties, or performs changes in quick succession.

### 1. Requirements

The class utilizing this decorator must inherit from a Mixin or Base Class that implements the `Batchable` interface, providing the `batchNotifications` method. (This is guaranteed if you use `GenericPubSubMixin`).

```typescript
// Example of the class using the decorator
import { BatchNotifications } from 'your-library-path'; 
import { UserProfile } from './UserProfile'; 

export class UserProfileViewModel extends UserProfile {
  // ... code ...

  // Method without decorator: Sends two separate notifications
  updateIndividualProperties(name: string, age: number) {
    this.firstName = name; // Notification 1
    this.age = age;        // Notification 2
  }

  /**
   * @BatchNotifications ensures that both modifications trigger 
   * A SINGLE notification at the end of the method execution.
   */
  @BatchNotifications()
  updateProfileAndAge(name: string, age: number) {
    // These reactive setters are internally queued
    this.firstName = name; 
    this.age = age;
  }
}
```

-----

## Technical Details

The `@BatchNotifications` decorator acts as an interceptor:

1.  **Captures the Method:** When applied, it overrides the definition of the original method.
2.  **Injects the Wrapper:** The new method implementation executes all of the original method's logic within the `this.batchNotifications()` *callback*.

### Asynchronous Handling

The decorator is designed to support both synchronous and asynchronous methods. If the decorated method is an `async` function (which returns a `Promise`), `batchNotifications` will wait for the `Promise` to settle before closing the batching block and sending the notification.

**Asynchronous Example:**

```typescript
@BatchNotifications()
async saveUserData(data: UserData) {
  // Queues the notification
  this.isLoading = true; 
  
  // Waits for the asynchronous operation
  await this.modelService.save(data); 
  
  // Queues the notification
  this.isLoading = false; 
  this.isSaved = true;

  // Single notification: ['isLoading', 'isSaved']
}
```
