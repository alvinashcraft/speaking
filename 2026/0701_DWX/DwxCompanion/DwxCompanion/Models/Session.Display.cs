using System.Globalization;

namespace DwxCompanion.Models;

public partial record Session
{
    public string DayLabel => StartsAt.ToString("ddd MMM d", CultureInfo.InvariantCulture);

    public string TimeRange =>
        $"{StartsAt.ToString("HH:mm", CultureInfo.InvariantCulture)} – {EndsAt.ToString("HH:mm", CultureInfo.InvariantCulture)}";

    public string SpeakerSummary =>
        SpeakerIds.Count switch
        {
            0 => "TBA",
            1 => SpeakerIds[0],
            _ => string.Join(" · ", SpeakerIds),
        };
}
