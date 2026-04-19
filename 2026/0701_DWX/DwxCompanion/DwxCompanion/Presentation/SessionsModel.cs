namespace DwxCompanion.Presentation;

public partial record SessionsModel
{
    private readonly INavigator _navigator;
    private readonly ISessionService _sessionService;
    private readonly ISettingsService _settings;
    private readonly IFavoritesService _favorites;

    public SessionsModel(
        ISessionService sessions,
        ISettingsService settings,
        IFavoritesService favorites,
        INavigator navigator)
    {
        _navigator = navigator;
        _sessionService = sessions;
        _settings = settings;
        _favorites = favorites;

        Sessions = ListState.Async(this, LoadAsync);

        _settings.SettingsChanged += OnExternalChanged;
        _favorites.FavoritesChanged += OnExternalChanged;
    }

    public IListState<SessionView> Sessions { get; }

    public async ValueTask OpenSession(SessionView view, CancellationToken ct)
    {
        // Workaround for the visibility-navigator caching the SessionDetailModel
        // instance: we publish the selection on a singleton service so the
        // (reused) detail model can re-project on every visit.
        await _sessionService.SelectSessionAsync(view.Session, ct);
        await _navigator.NavigateRouteAsync(this, "SessionDetail", cancellation: ct);
    }

    public async ValueTask ToggleFavorite(SessionView view, CancellationToken ct)
    {
        await _favorites.ToggleAsync(view.Session.Id);
    }

    private async ValueTask<IImmutableList<SessionView>> LoadAsync(CancellationToken ct)
    {
        var list = await _sessionService.GetSessionsAsync(ct);
        return Project(list);
    }

    private IImmutableList<SessionView> Project(IEnumerable<Session> list)
    {
        var fmt = _settings.Use24HourFormat;
        return list
            .Select(s => new SessionView(s, fmt, _favorites.IsFavorite(s.Id)))
            .ToImmutableList();
    }

    private async void OnExternalChanged(object? sender, EventArgs e)
    {
        try
        {
            var list = await _sessionService.GetSessionsAsync(default);
            var items = Project(list);
            await Sessions.UpdateAsync(_ => items, default);
        }
        catch
        {
            // ignored — best-effort live refresh
        }
    }
}
