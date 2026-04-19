---
name: uno-mvux
description: 'Author and review Uno Platform code that follows MVUX (Model-View-Update-eXtended) best practices. Use when creating, editing, or reviewing presentation models in an Uno app — anything involving Feed, ListFeed, State, ListState, the Bindable* generated wrappers, async loaders, navigation between MVUX models, or commands invoked from XAML. Triggers on prompts like "add a page model", "create a view model", "expose a state", "wire up a command", "MVUX list", "feed vs state", "two-way binding in MVUX", "navigate with data", "convert MVVM to MVUX", or whenever generated code lives next to a `partial record SomethingModel`.'
---

# Uno Platform MVUX Best Practices

MVUX (Model-View-Update-eXtended) is Uno Platform's reactive presentation pattern. It replaces the hand-written `ViewModel : ObservableObject + RelayCommand` boilerplate of MVVM with **immutable records, async data feeds, observable states, and source-generated bindable proxies**. The compiler does the change-notification plumbing; the developer writes pure data and pure async functions.

This skill enforces the patterns that work and flags the ones that look like MVVM but break in MVUX.

## When to Use This Skill

- Creating or editing a `*Model.cs` file that is a `partial record` (MVUX page/component model)
- Adding a `Feed`, `ListFeed`, `State`, or `ListState` property
- Wiring a method on a model as a command in XAML
- Sharing state across pages via a service event
- Navigating from one MVUX model to another, especially when passing data
- Reviewing PRs that mix MVVM idioms (`ObservableObject`, `RelayCommand`, `Set(ref ...)`) into an MVUX project
- Resolving build errors `KE0001` (record with `Id` not partial) or runtime "command does not fire" issues

## Core Mental Model

| MVVM | MVUX equivalent | Notes |
|------|-----------------|-------|
| `class FooViewModel : ObservableObject` | `public partial record FooModel(...)` | Records are immutable; the source generator emits a `BindableFooModel` wrapper for the View. |
| `[ObservableProperty] private string _title;` | `IState<string> Title { get; }` | A *state* is an observable cell. The bindable proxy exposes it as a normal property to XAML. |
| `IRelayCommand RefreshCommand { get; }` | `public ValueTask Refresh(CancellationToken ct)` | Public methods become commands automatically. The generator emits `IAsyncCommand Refresh` on the bindable proxy. |
| `ObservableCollection<Item> Items` | `IListFeed<Item> Items` (read-only) **or** `IListState<Item> Items` (read/write) | A feed is a stream of immutable lists; mutation flows through `UpdateAsync`. |
| Set property + raise PropertyChanged | `await SomeState.UpdateAsync(_ => newValue, ct)` | You never raise change events yourself. |
| `Task LoadAsync()` called in ctor + `try/catch` | `Feed.Async(LoadAsync)` / `ListState.Async(this, LoadAsync)` | The feed handles loading state, errors, and cancellation. |

The mental shift: **the model is data; refresh is a function; the framework binds.** You don't push values into the View — you describe how to compute them.

## Fundamentals

### The model record

```csharp
namespace MyApp.Presentation;

public partial record SessionsModel
{
    private readonly INavigator _navigator;
    private readonly ISessionService _sessions;

    public SessionsModel(ISessionService sessions, INavigator navigator)
    {
        _sessions = sessions;
        _navigator = navigator;

        Sessions = ListState.Async(this, LoadAsync);
    }

    public IListState<SessionView> Sessions { get; }

    public async ValueTask OpenSession(SessionView view, CancellationToken ct)
        => await _navigator.NavigateViewModelAsync<SessionDetailModel>(this, data: view.Session, cancellation: ct);

    private async ValueTask<IImmutableList<SessionView>> LoadAsync(CancellationToken ct)
    {
        var list = await _sessions.GetSessionsAsync(ct);
        return list.Select(s => new SessionView(s)).ToImmutableList();
    }
}
```

Required:
- `public partial record` (NOT `class`, NOT `sealed`, NOT `internal`)
- DI dependencies injected via primary or explicit constructor
- One ctor per model — the source generator picks the **most public** one to wire to navigation

