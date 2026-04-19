namespace DwxCompanion.Presentation;

public partial record SettingsModel
{
    private readonly ISettingsService _settings;

    public SettingsModel(ISettingsService settings)
    {
        _settings = settings;
        Use24HourFormat = State
            .Value(this, () => _settings.Use24HourFormat)
            .ForEach(async (value, _) => await _settings.SetUse24HourFormatAsync(value));
    }

    public IState<bool> Use24HourFormat { get; }
}
