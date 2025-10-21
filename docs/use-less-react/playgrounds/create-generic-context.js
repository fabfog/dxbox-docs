
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

export default function Playground() {
return <SandboxEmbed files={{
  "/App.js": `
import React from "react";
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.js";

import { GenericContextProvider } from './context.js';
import { CounterComponent } from './counter-component.js';

export default function App() {
  const counter = React.useRef(new Counter())
  
  return (
    <GenericContextProvider value={counter.current}>
      <CounterComponent />
    </GenericContextProvider>
  );
}
  `,
    "/counter.js": `
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
"/context.js": `
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";

const [GenericContextProvider, useGenericContext] = createGenericContext();

export { GenericContextProvider, useGenericContext }
`,
  "/counter-component.js": `
import React from "react";
import { useReactiveInstance, createGenericContext } from "@dxbox/use-less-react/client";
import { GenericContextProvider, useGenericContext } from './context.js';

export function CounterComponent() {
  const counter = useGenericContext();

  const { 
    state: { count }, 
    instance,
  } = useReactiveInstance(
    counter,
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
    "/index.js": `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`
    }}
  />
}