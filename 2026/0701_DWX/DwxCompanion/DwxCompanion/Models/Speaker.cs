namespace DwxCompanion.Models;

public partial record Speaker(
    string Id,
    string Name,
    string Title,
    string Bio,
    string PhotoUrl,
    SpeakerLinks Links);

public record SpeakerLinks(
    string? Blog = null,
    string? Bluesky = null,
    string? GitHub = null,
    string? LinkedIn = null);