### Picking the right reactive primitive

| Primitive | Read | Write | Typical use |
|-----------|------|-------|-------------|
| `IFeed<T>` | yes | no | Read-only async data: `Feed.Async(ct => api.GetUserAsync(ct))` |
| `IListFeed<T>` | yes | no | Read-only async list: `ListFeed.Async(ct => api.GetItemsAsync(ct))` |
| `IState<T>` | yes | yes | Mutable scalar: form fields, toggles, computed display strings refreshed on events |
| `IListState<T>` | yes | yes | Mutable list: filterable lists, lists that need to react to external events |

**Decision rule:** start with the most restrictive (`IFeed`/`IListFeed`). Promote to `IState`/`IListState` only when you need to call `UpdateAsync` from an event handler or another method.

### Async loaders

```csharp
// Read-only feed from a service call
public IFeed<Room?> Room { get; }
    = Feed.Async(ct => sessions.GetRoomAsync(entity.RoomId, ct));

// Mutable list seeded asynchronously — note the `this` argument
public IListState<Item> Items { get; }
    = ListState.Async(this, LoadAsync);

// Mutable scalar with a synchronous initial value
public IState<bool> IsFavorite { get; }
    = State.Value(this, () => favorites.IsFavorite(entity.Id));
```

The `this` argument scopes the state's lifetime to the model — without it, two model instances will share the same state cell.

### Updating state

```csharp
await Title.UpdateAsync(_ => "New title", ct);
await Items.UpdateAsync(current => current?.Add(newItem) ?? ImmutableList.Create(newItem), ct);
await Sessions.UpdateAsync(_ => Project(latest), ct);
```

The lambda receives the current value (which may be `null` for first-load) and returns the next value. **Never** assign directly: `Items = newList;` won't compile and wouldn't notify if it did.

### Methods as commands

```csharp
public async ValueTask Refresh(CancellationToken ct) { ... }
public async ValueTask OpenSession(SessionView view, CancellationToken ct) { ... }
public async ValueTask ToggleFavorite(CancellationToken ct) { ... }
```

Bind from XAML by **method name** — the generator emits an `IAsyncCommand` with that name on the bindable proxy:

```xml
<Button Command="{Binding Refresh}" />
<Button Command="{Binding ToggleFavorite}" />
<ListView IsItemClickEnabled="True"
          utu:CommandExtensions.Command="{Binding OpenSession}" />
```

Method signature rules:
- Return `ValueTask` or `ValueTask<T>` (not `void`, not `Task` unless required by an interface)
- Accept `CancellationToken` as the **last** parameter
- For commands invoked with a parameter (item-click, button with `CommandParameter`), the **first** parameter is the bound value
- Keep them public; private methods are not exposed as commands

### Reacting to external events (the real-world pattern)

When state outside the model changes — a settings service, a favorites store, a SignalR push — subscribe in the constructor and re-project:

```csharp
public SessionsModel(ISessionService sessions, ISettingsService settings, IFavoritesService favorites, INavigator navigator)
{
    _sessions = sessions;
    _settings = settings;
    _favorites = favorites;
    _navigator = navigator;

    Sessions = ListState.Async(this, LoadAsync);

    _settings.SettingsChanged   += OnExternalChanged;
    _favorites.FavoritesChanged += OnExternalChanged;
}

private async void OnExternalChanged(object? sender, EventArgs e)
{
    try
    {
        var list = await _sessions.GetSessionsAsync(default);
        await Sessions.UpdateAsync(_ => Project(list), default);
    }
    catch
    {
        // best-effort live refresh — never let an event handler throw
    }
}
```

Notes:
- `async void` is acceptable **only** in event handlers. Never elsewhere.
- Always wrap in `try/catch` — an uncaught exception in `async void` crashes the app.
- Don't unsubscribe in a finalizer; the model lives for the page region's lifetime.

### Two-way state with a side-effect (the `ForEach` pattern)

When a `State` value should write through to a service whenever the user mutates it from XAML:

