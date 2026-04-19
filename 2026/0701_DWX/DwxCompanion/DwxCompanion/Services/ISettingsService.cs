namespace DwxCompanion.Services;

public interface ISettingsService
{
    bool Use24HourFormat { get; }
    event EventHandler? SettingsChanged;
    Task SetUse24HourFormatAsync(bool value);
}
