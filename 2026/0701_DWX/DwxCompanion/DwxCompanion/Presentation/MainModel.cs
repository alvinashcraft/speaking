namespace DwxCompanion.Presentation;

public class MainModel
{
    private readonly INavigator _navigator;

    public MainModel(INavigator navigator)
    {
        _navigator = navigator;
    }
}
