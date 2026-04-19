# DwxCompanion — Demo Script

Companion walkthrough for the **"Build Beautiful Cross-Platform Apps with Uno Platform"** session at DWX 2026.

The app is a small DWX 2026 conference companion: a sessions list, speakers, session detail, an agenda of favorited talks, and a settings toggle. Same C# + XAML, two heads — Windows (WinAppSDK) and WebAssembly in the browser.

---

## 0. Pre-flight (before you go on stage)

1. **Close any running instances.** WinAppSDK locks output files and a stale WASM dev server will hijack the port.
2. **Build both heads cold** so the first run on stage isn't a 30-second wait:
   ```powershell
   cd DwxCompanion\DwxCompanion
   dotnet build -f net10.0-desktop
   dotnet build -f net10.0-browserwasm
   ```
3. **Wipe demo state** (so favorites/settings start clean):
   ```powershell
   Remove-Item "$env:LOCALAPPDATA\DwxCompanion" -Recurse -Force -ErrorAction SilentlyContinue
   ```
4. **Open these tabs in your IDE** so they're one Ctrl+Tab away:
   - `App.xaml.cs` (DI + routes)
   - `Presentation/SessionsModel.cs` (MVUX)
   - `Presentation/SessionsPage.xaml` (XAML + bindings)
   - `Presentation/MyAgendaPage.xaml` (empty state + reuse)
   - `Services/FavoritesService.cs` (cross-platform persistence)
2. **Have both apps running side-by-side** on the same monitor. Easier than hot-swapping.

   ```powershell
   # Desktop (WinAppSDK)
   $env:DOTNET_MODIFIABLE_ASSEMBLIES = "debug"
   Start-Job { dotnet run -f net10.0-desktop --project D:\dev\speaking\2026\0701_DWX\DwxCompanion\DwxCompanion\DwxCompanion.csproj }

   # WASM
   Start-Job { dotnet run -f net10.0-browserwasm --project D:\dev\speaking\2026\0701_DWX\DwxCompanion\DwxCompanion\DwxCompanion.csproj }
   ```

---

## 1. Opening the demo (≈ 90 seconds)

> "What you're looking at is **one C# + XAML codebase**. The window on the left is a native Windows app — WinAppSDK, Skia-rendered. The browser tab on the right is the **same project**, compiled to WebAssembly. No code-behind branching for the screens you'll see; one App, one Shell, one set of pages."

Drag/resize the WASM browser to show responsive behavior. Hover the side rail on each.

**Code to show:** `DwxCompanion.csproj`

```xml
<TargetFrameworks>net10.0-desktop;net10.0-browserwasm</TargetFrameworks>
```

```xml
<UnoFeatures>
  Material;
  MVUX;
  Toolkit;
  Hosting;
  Logging;
  Navigation;
  ThemeService;
  Serialization;
</UnoFeatures>
```

> "Every feature on the next slides — Material styles, MVUX state, region navigation, the toolkit controls — is one line in `<UnoFeatures>`. No NuGet archaeology."

---

## 2. App composition & navigation (≈ 3 minutes)

**Click through:** Sessions → Speakers → My Agenda → Settings using the side rail. Note the smooth instant-switch (no page reconstruction).

**Code to show:** `App.xaml.cs`

Highlight three things:

1. **Hosting + DI registration** (around line 70-80) — same `IHostBuilder` pattern as ASP.NET / .NET MAUI:
   ```csharp
   services.AddSingleton<ISessionService, JsonSessionService>();
   services.AddSingleton<ISettingsService, SettingsService>();
   services.AddSingleton<IFavoritesService, FavoritesService>();
   ```

2. **ViewMap + RouteMap** — the contract between routes and view-models:
   ```csharp
   new ViewMap<SessionsPage, SessionsModel>(),
   new DataViewMap<SessionDetailPage, SessionDetailModel, Session>(),
   ```
   > "DataViewMap is the magic for typed navigation — pass a `Session` and the framework hands the view-model its strongly-typed data argument."

3. **Region navigator on MainPage** — `Region.Navigator="Visibility"` keeps every page **pre-instantiated** as siblings in the content grid and toggles `Visibility`. Tabs/rails feel instant because nothing is being constructed on click.

   In `MainPage.xaml`:
   ```xml
   <Grid uen:Region.Attached="True"
         uen:Region.Navigator="Visibility">
     <local:SessionsPage   uen:Region.Name="Sessions" />
     <local:SpeakersPage   uen:Region.Name="Speakers"   Visibility="Collapsed" />
     <local:MyAgendaPage   uen:Region.Name="MyAgenda"   Visibility="Collapsed" />
     <local:SettingsPage   uen:Region.Name="Settings"   Visibility="Collapsed" />
     <local:SessionDetailPage  uen:Region.Name="SessionDetail" Visibility="Collapsed" />
     <local:SpeakerDetailPage  uen:Region.Name="SpeakerDetail" Visibility="Collapsed" />
   </Grid>
   ```

   > "Side-rail buttons are just `uen:Navigation.Request='Sessions'` attached properties. No code-behind, no event handlers."

