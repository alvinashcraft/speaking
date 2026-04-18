namespace DwxCompanion.Presentation;

public partial record SpeakersModel
{
    public SpeakersModel(ISessionService sessions)
    {
        Speakers = ListFeed.Async(async ct => await sessions.GetSpeakersAsync(ct));
    }

    public IListFeed<Speaker> Speakers { get; }
}
