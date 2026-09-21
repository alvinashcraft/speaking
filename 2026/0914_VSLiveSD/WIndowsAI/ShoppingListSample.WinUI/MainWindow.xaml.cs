using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using ShoppingListSample.Shared;
using System;
using System.Linq;

namespace ShoppingListSample.WinUI
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private MainViewModel viewModel;

        public MainWindow()
        {
            this.InitializeComponent();
            viewModel = new MainViewModel();
            SetTitleBar();
        }

        private void deleteButton_Click(object sender, RoutedEventArgs e)
        {
            var item = (Item)((Button)sender).DataContext;
            viewModel.Items.Remove(item);
        }

        private void SetTitleBar()
        {
            ExtendsContentIntoTitleBar = true;
            SetTitleBar(titleBar);
            AppWindow.TitleBar.PreferredHeightOption = Microsoft.UI.Windowing.TitleBarHeightOption.Tall;
            //AppWindow.SetIcon("Assets/AppIcon/Icon.ico");
            Title = Windows.ApplicationModel.Package.Current.DisplayName;
        }

        private void SearchBox_TextChanged(AutoSuggestBox sender, AutoSuggestBoxTextChangedEventArgs args)
        {
            if (args.Reason == AutoSuggestionBoxTextChangeReason.UserInput && !string.IsNullOrWhiteSpace(SearchBox.Text))
            {
                var filteredSearchResults = viewModel.Items.Where(i => i.Name.Contains(sender.Text, StringComparison.OrdinalIgnoreCase)).ToList();
                SearchBox.ItemsSource = filteredSearchResults.OrderByDescending(i => i.Name.StartsWith(sender.Text, StringComparison.CurrentCultureIgnoreCase)).ThenBy(i => i.Name);
            }
        }

        private async void SearchBox_QuerySubmitted(AutoSuggestBox sender, AutoSuggestBoxQuerySubmittedEventArgs args)
        {
            if (args.ChosenSuggestion is Item result)
            {
                viewModel.Items.Remove(result);
            }

            SearchBox.Text = string.Empty;
        }
    }
}