using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Windows.ApplicationModel.Resources;
using Windows.UI.Core;

namespace MyMediaCollection
{
    public sealed partial class MainWindow : Window
    {
        private string AppTitle = "My Media Collection";

        public MainWindow()
        {
            this.InitializeComponent();
            if (CoreWindow.GetForCurrentThread() != null)
            {
                var resourceLoader = ResourceLoader.GetForCurrentView();
                AppTitle = resourceLoader.GetString("MainWindow.Title");
            }

            AppWindow.Title = AppTitle;
        }

        internal void SetPageTitle(string title)
        {
            AppWindow.Title = $"{AppTitle} - {title}";
        }
    }
}