using Azure.AI.Extensions.OpenAI;
using Azure.AI.Projects;
using Azure.Identity;
using OpenAI.Responses;

#pragma warning disable OPENAI001

string projectEndpoint = Environment.GetEnvironmentVariable("FOUNDRY_PROJECT_ENDPOINT")
	?? throw new InvalidOperationException(
		"FOUNDRY_PROJECT_ENDPOINT must be set to the Microsoft Foundry project endpoint.");
string agentName = Environment.GetEnvironmentVariable("FOUNDRY_AGENT_NAME")
	?? "hosted-toolbox-agent";

AIProjectClient projectClient = new(
	new Uri(projectEndpoint),
	new DefaultAzureCredential(new DefaultAzureCredentialOptions
	{
		ExcludeManagedIdentityCredential = true
	}));

ProjectResponsesClient responsesClient = projectClient.ProjectOpenAIClient
	.GetProjectResponsesClientForAgentEndpoint(agentName);

ResponseResult response = await responsesClient.CreateResponseAsync(
	new CreateResponseOptions
	{
		InputItems =
		{
			ResponseItem.CreateUserMessageItem(
				"Using Microsoft Learn, explain in three concise bullets how Foundry hosted agents " +
				"differ from prompt agents, and include source links.")
		}
	});

Console.WriteLine(response.GetOutputText());
Console.ReadLine();