```csharp
public IState<bool> Use24HourFormat { get; }

public SettingsModel(ISettingsService settings)
{
    Use24HourFormat = State.Value(this, () => settings.Use24HourFormat)
        .ForEach(async (value, ct) => settings.Use24HourFormat = value);
}
```

The `ForEach` callback runs after every state change, including the change made by a two-way XAML binding.

### Navigating with typed data

Register a `DataViewMap` so the framework knows how to deliver the data argument to the destination model's constructor:

```csharp
new DataViewMap<SessionDetailPage, SessionDetailModel, Session>()
```

```csharp
public SessionDetailModel(Session entity, ISessionService sessions, ISettingsService settings)
{
    Session = entity;
    // ...
}
```

Then navigate from another model:

```csharp
public async ValueTask OpenSession(SessionView view, CancellationToken ct)
    => await _navigator.NavigateViewModelAsync<SessionDetailModel>(this, data: view.Session, cancellation: ct);
```

Going back:

```csharp
// In code-behind (rare — only for non-bindable controls like a custom back link)
private async void OnBackClick(object sender, RoutedEventArgs e)
    => await ((FrameworkElement)sender).Navigator()!
        .NavigateViewModelAsync<SessionsModel>(this);
```

### Records with an `Id` property MUST be partial

The MVUX `IKeyEquatable` source generator emits equality based on `Id`. If a record has an `Id` member it must be `partial`, or the build fails with **KE0001**.

```csharp
// ✅ correct
public partial record SessionView(Session Session, bool Use24HourFormat, bool IsFavorite)
{
    public string Id => Session.Id;
}

// ❌ KE0001
public record SessionView(Session Session) { public string Id => Session.Id; }
```

Same rule for `Session`, `Speaker`, etc., when used as MVUX item types.

## Patterns Reference

### List page that reacts to two services

```csharp
public partial record MyAgendaModel
{
    private readonly ISessionService _sessions;
    private readonly ISettingsService _settings;
    private readonly IFavoritesService _favorites;

    public MyAgendaModel(ISessionService sessions, ISettingsService settings, IFavoritesService favorites)
    {
        _sessions = sessions;
        _settings = settings;
        _favorites = favorites;

        Sessions = ListState.Async(this, LoadAsync);

        _settings.SettingsChanged   += OnExternalChanged;
        _favorites.FavoritesChanged += OnExternalChanged;
    }

    public IListState<SessionView> Sessions { get; }

    private async ValueTask<IImmutableList<SessionView>> LoadAsync(CancellationToken ct)
        => Project(await _sessions.GetSessionsAsync(ct));

    private IImmutableList<SessionView> Project(IEnumerable<Session> list)
    {
        var fmt = _settings.Use24HourFormat;
        return list
            .Where(s => _favorites.IsFavorite(s.Id))
            .OrderBy(s => s.StartsAt)
            .Select(s => new SessionView(s, fmt, true))
            .ToImmutableList();
    }

    private async void OnExternalChanged(object? sender, EventArgs e)
    {
        try
        {
            await Sessions.UpdateAsync(_ => Project(await _sessions.GetSessionsAsync(default)), default);
        }
        catch { }
    }
}
```

### Detail page with computed state

```csharp
public partial record SessionDetailModel
{
    public SessionDetailModel(Session entity, ISessionService sessions, ISettingsService settings, IFavoritesService favorites)
    {
        Session    = entity;
        Speakers   = ListFeed.Async(ct => ResolveSpeakersAsync(entity, sessions, ct));
        Room       = Feed.Async(ct => sessions.GetRoomAsync(entity.RoomId, ct));
        TimeRange  = State.Value(this, () => Format(entity, settings.Use24HourFormat));
        IsFavorite = State.Value(this, () => favorites.IsFavorite(entity.Id));

        settings.SettingsChanged   += async (_, _) => await TimeRange .UpdateAsync(_ => Format(entity, settings.Use24HourFormat), default);
        favorites.FavoritesChanged += async (_, _) => await IsFavorite.UpdateAsync(_ => favorites.IsFavorite(entity.Id),         default);
    }

    public Session              Session    { get; }
    public IListFeed<Speaker>   Speakers   { get; }
    public IFeed<Room?>         Room       { get; }
    public IState<string>       TimeRange  { get; }
    public IState<bool>         IsFavorite { get; }

    public ValueTask ToggleFavorite(CancellationToken ct) => _favorites.ToggleAsync(Session.Id);
}
```

