# Slide Notes

## Slide 1 - Supercharge Your Agents

- Welcome the audience and frame the session as a practical tour of agent capabilities beyond a chat prompt.
- The three anchors are custom tools, MCP, and Microsoft Foundry as the management and hosting layer.
- Promise two concrete demos: deploy an agent and compose a reusable toolbox.

## Slide 2 - About me

- Give a short credibility statement: developer-focused content, .NET, Azure, and practical tooling.
- Keep this brief. The audience came for the agent workflow, so move quickly to their problems.

## Slide 3 - TechBash

- This is a short community/conference plug, not part of the technical narrative.
- Mention the value of deep technical sessions and hallway conversations, then return to today's session.

## Slide 4 - Agenda

- Preview the arc: platform, agent-service choices, hosted-agent demo, tools and MCP, toolbox demo, operations.
- Tell attendees to watch for the boundary between code they own and capabilities Foundry manages.

## Slide 5 - What is Microsoft Foundry?

- Describe Foundry as the Azure platform for building and operating AI applications and agents.
- It brings together projects, model deployments, agent authoring, tools, evaluation, tracing, and governance.
- Emphasize that Foundry is more than a model endpoint: the surrounding lifecycle is the point.

## Slide 6 - What can you build in Foundry?

- Separate the nouns: models provide reasoning, agents provide behavior, and tools connect behavior to data and actions.
- Prompt agents are configuration-led. Hosted agents are code-led. Both can use tools.
- The model catalog is broad, but model availability, quotas, region, and tool support still matter.

## Slide 7 - Agent Services

- Introduce Agent Service as the execution layer for agents.
- Ask the audience to think about where their agent code should run and where state, identity, and telemetry should live.
- This sets up the next slide rather than diving into every service feature.

## Slide 8 - Agent Services Options

- Prompt agents: author in the portal or SDKs; Foundry runs the service for you.
- Hosted agents: bring your code, packages, protocols, and runtime assumptions; Foundry supplies a managed endpoint and hosting lifecycle.
- Decision rule: start with prompt agents for speed and managed execution; move to hosted agents when application code or runtime control is the requirement.

## Slide 9 - Building Hosted Agents

- A hosted agent still looks like software development: local loop, dependency management, deployment, versions, and logs.
- The platform boundary removes infrastructure work without hiding the application boundary.
- Transition into Demo 1: show the project, run locally, deploy, invoke, and inspect the result.

## Slide 10 - Extend agents with tools

- A tool lets the agent do something the model cannot reliably do from its weights: retrieve current information, query data, calculate, or take an action.
- Function tools are a good fit for application-owned logic. MCP is a good fit for reusable server-hosted capabilities.
- Tool descriptions, authentication, approval, and data boundaries are part of the design.

## Slide 11 - Toolboxes in Foundry

- A toolbox bundles tools behind one MCP-compatible endpoint.
- This centralizes reuse, credentials, policy, and versioning. The agent consumes the contract rather than knowing every implementation detail.
- Use the Microsoft Learn MCP server in the next demo because the audience can see current documentation retrieval and citations.

## Slide 12 - Create and deploy a toolbox

- Demo 2: create the connection, define the toolbox, add Web Search and Microsoft Learn MCP, attach the version to an agent, and ask a documentation question.
- Pause on the tool call and the cited answer. That is the visible proof of grounding.
- Show the version boundary: changing the bundle should not require changing the agent's core code.

## Slide 13 - Manage agents at scale

- A single successful demo says little about production health.
- The Foundry Control Plane provides inventory and lifecycle views across agents and projects; Application Insights-backed tracing exposes runs, errors, usage, and cost signals.
- Show one trace if available: request, model spans, tool calls, latency, and conversation correlation.
- Remind the audience that traces can contain sensitive inputs and tool arguments; apply access controls and redact sensitive content.

## Slide 14 - Additional Resources

- Point attendees to the links file, especially Foundry overview, hosted agents, MCP, toolboxes, and tracing.
- Encourage them to start with a small prompt agent or hosted sample, then add one tool with a clear contract.
- Mention that preview labels, regional support, and SDK versions should be checked before production use.

## Slide 15 - Thank you / Q&A

- Invite questions about choosing the hosting model, connecting MCP servers, identity, and deployment workflows.
- Give the contact details on the slide and direct attendees to the shared links.
- End with the practical summary: agents become useful when they can access the right tools, and maintainable when those tools and runtimes are managed deliberately.
