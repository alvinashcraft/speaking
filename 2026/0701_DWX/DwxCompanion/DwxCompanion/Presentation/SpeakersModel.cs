namespace DwxCompanion.Presentation;

public partial record SpeakersModel
{
    private readonly INavigator _navigator;

    public SpeakersModel(ISessionService sessions, INavigator navigator)
    {
        _navigator = navigator;
        Speakers = ListFeed.Async(async ct => await sessions.GetSpeakersAsync(ct));
    }

    public IListFeed<Speaker> Speakers { get; }

    public async ValueTask OpenSpeaker(Speaker speaker, CancellationToken ct)
    {
        await _navigator.NavigateViewModelAsync<SpeakerDetailModel>(this, data: speaker, cancellation: ct);
    }
}

