namespace DwxCompanion.Models;

public record ConferenceData(
    IImmutableList<Session> Sessions,
    IImmutableList<Speaker> Speakers,
    IImmutableList<Room> Rooms);
