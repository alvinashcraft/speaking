# Foundry Agents Demo Guide

These are live-demo notes for the .NET Day Switzerland session. Run the demos against a disposable project and non-sensitive data. Names, screens, and command syntax can change as Foundry evolves, so perform a dry run shortly before August 25, 2026.

## Demo 1: Create and Deploy a Hosted Agent

### Goal

Show the developer-owned path: the agent is normal application code, but Foundry provides a managed endpoint, versioning, identity, scaling, and telemetry.

### Before the session

- A Microsoft Foundry project with a deployed chat model.
- A .NET hosted-agent sample or small agent application that runs locally.
- Azure Developer CLI (`azd`) and the Microsoft Foundry Toolkit for VS Code installed.
- Docker running if using the container deployment path.
- Permission to deploy hosted agents, including the Foundry Project Manager role where required.
- `azd auth login` completed and the correct subscription/project selected.

### Live steps

1. Open the .NET agent project and show the instructions, model configuration, tool registration, and hosting manifest. Keep the code small enough that the audience can see the application boundary.
2. Run the agent locally and send a prompt such as:

   ```text
   Explain the difference between a prompt agent and a hosted agent in two sentences.
   ```

3. Point out that local execution proves the agent code works, but does not yet provide a managed Foundry endpoint.
4. Provision only if this is a fresh environment:

   ```bash
   azd provision
   ```

5. Deploy the agent:

   ```bash
   azd deploy
   ```

   Explain that the deployment flow packages the code, builds or pushes the image, creates a hosted-agent version, and configures the supporting identity and resources.

6. Show the new version in the Foundry portal and wait for its status to become active.
7. Invoke the deployed agent:

   ```bash
   azd ai agent invoke "Explain the difference between a prompt agent and a hosted agent in two sentences."
   ```

8. Open the agent's Playground or endpoint details and compare the hosted response with the local response.
9. Open Traces and show the request, model call, latency, and any tool spans. Do not expose prompt content containing secrets or personal data.
10. If time permits, mention rather than perform the second deployment: a small instruction change followed by `azd deploy` creates a new version while the previous version remains available.

### Talking points

- Hosted agents are the choice when the agent itself is an application, not just a configuration.
- Foundry owns the service boundary; the team still owns code, dependencies, prompts, and runtime behavior.
- Deployment creates versions. Versioning makes a change reviewable and gives the team a rollback story.
- Managed identity is preferable to putting credentials in source code or prompts.
- A successful final answer is not enough for production. Trace the path that produced it.

### Fallback path

Use **Foundry Toolkit: Deploy Hosted Agent** from the VS Code Command Palette. Select **Code** or **Container**, review the generated deployment settings, and deploy. This is useful when Docker or `azd` is not ready on the presentation machine.

### Recovery notes

- **Deployment is still pending:** switch to the pre-deployed version and explain the lifecycle while polling in the background.
- **Model deployment unavailable:** use the pre-created project and show the model selection rather than provisioning live.
- **Local code works but hosted code fails:** inspect environment variables, managed-identity permissions, container logs, and the agent version status.
- **No trace appears:** confirm that the project is connected to Application Insights, invoke the agent once more, and verify telemetry permissions.

## Demo 2: Create and Deploy a Toolbox

### Goal

Show how to turn several capabilities into one reusable MCP endpoint. The demo uses Web Search plus the Microsoft Learn MCP server so the agent can answer a current technical question with first-party documentation.

The live portion starts with the toolbox already created and tested. The connection and CLI/YAML setup below are rehearsal instructions, not live presentation steps.

### Before the session

- An active Foundry project and model deployment.
- Permission to create toolbox versions and project connections.
- A disposable project connection for the public Microsoft Learn MCP endpoint.
- A tested toolbox version with a short description on every tool.
- A hosted or prompt agent ready to consume the toolbox.
- The toolbox already attached to, or ready to attach to, the demo agent.
- A backup screenshot or recording showing toolbox creation and configuration.
- The unified Foundry CLI extension bundle installed:

   ```bash
   azd ext install microsoft.foundry
   ```

