using HelloMauiCodeMash.Models;
using HelloMauiCodeMash.PageModels;

namespace HelloMauiCodeMash.Pages
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