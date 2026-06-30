# Uno Platform Presentation — Speaker Notes

## Slide 1: Title Slide

- Welcome and intro
- Quick eye contact with audience
- Set tone: exciting possibilities for cross-platform development

## Slide 2: About Me

- Give brief background (Sr. Content Developer at Microsoft on Foundry Learn docs)
- Social handles for follow-up

## Slide 3: Agenda

- Set expectations—7 topics ahead
- Tell audience: "We'll go from intro to real-world migration"
- Mention demos coming later

## Slide 4: What is Uno Platform?

- Emphasize: **one codebase, multiple platforms**
- Stress native capabilities—not a thin wrapper
- Mention pixel-perfect UI as key differentiator
- Visual design tools make it approachable

## Slide 5: Why Uno Platform?

- Address the "why not X?" question
- Lead with **single codebase** — biggest pain point it solves
- Highlight ecosystem (NuGet, C#, async/await)
- Familiar APIs reduce learning curve
- Community support matters for adoption

## Slide 6: Supported Platforms

- Walk through table left to right
- Mention: **Windows is native (WinUI 3), everything else via Skia**
- Skia ensures consistent rendering across non-Windows platforms
- Web via WebAssembly is significant for reach

## Slide 7: Lead Slide — "Develop Your Way"

- Pause and transition: "Flexibility matters—choose your IDE"
- Energize: "You're not locked in"

## Slide 8: IDE Choices

- Three strong options depending on OS and preference
- Mention: all are first-class citizens in Uno Platform world
- VS is feature-rich, VS Code is lightweight, Rider is cross-platform powerhouse

## Slide 9: Visual Studio

- Speak to designers (XAML Hot Reload, integrated debugging)
- Solution Explorer multi-target awareness saves mental load
- Integrated emulators/simulators reduce friction

## Slide 10: VS Code

- Appeal to Linux/Mac developers and minimalists
- Uno extension + C# Dev Kit = lightweight but capable
- Terminal workflows feel natural here

## Slide 11: JetBrains Rider

- For teams already in Rider ecosystem or using other JetBrains IDEs
- XAML support is increasingly strong
- Refactoring and testing tools are excellent
- True cross-platform IDE

## Slide 12: Lead Slide — "Accelerate Creation"

- Transition: "Starting a project should be fast and simple"
- Introduce the wizard concept

## Slide 13: Uno Platform Template Wizard

- Point to **new.platform.uno**
- Emphasize: **web-based, no install required**
- Generates production-ready structure in seconds
- Takes guessing out of setup

## Slide 14: Template Wizard Walkthrough

- Walk through 6 steps methodically
- Emphasize simplicity: name, platforms, UI framework, preset, customize, download
- Show image (once added) to make it tangible
- Time it: "takes about 30 seconds in real time"

## Slide 15: What You Get

- Solution structure is properly multi-targeted from day one
- Dependency injection and navigation already wired
- No manual boilerplate = faster to features
- Theming ready (Material or Fluent)

## Slide 16: Lead Slide — "Bridge Design & Code"

- Transition: "Designers and developers need to work together smoothly"
- Hook: "Figma to code in real time"

## Slide 17: Figma Integration

- **Uno Figma Plugin** is the bridge
- Emphasize: **no manual translation of designs**
- Both XAML and C# Markup output options
- Design tokens ensure consistency
- Single source of truth mentality

## Slide 18: Design to Code Workflow

- Walk through 5-step workflow
- Emphasis: iterative, not one-time export
- Designer and developer collaboration is central
- Demo later will show this in action

## Slide 19: Lead Slide — "Visualize Your UI"

- Transition: "Designing in code should be interactive, not slow"
- Introduce Hot Design concept

## Slide 20: Hot Design — Uno Platform Studio

- **Live visual editor** — the key phrase
- Highlight: no recompile, real-time feedback
- Works in parallel with Hot Reload for code changes
- Inspect visual tree for debugging

## Slide 21: Hot Design in Action

- Step-by-step walkthrough (debug mode → toolbar → select → edit → save)
- Emphasize: **no context switching between IDE and preview**
- Works on all running targets simultaneously
- Major UX improvement over traditional workflows

## Slide 22: Lead Slide — "Go XAML-Free"

- Transition: "Some developers prefer code to markup"
- Hook: "You can build full UIs without a single XML tag"

## Slide 23: C# Markup

- It's not experimental—it's a first-class option
- Fluent API = natural C# coding experience
- Full IntelliSense beats XAML partial support
- Compile-time safety prevents runtime surprises

## Slide 24: C# Markup Example

- Walk through fluent API structure
- Explain: DataContext binding, nesting, fluent method chaining
- Point out: readable even without XAML knowledge
- Emphasize: this is real code, no reflection magic

## Slide 25: XAML vs. C# Markup

- Comparison table: no "winner," both viable
- Key insight: XAML has designer support (Hot Design), C# has compiler safety
- Both support Hot Reload and Figma export
- Choice is team/project preference

## Slide 26: Lead Slide — "Modernize Legacy Apps"

- Transition: "Don't scrap existing code—extend it"
- Hook: "Your WinUI app can go global"

## Slide 27: WinUI to Uno Migration

- **Virtually zero code changes** — this is the shock value
- Uno implements WinUI APIs on all platforms
- Incremental migration is possible (page by page)
- MVVM architecture carries over cleanly

## Slide 28: Migration Steps

- Four-step process (add targets, resolve APIs, platform-specific code, test, ship)
- Highlight: it's not a risky rewrite
- Platform-specific code (#if directives) is minimal with Uno
- Demo will show this in practice

## Slide 29: Architecture Overview

- Single multi-targeted project simplifies dependency management
- Uno.WinUI = API compatibility layer
- Skia = rendering engine (default for non-Windows)
- Uno.Extensions (MVUX, DI, Navigation, Auth) = productivity boost
- MVUX pattern = modern, immutable, testable

## Slide 30: Lead Slide — "AI-Assisted Development"

- Transition: "Modern development includes AI partners"
- Hook: "We've built MCP servers to make Uno + AI work seamlessly"

## Slide 31: Uno MCP Servers

- **Model Context Protocol** — emerging standard for AI tool integration
- Two servers: Docs (semantic search) + App (inspect running app)
- Plugs into Copilot, Claude, Cursor
- Keeps AI grounded in Uno-specific knowledge

## Slide 32: What You Can Do With It

- Pair programming with AI that understands Uno
- Grounded answers from actual documentation
- Code generation that actually compiles
- Scaffold MVUX models, pages, bindings faster
- Pair with Hot Design/Hot Reload for tight loop

## Slide 33: Demo Time

- Transition to live demo if showing
- Suggest demos to run: Live Wizard, multi-platform run, Hot Design, C# Markup, Figma export
- Keep energy high—demos are the proof

## Slide 34: Resources

- Walk through each link methodically
- Emphasize: **platform.uno is the main hub**
- Docs, Live Wizard, Samples, GitHub all accessible from there
- Discord community is active and welcoming

## Slide 35: Resources (cont.)

- Discord is for real-time questions and community support
- Mention: Uno team is very responsive
- Encourage follow-up and questions
- Thank audience
