namespace DwxCompanion.Services;

public interface IFavoritesService
{
    bool IsFavorite(string sessionId);
    IReadOnlyCollection<string> Favorites { get; }
    event EventHandler? FavoritesChanged;
    Task ToggleAsync(string sessionId);
}
