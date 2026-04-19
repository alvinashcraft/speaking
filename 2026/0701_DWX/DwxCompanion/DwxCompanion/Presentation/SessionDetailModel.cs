namespace DwxCompanion.Presentation;

public partial record SessionDetailModel
{
    private readonly ISettingsService _settings;

    public SessionDetailModel(Session entity, ISessionService sessions, ISettingsService settings)
    {
        Session = entity;
        _settings = settings;

        Speakers = ListFeed.Async(async ct => await ResolveSpeakersAsync(entity, sessions, ct));
        Room = Feed.Async(async ct => await sessions.GetRoomAsync(entity.RoomId, ct));
        TimeRange = State.Value(this, () => Format(entity, _settings.Use24HourFormat));

        _settings.SettingsChanged += OnSettingsChanged;
    }

    public Session Session { get; }

    public IListFeed<Speaker> Speakers { get; }

    public IFeed<Room?> Room { get; }

    public IState<string> TimeRange { get; }

    private async void OnSettingsChanged(object? sender, EventArgs e)
    {
        try
        {
            await TimeRange.UpdateAsync(_ => Format(Session, _settings.Use24HourFormat), default);
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
