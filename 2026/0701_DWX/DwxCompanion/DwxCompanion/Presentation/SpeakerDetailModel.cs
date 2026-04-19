using System.ComponentModel;
using Microsoft.UI.Dispatching;

namespace DwxCompanion.Presentation;

// ─────────────────────────────────────────────────────────────────────────────
//                  *** MVUX BEST-PRACTICE EXCEPTION ***
//
// The MVUX skill (see .github/skills/uno-mvux/SKILL.md) flags
// INotifyPropertyChanged in a presentation model as an anti-pattern, and for
// good reason — IState<T> + the source-generated bindable wrapper is the
// idiomatic way to surface mutable values to XAML.
//
// This model is a documented exception. Two constraints force it:
//
//   1. The Region.Navigator="Visibility" pattern in MainPage.xaml caches both
//      the SpeakerDetailPage and its bound model — every navigation after the
//      first re-uses the existing instance, so ctor-data passed via
//      DataViewMap is only honoured once.
//
//   2. SpeakerDetailPage is implemented in C# Markup. The strongly-typed
//      binding lambdas (`() => vm.Speaker.Initials`) require `Speaker` on the
//      model to be of type `Speaker`, not `IState<Speaker?>`.
//
// Solution: the model holds a settable Speaker property backed by the
// `ISessionService.SelectedSession` selection state, and notifies via INPC
// when the singleton service raises `SelectedSpeakerChanged`. The C# Markup
// bindings see a normal `Speaker` and re-evaluate on PropertyChanged.
//
// Do NOT copy this pattern for new MVUX models — use IState in a partial
// record instead.
// ─────────────────────────────────────────────────────────────────────────────
public sealed class SpeakerDetailModel : INotifyPropertyChanged
{
    private readonly ISessionService _sessions;
    private readonly DispatcherQueue? _dispatcher;

    public SpeakerDetailModel(ISessionService sessions)
    {
        _sessions = sessions;
        // The model can be constructed on a background thread (the click that
        // triggers navigation runs on the threadpool under MVUX), so
        // DispatcherQueue.GetForCurrentThread() returns null here. Use the
        // app-wide UI dispatcher captured in App.OnLaunched instead, so we can
        // marshal PropertyChanged back to the UI thread (otherwise WinUI
        // bindings throw COMException when they re-read Speaker on a non-UI
        // thread the second time around).
        _dispatcher = App.UIDispatcher ?? DispatcherQueue.GetForCurrentThread();
        _sessions.SelectedSpeakerChanged += OnSelectedSpeakerChanged;
    }

    public Speaker Speaker => _sessions.SelectedSpeaker
        ?? throw new InvalidOperationException(
            "SpeakerDetailModel was bound before a speaker was selected. "
            + "SpeakersModel.OpenSpeaker must call ISessionService.SelectSpeakerAsync before navigating.");

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnSelectedSpeakerChanged(object? sender, EventArgs e)
    {
        if (_dispatcher is not null && !_dispatcher.HasThreadAccess)
        {
            _dispatcher.TryEnqueue(RaiseSpeakerChanged);
        }
        else
        {
            RaiseSpeakerChanged();
        }
    }

    private void RaiseSpeakerChanged()
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Speaker)));
}
