using Azure.Identity;
using Azure.AI.Projects;
using Azure.AI.Projects.Agents;
using OpenAI.Responses;

#pragma warning disable OPENAI001

try
{
  // Create Foundry project client
  string projectEndpoint = Environment.GetEnvironmentVariable("FOUNDRY_PROJECT_ENDPOINT")
        ?? throw new InvalidOperationException(
            "FOUNDRY_PROJECT_ENDPOINT must be set to the Microsoft Foundry project endpoint.");

  AIProjectClient projectClient = new(new Uri(projectEndpoint), new AzureCliCredential());
  AgentToolboxes toolboxClient = projectClient.AgentAdministrationClient.GetAgentToolboxes();

  WebSearchToolboxTool webTool = new();
  MCPToolboxTool mcpTool = new(serverLabel: "learn-mcp-conn")
  {
    ServerUri = new Uri("https://learn.microsoft.com/api/mcp"),
    ToolCallApprovalPolicy = new McpToolCallApprovalPolicy(
      GlobalMcpToolCallApprovalPolicy.NeverRequireApproval),
  };

  ToolboxSearchPreviewToolboxTool searchTool = new() { Name = "ToolBoxSearch" };

  Console.WriteLine("Creating toolbox: my-toolbox");
  ToolboxVersion toolboxVersion = await toolboxClient.CreateVersionAsync(
    name: "my-toolbox",
    tools: [webTool, mcpTool, searchTool],
    description: "Toolbox with web search, Learn MCP, and tool search"
  );
  Console.WriteLine($"Created toolbox: {toolboxVersion.Name}, version: {toolboxVersion.Version}");
}
catch (AuthenticationFailedException exception)
{
  WriteError("Authentication failed", exception.Message);
  Console.Error.WriteLine("Sign in with the Azure CLI or verify the configured credentials, then try again.");
  Environment.ExitCode = 1;
}
catch (Azure.RequestFailedException exception)
{
  WriteError("The Foundry request failed", exception.Message);
  Console.Error.WriteLine($"Status: {exception.Status}; error code: {exception.ErrorCode ?? "unknown"}");
  Environment.ExitCode = 1;
}
catch (Exception exception)
{
  WriteError("An unexpected error occurred", exception.Message);
  Console.Error.WriteLine(exception.StackTrace);
  Environment.ExitCode = 1;
}
finally
{
  Console.WriteLine();
  Console.Write("Press Enter to exit...");
  Console.ReadLine();
}

static void WriteError(string title, string message)
{
  Console.Error.WriteLine();
  Console.Error.WriteLine($"{title}: {message}");
}