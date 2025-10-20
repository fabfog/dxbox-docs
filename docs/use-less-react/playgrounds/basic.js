
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

export default function Playground() {
return <SandboxEmbed files={{
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
  "/App.js": `
import React from "react";
import { useReactiveInstance } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.js";

export default function App() {
  const { 
    state: { count }, 
    instance,
  } = useReactiveInstance(
    () => new Counter(),
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