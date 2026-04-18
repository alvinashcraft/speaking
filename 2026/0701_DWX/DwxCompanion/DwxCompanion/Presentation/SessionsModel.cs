namespace DwxCompanion.Presentation;

public partial record SessionsModel
{
    public SessionsModel(ISessionService sessions)
    {
        Sessions = ListFeed.Async(async ct => await sessions.GetSessionsAsync(ct));
    }

    public IListFeed<Session> Sessions { get; }
}
