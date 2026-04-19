using Microsoft.UI.Xaml.Data;

namespace DwxCompanion.Presentation.Converters;

public sealed class BoolToAgendaLabelConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
        => (value is bool b && b) ? "Remove from agenda" : "Add to agenda";

    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotImplementedException();
}
