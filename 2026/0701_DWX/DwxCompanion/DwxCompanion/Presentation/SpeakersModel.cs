namespace DwxCompanion.Presentation;

public partial record SpeakersModel
{
    private readonly INavigator _navigator;
    private readonly ISessionService _sessions;

    public SpeakersModel(ISessionService sessions, INavigator navigator)
    {
        _navigator = navigator;
        _sessions = sessions;
        Speakers = ListFeed.Async(async ct => await sessions.GetSpeakersAsync(ct));
    }

    public IListFeed<Speaker> Speakers { get; }

    public async ValueTask OpenSpeaker(Speaker speaker, CancellationToken ct)
    {
        // Workaround for visibility-navigator model caching — see ISessionService
        // and SKILL.md for the full pitfall write-up.
        await _sessions.SelectSpeakerAsync(speaker, ct);
        await _navigator.NavigateRouteAsync(this, "SpeakerDetail", cancellation: ct);
    }
}
