using System.IO;
using System.Text.Json;

namespace DwxCompanion.Services;

public sealed class FavoritesService : IFavoritesService
{
    private static readonly string FavoritesFilePath = System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "DwxCompanion",
        "favorites.json");

    private readonly object _gate = new();
    private HashSet<string> _favorites;

    public FavoritesService()
    {
        _favorites = Load();
    }

    public event EventHandler? FavoritesChanged;

    public IReadOnlyCollection<string> Favorites
    {
        get
        {
            lock (_gate)
            {
                return _favorites.ToArray();
            }
        }
    }

    public bool IsFavorite(string sessionId)
    {
        lock (_gate)
        {
            return _favorites.Contains(sessionId);
        }
    }

    public Task ToggleAsync(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return Task.CompletedTask;
        }

        lock (_gate)
        {
            if (!_favorites.Add(sessionId))
            {
                _favorites.Remove(sessionId);
            }
            Save(_favorites);
        }

        FavoritesChanged?.Invoke(this, EventArgs.Empty);
        return Task.CompletedTask;
    }

    private static HashSet<string> Load()
    {
        try
        {
            if (File.Exists(FavoritesFilePath))
            {
                var json = File.ReadAllText(FavoritesFilePath);
                var ids = JsonSerializer.Deserialize<string[]>(json);
                if (ids is not null)
                {
                    return new HashSet<string>(ids, StringComparer.Ordinal);
                }
            }
        }
        catch
        {
            // Best-effort load.
        }
        return new HashSet<string>(StringComparer.Ordinal);
    }

    private static void Save(HashSet<string> favorites)
    {
        try
        {
            var dir = System.IO.Path.GetDirectoryName(FavoritesFilePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            File.WriteAllText(FavoritesFilePath, JsonSerializer.Serialize(favorites.ToArray()));
        }
        catch
        {
            // Best-effort persistence.
        }
    }
}
