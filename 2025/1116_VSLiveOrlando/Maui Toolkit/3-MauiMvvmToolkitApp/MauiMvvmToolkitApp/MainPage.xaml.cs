namespace MauiMvvmToolkitApp
{
    public partial class MainPage : ContentPage
    {
        private MainViewModel viewModel = new();

        public MainPage()
        {
            InitializeComponent();
            this.BindingContext = viewModel;
        }

        private void deleteButton_Click(object sender, EventArgs e)
        {
            var item = (Item)((Button)sender).BindingContext;
            viewModel.Items.Remove(item);
        }
    }
}
