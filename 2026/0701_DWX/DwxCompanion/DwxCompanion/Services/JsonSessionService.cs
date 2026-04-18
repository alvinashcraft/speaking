using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
#if __WASM__
using Windows.Storage;
#endif

namespace DwxCompanion.Services;

public class JsonSessionService : ISessionService
{
    private readonly ILogger<JsonSessionService> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private ConferenceData? _cache;

    private static readonly JsonSerializerOptions s_options = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public JsonSessionService(ILogger<JsonSessionService> logger)
    {
        _logger = logger;
    }

    public async ValueTask<ConferenceData> GetConferenceDataAsync(CancellationToken ct = default)
    {
        if (_cache is not null)
        {
            return _cache;
        }

        await _gate.WaitAsync(ct);
        try
        {
            if (_cache is not null)
            {
                return _cache;
            }

#if __WASM__
            // WebAssembly has no real filesystem; read the asset through the Uno asset pipeline.
            var uri = new Uri("ms-appx:///Assets/sessions.json");
            var file = await StorageFile.GetFileFromApplicationUriAsync(uri);
            await using var stream = await file.OpenStreamForReadAsync();
#else
            // Desktop, WinAppSDK (packaged & unpackaged), Android, iOS: read from the bundled
            // file copied next to the executable via <Content CopyToOutputDirectory>.
            var path = Path.Combine(AppContext.BaseDirectory, "Assets", "sessions.json");
            await using var stream = File.OpenRead(path);
#endif

            var dto = await JsonSerializer.DeserializeAsync<ConferenceDataDto>(stream, s_options, ct)
                ?? throw new InvalidOperationException("sessions.json deserialized to null.");

            _cache = new ConferenceData(
                Sessions: dto.Sessions.ToImmutableArray(),
                Speakers: dto.Speakers.ToImmutableArray(),
                Rooms: dto.Rooms.ToImmutableArray());

            _logger.LogInformation(
                "Loaded {Sessions} sessions, {Speakers} speakers, {Rooms} rooms from bundled JSON.",
                _cache.Sessions.Count, _cache.Speakers.Count, _cache.Rooms.Count);

            return _cache;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async ValueTask<IImmutableList<Session>> GetSessionsAsync(CancellationToken ct = default)
        => (await GetConferenceDataAsync(ct)).Sessions;

    public async ValueTask<Session?> GetSessionAsync(string id, CancellationToken ct = default)
        => (await GetConferenceDataAsync(ct)).Sessions.FirstOrDefault(s => s.Id == id);

    public async ValueTask<IImmutableList<Speaker>> GetSpeakersAsync(CancellationToken ct = default)
        => (await GetConferenceDataAsync(ct)).Speakers;

    public async ValueTask<Speaker?> GetSpeakerAsync(string id, CancellationToken ct = default)
        => (await GetConferenceDataAsync(ct)).Speakers.FirstOrDefault(s => s.Id == id);

    public async ValueTask<Room?> GetRoomAsync(string id, CancellationToken ct = default)
        => (await GetConferenceDataAsync(ct)).Rooms.FirstOrDefault(r => r.Id == id);

    // DTOs use mutable lists so System.Text.Json (without source generation) can populate them
    // directly. They are projected to immutable types in GetConferenceDataAsync.
    private sealed class ConferenceDataDto
    {
        public List<Session> Sessions { get; set; } = new();
        public List<Speaker> Speakers { get; set; } = new();
        public List<Room> Rooms { get; set; } = new();
    }
}
