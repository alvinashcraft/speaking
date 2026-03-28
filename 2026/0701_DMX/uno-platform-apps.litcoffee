---
marp: true
theme: gaia
paginate: true
_paginate: false
title: Build Beautiful Cross-Platform Apps with Uno Platform
author: Alvin Ashcraft
footer: DWX 2026
style: |
  :root {
    --color-background: #fff;
    --color-foreground: #333;
    --color-highlight: #7B2D8E;
    --color-dimmed: #9B59B6;
  }
  section {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
  section.lead {
    background-color: var(--color-highlight);
    color: #fff;
  }
  section.lead.invert {
    background-color: #4A0E5C;
    color: #f0e6f6;
  }
  section.invert {
    background-color: #4A0E5C;
    color: #f0e6f6;
  }
  h1, h2 {
    color: var(--color-highlight);
  }
  section.lead h1, section.lead h2, section.lead h3, section.lead h4 {
    color: #fff;
  }
  section.invert h1, section.invert h2, section.invert h3, section.invert h4 {
    color: #f0e6f6;
  }
  a {
    color: var(--color-dimmed);
  }
  section.lead a, section.invert a {
    color: #d4a8e0;
  }
  header {
    color: var(--color-highlight);
  }
  footer {
    font-size: 0.6em;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .columns-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
  section.lead footer {
    display: none;
  }
  .fa-bluesky { color: #0085ff; }
  .fa-github { color: #6e5494; }
  .fa-globe { color: #7B2D8E; }
  ul {
    list-style-type: disc;
  }
  ul ul {
    list-style-type: circle;
  }
  table th {
    background-color: #7B2D8E;
    color: #fff;
  }
  @import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
---

<!-- _class: lead invert -->
<!-- _footer: '' -->

# Build Beautiful Cross-Platform Apps with Uno Platform

### Alvin Ashcraft

#### July 1, 2026

---

<!-- header: '**Build Beautiful Cross-Platform Apps with Uno Platform**' -->

## About Me

- **Alvin Ashcraft**
- Sr. Content Developer — Microsoft Learn

<i class="fa-brands fa-github"></i> [github.com/alvinashcraft](https://www.github.com/alvinashcraft/)
<i class="fa-solid fa-globe"></i> [alvinashcraft.com](https://www.alvinashcraft.com/)
<i class="fa-brands fa-bluesky"></i> [bsky.app/profile/alvinashcraft.com](https://bsky.app/profile/alvinashcraft.com)

---

## Agenda

- What is Uno Platform?
- Develop Your Way — IDE Flexibility
- Accelerate Creation — Live Wizard
- Bridge Design & Code — Figma to XAML / C# Markup
- Visualize Your UI — Hot Design
- Go XAML-Free — C# Markup
- Modernize Legacy Apps — WinUI Migration

---

## What is Uno Platform?

- Open-source framework for building cross-platform apps with .NET
- Single codebase targeting **iOS, Android, macOS, Linux, Windows, and the Web**
- Pixel-perfect UI across all platforms
- 100% native platform capabilities
- Visual design with Uno Platform Studio and Hot Design

---

## Why Uno Platform?

- **Single codebase** — write once, run everywhere
- **Full .NET ecosystem** — NuGet packages, C#, LINQ, async/await
- **Familiar APIs** — WinUI / XAML for UI developers
- **Flexible UI options** — XAML or C# Markup
- **Active community** — open source with strong commercial support

---

## Supported Platforms

| Platform | Technology |
|---|---|
| Windows | WinUI 3 / Windows App SDK (native) |
| iOS | .NET for iOS (Skia) |
| Android | .NET for Android (Skia) |
| macOS | Skia Desktop |
| Linux | Skia Desktop (X11, Framebuffer) |
| Web | WebAssembly via Skia |

---

<!-- _class: lead invert -->

# Develop Your Way

### Use your favorite IDE on any OS

---

## IDE Choices

- **Visual Studio** (Windows)
  - Full XAML designer & IntelliSense
  - Integrated debugging for all targets
- **VS Code** (Windows / Mac / Linux)
  - Uno Platform extension
  - Lightweight and fast
- **JetBrains Rider** (Windows / Mac / Linux)
  - Rich .NET support
  - Cross-platform debugging

---

## Visual Studio

<div class="columns">
<div>

- XAML Hot Reload for rapid iteration
- Solution Explorer with multi-target awareness
- Integrated emulators and simulators
- NuGet package management

</div>
<div>

<!-- TODO: Add screenshot -->
![w:450](images/vs-screenshot.png)

</div>
</div>

---

## VS Code

<div class="columns">
<div>

- Uno Platform Extension for VS Code
- C# Dev Kit integration
- Terminal-based workflows
- Great for Linux developers

</div>
<div>

<!-- TODO: Add screenshot -->
![w:450](images/vscode-screenshot.png)

</div>
</div>

---

## JetBrains Rider

<div class="columns">
<div>

- First-class .NET IDE on all platforms
- XAML preview and editing support
- Powerful refactoring tools
- Integrated unit testing

</div>
<div>

<!-- TODO: Add screenshot -->
![w:450](images/rider-screenshot.png)

</div>
</div>

---

<!-- _class: lead invert -->

# Accelerate Creation

### Launch projects instantly with the Live Wizard

---

## Uno Platform Live Wizard

- Web-based project template generator
- Available at **platform.uno/create**
- Choose your target platforms
- Select authentication, navigation, and theming options
- Generates a fully configured solution in seconds

---

## Live Wizard Walkthrough

1. Visit the Uno Platform Live Wizard
2. Name your project
3. Select target platforms
4. Pick a UI framework (XAML or C# Markup)
5. Choose a preset (Blank or Recommended) and optionally Customize
6. Download and open in your IDE

<!-- TODO: Add demo or screenshots of the wizard -->

---

## What You Get

<div class="columns">
<div>

- Multi-targeted solution structure
- Pre-configured dependency injection
- Navigation setup (Uno.Extensions.Navigation)

</div>
<div>

- Theming with Material or Fluent styles
- Ready-to-run on all selected platforms

</div>
</div>

---

<!-- _class: lead invert -->

# Bridge Design & Code

### Seamlessly export Figma designs to XAML or C# Markup

---

## Figma Integration

- **Uno Figma Plugin** exports designs directly to code
- Supports both **XAML** and **C# Markup** output
- Maintains design fidelity — colors, spacing, typography
- Design tokens map to Uno theming resources
- Designers and developers share a single source of truth

---

## Design to Code Workflow

1. Designers create UI in Figma
2. Use the Uno Platform Figma plugin
3. Export selected frames as XAML or C# Markup
4. Import generated code into your project
5. Fine-tune bindings and logic

<!-- TODO: Add demo or screenshots -->

---

<!-- _class: lead invert -->

# Visualize Your UI

### Real-time visual editing with Hot Design

---

## Hot Design — Uno Platform Studio

<div class="columns">
<div>

- **Live visual editor** for your running app
- Edit UI properties in real time — no recompile
- Drag and drop components

</div>
<div>

- Inspect the visual tree
- Works alongside Hot Reload for code changes

</div>
</div>

---

## Hot Design in Action

- Launch your app in debug mode
- Activate Hot Design from the toolbar
- Select elements to edit properties visually
- Changes reflect instantly on all running targets
- Save changes back to your XAML or C# Markup

<!-- TODO: Add demo or screenshots -->

---

<!-- _class: lead invert -->

# Go XAML-Free

### Build complete UIs using only C# Markup

---

## C# Markup

- Declare UI entirely in C# — no XAML files needed
- Fluent API for building control trees
- Full IntelliSense and compile-time checking
- Strongly-typed bindings
- Same controls and layout system as XAML

---

## C# Markup Example

```csharp
this.DataContext<MainViewModel>((page, vm) => page.Content(
    new StackPanel()
        .Children(
            new TextBlock()
                .Text("Hello, Uno Platform!")
                .FontSize(24)
                .HorizontalAlignment(HorizontalAlignment.Center),
            new Button()
                .Content("Click Me")
                .Command(x => x.Binding(() => vm.OnClick))
        )
));
```

---

## XAML vs. C# Markup

| Feature | XAML | C# Markup |
|---|---|---|
| Syntax | XML-based | Fluent C# API |
| IntelliSense | Partial | Full |
| Compile-time safety | Limited | Strong |
| Hot Reload | Yes | Yes |
| Figma export | Yes | Yes |
| Designer support | Yes (Hot Design) | Yes (Hot Design) |

---

<!-- _class: lead invert -->

# Modernize Legacy Apps

### Convert WinUI projects to cross-platform apps

---

## WinUI to Uno Migration

- Existing WinUI 3 / Windows App SDK apps can go cross-platform
- **Virtually zero code changes** required
- Uno implements the WinUI API surface on all platforms
- Incremental adoption — migrate one page at a time
- Keep your existing MVVM architecture

---

## Migration Steps

1. Add Uno Platform target frameworks to your project
2. Resolve any Windows-only API usage
3. Use platform-specific code where needed (`#if` directives)
4. Test on each target platform
5. Ship everywhere

<!-- TODO: Add demo or before/after examples -->

---

## Architecture Overview

<div class="columns">
<div>

- **Single multi-targeted project** — UI, ViewModels, business logic
- **Uno.WinUI** — cross-platform WinUI API implementation
- **Skia rendering** — pixel-perfect UI via Skia (default on non-Windows)

</div>
<div>

- **Uno.Extensions** — MVUX, Navigation, DI, HTTP, Auth
- **Uno Toolkit** — pre-built cross-platform UI components
- **MVUX pattern** — Model-View-Update eXtended with immutable records

</div>
</div>

---

## Demo Time 🎉

<!-- TODO: Add live demos covering:
  - Creating a project with the Live Wizard
  - Running on multiple platforms
  - Hot Design visual editing
  - C# Markup UI building
  - Figma export walkthrough
-->

---

## Resources

- <i class="fa-solid fa-globe"></i> **Uno Platform** — [platform.uno](https://platform.uno)
- <i class="fa-solid fa-book"></i> **Documentation** — [platform.uno/docs](https://platform.uno/docs/articles/intro.html)
- <i class="fa-solid fa-wand-magic-sparkles"></i> **Live Wizard** — [platform.uno/create](https://platform.uno/create)
- <i class="fa-brands fa-github"></i> **GitHub** — [github.com/unoplatform/uno](https://github.com/unoplatform/uno)
- <i class="fa-brands fa-figma"></i> **Uno Figma Plugin** — Available in the Figma Community
- <i class="fa-solid fa-flask"></i> **Samples** — [github.com/unoplatform/uno.samples](https://github.com/unoplatform/uno.samples)

<!-- TODO: Verify and update all links -->

---

## Resources (cont.)

- <i class="fa-brands fa-discord"></i> **Uno Platform Discord** — Community chat and support
- <i class="fa-brands fa-youtube"></i> **YouTube** — Uno Platform channel for tutorials and walkthroughs
- <i class="fa-solid fa-rss"></i> **Blog** — [platform.uno/blog](https://platform.uno/blog)
- <i class="fa-solid fa-toolbox"></i> **Uno Toolkit** — Pre-built UI components
- <i class="fa-solid fa-robot"></i> **Uno MCP Servers** — AI-assisted development with docs search and app interaction

---

<!-- _class: lead invert -->
<!-- _header: '' -->
<!-- _footer: '' -->

## <!-- fit --> Thank You!

### Questions?

<i class="fa-solid fa-globe"></i> [alvinashcraft.com](https://www.alvinashcraft.com/) · <i class="fa-brands fa-bluesky"></i> [bsky.app/profile/alvinashcraft.com](https://bsky.app/profile/alvinashcraft.com)

