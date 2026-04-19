using System.IO;
using System.Text.Json;

namespace DwxCompanion.Services;

public sealed class SettingsService : ISettingsService
{
    private static readonly string SettingsFilePath = System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "DwxCompanion",
        "settings.json");

    private bool _use24HourFormat = true;

    public SettingsService()
    {
        try
        {
            if (File.Exists(SettingsFilePath))
            {
                var json = File.ReadAllText(SettingsFilePath);
                var snapshot = JsonSerializer.Deserialize<SettingsSnapshot>(json);
                if (snapshot is not null)
                {
                    _use24HourFormat = snapshot.Use24HourFormat;
                }
            }
        }
        catch
        {
            // Best-effort load; fall back to defaults on any IO/parse failure.
        }
    }

    public event EventHandler? SettingsChanged;

    public bool Use24HourFormat => _use24HourFormat;

    public Task SetUse24HourFormatAsync(bool value)
    {
        if (_use24HourFormat == value)
        {
            return Task.CompletedTask;
        }

        _use24HourFormat = value;
        Save();
        SettingsChanged?.Invoke(this, EventArgs.Empty);
        return Task.CompletedTask;
    }

    private void Save()
    {
        try
        {
            var dir = System.IO.Path.GetDirectoryName(SettingsFilePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            var json = JsonSerializer.Serialize(new SettingsSnapshot(_use24HourFormat));
            File.WriteAllText(SettingsFilePath, json);
        }
        catch
        {
            // Best-effort persistence.
        }
    }

    private sealed record SettingsSnapshot(bool Use24HourFormat);
}
