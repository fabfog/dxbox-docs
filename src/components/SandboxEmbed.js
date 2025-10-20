import React from "react";
import { RefreshIcon, Sandpack } from "@codesandbox/sandpack-react";
import BrowserOnly from '@docusaurus/BrowserOnly';

export function SandboxEmbed({ files, height = "100%", template = "react" }) {
  return (
    <div>
      <p>Try it out in the playground:</p>
      <BrowserOnly style={{ overflow: "hidden" }}>
        {() => <Sandpack
          template={template}
          files={files}
          options={{
            showConsole: false,
            showNavigation: true,
            showLineNumbers: true,
            showRefreshButton: true,
            editorHeight: 600,
            editorWidthPercentage: 60
          }}
          customSetup={{
            dependencies: {
              react: "19.1",
              "react-dom": "19.1",
              "@dxbox/use-less-react": "latest",
              "use-immer": "0.11",
              "immer": "10.1"
            }
          }}
          style={{ height }}
        />}
      </BrowserOnly>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 14, fontStyle: "italic" }}>
        If you edit the code of any class inside this sandbox, please hit the "refresh 
        preview" <span style={{
          margin: 2,
          display: "inline-block",  
          transform: "translateY(3px)"        
        }}>
          <RefreshIcon style={{ 
            fill: "#808080", 
            backgroundColor: "#EFEFEF",
          }} />
        </span> button to apply changes.
      </div>
    </div>
  );
}
