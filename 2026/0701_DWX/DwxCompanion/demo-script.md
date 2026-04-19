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

## 4. Typed navigation with data — Session detail (≈ 2 minutes)

**Click any session card.** Detail page slides in (visibility swap, instant). Click "← Sessions" to go back. Click the same card again on the WASM side.

**Code to show:** `Presentation/SessionDetailModel.cs`

```csharp
public SessionDetailModel(Session entity, ISessionService s, ISettingsService settings, IFavoritesService favorites)
{
    Session = entity;
    Speakers   = ListFeed.Async(ct => ResolveSpeakersAsync(entity, s, ct));
    Room       = Feed.Async(ct => s.GetRoomAsync(entity.RoomId, ct));
    TimeRange  = State.Value(this, () => Format(entity, settings.Use24HourFormat));
    IsFavorite = State.Value(this, () => favorites.IsFavorite(entity.Id));
}
```

Talking points:

- The `Session entity` ctor parameter is **the navigation data argument** declared back in `App.xaml.cs` via `DataViewMap<…, …, Session>`. The framework injected it. No global state, no message bus.
- `Feed` = read-only async pull. `IListFeed` = async list. `IState` = mutable observable. Pick the smallest one that solves the problem.
- `Speakers` and `Room` are computed lazily; the page binding starts them.

**Code-behind in `SessionDetailPage.xaml.cs`** is one line of navigation glue, nothing else:

```csharp
private async void OnBackClick(object sender, RoutedEventArgs e)
    => await ((FrameworkElement)sender).Navigator()!
        .NavigateViewModelAsync<SessionsModel>(this);
```

> "Note we use the `Navigator()` extension on the element, not stored references. This avoids a gotcha where `DataContext` is the generated `BindableSessionDetailModel` wrapper, not the raw record."

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

> "Every line of code you saw today ships in this repo: github.com/alvinashcraft/speaking — the `0701_DWX` folder."

---

## Smoke-run checklist (run **before** you go on stage)

Run on **both** Windows and WASM:

- [ ] Side rail: Sessions / Speakers / My Agenda / Settings — each page renders, no XAML parse errors.
- [ ] Sessions list: cards render with track stripe, time, room, speaker name.
- [ ] Tap a session card → SessionDetail opens with abstract + speakers list.
- [ ] "← Sessions" returns to the list.
- [ ] Speakers list: avatar circles + names.
- [ ] Tap a speaker → SpeakerDetail opens.
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