### XAML binding cheatsheet

```xml
<!-- DataContext is the generated BindableSessionsModel, not SessionsModel -->

<!-- Scalar state -->
<TextBlock Text="{Binding TimeRange}" />

<!-- Two-way scalar state -->
<ToggleSwitch IsOn="{Binding Use24HourFormat, Mode=TwoWay}" />

<!-- List feed/state binds straight to ItemsSource -->
<ListView ItemsSource="{Binding Sessions}" />

<!-- Method-as-command -->
<Button Command="{Binding Refresh}" />

<!-- Item-click as command (Uno Toolkit) -->
<ListView IsItemClickEnabled="True"
          utu:CommandExtensions.Command="{Binding OpenSession}" />

<!-- Reach the parent model from an item template -->
<Button Command="{Binding ElementName=SessionsList, Path=DataContext.ToggleFavorite}"
        CommandParameter="{Binding}" />

<!-- Empty-state via the IListFeed.None projection (auto-bindable) -->
<TextBlock Text="No items yet"
           Visibility="{Binding Sessions.None}" />
```

## Anti-Patterns

### ❌ Using a class instead of a record

```csharp
// Won't get a Bindable wrapper. Bindings will silently fail or bind to the raw object.
public class SessionsModel { ... }
```

✅ `public partial record SessionsModel { ... }`

### ❌ Forgetting `partial`

```csharp
// KE0001 if record has an Id; otherwise the source generator can't emit the bindable wrapper.
public record SessionsModel { ... }
```

### ❌ Mutating state with assignment

```csharp
Items = newList;          // doesn't compile (init-only) and wouldn't notify if it did
Title.Value = "X";        // not the API
```

✅ `await Items.UpdateAsync(_ => newList, ct);`

### ❌ `INotifyPropertyChanged` / `ObservableObject` / `[ObservableProperty]` in an MVUX model

These are MVVM. In MVUX they add noise, hide bugs (the bindable wrapper exposes them differently), and signal that the author hasn't internalized the pattern.

### ❌ Storing the bindable wrapper as the model

```csharp
// SpeakerDetailPage.xaml.cs
if (DataContext is SpeakerDetailModel m) { ... }   // ❌ silently false
```

The runtime DataContext is `BindableSpeakerDetailModel`, not the record. Use the navigator extension instead:

```csharp
await ((FrameworkElement)sender).Navigator()!
    .NavigateViewModelAsync<SpeakersModel>(this);
```

### ❌ `async void` outside event handlers

The only acceptable use of `async void` is an `EventHandler` callback. Anywhere else it crashes the app on exception and breaks `await`.

### ❌ Subscribing to events without `try/catch`

External events (`SettingsChanged`, SignalR pushes, timer ticks) end up in `async void` handlers. An uncaught exception there is process-fatal. Always wrap.

### ❌ Long-running work in the constructor

Use `Feed.Async(...)` / `ListState.Async(this, ...)` to defer work until the View binds. A blocking `LoadAsync().Result` in a ctor will deadlock or stall navigation.

### ❌ Calling `ToggleFavorite()` from the page's code-behind

```csharp
// ❌ Bypasses the bindable wrapper, can't be unit-tested, hides the dependency.
private void Star_Click(object sender, RoutedEventArgs e)
    => ((SessionDetailModel)DataContext).ToggleFavorite(CancellationToken.None);
```

✅ Bind the button's `Command` to `{Binding ToggleFavorite}`.

### ❌ Sharing a `State.Value(...)` without the model instance

```csharp
public IState<bool> Toggle { get; } = State.Value(() => false);  // ❌ static cell
```

✅ `State.Value(this, () => false)` — scoped per-model-instance.

## Pitfalls Specific to Uno

