---
slug: implementing-the-state-pattern-for-safe-workflow-management
authors: [fabfog]
date: "2025-11-01"
tags: [use-less-react]
---
# Implementing the State Pattern for safe Auth Flow Management with `use-less-react`

## Introduction: The Inevitable Complexity of User Flows

Imagine you're tasked with implementing a standard authentication flow in a React application. The requirement seems simple:
1.  The app must first **check the session** (look for a stored token).
2.  If no session is found, redirect to the **login** page.
3.  If the session is valid, transition to the **authenticated** state, granting access to core features.

Most React developers immediately reach for a large, central custom hook / context to manage this logic. They will write something like this:

```typescript
// File: use-auth.ts

function useAuth() {
  const [status, setStatus] = useState<'checking' | 'login' | 'authenticated'>('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
      // Initial session check logic here
      const session = getSession();
      if (session.user) {
        setStatus('authenticated');
        setUser(session.user);
      } else {
        setsStatus('login');
      }
  }, []);
  
  const login = async (email: string, password: string) => {
    const session = await loginApi(email, password);
    if (session.user) {
      setStatus('authenticated');
      setUser(session.user);
    }
  };
  
  return { status, login, user };
};
```

### The Inevitable Feature Creep

Then, reality hits. A new requirement lands on your desk: **the user must not only be authenticated but must also complete their profile** with additional data like address, company ID, etc., before accessing the main app.

This means ripping into the heart of your flow logic, modifying all tests for the central hook, and introducing nested conditionals.

You modify your hook, adding the new `pending-profile` state. After many delicate changes, you arrive at what you believe is a stable solution.

But then, life happens again. A new, critical security requirement arrives: **You must integrate a mandatory 2-Factor Authentication (2FA) step** between login/signup and the profile completion stage.

This is a true nightmare. It forces you to re-engineer the same block of code again. The logic for transition, validation, and conditional routing is now becoming complex and fragile:

```typescript
// File: use-auth.ts

const login = async (email: string, password: string) => {
  const session = await loginApi(data);
  if (session.user) {
    setUser(session.user)
  }
};

useEffect(() => {
  if (!is2FASet(user)) { 
    setStatus('2fa-required')
  } else if (!user.profileComplete) {
    setStatus('pending-profile'); 
  } else {
    setStatus('authenticated');
  }
}, [user]);

```

This monolithic approach has failed even in our very simplified example. We are constantly violating the **Open/Closed Principle (OCP)**: modifying existing, working code instead of just extending it.

## The Architectural Question

Are we truly following the right architectural path for managing complex, evolving application behavior?

The answer is no. With **use-less-react**, you can manage this exact problem using a powerful object-oriented design pattern: the **State Pattern**, implemented as a **Finite State Machine (FSM)**. This approach uses the power of Object-Oriented Programming (OOP) to encapsulate behavior, making your logic robust, extensible, and easy to test.

-----

## The FSM Solution with `use-less-react`

The FSM model flips the script: instead of having one central controller that knows everything, we have small, dedicated state classes that only know **what transitions they can make** and **what actions they can handle**.

### 1\. Architectural Clarity through Encapsulation

Every step in our flow becomes a self-contained class: `InitializingState`, `LoginState`, `AuthenticatedState`, and later it will be super easy to add `ProfilePendingState` and `TwoFactorState`.

Here's the code for the `LoginState`:

```typescript
import { AuthConfig } from '../auth-flow';
import { FSMContext, FSMState, FSMStateConfig } from '../types';
import { AuthenticatedState } from './authenticated';

export type LoginPayload = {
  intent: 'submit';
  email: string;
  password: string;
};

// we'll use this type to let our FSM know what are the possible states
export type LoginConfig = FSMStateConfig<'login', LoginPayload>;

export class LoginState implements FSMState<LoginConfig> {
  name = 'login' as const;

  async handleNext(context: FSMContext<AuthConfig>, payload: LoginPayload): Promise<void> {
    switch (payload.intent) {
      case 'submit':
        // we should use an authentication service by dependency injection in the context instance
        // this will let us test the FSM with a mocked authService, not actually calling API
        const session = context.authService.getSession(payload);

        if (session.user) {
          // store session in the manager instance
          context.session = session;
          // transition to the authenticated state
          context.transitionTo(new AuthenticatedState());
        } else {
          // handle error, for example storing it into the manager instance
          context.error = session.error;
        }
        break;
      default:
        throw new Error(`Method ${payload.intent} not implemented.`);
    }
  }
}
```

