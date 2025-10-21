
import { SandboxEmbed } from '../../../src/components/SandboxEmbed';

const app = `
import React from "react";
import { useReactiveInstance } from "@dxbox/use-less-react/client";
import { Counter } from "/counter.ts";

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
}`;

const counter = `
import { PubSubMixin, Notifies } from  "@dxbox/use-less-react/classes";
import { Counter as BaseCounter } from "/third-party-lib.ts";

export class Counter extends PubSubMixin(BaseCounter) {
  constructor(public count: number = 0) { 
    super();
  }

  @Notifies("count")
  increment() {
    super.increment();
  }
}
`;

const thirdParty = `
export class Counter {
  constructor() { 
    this.count = 0;
  }
  increment() {
    this.count++;
  }
}
`;

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
  "/third-party-lib.ts": {
    code: thirdParty 
  },
  "/index.ts": {
    code: appIndex,
    hidden: true,
  }
}

export default function Playground() {
  return <SandboxEmbed template='react-ts' files={files} />
}