- **C# Markup global usings shadow `Path`.** When `<UnoFeatures>` includes `CSharpMarkup`, `Path` resolves to `Microsoft.UI.Xaml.Shapes.Path`. Always write `System.IO.Path.Combine(...)` in services.
- **Region navigator with `Visibility` caches both the page AND the bound MVUX model.** This is the single biggest gotcha in this codebase. Detail pages declared as siblings under `<Grid uen:Region.Attached="True" uen:Region.Navigator="Visibility">` are pre-instantiated, and on `NavigateViewModelAsync<T>` / `NavigateRouteAsync` the framework only toggles `Visibility` on the existing page. The model's constructor runs **once**, on the first navigation that needs it. Any `data:` argument passed via `DataViewMap<TPage, TModel, TData>` is honoured **only on that first navigation** — every subsequent navigation re-uses the cached model with the original entity. Symptom: "every session detail shows the first session I clicked".
  - **Workaround (used in DwxCompanion):** push the selection onto a singleton service (`ISessionService.SelectedSession` + `SelectedSessionChanged` event + `SelectSessionAsync` setter). Master models call `SelectXAsync(payload, ct)` **then** `NavigateRouteAsync(this, "RouteName", cancellation: ct)`. Detail models inject the service, expose IStates, and re-project from `SelectedX` in a `RefreshAsync(ct)` handler subscribed to the change event. Replace `DataViewMap<…, …, T>()` with `ViewMap<…, …>()` on the affected routes.
  - **C# Markup sub-exception:** if the detail page is C# Markup, its strongly-typed binding lambdas (`() => vm.Speaker.Initials`) require `Speaker` on the model to be of type `Speaker`, not `IState<Speaker?>`. In that case make the detail model a plain `sealed class : INotifyPropertyChanged` with a computed `Speaker => _sessions.SelectedSpeaker` getter and fire `PropertyChanged(nameof(Speaker))` on `SelectedSpeakerChanged`. **Document this as an MVUX exception** with a comment block — it is the only place in the codebase where INPC is acceptable. **Threading caveat:** unlike pure MVUX models (whose `IState<T>.UpdateAsync` is dispatched onto the UI thread by the source-generated `Bindable*` proxy before any binding is notified), an INPC class talks to WinUI bindings directly. `SelectXAsync` is invoked from MVUX item-click commands on the threadpool, so a naive `PropertyChanged?.Invoke(...)` will raise on a background thread and WinUI will throw `System.Runtime.InteropServices.COMException` ("''" / RPC_E_WRONG_THREAD) the next time it tries to update the bound TextBlock. Fix: capture `App.MainWindow.DispatcherQueue` at host startup (e.g. `App.UIDispatcher`) and have the handler do `if (!_dispatcher.HasThreadAccess) _dispatcher.TryEnqueue(RaisePropertyChanged); else RaisePropertyChanged();`. Don't rely on `DispatcherQueue.GetForCurrentThread()` inside the model's ctor — the ctor itself can run off-thread.
