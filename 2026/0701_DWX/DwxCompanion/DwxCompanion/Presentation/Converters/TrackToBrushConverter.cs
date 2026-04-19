using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;
using Windows.UI;

namespace DwxCompanion.Presentation.Converters;

public sealed class TrackToBrushConverter : IValueConverter
{
    private static readonly SolidColorBrush s_fallback = new(Color.FromArgb(0xFF, 0x7C, 0x7C, 0x7C));

    public object Convert(object value, Type targetType, object parameter, string language)
    {
        var track = (value as string)?.Trim();
        return track switch
        {
            "Cross-Platform" => Brush(0xC9, 0xF0, 0x4C),
            "Windows" => Brush(0x3B, 0x82, 0xF6),
            "Architecture" => Brush(0xA8, 0x55, 0xF7),
            "Design" => Brush(0xEC, 0x48, 0x99),
            "AI" => Brush(0xF5, 0x9E, 0x0B),
            _ => s_fallback,
        };
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotImplementedException();

    private static SolidColorBrush Brush(byte r, byte g, byte b)
        => new(Color.FromArgb(0xFF, r, g, b));
}
