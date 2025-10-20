
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

export default function Playground() {
return <SandboxEmbed files={{
  "/third-party-lib.js": `
export class Counter {
  constructor() { 
    this.count = 0;
  }
  increment() {
    this.count++;
  }
}
`,
    "/counter.js": `
import { PubSubMixin, Notifies } from  "@dxbox/use-less-react/classes";
import { Counter as BaseCounter } from "/third-party-lib.js";

export class Counter extends PubSubMixin(BaseCounter) {
  constructor() { 
    super();
  }
  @Notifies("count")
  increment() {
    super.increment();
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