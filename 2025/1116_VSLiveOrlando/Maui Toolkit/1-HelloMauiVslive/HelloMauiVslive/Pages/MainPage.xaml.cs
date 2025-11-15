using HelloMauiVslive.Models;
using HelloMauiVslive.PageModels;

namespace HelloMauiVslive.Pages
{
    public partial class MainPage : ContentPage
    {
        public MainPage(MainPageModel model)
        {
            InitializeComponent();
            BindingContext = model;
        }
    }
}