---

## 3. MVUX in 60 seconds — the Sessions list (≈ 4 minutes)

**Click into Sessions.** Point out the cards: track-colored stripe, time, room, speaker.

**Code to show:** `Presentation/SessionsModel.cs`

```csharp
public partial record SessionsModel(...)
{
    public IListState<SessionView> Sessions { get; }
        = ListState.Async(this, LoadAsync);

    public async ValueTask OpenSession(SessionView v, CancellationToken ct)
        => await _navigator.NavigateViewModelAsync<SessionDetailModel>(this, data: v.Session, cancellation: ct);

    public async ValueTask ToggleFavorite(SessionView v, CancellationToken ct)
        => await _favorites.ToggleAsync(v.Session.Id);
}
```

Talking points (don't read every line — pick 2-3):

- **It's a `record`, not a `ViewModel : INotifyPropertyChanged` god-class.** Immutable, partial, source-generated bindable wrapper.
- **`IListState<T>`** is a stream of immutable lists. We mutate via `Sessions.UpdateAsync(_ => newList, ct)` from event handlers.
- **Methods *are* commands.** `OpenSession` shows up in XAML as a bindable command — no `RelayCommand` ceremony.

**Then show the XAML binding in `SessionsPage.xaml`:**

```xml
<ListView ItemsSource="{Binding Sessions}"
          IsItemClickEnabled="True"
          utu:CommandExtensions.Command="{Binding OpenSession}">
```

> "`utu:CommandExtensions.Command` is from Uno Toolkit — turns ListView item-click into a typed command call. Click an item, you get the bound `SessionView` as the parameter, MVUX dispatches to `OpenSession` on the model."

---

## 4. Re-navigable detail pages — Session detail (≈ 3 minutes)

**Click any session card.** Detail page slides in. Back. **Click a different card.** Different session opens — not the one you clicked first. Repeat on WASM.

> "That last sentence sounds trivial. It's not. We had to work for it. Let me show you why — it's a great example of a leaky abstraction in any framework, and how MVUX gives you a clean exit."

**Set the scene** — open `Presentation/MainPage.xaml`:

```xml
<Grid uen:Region.Attached="True" uen:Region.Navigator="Visibility">
    <SessionsPage      uen:Region.Name="Sessions"      Visibility="Collapsed"/>
    <SessionDetailPage uen:Region.Name="SessionDetail" Visibility="Collapsed"/>
    <SpeakersPage      uen:Region.Name="Speakers"      Visibility="Collapsed"/>
    <SpeakerDetailPage uen:Region.Name="SpeakerDetail" Visibility="Collapsed"/>
    …
</Grid>
```

> "The **Visibility navigator** is fast — every page is pre-instantiated, navigation just toggles `Visibility`. No allocation, no flash. Lovely. Until you re-navigate to a detail page with different data."

**The trap.** With `DataViewMap<SessionDetailPage, SessionDetailModel, Session>()`, the `Session` ctor parameter is filled in **once** — the first navigation. The page and the bound MVUX model are cached forever. Click a second session and you'd see the first one. (We had this bug last week; demo it from a `git stash` if you want the laugh.)

**The fix — selection state on a singleton service.** Show `Services/ISessionService.cs`:

```csharp
Session?  SelectedSession   { get; }
event EventHandler? SelectedSessionChanged;
ValueTask SelectSessionAsync(Session? session, CancellationToken ct = default);
```

Then `SessionsModel.OpenSession`:

```csharp
public async ValueTask OpenSession(SessionView view, CancellationToken ct)
{
    await _sessionService.SelectSessionAsync(view.Session, ct);
    await _navigator.NavigateRouteAsync(this, "SessionDetail", cancellation: ct);
}
```

> "Select **then** navigate. The selection lands on the singleton service before the navigator switches visibility, so the (already-alive) detail model has fresh data to project from."

And `SessionDetailModel.cs` — pure MVUX, no `Session` ctor arg:

```csharp
public SessionDetailModel(ISessionService sessions, ISettingsService settings, IFavoritesService favorites)
{
    Session    = State<Session?>.Value(this, () => null);
    Speakers   = State<IImmutableList<Speaker>>.Value(this, () => …Empty);
    Room       = State<Room?>.Value(this, () => null);
    TimeRange  = State.Value(this, () => string.Empty);
    IsFavorite = State.Value(this, () => false);

    _ = RefreshAsync(default);                    // first-time projection
    sessions.SelectedSessionChanged  += OnSelectionChanged;
    settings.SettingsChanged         += OnSettingsChanged;
    favorites.FavoritesChanged       += OnFavoritesChanged;
}
```

`RefreshAsync` reads `_sessions.SelectedSession` and pushes through every `IState.UpdateAsync(...)`. The XAML bindings (`{Binding Session.Track}`, `{Binding TimeRange}`, etc.) re-evaluate via the source-generated `BindableSessionDetailModel`. **MVUX dispatches the value onto the UI thread for us** — that detail matters in 2 minutes.

In `App.xaml.cs` the route is now plain `ViewMap`, no data:

```csharp
new ViewMap<SessionDetailPage, SessionDetailModel>(),
```

> "Two-line moral: **the framework's caching is a feature, not a bug. You just hold the selection in a service instead of in a ctor argument.** The pitfall is documented in `.github/skills/uno-mvux/SKILL.md` so Copilot can warn the next person."

---

## 4b. Same pitfall, different escape hatch — Speaker detail (≈ 90 seconds)

**Click two different speakers.** Works. Open `Presentation/SpeakerDetailModel.cs` and lean in:

```csharp
public sealed class SpeakerDetailModel : INotifyPropertyChanged   // 👈 not a record
{
    private readonly DispatcherQueue? _dispatcher;
    public Speaker Speaker => _sessions.SelectedSpeaker ?? throw …;
    …
}
```

> "Why the about-face from MVUX records to plain INPC here? Because **`SpeakerDetailPage` is C# Markup**, and its bindings are typed lambdas: `() => vm.Speaker.Initials`. `IState<Speaker?>` doesn't have an `Initials` member, so the lambda won't compile. We need `Speaker` to be a real `Speaker`."

The catch — and the reason the comment block at the top of this file says **"do not copy this pattern"**:

```csharp
private void OnSelectedSpeakerChanged(object? sender, EventArgs e)
{
    if (_dispatcher is not null && !_dispatcher.HasThreadAccess)
        _dispatcher.TryEnqueue(RaiseSpeakerChanged);
    else
        RaiseSpeakerChanged();
}
```

> "MVUX item-click commands run on the threadpool. The service event fires on whatever thread called it. A naive `PropertyChanged?.Invoke(...)` will raise on a background thread, the WinUI binding tries to push a string into a TextBlock that lives on the UI thread, and you get a `COMException` — the second time you click. **MVUX would have dispatched this for us automatically through the source-generated bindable wrapper.** This is the line we had to add by hand. That's the cost of the C# Markup convenience."

Two-line moral worth saying out loud:

1. **MVUX gives you free UI-thread marshaling.** If you use it, you don't think about threads. If you opt out into INPC, you own the dispatching.
2. **The escape hatch exists.** Uno doesn't trap you in MVUX — when a real constraint forces a different shape, you reach for plain .NET patterns. Just document it.

---

## 5. Live UI from a setting — the 24h/12h toggle (≈ 2 minutes)

**Click Settings.** Toggle "24-hour time format". Don't navigate — leave it open. Switch to **Sessions** in the side rail. Times have already updated. Open a **session detail**. Same.

> "Notice we never navigated *back* to Sessions to see it refresh. The list updated under the page."

**Code to show:** `Services/SettingsService.cs` — the simple sync getter + event:

```csharp
public bool Use24HourFormat
{
    get => _use24;
    set { if (_use24 != value) { _use24 = value; Persist(); SettingsChanged?.Invoke(this, EventArgs.Empty); } }
}
public event EventHandler? SettingsChanged;
```

Then `SessionsModel.cs` — re-projecting on the event:

```csharp
_settings.SettingsChanged += OnExternalChanged;

private async void OnExternalChanged(object? s, EventArgs e)
{
    var list = await _sessionService.GetSessionsAsync(default);
    await Sessions.UpdateAsync(_ => Project(list), default);
}
```

> "Live updates aren't magic — they're an event the model subscribes to and pushes through `IListState.UpdateAsync`. The bindable wrapper notifies the UI."

---

## 6. Favorites & My Agenda — putting it all together (≈ 3 minutes)

**On the Sessions page**, tap the ☆ on three sessions on Windows. The star fills (★). **Switch to WASM** — different state because each runtime has its own local store. Tap a couple over there too.

**Click "My Agenda"** in the side rail. Empty? Add one first. Then go to My Agenda — favorited sessions appear, sorted by start time.

**Click "My Agenda" with no favorites** to show the empty state ("No sessions yet — Tap the star on a session to add it to your agenda.").

**Open a session detail** and click "★ Remove from agenda" — go back, the star is hollow on the card and the session is gone from My Agenda. **All without a navigation refresh.**

**Code to show:** `Services/FavoritesService.cs`

```csharp
public async ValueTask ToggleAsync(string id)
{
    lock (_lock)
        if (!_ids.Add(id)) _ids.Remove(id);
    await PersistAsync();
    FavoritesChanged?.Invoke(this, EventArgs.Empty);
}
```

```csharp
private static string FilePath => System.IO.Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "DwxCompanion", "favorites.json");
```

> "Same code path on Windows and WASM. On WASM, Uno emulates `LocalApplicationData` against IndexedDB so persistence survives a refresh."

> "We considered SQLite for the demo and decided against it. ~30 sessions and a `HashSet<string>` of favorites doesn't earn the dependency — but if you're storing thousands of records, SQLite via `Microsoft.Data.Sqlite` works on every Uno target, including WASM."

**Then `Presentation/MyAgendaModel.cs`** — point out it's the same shape as `SessionsModel`:

```csharp
private IImmutableList<SessionView> Project(IEnumerable<Session> list)
    => list.Where(s => _favorites.IsFavorite(s.Id))
           .OrderBy(s => s.StartsAt)
           .Select(s => new SessionView(s, _settings.Use24HourFormat, true))
           .ToImmutableList();

_settings.SettingsChanged   += OnExternalChanged;
_favorites.FavoritesChanged += OnExternalChanged;
```

> "Two services, two events, one re-projection. The page is the *same card template* as Sessions — that's the payoff for using a passthrough `SessionView` record."

---

## 7. Closing & the "wow" moments to land (≈ 60 seconds)

Reload the WASM tab in the browser to drive home that "yes, this is really running in the browser." Resize both windows to show the responsive layout reflowing.

Three things worth saying out loud:

1. **One project, two heads.** `dotnet build -f net10.0-desktop` and `dotnet build -f net10.0-browserwasm`. No platform `#if` in the screens you saw.
2. **MVUX is small.** `IFeed`, `IListFeed`, `IState`, `IListState`, methods-as-commands. That's most of it.
3. **The Toolkit fills the gaps.** `CommandExtensions`, `SafeArea`, `AutoLayout`, `NavigationBar` — paged through earlier slides.
4. **MVUX pays off when you go off the happy path.** The visibility-navigator caching trap (Section 4) was a 30-minute fix because we could swap `IState` projections without touching XAML or threading code. The C# Markup INPC escape hatch (Section 4b) needed manual UI-thread marshaling. **That delta is the case for MVUX in one slide.**

> "Every line of code you saw today ships in this repo: github.com/alvinashcraft/speaking — the `0701_DWX` folder."

---

## Smoke-run checklist (run **before** you go on stage)

Run on **both** Windows and WASM:

- [ ] Side rail: Sessions / Speakers / My Agenda / Settings — each page renders, no XAML parse errors.
- [ ] Sessions list: cards render with track stripe, time, room, speaker name.
- [ ] Tap a session card → SessionDetail opens with summary + speakers list.
- [ ] Back, tap a **different** session → detail shows the new one (regression check for the visibility-navigator workaround).
- [ ] "← Sessions" returns to the list.
- [ ] Speakers list: avatar circles + names.
- [ ] Tap a speaker → SpeakerDetail opens.
- [ ] Back, tap a **second different speaker** → detail shows the new one, no `COMException` in the debugger (regression check for the SpeakerDetailModel dispatcher fix).
- [ ] "← Speakers" returns.
- [ ] Settings: 24h toggle persists across navigation; Sessions/Detail times update live.
- [ ] Tap ☆ on a card → fills to ★, no navigation triggered.
- [ ] My Agenda with zero favorites shows the empty state.
- [ ] My Agenda with favorites shows them ordered by start time.
- [ ] On Detail: "★ Remove from agenda" / "☆ Add to agenda" toggles correctly.
- [ ] Close + relaunch the app — favorites and time format survive.

If anything fails, re-run with a clean local store:
```powershell
Remove-Item "$env:LOCALAPPDATA\DwxCompanion" -Recurse -Force
```
