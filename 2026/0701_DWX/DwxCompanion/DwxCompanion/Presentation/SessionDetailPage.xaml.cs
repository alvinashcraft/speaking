namespace DwxCompanion.Presentation;

public sealed partial class SessionDetailPage : UserControl
{
    public SessionDetailPage()
    {
        this.InitializeComponent();
    }

    private async void OnBackClick(object sender, RoutedEventArgs e)
    {
        if (sender is FrameworkElement fe)
        {
            var nav = fe.Navigator();
            if (nav is not null)
            {
                await nav.NavigateViewModelAsync<SessionsModel>(this);
            }
        }
    }
}
