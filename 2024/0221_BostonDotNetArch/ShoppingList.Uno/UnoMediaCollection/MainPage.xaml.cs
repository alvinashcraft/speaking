using ShoppingListSample.Shared;
using UnoMediaCollection.ViewModels;

namespace UnoMediaCollection
{
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
            viewModel = new MainViewModel();
        }

        public MainViewModel viewModel;

        private void deleteButton_Click(object sender, RoutedEventArgs e)
        {
            var item = (Item)((Button)sender).DataContext;
            viewModel.Items.Remove(item);
        }
    }
}