And here's the code for the context instance, the "core" of our FSM:

```typescript
import { Notifies, PubSub } from '@dxbox/use-less-react/classes';
import { InitializingConfig, InitializingState } from './states/initializing';
import { LoginConfig } from './states/login';
import { AuthenticatedConfig } from './states/authenticated';
import { FSMContext, type FSMState } from './types';

export type AuthConfig = InitializingConfig & LoginConfig & AuthenticatedConfig;

export class AuthFlowManager extends PubSub implements FSMContext<AuthConfig> {
  private _currentState: FSMState<AuthConfig>;
  private _error: Error | null;
  private _session: Session | null;

  constructor(initialState?: FSMState<AuthConfig>) {
    super();
    this._session = null;
    this._error = null;
    this._currentState = initialState ?? new InitializingState();

    // handle default state:
    if (!initialState) {
      this._currentState.handleNext(this, { intent: 'check-session' });
    }
  }

  // implement the FSMContext contract
  async dispatch<T extends keyof AuthConfig>(payload: AuthConfig[T]): Promise<void> {
    await this._currentState.handleNext(this, payload);
  }

  @Notifies('currentState', 'error')
  transitionTo(state: FSMState<AuthConfig>) {
    this.error = null;
    this._currentState = state;
  }

  // implement getters and setters to ensure reactivity
  public get currentState() {
    return this._currentState;
  }

  public get error() {
    return this._error;
  }

  // use this.notify instead of Notifies for setters methods
  public set error(err: Error | null) {
    this._error = err;
    this.notify("error");
  }

  public get session() {
    return this._session;
  }

  // use this.notify instead of Notifies for setters methods
  public set session(session: Session | null) {
    this._session = session;
    this.notify("session");
  }
}
```
Quick, powerful and, most importantly: to add new states, the only line of code you'll need to change is this one

```typescript
export type AuthConfig = InitializingConfig & LoginConfig & AuthenticatedConfig;
```

like this:

```typescript
export type AuthConfig = /* existing states */ & ProfilePendingState;
```

### 2\. Adding the Profile Pending State

Our original pain point — enforcing profile completion — is resolved by making the `AuthenticatedState` responsible for its own integrity:

```typescript
// File: states/authenticated.ts
export class AuthenticatedState implements IAuthState<'authenticated'> {
  // ...
    if (context.user && !isComplete(context.user)) {
      // Transition directly to the required state
      context.transitionTo(new ProfilePendingState()); 
      return;
    }
}
```

### 3\. The React View Remains Clean

Crucially, the React component (`AuthConnector`) remains blissfully unaware of the complexity. It only sees the current state name and dispatches user actions.

```tsx
// File: auth.connector.tsx (Declarative View)
'use client';

import { AuthFlowManager } from '@/modules/auth';
import { useReactiveInstance } from '@dxbox/use-less-react/client';
import { FC } from 'react';

export const AuthConnector: FC = () => {
  const {
    state: { currentState },
    instance: authManager,
  } = useReactiveInstance(
    () => new AuthFlowManager(),
    (authManager) => ({
      currentState: authManager.currentState,
    }),
    ['currentState'],
  );

  return (
    <div>
      <div>
        <h1>{currentState.name}</h1>{isLoading && <Spinner />}
      </div>

      // of course you can use use-less-react's GenericContext to share authManager without prop-drilling
      {currentState.name === 'login' && <LoginComponent authManager={authManager} />}
      {currentState.name === 'profile-pending' && <ProfilePendingComponent authManager={authManager} />}
      {currentState.name === '2fa' && <TwoFAComponent authManager={authManager} />}
    </div>
  );
};
```

`LoginComponent` is simply:


```tsx
// File: login.component.tsx (Declarative View)
'use client';

import { AuthFlowManager } from '@/modules/auth';
import { useReactiveInstance } from '@dxbox/use-less-react/client';
import { FC, useState } from 'react';

export interface LoginComponentProps {
  authManager: AuthFlowManager;
}

export const LoginComponent: FC<LoginComponentProps> = ({ authManager }) => {
  // you should use a more complex form with validations, this is just a basic example
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const {
    state: { error },
  } = useReactiveInstance(
    authManager,
    (authManager) => ({
      error: authManager.error,
    }),
    ['error'],
  );

  return (
    <div className={`mt-2 flex flex-col gap-4 ${isLoading && 'opacity-50'}`}>
      <label>
        <p>Email</p>
        <input
          disabled={isLoading}
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
        />
      </label>
      <label>
        <p>Password</p>
        <input
          disabled={isLoading}
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
        />
      </label>
      <button
        className="text-left"
        disabled={isLoading}
        onClick={async () => {
          // see how use-less-react seamlessly integrates with React's useState, if needed
          setIsLoading(true);
          await authManager.dispatch<'login'>({ intent: 'submit', email, password });
          setIsLoading(false);
        }}
      >
        Submit
      </button>

      {error && <ErrorUI error={error}>}
    </div>
  );
};
```

