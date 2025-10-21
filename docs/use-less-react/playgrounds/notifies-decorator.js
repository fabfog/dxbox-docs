
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

export default function Playground() {
return <SandboxEmbed files={{
    "/App.js": `
import React from "react";
import { useReactiveInstance } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.js";

export default function App() {
  const { state: { count }, instance } = useReactiveInstance(() => new Counter(), ["count"]);
  return (
    <div style={{ padding: 20 }}>
      <h3>Counter</h3>
      <div>Count: {count}</div>
      <button
        style={{ marginTop: 10 }}
        onClick={() => instance.increment()}
      >
        Increment
      </button>
    </div>
  );
}
`,
    "/counter.js": `
import { PubSub, Notifies } from  "@dxbox/use-less-react/classes";

export class Counter extends PubSub {
  constructor() { 
    super();
    this.count = 0;
  }
  @Notifies("count")
  increment() {
    this.count++;
  }
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