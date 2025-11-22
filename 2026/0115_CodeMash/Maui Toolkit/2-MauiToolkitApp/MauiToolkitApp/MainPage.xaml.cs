using CommunityToolkit.Maui.Alerts;
using CommunityToolkit.Maui.Core;
using CommunityToolkit.Maui.Core.Extensions;
using CommunityToolkit.Maui.Extensions;
using CommunityToolkit.Maui.Storage;

namespace MauiToolkitApp
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
        }

        private async void Button_Clicked(object sender, EventArgs e)
        {
            var button = (Button)sender;
            var color = button.BackgroundColor;
            await button.BackgroundColorTo(color.ToInverseColor());
        }

        private async Task PickFolderAsync()
        {
            var result = await FolderPicker.Default.PickAsync();
            if (result.IsSuccessful)
            {
                centerButton.Text = result.Folder.Name;
            }
            else
            {
                centerButton.Text = "No folder selected";
            }
        }

        private async void centerButton_Clicked(object sender, EventArgs e)
        {
            await PickFolderAsync();
        }
    }
}
