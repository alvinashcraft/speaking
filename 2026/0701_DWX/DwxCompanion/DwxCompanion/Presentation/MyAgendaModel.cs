namespace DwxCompanion.Presentation;

public partial record MyAgendaModel
{
    private readonly ISessionService _sessionService;
    private readonly ISettingsService _settings;
    private readonly IFavoritesService _favorites;

    public MyAgendaModel(
        ISessionService sessions,
        ISettingsService settings,
        IFavoritesService favorites)
    {
        _sessionService = sessions;
        _settings = settings;
        _favorites = favorites;

        Sessions = ListState.Async(this, LoadAsync);

        _settings.SettingsChanged += OnExternalChanged;
        _favorites.FavoritesChanged += OnExternalChanged;
    }

    public IListState<SessionView> Sessions { get; }

    private async ValueTask<IImmutableList<SessionView>> LoadAsync(CancellationToken ct)
    {
        var list = await _sessionService.GetSessionsAsync(ct);
        return Project(list);
    }

    private IImmutableList<SessionView> Project(IEnumerable<Session> list)
    {
        var fmt = _settings.Use24HourFormat;
        return list
            .Where(s => _favorites.IsFavorite(s.Id))
            .OrderBy(s => s.StartsAt)
            .Select(s => new SessionView(s, fmt, true))
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
            // ignored
        }
    }
}
