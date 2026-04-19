using Uno.Resizetizer;

namespace DwxCompanion;

public partial class App : Application
{
    /// <summary>
    /// Initializes the singleton application object. This is the first line of authored code
    /// executed, and as such is the logical equivalent of main() or WinMain().
    /// </summary>
    public App()
    {
        this.InitializeComponent();
    }

    protected Window? MainWindow { get; private set; }
    protected IHost? Host { get; private set; }

    protected async override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var builder = this.CreateBuilder(args)
            // Add navigation support for toolkit controls such as TabBar and NavigationView
            .UseToolkitNavigation()
            .Configure(host => host
#if DEBUG
                // Switch to Development environment when running in DEBUG
                .UseEnvironment(Environments.Development)
#endif
                .UseLogging(configure: (context, logBuilder) =>
                {
                    // Configure log levels for different categories of logging
                    logBuilder
                        .SetMinimumLevel(
                            context.HostingEnvironment.IsDevelopment() ?
                                LogLevel.Information :
                                LogLevel.Warning)

                        // Default filters for core Uno Platform namespaces
                        .CoreLogLevel(LogLevel.Warning);

                    // Uno Platform namespace filter groups
                    // Uncomment individual methods to see more detailed logging
                    //// Generic Xaml events
                    //logBuilder.XamlLogLevel(LogLevel.Debug);
                    //// Layout specific messages
                    //logBuilder.XamlLayoutLogLevel(LogLevel.Debug);
                    //// Storage messages
                    //logBuilder.StorageLogLevel(LogLevel.Debug);
                    //// Binding related messages
                    //logBuilder.XamlBindingLogLevel(LogLevel.Debug);
                    //// Binder memory references tracking
                    //logBuilder.BinderMemoryReferenceLogLevel(LogLevel.Debug);
                    //// DevServer and HotReload related
                    //logBuilder.HotReloadCoreLogLevel(LogLevel.Information);
                    //// Debug JS interop
                    //logBuilder.WebAssemblyLogLevel(LogLevel.Debug);

                }, enableUnoLogging: true)
                .UseConfiguration(configure: configBuilder =>
                    configBuilder
                        .EmbeddedSource<App>()
                        .Section<AppConfig>()
                )
                // Enable localization (see appsettings.json for supported languages)
                .UseLocalization()
                .UseHttp((context, services) => {
#if DEBUG
                // DelegatingHandler will be automatically injected
                services.AddTransient<DelegatingHandler, DebugHttpHandler>();
#endif

})
                .ConfigureServices((context, services) =>
                {
                    services.AddSingleton<ISessionService, JsonSessionService>();
                })
                .ConfigureAppConfiguration(config =>
                {
#if __WASM__
                    // Clear launchurl so WASM always starts at the Shell root,
                    // preventing the URL-based deep-link race that replaces Shell
                    // with the leaf page on reload.
                    // See: https://github.com/unoplatform/uno.chefs/issues/738
                    Microsoft.Extensions.Configuration.MemoryConfigurationBuilderExtensions
                        .AddInMemoryCollection(config, new Dictionary<string, string?>
                    {
                        { HostingConstants.LaunchUrlKey, "" }
                    });
#endif
                })
                .UseNavigation(
                    ReactiveViewModelMappings.ViewModelMappings,
                    RegisterRoutes,
                    configure: navConfig =>
#if __WASM__
                        navConfig with { AddressBarUpdateEnabled = false }
#else
                        navConfig
#endif
                    )
            );
        MainWindow = builder.Window;

        #if DEBUG
        MainWindow.UseStudio();
#endif
                MainWindow.SetWindowIcon();

        Host = await builder.NavigateAsync<
#if __WASM__
            Shell
#else
            MainPage
#endif
            >();
    }

    private static void RegisterRoutes(IViewRegistry views, IRouteRegistry routes)
    {
        views.Register(
            new ViewMap(ViewModel: typeof(ShellModel)),
            new ViewMap<MainPage, MainModel>(),
            new ViewMap<SessionsPage, SessionsModel>(),
            new ViewMap<SpeakersPage, SpeakersModel>(),
            new DataViewMap<SpeakerDetailPage, SpeakerDetailModel, Speaker>(),
            new ViewMap<MyAgendaPage, MyAgendaModel>(),
            new ViewMap<SettingsPage, SettingsModel>()
        );

        routes.Register(
#if __WASM__
            new RouteMap("", View: views.FindByViewModel<ShellModel>(),
                Nested:
                [
                    new ("Main", View: views.FindByViewModel<MainModel>(), IsDefault: true,
                        Nested:
                        [
                            new ("Sessions", View: views.FindByViewModel<SessionsModel>(), IsDefault: true),
                            new ("Speakers", View: views.FindByViewModel<SpeakersModel>()),
                            new ("SpeakerDetail", View: views.FindByViewModel<SpeakerDetailModel>()),
                            new ("MyAgenda", View: views.FindByViewModel<MyAgendaModel>()),
                            new ("Settings", View: views.FindByViewModel<SettingsModel>()),
                        ]),
                ]
            )
#else
            new RouteMap("", View: views.FindByViewModel<MainModel>(),
                Nested:
                [
                    new ("Sessions", View: views.FindByViewModel<SessionsModel>(), IsDefault: true),
                    new ("Speakers", View: views.FindByViewModel<SpeakersModel>()),
                    new ("SpeakerDetail", View: views.FindByViewModel<SpeakerDetailModel>()),
                    new ("MyAgenda", View: views.FindByViewModel<MyAgendaModel>()),
                    new ("Settings", View: views.FindByViewModel<SettingsModel>()),
                ]
            )
#endif
        );
    }
}
