
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

export default function Playground() {
return <SandboxEmbed template="react-ts" files={{
  "/App.tsx": `
import React from "react";
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.ts";

import { GenericContextProvider } from './context.ts';
import { CounterComponent } from './counter-component.ts';

export default function App() {
  const counter = React.useRef(new Counter())
  
  return (
    <GenericContextProvider value={counter.current}>
      <CounterComponent />
    </GenericContextProvider>
  );
}
  `,
    "/counter.ts": `
import { PubSub } from  "@dxbox/use-less-react/classes";

export class Counter extends PubSub {
  constructor() { 
    super();
    this.count = 0;
  }
  increment() {
    this.count++;
    this.notify("count");
  }
}
`,
"/context.ts": `
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";

const [GenericContextProvider, useGenericContext] = createGenericContext();

export { GenericContextProvider, useGenericContext }
`,
  "/counter-component.ts": `
import React from "react";
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";
import { GenericContextProvider, useGenericContext } from './context.ts';

export function CounterComponent() {
  const counter = useGenericContext();

  const { 
    state: count, 
    instance,
  } = useReactiveInstance(
    counter,
    (instance) => instance.count,
    ["count"]
  );
  
  return (
    <div style={{ padding: 20 }}>
      <div>Count: {count}</div>
      <button style={{ marginTop: 10 }}
        onClick={() => instance.increment()}
      >
        Increment
      </button>
    </div>
  );
}
  `,
    "/index.ts": `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`
    }}
  />
}