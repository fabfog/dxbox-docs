# Command Bus

## Overview

The `HybridCommandBus` is a core architectural component designed to manage the initiation and execution of state-changing operations (Commands) across an application. It enforces the Command pattern, guaranteeing that every command is handled by **exactly one** handler, thus ensuring a clear, traceable, and modular application flow.

The "Hybrid" nature of the bus allows for seamless dispatching of commands either **locally** (processed by a handler within the current client process) or **remotely** (serialized and sent over the network, e.g., via HTTP or WebSocket), using a unified `dispatch()` API.

## Core Concepts

| Component | Role | Responsibility |
| :--- | :--- | :--- |
| **Command** | Intent | An immutable data structure representing a user's *intention* to change the application state (e.g., `UpdateUserProfileCommand`). |
| **Command Bus** | Dispatcher | The central mechanism that receives a Command, identifies its type, and forwards it to the correct, single Handler. It manages the local/remote routing decision. |
| **Command Handler**| Executor | Contains the business logic required to execute a specific Command. It is responsible for coordinating services and updating the domain state. |
| **Remote Sender** | Infrastructure | An optional dependency responsible for serializing a Command and sending it to a remote endpoint. |

## Usage and Configuration

### 1. Initialization and Registration

The `HybridCommandBus` must be configured during application startup by providing optional infrastructure services (`RemoteCommandSenderInterface` and `MonitoringPortInterface`) and registering all local handlers.

```typescript
import { HybridCommandBus, UpdateUserProfileCommand, UserProfileHandler } from './command-bus-core';

// 1. Define Infrastructure (Mocks or Real implementations)
const remoteSender = new MyRemoteSender(); 
const monitoringService = new MyMonitoringService();

// 2. Initialize the Bus
const commandBus = new HybridCommandBus({
  remoteSender,
  monitoringService,
});

// 3. Register Handler (One-to-One mapping is enforced)
commandBus.registerLocalHandler(
  "UpdateUserProfileCommand",
  new UserProfileHandler()
);
```

### 2\. Dispatching Commands

Components only interact with the Command Bus via the `dispatch()` method. The bus determines whether to execute the command locally or send it remotely.

**Local Dispatch:** Executes the command immediately on the client-side using the registered `CommandHandler`.

```typescript
import { commandBus } from '../command-bus';

// Create a Command instance
const command = new UpdateUserProfileCommand({ 
  userId: 'user-789', 
  newName: 'Jane Doe' 
});

try {
  // Executes locally by default
  await commandBus.dispatch(command); 
  console.log("Local execution completed successfully.");
} catch (error) {
  // Handle business logic errors thrown by the Handler
  console.error("Local Command Failed:", error); 
}
```

**Remote Dispatch:** Sends the command to the external `RemoteSender` service. This is enabled by implementing `RemoteCommandMarkerInterface` and adding an `isRemote = true as const` to the Command class.

```typescript
import { commandBus } from '../app-setup';

class UpdateUserProfileCommand 
  extends Command<"Update", { userId: string, newName: string }> 
  implements RemoteCommandMarkerInterface
{
  get type(): "UpdateUserProfile" {
    return "UpdateUserProfile";
  }

  isRemote = true as const;
}

const remoteCommand = new UpdateUserProfileCommand({ 
    userId: 'user-001', 
    newName: 'Remote User' 
});

try {
  // Handled by the RemoteSender service
  await commandBus.dispatch(remoteCommand); 
} catch (error) {
  // Handle infrastructure/network errors from the RemoteSender
  console.error("Remote Dispatch Failed:", error); 
}
```

## Error Handling and Monitoring

The Command Bus is designed with high traceability. All critical failures are logged via the injected `MonitoringPortInterface` using distinct error codes, providing context on the source of the failure (configuration, dispatch, or execution).

| Error Code | Origin / Phase | Description | What to do |
| :--- | :--- | :--- | :--- |
| **`MULTIPLE_HANDLERS_FOR_COMMAND`** | Registration | An attempt was made to register a second handler for a Command type that already has one. This violates the Command Bus's One-to-One guarantee. | Review application setup to ensure only one `registerLocalHandler` call exists per Command type. |
| **`NO_HANDLER_FOR_COMMAND`** | Dispatch (Local) | A Command was dispatched locally, but no corresponding `CommandHandler` was found registered with the Bus for that specific Command type. | Register the necessary handler during application initialization or ensure the Command type string is correct. |
| **`LOCAL_HANDLER_EXECUTION_FAILED`** | Execution (Local) | The registered `CommandHandler` threw an exception during its execution (i.e., a business logic validation failure or service dependency error). | This is a business exception. The caller must catch it to provide user feedback or transactional rollback. |
| **`REMOTE_SENDER_NOT_CONFIGURED`** | Dispatch (Remote) | A Command marked as remote (`isRemote: true`) was dispatched, but the `remoteSender` dependency was not provided during the `HybridCommandBus` construction. | Configure the `HybridCommandBus` with a valid implementation of `RemoteCommandSenderInterface`. |
| **`REMOTE_SEND_FAILED`** | Dispatch (Remote) | The configured `RemoteCommandSender` failed to deliver the serialized Command (e.g., network timeout, connection refusal, invalid serialization). | This is an infrastructure error. Check network connectivity, serialization logic, and the remote endpoint status. |

This structure ensures that system failures and business logic exceptions are cleanly separated and traceable via the registered monitoring service.

