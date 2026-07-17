using Microsoft.Graphics.Imaging;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Media.Imaging;
using Microsoft.Windows.AI;
using Microsoft.Windows.AI.ContentSafety;
using Microsoft.Windows.AI.Imaging;
using Microsoft.Windows.AI.Text;
using Microsoft.Windows.Storage.Pickers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Windows.Storage;

namespace WinuiAiOcrApp
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private ImageBuffer? _currentImage;
        private LanguageModel? languageModel = null;
        private TextRecognizer? textRecognizer = null;

        public MainWindow()
        {
            InitializeComponent();
        }

        private async void SelectFile_Click(object sender, RoutedEventArgs e)
        {
            _currentImage = null;
            Description.Text = "(picking a file)";
            FileContent.Text = Description.Text;

            var fileDialog = new FileOpenPicker(AppWindow.Id)
            {
                ViewMode = PickerViewMode.Thumbnail,
                SuggestedStartLocation = PickerLocationId.PicturesLibrary
            };

            var result = await fileDialog.PickSingleFileAsync();
            if (result?.Path.Length > 0)
            {
                FilePath.Text = result.Path;
                ProcessFile.IsEnabled = true;
                _currentImage = await GetImageBufferFromFile(result.Path);
                var source = new BitmapImage(new Uri(result.Path));
                InputImage.Source = source;
            }

            Description.Text = "(done picking)";
            FileContent.Text = Description.Text;
        }

        private async Task<ImageBuffer> GetImageBufferFromFile(string path)
        {
            var storageFile = await StorageFile.GetFileFromPathAsync(path);
            var inputStream = await storageFile.OpenAsync(FileAccessMode.Read);
            var decoder = await Windows.Graphics.Imaging.BitmapDecoder.CreateAsync(inputStream);
            var frame = await decoder.GetFrameAsync(0);
            var softwareBitmap = await frame.GetSoftwareBitmapAsync();
            try
            {
                var buffer = ImageBuffer.CreateForSoftwareBitmap(softwareBitmap);
                return buffer;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error creating ImageBuffer: {ex.Message}");
                throw new Exception("Failed to create ImageBuffer from software bitmap.");
            }
        }

        private async void ProcessFile_Click(object sender, RoutedEventArgs e)
        {
            FileContent.Text = "Extracting text...";
            Description.Text = "(waiting)";

            try
            {
                FileContent.Text = "Loading AI models...";
                Description.Text = FileContent.Text;
                await LoadAIModels();
            }
            catch (Exception ex)
            {
                FileContent.Text = $"An error has occurred: Loading AI models. Exception: {ex.Message}";
                Description.Text = FileContent.Text;
                return;
            }

            string textInImage = "";
            try
            {
                FileContent.Text = "Performing Text Recognition";
                textInImage = await PerformTextRecognition();
            }
            catch (Exception ex)
            {
                FileContent.Text = $"An error has occurred: Performing Text Recognition. Exception: {ex.Message}";
                return;
            }

            try
            {
                Description.Text = "Performing Text Description";
                await SummarizeImageText(textInImage);
            }
            catch (Exception ex)
            {
                Description.Text = $"An error has occurred: Performing Text Description. Exception: {ex.Message}";
                return;
            }
        }

        private async Task LoadAIModels()
        {
            // Load the AI models needed for image processing
            switch (LanguageModel.GetReadyState())
            {
                case AIFeatureReadyState.NotReady:
                    System.Diagnostics.Debug.WriteLine("Ensure LanguageModel is ready");
                    var op = await LanguageModel.EnsureReadyAsync();
                    System.Diagnostics.Debug.WriteLine($"LanguageModel.EnsureReadyAsync completed with status: {op.Status}");
                    if (op.Status != AIFeatureReadyResultState.Success)
                    {
                        Description.Text = "Language model not ready for use";
                        throw new Exception("Language model not ready for use");
                    }
                    break;
                case AIFeatureReadyState.DisabledByUser:
                    System.Diagnostics.Debug.WriteLine("Language model disabled by user");
                    Description.Text = "Language model disabled by user";
                    return;
                case AIFeatureReadyState.NotSupportedOnCurrentSystem:
                    System.Diagnostics.Debug.WriteLine("Language model not supported on current system");
                    Description.Text = "Language model not supported on current system";
                    return;
            }

            languageModel = await LanguageModel.CreateAsync();
            if (languageModel == null)
            {
                throw new Exception("Failed to create LanguageModel instance.");
            }

            switch (TextRecognizer.GetReadyState())
            {
                case AIFeatureReadyState.NotReady:
                    System.Diagnostics.Debug.WriteLine("Ensure TextRecognizer is ready");
                    var op = await TextRecognizer.EnsureReadyAsync();
                    System.Diagnostics.Debug.WriteLine($"TextRecognizer.EnsureReadyAsync completed with status: {op.Status}");
                    if (op.Status != AIFeatureReadyResultState.Success)
                    {
                        FileContent.Text = "Text recognizer not ready for use";
                        throw new Exception("Text recognizer not ready for use");
                    }
                    break;
                case AIFeatureReadyState.DisabledByUser:
                    System.Diagnostics.Debug.WriteLine("Text Recognizer disabled by user");
                    FileContent.Text = "Text recognizer disabled by user";
                    return;
                case AIFeatureReadyState.NotSupportedOnCurrentSystem:
                    System.Diagnostics.Debug.WriteLine("Text Recognizer not supported on current system");
                    FileContent.Text = "Text recognizer not supported on current system";
                    return;
            }

            textRecognizer = await TextRecognizer.CreateAsync();
            if (textRecognizer == null)
            {
                throw new Exception("Failed to create TextRecognizer instance.");
            }
        }

        private async Task<string> PerformTextRecognition()
        {
            var readyState = TextRecognizer.GetReadyState();
            if (readyState is AIFeatureReadyState.Ready or AIFeatureReadyState.NotReady)
            {
                if (readyState == AIFeatureReadyState.NotReady)
                {
                    var op = await TextRecognizer.EnsureReadyAsync();
                }

                using TextRecognizer textRecognizer = await TextRecognizer.CreateAsync();

                RecognizedText? result = textRecognizer?.RecognizeTextFromImage(_currentImage);

                var recognizedTextLines = result?.Lines.Select(line => line.Text);
                string text = "";

                if (recognizedTextLines != null && recognizedTextLines.Any())
                {
                    text = string.Join(Environment.NewLine, recognizedTextLines);
                }
                else
                {
                    text = "(no text recognized)";
                }

                FileContent.Text = text;
                return text;
            }

            return "(text recognition not ready)";
        }

        private async Task SummarizeImageText(string text)
        {
            string systemPrompt = "You summarize user-provided text to a software developer audience." +
                "Respond only with the summary and no additional text.";

            // Update the property names to match the correct ones based on the provided type signature.  
            var promptMaxAllowedSeverityLevel = new TextContentFilterSeverity
            {
                Hate = SeverityLevel.Low,
                Sexual = SeverityLevel.Low,
                Violent = SeverityLevel.Low,
                SelfHarm = SeverityLevel.Low
            };

            var responseMaxAllowedSeverityLevel = new TextContentFilterSeverity
            {
                Hate = SeverityLevel.Low,
                Sexual = SeverityLevel.Low,
                Violent = SeverityLevel.Low,
                SelfHarm = SeverityLevel.Low
            };

            var contentFilterOptions = new ContentFilterOptions
            {
                PromptMaxAllowedSeverityLevel = promptMaxAllowedSeverityLevel,
                ResponseMaxAllowedSeverityLevel = responseMaxAllowedSeverityLevel
            };

            if (languageModel != null)
            {
                // Create a context for the language model
                var languageModelContext = languageModel!.CreateContext(systemPrompt, contentFilterOptions);
                string prompt = "Summarize the following text: " + text;
                var output = await languageModel.GenerateResponseAsync(languageModelContext, prompt, new LanguageModelOptions());
                Description.Text = output.Text;
            }
            else
            {
                System.Diagnostics.Debug.WriteLine("Error: LanguageModel is null but should have been created during LoadAIModels()");
                Description.Text = "Error: LanguageModel is null";
            }
        }
    }
}