The documented Microsoft Learn MCP endpoint is `https://learn.microsoft.com/api/mcp`. It is public, so do not add a secret or custom authorization header for this demo.

### Rehearsal setup: provision before the session

1. Set the active Foundry project endpoint:

   ```bash
   azd ai project set https://<account>.services.ai.azure.com/api/projects/<project>
   ```

2. Create a connection for the Microsoft Learn MCP server:

   ```bash
   azd ai connection create learn-mcp-conn \
     --kind remote-tool \
     --target https://learn.microsoft.com/api/mcp \
     --auth-type none
   ```

3. Create `demo-toolbox.yaml`:

   ```yaml
   description: Web search and Microsoft Learn documentation for technical answers
   connections:
     - name: learn-mcp-conn
   ```

4. Create the toolbox from the YAML file:

    ```bash
    azd ai toolbox create learn-toolbox --from-file demo-toolbox.yaml
    ```

   Alternatively, create a version from the Foundry portal. Use the tool configuration UI to add Web Search and the Microsoft Learn MCP server, then provide clear descriptions for both. Verify that the tools load and record the toolbox name and version.

### Live steps: use the prepared toolbox

1. Show the prepared toolbox, its version, and the two capabilities it exposes. Explain that the audience is seeing the reusable contract, not a one-off tool wired into application code.
2. Attach or select the toolbox for the demo agent using its MCP endpoint. Keep approval explicit for action-taking tools; for this read-only demo, the selected tools can run without approval if the project policy allows it.
3. Ask the agent:

   ```text
   What is the current Microsoft guidance for connecting a .NET agent to an MCP server? Cite Microsoft Learn sources and separate Foundry Agent Service guidance from Agent Framework guidance.
   ```

4. Show the tool selection, the Microsoft Learn result, and the citations in the response.
5. Ask a follow-up that requires the same knowledge source:

   ```text
   Turn that guidance into a five-step checklist for a developer preparing a local demo.
   ```

6. If time permits, show the existing version list or a prepared screenshot of a second version. Explain that changing the bundle does not require rewriting the agent's orchestration code.

### Talking points

- MCP standardizes the connection between an agent and a server that exposes tools or contextual data.
- A toolbox is an operational boundary: reuse, credentials, policy, and versioning live in one place.
- The agent chooses tools based on their descriptions. Good descriptions are part of the interface contract.
- Read-only documentation search is a good first demo because it makes grounding and citations visible.
- Pre-provisioning keeps the live segment focused on agent behavior and the MCP contract instead of waiting on infrastructure.
- For third-party MCP servers, review data handling, terms, retention, cost, and trust. Foundry does not make an external service automatically safe.
- Use project connections for authentication. Never paste credentials into a prompt or source file.

### Recovery notes

- **MCP server does not load:** verify the endpoint, connection name, project, and network access.
- **Consent required:** complete the documented OAuth consent flow if the selected server requires it; the public Microsoft Learn endpoint should not require OAuth.
- **The agent ignores the tool:** improve the tool description, ask a question that clearly needs current documentation, and verify the toolbox version attached to the agent.
- **No citations:** ask explicitly for Microsoft Learn citations and confirm the response came from the documentation tool rather than model memory.

## Optional Operations Finish

1. In Foundry, go to **Operate > Assets > Agents** and show the inventory view.
2. Open the agent's traces and select the latest invocation.
3. Point out the trace ID, conversation ID, ordered tool calls, response, and token/latency data.
4. Connect this to the final slide: once agents multiply, inventory, observability, lifecycle, and cost are product capabilities.

## Documentation Used

- [Deploy a hosted agent](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent)
- [Create and manage a toolbox in Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox)
- [Connect agents to Model Context Protocol servers](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol)
- [Manage agents at scale in Microsoft Foundry Control Plane](https://learn.microsoft.com/azure/foundry/control-plane/how-to-manage-agents)
- [Set up tracing in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/observability/how-to/trace-agent-setup)