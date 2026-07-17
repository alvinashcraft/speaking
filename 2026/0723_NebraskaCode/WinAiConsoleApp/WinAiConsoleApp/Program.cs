using Microsoft.Windows.AI;
using Microsoft.Windows.AI.Text;

namespace WinAiConsoleApp
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            await AiTest();
        }

        private static async Task AiTest()
        {
            Console.WriteLine("Preparing the Phi Silica language model...");
            using var languageModel = await LanguageModel.CreateAsync();

            if (LanguageModel.GetReadyState() == AIFeatureReadyState.NotReady)
            {
                Console.WriteLine("Loading the language model...");
                var result = await LanguageModel.EnsureReadyAsync();
                if (result.Status != AIFeatureReadyResultState.Success)
                {
                    throw new Exception(result.ExtendedError.Message);
                }
            }

            var prompt = "Why is the sky blue?";
            Console.WriteLine("Prompt: {0}", prompt);
            Console.WriteLine("Generating response...");
            var resp = await languageModel.GenerateResponseAsync(prompt);
            Console.WriteLine(resp.Text);
            Console.ReadKey();
        }
    }
}