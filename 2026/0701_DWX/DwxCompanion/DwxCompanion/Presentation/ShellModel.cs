namespace DwxCompanion.Presentation;

public class ShellModel
{
    public ShellModel(INavigator navigator)
    {
        Navigator = navigator;
    }

    public INavigator Navigator { get; }
}
