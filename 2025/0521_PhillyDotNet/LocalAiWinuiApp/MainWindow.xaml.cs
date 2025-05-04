using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AI.ContentModeration;
using Microsoft.Windows.AI.Generative;
using System;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;
using Windows.Foundation;

namespace LocalAiWinuiApp
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        public MainWindow()
        {
            this.InitializeComponent();
            SetTitleBar();
        }

        private async void generalButton_Click(object sender, RoutedEventArgs e)
        {
            await CallWcrAsync(LanguageModelSkill.General);
        }

        private async void rewriteButton_Click(object sender, RoutedEventArgs e)
        {
            await CallWcrAsync(LanguageModelSkill.Rewrite);
        }

        private async void summarizeButton_Click(object sender, RoutedEventArgs e)
        {
            await CallWcrAsync(LanguageModelSkill.Summarize);
        }

        private async void textToTableButton_Click(object sender, RoutedEventArgs e)
        {
            await CallWcrAsync(LanguageModelSkill.TextToTable);
        }

        private async Task CallWcrAsync(LanguageModelSkill modelSkill)
        {
            if (!LanguageModel.IsAvailable())
            {
                _ = await LanguageModel.MakeAvailableAsync();
            }

            try
            {
                resultsMarkdown.Text = "Thinking...";
                using LanguageModel languageModel = await LanguageModel.CreateAsync();

                string prompt = promptText.Text;

                var modelOptions = new LanguageModelOptions
                {
                    Skill = modelSkill
                };

                ContentFilterOptions filterOptions = ApplyContentFilters();

                LanguageModelResponse? result;

                if (resultWithProgress.IsChecked.Value)
                {
                    AsyncOperationProgressHandler<LanguageModelResponse, string>
                    progressHandler = (asyncInfo, delta) =>
                    {
                        DispatcherQueue.TryEnqueue(() => { resultsMarkdown.Text = asyncInfo.GetResults().Response; });
                    };

                    var asyncOp = languageModel.GenerateResponseWithProgressAsync(prompt);

                    asyncOp.Progress = progressHandler;

                    result = await asyncOp;
                }
                else
                {
                    result = await languageModel.GenerateResponseAsync(modelOptions, prompt, filterOptions);
                }

                if (string.IsNullOrWhiteSpace(result.Response))
                {
                    resultsMarkdown.Text = result.Status.ToString();
                }
                else if (!resultWithProgress.IsChecked.Value)
                {
                    resultsMarkdown.Text = result.Response;
                }
            }
            catch (Exception ex)
            {
                resultsMarkdown.Text = "An error occurred. Please try again.";
                Debug.WriteLine(ex.Message + "; " + ex.StackTrace);
            }
        }

        private ContentFilterOptions ApplyContentFilters()
        {
            var filterOptions = new ContentFilterOptions();

            if (strictFilterCheckBox.IsChecked == true)
            {
                filterOptions.PromptMinSeverityLevelToBlock.ViolentContentSeverity = SeverityLevel.High;
                filterOptions.ResponseMinSeverityLevelToBlock.ViolentContentSeverity = SeverityLevel.High;
                filterOptions.PromptMinSeverityLevelToBlock.HateContentSeverity = SeverityLevel.High;
                filterOptions.ResponseMinSeverityLevelToBlock.HateContentSeverity = SeverityLevel.High;
                filterOptions.PromptMinSeverityLevelToBlock.SexualContentSeverity = SeverityLevel.High;
                filterOptions.ResponseMinSeverityLevelToBlock.SexualContentSeverity = SeverityLevel.High;
                filterOptions.PromptMinSeverityLevelToBlock.SelfHarmContentSeverity = SeverityLevel.High;
                filterOptions.ResponseMinSeverityLevelToBlock.SelfHarmContentSeverity = SeverityLevel.High;
            }
            else
            {
                filterOptions.PromptMinSeverityLevelToBlock.ViolentContentSeverity = SeverityLevel.Low;
                filterOptions.ResponseMinSeverityLevelToBlock.ViolentContentSeverity = SeverityLevel.Low;
                filterOptions.PromptMinSeverityLevelToBlock.HateContentSeverity = SeverityLevel.Low;
                filterOptions.ResponseMinSeverityLevelToBlock.HateContentSeverity = SeverityLevel.Low;
                filterOptions.PromptMinSeverityLevelToBlock.SexualContentSeverity = SeverityLevel.Low;
                filterOptions.ResponseMinSeverityLevelToBlock.SexualContentSeverity = SeverityLevel.Low;
                filterOptions.PromptMinSeverityLevelToBlock.SelfHarmContentSeverity = SeverityLevel.Low;
                filterOptions.ResponseMinSeverityLevelToBlock.SelfHarmContentSeverity = SeverityLevel.Low;
            }

            return filterOptions;
        }

        private void SetTitleBar()
        {
            this.ExtendsContentIntoTitleBar = true;
            this.SetTitleBar(titleBar);
            this.AppWindow.TitleBar.PreferredHeightOption = TitleBarHeightOption.Tall;
            this.AppWindow.SetIcon("Assets/winui.ico");
            this.Title = Windows.ApplicationModel.Package.Current.DisplayName;
        }
    }
}
