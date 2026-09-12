using Microsoft.AI.Foundry.Local;
using OpenAI;
using System.ClientModel;
using System.Diagnostics;
using System.Text.Json;

namespace MauiFoundryLocalApp
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
        }

        private async void OnCounterClicked(object? sender, EventArgs e)
        {
#if MACCATALYST
            // var alias = "phi-4-mini-instruct-generic-gpu:5";
            var alias = "phi-4-mini";
            await LoadMacCatalystModelAsync(alias);

            var endpoint = await GetMacCatalystEndpointAsync();
            var client = new OpenAIClient(
                new ApiKeyCredential("foundry-local"),
                new OpenAIClientOptions
                {
                    Endpoint = new Uri($"{endpoint.TrimEnd('/')}/v1")
                });

            var chatClient = client.GetChatClient("Phi-4-mini-instruct-generic-gpu");
            var completion = await chatClient.CompleteChatAsync("Why is the sky blue?");
            WelcomeLabel.Text = completion.Value.Content[0].Text;
            return;
#else
            // var alias = "phi-4-mini-instruct-generic-gpu:5"; // Use generic GPU optimized model
            var alias = "phi-4-mini-instruct-openvino-npu:2"; // Use OpenVINO NPU optimized model (for Windows Copilot+ PC)

            var manager = await FoundryLocalManager.StartModelAsync(aliasOrModelId: alias);

            if (!manager.IsServiceRunning)
            {
                WelcomeLabel.Text = $"Failed to start model {alias}.";
                return;
            }

            var model = await manager.GetModelInfoAsync(aliasOrModelId: alias);
            if (model is null || string.IsNullOrWhiteSpace(model.ModelId))
            {
                WelcomeLabel.Text = $"Model information was not returned for {alias}.";
                return;
            }

            var key = new ApiKeyCredential(manager.ApiKey);
            var client = new OpenAIClient(key, new OpenAIClientOptions
            {
                Endpoint = manager.Endpoint
            });

            var chatClient = client.GetChatClient(model.ModelId);
            var completionUpdates = chatClient.CompleteChatStreaming("Why is the sky blue?");

            using var stringWriter = new StringWriter();
            await stringWriter.WriteLineAsync("[ASSISTANT]: ");

            foreach (var completionUpdate in completionUpdates)
            {
                if (completionUpdate.ContentUpdate.Count > 0)
                {
                    await stringWriter.WriteAsync(completionUpdate.ContentUpdate[0].Text);
                }
            }

            WelcomeLabel.Text = stringWriter.ToString();
#endif
        }

#if MACCATALYST
        private static async Task LoadMacCatalystModelAsync(string alias)
        {
            var executable = new[] { "/opt/homebrew/bin/foundry", "/usr/local/bin/foundry" }
                .FirstOrDefault(File.Exists);

            if (executable is null)
            {
                throw new InvalidOperationException("Foundry Local CLI was not found.");
            }

            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = executable,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false
                }
            };
            process.StartInfo.ArgumentList.Add("model");
            process.StartInfo.ArgumentList.Add("load");
            process.StartInfo.ArgumentList.Add(alias);
            process.StartInfo.ArgumentList.Add("--output");
            process.StartInfo.ArgumentList.Add("json");

            process.Start();
            var error = await process.StandardError.ReadToEndAsync();
            await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"Foundry Local failed to load {alias}: {error.Trim()}");
            }
        }

        private static async Task<string> GetMacCatalystEndpointAsync()
        {
            var daemonPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".foundry",
                "daemon.json");

            await using var stream = File.OpenRead(daemonPath);
            using var document = await JsonDocument.ParseAsync(stream);
            var urls = document.RootElement.GetProperty("web_urls");
            var endpoint = urls.EnumerateArray().FirstOrDefault().GetString();

            if (string.IsNullOrWhiteSpace(endpoint))
            {
                throw new InvalidOperationException(
                    "Foundry Local did not publish a web service endpoint.");
            }

            return endpoint;
        }
#endif
    }
}
