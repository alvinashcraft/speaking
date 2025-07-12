using Microsoft.UI.Xaml.Controls;
using ShoppingListSample.Shared;

namespace UnoMsHq25;

public sealed partial class MainPage : Page
{
    private MainViewModel viewModel;
    public MainPage()
    {
        this.InitializeComponent();
        this.viewModel = new MainViewModel();
    }

    private void deleteButton_Click(object sender, RoutedEventArgs e)
    {
        var item = (Item)((Button)sender).DataContext;
        viewModel.Items.Remove(item);
    }
}
