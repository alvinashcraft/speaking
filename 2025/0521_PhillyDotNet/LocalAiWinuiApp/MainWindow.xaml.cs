using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.Windows.AI;
using Microsoft.Windows.AI.ContentSafety;
using Microsoft.Windows.AI.Text;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

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
            await GenerateResponseAsync();
        }

        private async void summarizeButton_Click(object sender, RoutedEventArgs e)
        {
            await SummarizeTextAsync();
        }

        private async Task GenerateResponseAsync()
        {
            if (LanguageModel.GetReadyState() == AIFeatureReadyState.NotReady)
            {
                _ = await LanguageModel.EnsureReadyAsync();
            }

            try
            {
                resultsMarkdown.Text = "Thinking...";
                using LanguageModel languageModel = await LanguageModel.CreateAsync();

                string prompt = promptText.Text;

                var modelOptions = new LanguageModelOptions();

                ContentFilterOptions filterOptions = ApplyContentFilters();
                modelOptions.ContentFilterOptions = filterOptions;

                var result = await languageModel.GenerateResponseAsync(prompt, modelOptions);

                if (string.IsNullOrWhiteSpace(result.Text))
                {
                    resultsMarkdown.Text = result.Status.ToString();
                }
                else
                {
                    resultsMarkdown.Text = result.Text;
                }
            }
            catch (Exception ex)
            {
                resultsMarkdown.Text = "An error occurred. Please try again.";
                Debug.WriteLine(ex.Message + "; " + ex.StackTrace);
            }
        }

        private async Task SummarizeTextAsync()
        {
            if (LanguageModel.GetReadyState() == AIFeatureReadyState.NotReady)
            {
                _ = await LanguageModel.EnsureReadyAsync();
            }

            try
            {
                resultsMarkdown.Text = "Thinking...";
                using LanguageModel languageModel = await LanguageModel.CreateAsync();

                string prompt = promptText.Text;

                var textSummarizer = new TextSummarizer(languageModel);
                var result = await textSummarizer.SummarizeAsync(prompt);

                if (string.IsNullOrWhiteSpace(result.Text))
                {
                    resultsMarkdown.Text = result.Status.ToString();
                }

                resultsMarkdown.Text = result.Text;
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
                filterOptions.PromptMaxAllowedSeverityLevel.Violent = SeverityLevel.High;
                filterOptions.ResponseMaxAllowedSeverityLevel.Violent = SeverityLevel.High;
                filterOptions.PromptMaxAllowedSeverityLevel.Hate = SeverityLevel.High;
                filterOptions.ResponseMaxAllowedSeverityLevel.Hate = SeverityLevel.High;
                filterOptions.PromptMaxAllowedSeverityLevel.Sexual = SeverityLevel.High;
                filterOptions.ResponseMaxAllowedSeverityLevel.Sexual = SeverityLevel.High;
                filterOptions.PromptMaxAllowedSeverityLevel.SelfHarm = SeverityLevel.High;
                filterOptions.ResponseMaxAllowedSeverityLevel.SelfHarm = SeverityLevel.High;
            }
            else
            {
                filterOptions.PromptMaxAllowedSeverityLevel.Violent = SeverityLevel.Minimum;
                filterOptions.ResponseMaxAllowedSeverityLevel.Violent = SeverityLevel.Minimum;
                filterOptions.PromptMaxAllowedSeverityLevel.Hate = SeverityLevel.Minimum;
                filterOptions.ResponseMaxAllowedSeverityLevel.Hate = SeverityLevel.Minimum;
                filterOptions.PromptMaxAllowedSeverityLevel.Sexual = SeverityLevel.Minimum;
                filterOptions.ResponseMaxAllowedSeverityLevel.Sexual = SeverityLevel.Minimum;
                filterOptions.PromptMaxAllowedSeverityLevel.SelfHarm = SeverityLevel.Minimum;
                filterOptions.ResponseMaxAllowedSeverityLevel.SelfHarm = SeverityLevel.Minimum;
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
