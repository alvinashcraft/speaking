namespace DwxCompanion.Models;

public partial record Session(
    string Id,
    string Title,
    string Track,
    string RoomId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    IImmutableList<string> SpeakerIds,
    string Summary);
