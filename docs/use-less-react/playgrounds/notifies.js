
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

const app = `
import React from "react";
import { useReactiveInstance } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.ts";

export default function App() {
  const {
    state: count, 
    instance,
  } = useReactiveInstance(
    () => new Counter(),
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
}`;

const counter = `
import { PubSub, Notifies } from  "@dxbox/use-less-react/classes";

export class Counter extends PubSub {
  constructor(public count: number = 0) { 
    super();
  }
  @Notifies("count")
  increment() {
    this.count++;
  }
}
`

const appIndex = `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`

const files = {
  "/App.tsx": {
    code: app,
  },
  "/counter.ts": { 
    code: counter,
  },
  "/index.ts": {
    code: appIndex,
    hidden: true,
  }
}

export default function Playground() {
  return <SandboxEmbed template='react-ts' files={files} />
}