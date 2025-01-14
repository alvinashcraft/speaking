# Links from VSLive! Las Vegas 2025

## Building a Native Application for Windows

Which UI framework should you choose?

### Alvin Ashcraft's links

- [Alvin on LinkedIn](https://www.linkedin.com/in/alvinashcraft/)
- [Alvin's blog](https://www.alvinashcraft.com/)
- [Alvin on Twitter](https://twitter.com/alvinashcraft)
- [Alvin's GitHub](https://github.com/alvinashcraft)
- [Buy my books](https://www.amazon.com/stores/Alvin-Ashcraft/author/B08WLD35BX)

### Microsoft Learn links

- [Windows Developer Documentation](https://learn.microsoft.com/windows/apps/)
- [Choose the best application framework for a Windows development project | Training Module](https://learn.microsoft.com/training/modules/windows-choose-best-app-framework/)
- [Overview of Windows Development Options](https://learn.microsoft.com/windows/apps/get-started/)
- [Client app development frameworks FAQ](https://learn.microsoft.com/windows/apps/get-started/client-frameworks-faq)
- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Build a WPF Blazor Hybrid App](https://learn.microsoft.com/aspnet/core/blazor/hybrid/tutorials/wpf)

### Other Links

- [WinUI at Build 2024 links](https://github.com/microsoft/microsoft-ui-xaml/discussions/9649)
- [TechBash Developer Conference](https://techbash.com/)
- [.NET Product Support](https://dotnet.microsoft.com/platform/support)
- [Uno Platform Documentation](https://platform.uno/docs/articles/intro.html)
- [Avalonia Docs](https://docs.avaloniaui.net/)
- [Modernize your UWP app with preview UWP support for .NET 9 and Native AOT](https://devblogs.microsoft.com/ifdef-windows/preview-uwp-support-for-dotnet-9-native-aot/)
- [Info about experimental Dark Mode support in Windows Forms with .NET 9](https://learn.microsoft.com/en-us/dotnet/desktop/winforms/whats-new/net90?view=netdesktop-9.0#dark-mode)

### Using UWP with .NET 9

Detailed instructions to get this working with the current preview release can be found in the [blog post](https://devblogs.microsoft.com/ifdef-windows/preview-uwp-support-for-dotnet-9-native-aot/) above. At a high level, you need to:

1. Install the latest .NET 9 SDK (or get it with your VS2022 install in the next step).
1. Install Visual Studio 2022 17.12 or later with the **Windows application development** workload, making sure to include the **Universal Windows Platform tools** and **Windows 11 SDK (10.0.26100.0)** components.
1. Get the [Windows SDK Preview bundle](https://aka.ms/preview-uwp-support-for-dotnet9-windows-sdk) and follow the README instructions to install it.
1. Install the [VSIX](https://aka.ms/preview-uwp-support-for-dotnet9-templates-vsix) with the preview UWP project templates.

That will get you ready to create your first UWP project with .NET 9.
