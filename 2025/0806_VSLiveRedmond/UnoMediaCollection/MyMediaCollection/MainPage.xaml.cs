using MyMediaCollection.ViewModels;

namespace MyMediaCollection;

public sealed partial class MainPage : Page
{
    public MainPage()
    {
        ViewModel = App.Host.Services.GetService<MainViewModel>();
        this.InitializeComponent();
    }

    public MainViewModel ViewModel;
}
