using Azure.Identity;
using Azure.AI.Projects;
using Azure.AI.Extensions.OpenAI;
using OpenAI.Responses;

#pragma warning disable OPENAI001

try
{
    string projectEndpoint = Environment.GetEnvironmentVariable("FOUNDRY_PROJECT_ENDPOINT")
        ?? throw new InvalidOperationException(
            "FOUNDRY_PROJECT_ENDPOINT must be set to the Microsoft Foundry project endpoint.");

    string agentDeploymentName = "simple-agent";

    // Create project client to call Foundry API
    AIProjectClient projectClient = new(
        endpoint: new Uri(projectEndpoint),
        tokenProvider: new DefaultAzureCredential(
            new DefaultAzureCredentialOptions
            {
                ExcludeManagedIdentityCredential = true
            }));

    // Chat with the agent to answer questions
    ProjectResponsesClient responsesClient = projectClient.ProjectOpenAIClient
        .GetProjectResponsesClientForAgentEndpoint(agentDeploymentName);
    Console.WriteLine("Sending first request...");
    ResponseResult response = await SendResponseAsync(
        responsesClient,
        new CreateResponseOptions
        {
            InputItems =
            {
                ResponseItem.CreateUserMessageItem("What is the size of Switzerland in square miles?")
            }
        });
    WriteResponse(response);

    // Ask a follow-up question using the previous response as context
    Console.WriteLine("Sending follow-up request...");
    response = await SendResponseAsync(
        responsesClient,
        new CreateResponseOptions
        {
            PreviousResponseId = response.Id,
            InputItems =
            {
                ResponseItem.CreateUserMessageItem("And what is the capital city?")
            }
        });
    WriteResponse(response);
}
catch (Exception ex)
{
    Console.WriteLine("ERROR:");
    Console.WriteLine(ex.ToString());
}

Console.ReadLine();

static async Task<ResponseResult> SendResponseAsync(
    ProjectResponsesClient responsesClient,
    CreateResponseOptions options)
{
    using CancellationTokenSource timeout = new(TimeSpan.FromMinutes(2));
    return await responsesClient.CreateResponseAsync(options, timeout.Token);
}

static void WriteResponse(ResponseResult response)
{
    string outputText = response.GetOutputText();
    if (!string.IsNullOrWhiteSpace(outputText))
    {
        Console.WriteLine(outputText);
        return;
    }

    Console.WriteLine($"No text returned. Status: {response.Status}");
    foreach (ResponseItem item in response.OutputItems)
    {
        Console.WriteLine($"Output item: {item.GetType().Name}");
    }
}
