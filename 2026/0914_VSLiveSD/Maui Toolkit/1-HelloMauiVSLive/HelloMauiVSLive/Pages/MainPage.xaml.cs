using HelloMauiVSLive.Models;
using HelloMauiVSLive.PageModels;

namespace HelloMauiVSLive.Pages
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