- **MVUX FeedsGenerator chokes on C# reserved-word property names.** The generator emits a lambda parameter that is `char.ToLower(propertyName[0]) + propertyName[1..]`. If a record member is named `Abstract`, the generated lambda is `(session, abstract) => …`, which is a parser error and cascades into a wall of `CS9348` / `CS0102` / `CS0246` errors all pointing into the generated `…BindableModelGenerator…/<Type>.g.cs`. The bindable wrapper is only generated when the type appears as `IState<T>` / `IListState<T>` somewhere — so the failure can appear suddenly when you wrap an existing record in a state. **Rename the offending member to a non-keyword equivalent** (e.g. `Abstract` → `Summary`, `Event` → `EventInfo`, `Class` → `Category`). Set `<EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>` on the csproj temporarily and look under `obj/Debug/<TFM>/generated/Uno.Extensions.Reactive.Generator/` to confirm the offending lambda parameter.
- **`State<TRefType?>` produces nullability warnings** (`CS8714`, `CS8621`) because the MVUX `State<T>` API declares `T : notnull`. The runtime tolerates nullable reference types fine, so suppress at file scope with `#pragma warning disable CS8714, CS8621` rather than rewriting the model. (Value types use `Nullable<T>` and don't trip this.)
- **`State<IImmutableList<T>>.Value(this, () => ImmutableList<T>.Empty)` is ambiguous** between the `Func<T>` and `Func<Option<T>>` overloads because `ImmutableList<T>` implements `IImmutableList<T>` exactly. Cast the lambda result: `() => (IImmutableList<T>)ImmutableList<T>.Empty`.
- **WASM `LocalApplicationData`** is emulated against IndexedDB. JSON file I/O works, but a stale `bin/` or `obj/` after asset changes can cause the splash to hang. Delete and rebuild.
- **`ApplicationData.Current.LocalSettings`** throws `InvalidOperationException` on Windows **unpackaged**. For settings persistence prefer JSON file under `Environment.GetFolderPath(SpecialFolder.LocalApplicationData)`.

## Quick Decision Flow

```
Need to expose data to the View?
├── Read-only async value      → IFeed<T>           via Feed.Async(ct => …)
├── Read-only async list       → IListFeed<T>       via ListFeed.Async(ct => …)
├── Mutable scalar             → IState<T>          via State.Value(this, () => …)
└── Mutable list               → IListState<T>      via ListState.Async(this, LoadAsync)

Need the user to trigger something?
└── Public ValueTask method on the model. Bind {Binding MethodName} in XAML.

Need state to react to a service event?
└── Subscribe in ctor → async void handler with try/catch → State.UpdateAsync(_ => newValue, default)

Need to navigate with data?
├── First navigation only / no re-navigation     → DataViewMap<TPage, TModel, TData>() + ctor takes TData first
│                                                  + caller does _navigator.NavigateViewModelAsync<TModel>(this, data: payload, cancellation: ct)
└── Re-navigable detail page under Visibility    → ViewMap<TPage, TModel>() (NO data) — the navigator caches the model.
    region (THE COMMON CASE for masters/details)   Push selection onto a singleton service, then NavigateRouteAsync.
                                                   See "Pitfalls Specific to Uno" → "Region navigator with Visibility caches…".
```

## Review Checklist

When reviewing or generating an MVUX model, verify all of:

- [ ] `public partial record` (not class, not sealed)
- [ ] Records with `Id` are `partial`
- [ ] Constructor receives services via DI; no service locator
- [ ] Properties are `IFeed`/`IListFeed`/`IState`/`IListState` — never `ObservableCollection`, never `[ObservableProperty]`
- [ ] State initialized via `Feed.Async`, `ListFeed.Async`, `State.Value(this, …)`, or `ListState.Async(this, …)`
- [ ] `State.Value` and `ListState.Async` pass `this` so state is per-instance
- [ ] Methods exposed as commands return `ValueTask` and accept `CancellationToken` last
- [ ] Updates use `UpdateAsync(current => next, ct)` — no direct assignment
- [ ] `async void` only in event handlers, always wrapped in `try/catch`
- [ ] Navigation between models uses `INavigator.NavigateViewModelAsync<TModel>(this, …)`, not page types
- [ ] Typed nav data is registered with `DataViewMap<TPage, TModel, TData>` and received as the first ctor param
- [ ] Code-behind contains only navigation glue (or nothing)
- [ ] No leftover MVVM scaffolding (`ObservableObject`, `RelayCommand`, `Set(ref ...)`)

## References

- MVUX overview — https://platform.uno/docs/articles/external/uno.extensions/doc/Overview/Reactive/overview.html
- Feeds, States, ListFeeds — https://platform.uno/docs/articles/external/uno.extensions/doc/Learn/Mvux/Concepts.html
- IKeyEquatable rules (KE0001) — https://platform.uno/docs/articles/external/uno.extensions/doc/Overview/KeyEquality/rules.html
- "MVVM versus MVUX", Nick Randolph — https://nicksnettravels.builttoroam.com/mvvm-versus-mvux/
- "Comparing MVVM and MVUX", Peter Smulovics — https://www.linkedin.com/pulse/comparing-mvvm-mvux-from-uno-modern-approach-peter-smulovics-ukl3e/
- Uno Chefs sample (canonical reference app) — https://github.com/unoplatform/uno.chefs
