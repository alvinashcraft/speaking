namespace DwxCompanion.Presentation;

public partial record SessionsModel
{
    private readonly INavigator _navigator;
    private readonly ISessionService _sessionService;
    private readonly ISettingsService _settings;

    public SessionsModel(ISessionService sessions, ISettingsService settings, INavigator navigator)
    {
        _navigator = navigator;
        _sessionService = sessions;
        _settings = settings;

        Sessions = ListState.Async(this, LoadAsync);

        _settings.SettingsChanged += OnSettingsChanged;
    }

    public IListState<SessionView> Sessions { get; }

    public async ValueTask OpenSession(SessionView view, CancellationToken ct)
    {
        await _navigator.NavigateViewModelAsync<SessionDetailModel>(this, data: view.Session, cancellation: ct);
    }

    private async ValueTask<IImmutableList<SessionView>> LoadAsync(CancellationToken ct)
    {
        var list = await _sessionService.GetSessionsAsync(ct);
        var fmt = _settings.Use24HourFormat;
        return list.Select(s => new SessionView(s, fmt)).ToImmutableList();
    }

    private async void OnSettingsChanged(object? sender, EventArgs e)
    {
        try
        {
            var list = await _sessionService.GetSessionsAsync(default);
            var fmt = _settings.Use24HourFormat;
            var items = list.Select(s => new SessionView(s, fmt)).ToImmutableList();
            await Sessions.UpdateAsync(_ => items, default);
        }
        catch
        {
            // ignored — best-effort live refresh
        }
    }
}
