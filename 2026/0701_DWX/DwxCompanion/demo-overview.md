# DwxCompanion — Demo Overview (1 page)

**Session:** "Build Beautiful Cross-Platform Apps with Uno Platform" (DWX 2026)

**App:** A DWX 2026 conference companion — Sessions list, Speakers, session detail, favorited agenda, settings. **One C# + XAML codebase**, built to both Windows (WinAppSDK) and WebAssembly in the browser.

**Demo Walkthrough:** Slide **34** ("Demo Time 🎉"). The 7 sections below are a structured walk through the running apps; see `demo-script.md` for detailed talking points and code blocks.

---

## Quick Rundown

| Demo Section | Time | What to Show | Key Code |
|---------|------|--------------|----------|
| **1. Opening** | 90s | One project, two heads. Drag WASM browser narrow ↔ wide to show sidebar ↔ bottom nav. | `DwxCompanion.csproj` (`net10.0-desktop;net10.0-browserwasm`) |
| **2. Navigation** | 3m | Click through Sessions/Speakers/Agenda/Settings side-rail. Fast, instant. Show `VisualStateManager` + `AdaptiveTrigger` driving the responsive layout swap. | `MainPage.xaml` (VisualStateManager, sidebar + bottom nav), `App.xaml.cs` (DI, routes) |
| **3. MVUX / Sessions** | 4m | Sessions list card template. Methods-as-commands. `IListState` + source-gen bindable wrapper. | `SessionsModel.cs` (record, `IListState`, `OpenSession` command), `SessionsPage.xaml` (ListView binding) |
| **4. Detail Pages** | 3m | Tap session card → detail. Tap **different** session → it updates (not the first one). The trap: visibility-navigator caches pages. Fix: hold selection in `ISessionService`, re-project on nav. | `SessionDetailModel.cs` (subscription-based projection), `Services/ISessionService.cs` |
| **4b. C# Markup** | 90s | SpeakerDetail is C# Markup (not XAML). Typed bindings, but no automatic UI-thread marshaling → manual dispatcher dance. Escape hatch, not the pattern. | `SpeakerDetailPage.cs` (INPC, dispatcher logic) |
| **5. Live Settings** | 2m | Toggle 24h format in Settings. **Don't navigate** — switch to Sessions/Detail, times already updated. Event → projection → MVUX re-bind. | `SettingsService.cs` (event-driven), `SessionsModel.cs` (re-projection on event) |
| **5b. Hot Design** | 2m | WASM app: click Uno Studio toolbar → Hot Design. Live XAML editor. Tweak CornerRadius, Padding. Save. Browser canvas updates instantly. No rebuild, no reload, state survives. | `App.xaml.cs` (`.UseStudio()`) |
| **6. Favorites / Agenda** | 3m | Tap ☆ on cards → ★. My Agenda shows favorites sorted by time. Empty state. Click detail → toggle "★ Remove from agenda". All without nav refresh. | `FavoritesService.cs` (event-driven, JSON persist), `MyAgendaModel.cs` (same template reuse) |
| **7. Closing** | 60s | Reload WASM tab to confirm browser runtime. Narrow/widen to show responsive. Wow moments: one codebase, MVUX small, Toolkit features, adaptive layout = XAML only, MVUX wins off the happy path. | (demo, no code) |

---

**Note:** These 7 sections happen consecutively during the demo time (slide 34). You don't navigate back to the presentation between sections — it's all live in the running apps. Use the time budgets to stay on pace and hit each beat.

## Pre-Flight (before stage)

```powershell
# Close old instances, build cold
cd DwxCompanion\DwxCompanion
dotnet build -f net10.0-desktop
dotnet build -f net10.0-browserwasm

# Wipe state
Remove-Item "$env:LOCALAPPDATA\DwxCompanion" -Recurse -Force -ErrorAction SilentlyContinue

# Open in tabs: App.xaml.cs, SessionsModel.cs, SessionsPage.xaml, MyAgendaPage.xaml, FavoritesService.cs

# Run both side-by-side
dotnet run -f net10.0-desktop &
dotnet run -f net10.0-browserwasm &
```

---

## Key Files to Know

- **`MainPage.xaml`** — VisualStateManager, sidebar + bottom nav, content grid, region navigator.
- **`App.xaml.cs`** — DI, ViewMap routes, `UseStudio()` for Hot Design.
- **`SessionsModel.cs`** — MVUX record, `IListState<SessionView>`, commands (`OpenSession`, `ToggleFavorite`).
- **`SessionDetailModel.cs`** — Selection-based projection, re-bind on service event.
- **`SpeakerDetailPage.cs`** — C# Markup, INPC, manual dispatcher (the escape hatch).
- **`SettingsService.cs`** — Event-driven, `Use24HourFormat` toggle, triggers re-projections.
- **`FavoritesService.cs`** — Persist to JSON/IndexedDB, event on toggle, survives reload.
- **`MyAgendaModel.cs`** — Same `SessionView` template as Sessions, filters + sorts favorites.

---

## Smoke-Run Checklist

- [ ] Both Windows and WASM launch, no XAML errors.
- [ ] Side-rail: Sessions/Speakers/Agenda/Settings all render.
- [ ] Responsive narrow/wide: sidebar ↔ bottom nav.
- [ ] Session detail: tap card, tap *different* card → shows new data.
- [ ] SpeakerDetail: tap speaker, tap *different* speaker → no COMException.
- [ ] Settings 24h toggle: no nav, Sessions/Detail times update live.
- [ ] Tap ☆ → ★; My Agenda shows it; detail toggles "★ Remove from agenda".
- [ ] Close & relaunch: favorites & time format persist.
- [ ] Hot Design (WASM): Uno Studio toolbar → tweak CornerRadius → Save → instant update.
- [ ] Reload browser tab → WASM still running, state intact.

---

See `demo-script.md` for the full, detailed walkthrough with code blocks and talking points.
