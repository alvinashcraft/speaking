namespace DwxCompanion.Services;

public interface ISessionService
{
    ValueTask<ConferenceData> GetConferenceDataAsync(CancellationToken ct = default);

    ValueTask<IImmutableList<Session>> GetSessionsAsync(CancellationToken ct = default);

    ValueTask<Session?> GetSessionAsync(string id, CancellationToken ct = default);

    ValueTask<IImmutableList<Speaker>> GetSpeakersAsync(CancellationToken ct = default);

    ValueTask<Speaker?> GetSpeakerAsync(string id, CancellationToken ct = default);

    ValueTask<Room?> GetRoomAsync(string id, CancellationToken ct = default);
}
