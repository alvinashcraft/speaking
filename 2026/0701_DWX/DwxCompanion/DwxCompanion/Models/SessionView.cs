using System.Globalization;

namespace DwxCompanion.Models;

public partial record SessionView(Session Session, bool Use24HourFormat)
{
    public string Id => Session.Id;
    public string Title => Session.Title;
    public string Track => Session.Track;
    public string Abstract => Session.Abstract;
    public string DayLabel => Session.DayLabel;
    public string RoomId => Session.RoomId;
    public string SpeakerSummary => Session.SpeakerSummary;

    public string TimeRange =>
        Use24HourFormat
            ? $"{Session.StartsAt.ToString("HH:mm", CultureInfo.InvariantCulture)} – {Session.EndsAt.ToString("HH:mm", CultureInfo.InvariantCulture)}"
            : $"{Session.StartsAt.ToString("h:mm tt", CultureInfo.InvariantCulture)} – {Session.EndsAt.ToString("h:mm tt", CultureInfo.InvariantCulture)}";
}
