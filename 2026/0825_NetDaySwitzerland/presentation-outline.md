# Supercharge Your Agents

## Session

- **Event:** .NET Day Switzerland 2026
- **Date:** August 25, 2026
- **Location:** Arena Cinemas, Sihlcity, Zurich
- **Session:** Supercharge Your Agents: Custom Tools, MCP, and Microsoft Foundry
- **Audience outcome:** Attendees leave with a practical mental model for choosing a Foundry agent hosting option and extending an agent with reusable tools.

## Narrative

1. Start with the agent landscape: Microsoft Foundry brings models, agents, tools, and operational controls into one platform.
2. Compare prompt agents with hosted agents. Prompt agents are authored and run by Foundry; hosted agents let developers bring their own code and runtime.
3. Show the hosted-agent development loop: create, run locally, deploy, invoke, and inspect.
4. Explain that tools are the action and knowledge boundary of an agent. Use built-in tools when they fit; use custom tools when the capability belongs to your application or organization.
5. Demonstrate MCP and toolboxes. A toolbox packages capabilities behind one MCP-compatible endpoint, so the same tool set can be reused by multiple runtimes.
6. Close with the control-plane view: inventory, lifecycle, tracing, usage, and cost become important as the number of agents grows.

## Run of Show

| Slides | Topic | Approx. time | Format |
| --- | --- | ---: | --- |
| 1-8 | Welcome, context, Foundry, and agent-service choices | 10 min | Talk |
| 9 | **Demo 1: Create and deploy a hosted agent** | 10 min | Live demo |
| 10-11 | Extending agents, MCP, and toolboxes | 5 min | Talk |
| 12 | **Demo 2: Use a pre-provisioned toolbox with Microsoft Learn MCP** | 10 min | Live demo |
| 13 | Manage agents at scale and inspect one trace | 3 min | Portal tour |
| 14-15 | Resources and close | 2 min | Talk |
| 15 | Questions and deployment buffer | 5 min | Q&A |

Target length: 45 minutes. The two demos provide the core content; the final five minutes absorb questions and deployment latency.

## Demo Story

### Demo 1: Hosted agent

Build the smallest useful custom agent that owns its orchestration code. Run it locally, deploy it to Foundry Agent Service, invoke its dedicated endpoint, and show that Foundry supplies managed hosting, identity, versioning, and observability.

**Success moment:** The same agent behavior works locally and from the hosted endpoint, with a new agent version visible in Foundry.

### Demo 2: Toolbox with Microsoft Learn MCP

Use a pre-provisioned toolbox containing Web Search and the Microsoft Learn MCP server. Connect the toolbox to an agent, ask a current .NET or Foundry question, and show the tool calls and cited answer. Keep toolbox creation and connection setup in the rehearsal notes rather than performing them live.

**Success moment:** Add or change a tool in the toolbox without changing the agent's core orchestration code.

### Optional close-out: Operations

After either demo invocation, open traces and the agent inventory. Point out that the production conversation includes more than the final answer: tool calls, latency, token usage, errors, and trace identifiers.

## Key Takeaways

- Choose **prompt agents** when Foundry-managed execution and portal/SDK authoring are enough.
- Choose **hosted agents** when you need your own code, packages, protocols, state, or runtime control.
- Choose **function tools** for application-owned logic that should execute in your process.
- Choose **MCP** for a standard connection to reusable external capabilities.
- Choose a **toolbox** when a curated, centrally managed bundle should be shared across agents and runtimes.
- Treat identity, approval policy, data boundaries, tracing, and versioning as part of the design, not as demo-day details.

## Presenter Checklist

- Confirm the Foundry project, model deployment, region, and required RBAC roles.
- Deploy and invoke Demo 1 before attendees arrive.
- Create and test the Microsoft Learn MCP connection and toolbox before the session.
- Record the toolbox name, version, endpoint, and agent configuration so the live demo starts at the useful interaction.
- Have a pre-recorded screen capture or screenshots for provisioning and deployment waits.
- Remove secrets, tokens, personal data, and attendee information from prompts and traces.
- Verify that any preview features are still available on the day of the session.

## Reference Documentation

- [What is Microsoft Foundry?](https://learn.microsoft.com/azure/foundry/what-is-foundry)
- [Deploy a hosted agent](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent)
- [Deploy a hosted agent from source code](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent-code)
- [Connect agents to Model Context Protocol servers](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol)
- [Create and manage a toolbox in Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox)
- [Manage agents at scale in Microsoft Foundry Control Plane](https://learn.microsoft.com/azure/foundry/control-plane/how-to-manage-agents)
- [Set up tracing in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/observability/how-to/trace-agent-setup)