## Comparing the "Central-Hook Approach" with the "`use-less-react` Approach"

The central hook approach couples the UI layer, the state data, and the business logic. It will be difficult to write, debug and test. Just thinking of all the `act` and `waitForNextUpdate` calls inside the tests should give you headache.

The State Pattern powered by `use-less-react` clearly separates the concerns, leaving the UI lightweight and the business logic robust and future-proof. Adding 2FA or handling the "complete profile" step is now a matter of writing one new class and changing a couple lines in the context file (the import of the new state type and adding it to the possible states type). You will "wire" the new state to the old ones - but only to those states that actually have transitions to it.
Lastly, the behavior of the FSM flow will be testable even state-by-state, and you can initialize your FSM in any given state to test specific transitions.

The changes to introduce new transitions will be local and you won't need to savage all your old code - you will act like a surgeon, not like a butcher.

## Ok, but what about the types you used?

Yes, we imported some types from the `types.ts` file in the example, but we didn't see them yet.

Here they are:

```tsx
// File: types.ts
export type FSMStateConfig<TName extends PropertyKey, TPayload> = Record<TName, TPayload>;

export type FSMState<TStateConfig> =
  TStateConfig extends FSMStateConfig<infer TName, infer TPayload>
    ? {
        name: TName;
        handleNext(context: FSMContext<TStateConfig>, payload: TPayload): Promise<void>;
      }
    : never;

export type FSMContext<TConfig extends FSMStateConfig<PropertyKey, unknown>> = {
  dispatch<T extends keyof TConfig>(payload: TConfig[T]): Promise<void>;
  transitionTo(state: FSMState<TConfig>): Promise<void>;
};
```

While these generic type definitions (`FSMStateConfig`, `FSMState`, and `FSMContext`) may appear abstract and complex, particularly to those less familiar with advanced TypeScript features, they represent a critical investment in architectural quality.

These three types collectively **encapsulate the entire FSM contract**, adhering to a single, clear responsibility: enforcing strict, compile-time validation of state transitions and payloads across the entire application. 

Let's also consider that they won't need any changes as requirements scale: **you write them once**, and they'll keep ensuring maximum flexibility, providing a battle-tested State Design Pattern - forever. 

Truth be told: types like this will soon be **provided out-of-the-box** as a part of `use-less-react`. The goal of this library is to empower developers to adopt effective patterns with minimal boilerplate, instead of letting them fall into anti-patterns like writing logics inside centralized hooks. So it makes sense to provide all the necessary tools (types/interfaces, classes, code generators, etc.) to get the job done without re-inventing the wheel.

### Update 02/11/2025
The context base class and types for implementing the **State Design Pattern** have been included as a part of [`use-less-react` v0.5.0](https://www.npmjs.com/package/@dxbox/use-less-react/v/0.5.0), you can find the documentation [here](/docs/use-less-react/api/patterns/state)!.

## Conclusion

By adopting the State Design Pattern with `use-less-react`, we achieve a superior architectural outcome:

| Feature | Monolithic Hook (`useAuth`) | State Pattern (`AuthFlowManager`) |
| :--- | :--- | :--- |
| **Testability** | Difficult, requires mocking parts of the hook and using non-intuitive test utilities like `act` and. `waitForNextUpdate`. | Easy: each state class is an isolated unit. They can be unit-tested, or you can test only specific transitions by initializing the FSM in a specific state. |
| **Extensibility (OCP)** | Low, new steps break the central `switch`. | High, new states (`ProfilePending`, `2FA`) are new classes, *extending* the system. |
| **Logic Location (SRP)** | Scattered across `switch` statements and/or chained `useEffect`s. | **Encapsulated** within dedicated classes. |

Moving complex client-side workflows into a robust, class-based FSM is a pivotal step toward building scalable, bug-free applications. `use-less-react` simply provides the highly efficient reactive bridge needed to complete this architecture, enabling powerful and battle-tested Design Patterns.
