// Copyright (c) Microsoft. All rights reserved.

using Azure.AI.AgentServer.Core;
using Azure.AI.Projects;
using Azure.Core;
using Azure.Identity;
using DotNetEnv;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Foundry.Hosting;

static TokenCredential CreateCredential()
{
    var isHostedEnvironment =
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME")) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("MSI_ENDPOINT")) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("IDENTITY_ENDPOINT"));

    if (isHostedEnvironment)
    {
        return new DefaultAzureCredential();
    }

    return new DefaultAzureCredential(new DefaultAzureCredentialOptions
    {
        ExcludeManagedIdentityCredential = true
    });
}

Env.NoClobber().TraversePath().Load();

var projectEndpoint = new Uri(Environment.GetEnvironmentVariable("FOUNDRY_PROJECT_ENDPOINT")
    ?? throw new InvalidOperationException("FOUNDRY_PROJECT_ENDPOINT environment variable is not set."));
var deployment = Environment.GetEnvironmentVariable("AZURE_AI_MODEL_DEPLOYMENT_NAME") ?? "gpt-5.4-mini";

AIAgent agent = new AIProjectClient(projectEndpoint, CreateCredential())
    .AsAIAgent(
        model: deployment,
        instructions: """
            You are a helpful AI assistant hosted as a Foundry Hosted Agent.
            You can help with a wide range of tasks including answering questions,
            providing explanations, brainstorming ideas, and offering guidance.
            Be concise, clear, and helpful in your responses.
            """,
        name: "simple-agent",
        description: "A simple general-purpose AI assistant");

var builder = AgentHost.CreateBuilder(args);
builder.Services.AddFoundryResponses(agent);
builder.RegisterProtocol("responses", endpoints => endpoints.MapFoundryResponses());

var app = builder.Build();
app.Run();
