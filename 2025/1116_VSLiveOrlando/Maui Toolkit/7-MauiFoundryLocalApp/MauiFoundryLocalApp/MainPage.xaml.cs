using Microsoft.AI.Foundry.Local;
using OpenAI;
using System.ClientModel;

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
            var alias = "phi-4-mini-instruct-openvino-npu:2"; // Use OpenVINO NPU optimized model

            var manager = await FoundryLocalManager.StartModelAsync(aliasOrModelId: alias);

            var model = await manager.GetModelInfoAsync(aliasOrModelId: alias);
            var key = new ApiKeyCredential(manager.ApiKey);
            var client = new OpenAIClient(key, new OpenAIClientOptions
            {
                Endpoint = manager.Endpoint
            });

            var chatClient = client.GetChatClient(model?.ModelId);

            var completionUpdates = chatClient.CompleteChatStreaming("Why is the sky blue'");

            var stringWriter = new StringWriter();
            await stringWriter.WriteLineAsync($"[ASSISTANT]: ");
            foreach (var completionUpdate in completionUpdates)
            {
                if (completionUpdate.ContentUpdate.Count > 0)
                {
                    await stringWriter.WriteAsync(completionUpdate.ContentUpdate[0].Text);
                }
            }

            WelcomeLabel.Text = stringWriter.ToString();
        }
    }
}
