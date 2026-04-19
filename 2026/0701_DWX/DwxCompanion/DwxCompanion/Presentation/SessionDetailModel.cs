// MVUX's State<T> APIs constrain T : notnull, but our domain records are nullable
// reference types here (Session?, Room?). The runtime tolerates this fine; the
// compile-time warnings are noise. Suppress them at file scope.
#pragma warning disable CS8714, CS8621

namespace DwxCompanion.Presentation;

// Reused-instance detail model. Because the Visibility navigator caches both
// the page AND the bound MVUX model, this model is constructed exactly once
// per app session. We therefore derive all observable state from the
// `ISessionService.SelectedSession` workaround state and re-project it on
// every selection / settings / favorites event.
public partial record SessionDetailModel
{
    private readonly ISessionService _sessions;
    private readonly ISettingsService _settings;
    private readonly IFavoritesService _favorites;

    public SessionDetailModel(
        ISessionService sessions,
        ISettingsService settings,
        IFavoritesService favorites)
    {
        _sessions = sessions;
        _settings = settings;
        _favorites = favorites;

        Session = State<Session?>.Value(this, () => null);
        Speakers = State<IImmutableList<Speaker>>.Value(this, () => (IImmutableList<Speaker>)ImmutableList<Speaker>.Empty);
        Room = State<Room?>.Value(this, () => null);
        TimeRange = State.Value(this, () => string.Empty);
        IsFavorite = State.Value(this, () => false);

        // Initial projection — runs once when the model is first constructed.
        _ = RefreshAsync(default);

        _sessions.SelectedSessionChanged += OnSelectionChanged;
        _settings.SettingsChanged += OnSettingsChanged;
        _favorites.FavoritesChanged += OnFavoritesChanged;
    }

    public IState<Session?> Session { get; }

    public IState<IImmutableList<Speaker>> Speakers { get; }

    public IState<Room?> Room { get; }

    public IState<string> TimeRange { get; }

    public IState<bool> IsFavorite { get; }

    public async ValueTask ToggleFavorite(CancellationToken ct)
    {
        var session = _sessions.SelectedSession;
        if (session is null)
        {
            return;
        }
        await _favorites.ToggleAsync(session.Id);
    }

    private async ValueTask RefreshAsync(CancellationToken ct)
    {
        var session = _sessions.SelectedSession;
        await Session.UpdateAsync(_ => session, ct);

        if (session is null)
        {
            await Room.UpdateAsync(_ => null, ct);
            await Speakers.UpdateAsync(_ => (IImmutableList<Speaker>)ImmutableList<Speaker>.Empty, ct);
            await TimeRange.UpdateAsync(_ => string.Empty, ct);
            await IsFavorite.UpdateAsync(_ => false, ct);
            return;
        }

        await TimeRange.UpdateAsync(_ => Format(session, _settings.Use24HourFormat), ct);
        await IsFavorite.UpdateAsync(_ => _favorites.IsFavorite(session.Id), ct);

        var room = await _sessions.GetRoomAsync(session.RoomId, ct);
        await Room.UpdateAsync(_ => room, ct);

        var speakers = await ResolveSpeakersAsync(session, _sessions, ct);
        await Speakers.UpdateAsync(_ => speakers, ct);
    }

    private async void OnSelectionChanged(object? sender, EventArgs e)
    {
        try
        {
            await RefreshAsync(default);
        }
        catch
        {
            // best-effort live refresh — never let an event handler throw
        }
    }

    private async void OnSettingsChanged(object? sender, EventArgs e)
    {
        try
        {
            var session = _sessions.SelectedSession;
            if (session is null)
            {
                return;
            }
            await TimeRange.UpdateAsync(_ => Format(session, _settings.Use24HourFormat), default);
        }
        catch
        {
            // ignored
        }
    }

    private async void OnFavoritesChanged(object? sender, EventArgs e)
    {
        try
        {
            var session = _sessions.SelectedSession;
            if (session is null)
            {
                return;
            }
            await IsFavorite.UpdateAsync(_ => _favorites.IsFavorite(session.Id), default);
        }
        catch
        {
            // ignored
        }
    }

    private static string Format(Session session, bool use24)
        => use24
            ? $"{session.StartsAt:HH:mm} – {session.EndsAt:HH:mm}"
            : $"{session.StartsAt:h:mm tt} – {session.EndsAt:h:mm tt}";

    private static async ValueTask<IImmutableList<Speaker>> ResolveSpeakersAsync(
        Session session,
        ISessionService sessions,
        CancellationToken ct)
    {
        var resolved = ImmutableArray.CreateBuilder<Speaker>(session.SpeakerIds.Count);
        foreach (var id in session.SpeakerIds)
        {
            var speaker = await sessions.GetSpeakerAsync(id, ct);
            if (speaker is not null)
            {
                resolved.Add(speaker);
            }
        }
        return resolved.ToImmutable();
    }
}
