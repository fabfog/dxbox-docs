# `createHydrationContext`

## Overview
`createHydrationContext` builds upon `createGenericContext` to handle **server-to-client hydration** of serializable class instances. It provides two nested contexts — one for passing **dehydrated** data (serialized value) from server side to client side, and another for **hydrating** instances and sharing them to client components (runtime value).

## Example

First, you define your class by decorating it with the `@Serializable` decorator and implementing the `dehydrate` instance method and the `hydrate` static method.

```ts
// classes.ts 
@Serializable()
export class Sprite extends PubSub {
  constructor(private x: number, private y: number) {
    super();
  }

  get position() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  @Notifies("position")
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // this method will create an instance from a plain object
  static hydrate(obj: object) {
    if (
      "x" in obj &&
      typeof obj.x === "number" &&
      "y" in obj &&
      typeof obj.y === "number"
    ) {
      return new Sprite(obj.x, obj.y);
    }
    throw new Error("invalid params");
  }

  // this method will serialize an instance to a plain object
  dehydrate() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
```

You must register the class inside a **static** constant shared between server side and client side:
```ts
// serializable-classes-registry.ts
export const serializableClassesRegistry: SerializableClassesRegistry = {
  Sprite,
};
```

You must declare a type which defines the structure of the shared data. For example:
```ts
// types.ts
import { SerializableRecord } from "@dxbox/use-less-react/classes";
export interface HomepageHydratedProps extends SerializableRecord {
  playerSprite: Sprite;
}
```

Create a context provider and its related hook, by passing the type of the shared data as generics, and the registry constant (to let it know which classes to use when deserializing data). 
```ts
// hydration-context.ts
import { SerializableClassesRegistry } from "@dxbox/use-less-react/classes";
import { createHydrationContext } from "@dxbox/use-less-react/client";

export const [HomepageHydrationProvider, useHomepageHydratedInstances] =
  createHydrationContext<HomepageHydratedProps>(serializableClassesRegistry);
```

Use the hydration provider in the page (server side) passing it the dehydrated data.
```ts
// page.ts (server side)
import { HomepageHydrationProvider } from "./context";
import { HomepageHydratedProps } from "./types";
import { dehydrateInstances } from "@dxbox/use-less-react/classes";

function Homepage() {
  const playerSprite = new Sprite(5, 5);
  const value: HomepageHydratedProps = { playerSprite };

  return (
    <HydrationProvider dehydratedData={dehydrateInstances(value)}>
      <HomepageClientSideComponent />
    </HydrationProvider>
  );
}
```

Finally, retrieve the data client-side (it will be re-hydrated automatically by the hook) and use any instances from it, with `useReactiveInstance`.
```ts
// components/sprite.ts (client side)
"use client"
// import from the correct path to your context.ts file
import { useHomepageHydratedInstances } from "@/app/context.ts"; 
import { useReactiveInstance } from "@dxbox/use-less-react/client";

export const HomepageClientSideComponent: FC = () => {
  // get hydrated instances
  const hydratedInstances = useHomepageHydratedInstances();

  // use a specific instance with useReactiveInstance
  const {
    state: { position },
    instance: playerSprite,
  } = useReactiveInstance(hydratedInstances.playerSprite, ["position"]);

  return (
    <div>
      // print an instance state portion
      <pre>{JSON.stringify(position)}</pre>
      <button
        // call a method of the instance
        onClick={() => {
          playerSprite.setPosition(9, 9);
        }}
      >
        Set position
      </button>
    </div>
  );
};
```

## Properties

| Property / Return | Type | Description |
|--------------------|------|--------------|
| `DehydrationProvider` | `FC<PropsWithChildren<{ dehydratedData: Record<string, SerializedInstance> }>>` | Top-level provider that passes down the dehydrated data. |
| `useHydratedInstances()` | `() => HydratedPropsReturn` | Hook to access hydrated instances from the nested context. |
| **Return value** | `[DehydrationProvider, useHydratedInstances]` | A tuple containing the main provider and the hook. |

### Notes
- Internally, two contexts are created using `createGenericContext`:
  1. One for **dehydrated data** (serialized on the server).
  2. One for **hydrated instances** (rehydrated on the client).
- The `hydrateInstances` function reconstructs real instances from their serialized representations using the `SerializableClassesRegistry`.
- The design ensures **stable, shared instance references** between components — preventing multiple independent hydrations of the same object.
- This pattern allows **universal class instances** to persist seamlessly across server and client boundaries in a Next.js/React environment.
