using Microsoft.UI;
using Microsoft.UI.Text;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Uno.Extensions.Markup;
using Windows.UI;
using Windows.UI.Text;

namespace DwxCompanion.Presentation;

// Entire page expressed with Uno C# Markup to contrast the XAML-based pages.
// This is the "Look ma, no XAML!" demo target for the DWX 2026 session.
public sealed partial class SpeakerDetailPage : UserControl
{
    public SpeakerDetailPage()
    {
        var linksHost = new ContentControl();
        var backButton = new HyperlinkButton()
            .Grid(row: 0)
            .Content("← Speakers")
            .Foreground(Brush(0xC9, 0xF0, 0x4C))
            .FontSize(14)
            .Padding(0)
            .Margin(0, 0, 0, 12);

        backButton.Click += async (s, args) =>
        {
            _ = args;
            if (s is FrameworkElement fe)
            {
                var nav = fe.Navigator();
                if (nav is not null)
                {
                    await nav.NavigateViewModelAsync<SpeakersModel>(this);
                }
            }
        };

        this.DataContext<SpeakerDetailModel>((page, vm) => page
            .Background(Brush(0x0A, 0x0A, 0x0A))
            .Content(new Grid()
                .Padding(32)
                .RowDefinitions("Auto,Auto,*")
                .Children(
                    backButton,
                    // Header row: avatar + name + title
                    new Grid()
                        .Grid(row: 1)
                        .Margin(0, 0, 0, 24)
                        .ColumnDefinitions("Auto,*")
                        .Children(
                            new Border()
                                .Grid(column: 0)
                                .Width(112)
                                .Height(112)
                                .CornerRadius(56)
                                .Background(Brush(0xC9, 0xF0, 0x4C))
                                .Margin(0, 0, 24, 0)
                                .Child(new TextBlock()
                                    .Text(() => vm.Speaker.Initials)
                                    .FontSize(42)
                                    .FontWeight(FontWeights.Bold)
                                    .Foreground(Brush(0x0A, 0x0A, 0x0A))
                                    .HorizontalAlignment(HorizontalAlignment.Center)
                                    .VerticalAlignment(VerticalAlignment.Center)),
                            new StackPanel()
                                .Grid(column: 1)
                                .VerticalAlignment(VerticalAlignment.Center)
                                .Spacing(6)
                                .Children(
                                    new TextBlock()
                                        .Text(() => vm.Speaker.Name)
                                        .FontSize(34)
                                        .FontWeight(FontWeights.SemiBold)
                                        .Foreground(Brush(0xF5, 0xF5, 0xF5)),
                                    new TextBlock()
                                        .Text(() => vm.Speaker.Title)
                                        .FontSize(16)
                                        .Opacity(0.75)
                                        .Foreground(Brush(0xE6, 0xE8, 0xEC))
                                        .TextWrapping(TextWrapping.Wrap))),
                    // Body: bio + links
                    new StackPanel()
                        .Grid(row: 2)
                        .Spacing(20)
                        .Children(
                            new Border()
                                .Background(Brush(0x18, 0x18, 0x18))
                                .BorderBrush(Brush(0x2A, 0x2A, 0x2A))
                                .BorderThickness(1)
                                .CornerRadius(12)
                                .Padding(20)
                                .Child(new TextBlock()
                                    .Text(() => vm.Speaker.Bio)
                                    .FontSize(14)
                                    .LineHeight(22)
                                    .Foreground(Brush(0xE6, 0xE8, 0xEC))
                                    .TextWrapping(TextWrapping.Wrap)),
                            new TextBlock()
                                .Text("Connect")
                                .FontSize(18)
                                .FontWeight(FontWeights.SemiBold)
                                .Foreground(Brush(0xF5, 0xF5, 0xF5))
                                .Margin(0, 8, 0, 0),
                            new ContentControl()
                                .Content(linksHost)))));

        linksHost.DataContextChanged += (_, args) =>
        {
            if (args.NewValue is SpeakerDetailModel model)
            {
                linksHost.Content = BuildLinksPanel(model.Speaker);
            }
        };
    }

    private static StackPanel BuildLinksPanel(Speaker speaker)
    {
        var panel = new StackPanel()
            .Orientation(Orientation.Vertical)
            .Spacing(8);

        AddLinkIfPresent(panel, "🌐  Blog", speaker.Links.Blog);
        AddLinkIfPresent(panel, "🦋  Bluesky", speaker.Links.Bluesky);
        AddLinkIfPresent(panel, "🐙  GitHub", speaker.Links.GitHub);
        AddLinkIfPresent(panel, "💼  LinkedIn", speaker.Links.LinkedIn);

        return panel;
    }

    private static void AddLinkIfPresent(StackPanel parent, string label, string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        parent.Children.Add(new HyperlinkButton()
            .Content(label)
            .NavigateUri(new Uri(url))
            .Foreground(Brush(0xC9, 0xF0, 0x4C))
            .FontSize(14)
            .Padding(0));
    }

    private static SolidColorBrush Brush(byte r, byte g, byte b)
        => new(Color.FromArgb(0xFF, r, g, b));
}
