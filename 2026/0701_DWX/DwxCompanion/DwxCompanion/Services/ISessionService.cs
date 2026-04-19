namespace DwxCompanion.Services;

public interface ISessionService
{
    ValueTask<ConferenceData> GetConferenceDataAsync(CancellationToken ct = default);

    ValueTask<IImmutableList<Session>> GetSessionsAsync(CancellationToken ct = default);

    ValueTask<Session?> GetSessionAsync(string id, CancellationToken ct = default);

    ValueTask<IImmutableList<Speaker>> GetSpeakersAsync(CancellationToken ct = default);

    ValueTask<Speaker?> GetSpeakerAsync(string id, CancellationToken ct = default);

    ValueTask<Room?> GetRoomAsync(string id, CancellationToken ct = default);

    // ─────────────────────────────────────────────────────────────────────────
    // Selection state — workaround for the Region.Navigator="Visibility" caching
    // limitation. The visibility navigator instantiates a detail page exactly
    // once and re-uses the same MVUX model for every subsequent navigation, so
    // ctor-data passed via DataViewMap is only honoured the first time. Holding
    // the selection on a singleton service lets the (reused) detail model
    // reactively project the current selection on every visit.
    // See .github/skills/uno-mvux/SKILL.md for the full pitfall write-up.
    // ─────────────────────────────────────────────────────────────────────────

    Session? SelectedSession { get; }

    Speaker? SelectedSpeaker { get; }

    event EventHandler? SelectedSessionChanged;

    event EventHandler? SelectedSpeakerChanged;

    ValueTask SelectSessionAsync(Session? session, CancellationToken ct = default);

    ValueTask SelectSpeakerAsync(Speaker? speaker, CancellationToken ct = default);
}
