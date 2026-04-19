# Session Card — Figma Spec

Reverse-engineered from `SessionsPage.xaml`, `ColorPaletteOverride.xaml`, and `TrackToBrushConverter.cs`.  
Use this to build the **Session Card** component in Figma, then show the Uno Figma plugin exporting it to XAML during the demo.

---

## 1. Color Tokens

Define these as Figma **local variables** (Color type) so the plugin maps them cleanly.

| Token name            | Dark value  | Light value | Notes                                |
|-----------------------|-------------|-------------|--------------------------------------|
| `background/app`      | `#0A0A0A`   | `#FCFCFC`   | Page/canvas background               |
| `surface/card`        | `#181818`   | `#FFFFFF`   | Card fill                            |
| `surface/sidebar`     | `#181818`   | `#FFFFFF`   | Sidebar panel fill                   |
| `border/card`         | `#2A2A2A`   | `#E6E8EC`   | Card 1px border                      |
| `border/sidebar`      | `#2A2A2A`   | `#C6C7CB`   | Sidebar right-edge border            |
| `text/primary`        | `#F5F5F5`   | `#1F1F1F`   | Session title                        |
| `text/secondary`      | `#E6E8EC`   | `#454649`   | Subtitle, meta labels (70% opacity)  |
| `text/on-track-badge` | `#0A0A0A`   | `#0A0A0A`   | Text on coloured track pill          |
| `accent/lime`         | `#C9F04C`   | `#8CA835`   | Primary brand accent (DWX lime)      |
| `accent/olive`        | `#8CA835`   | `#8CA835`   | Secondary accent                     |

### Track pill colors (same in light & dark)

| Track           | Fill hex  |
|-----------------|-----------|
| Cross-Platform  | `#C9F04C` |
| Windows         | `#3B82F6` |
| Architecture    | `#A855F7` |
| Design          | `#EC4899` |
| AI              | `#F59E0B` |
| _(fallback)_    | `#7C7C7C` |

---

## 2. Typography Tokens

Define as Figma **text styles**. Font family: **Inter** (closest web-safe match to the app's default Uno/Skia sans-serif; swap to Roboto or system-ui if preferred).

| Style name           | Size | Weight    | Where used                          |
|----------------------|------|-----------|-------------------------------------|
| `title/page`         | 32   | SemiBold  | "Sessions" page heading             |
| `subtitle/page`      | 14   | Regular   | "Browse the full DWX 2026 program"  |
| `label/track`        | 11   | SemiBold  | Track pill text                     |
| `label/day`          | 12   | Regular   | Day label next to pill              |
| `title/card`         | 18   | SemiBold  | Session title in card               |
| `body/card`          | 13   | Regular   | Session summary (max 2 lines)       |
| `meta/card`          | 12   | Regular   | Time / Room / Speaker meta row      |
| `icon/favorite`      | 20   | Regular   | ☆ / ★ emoji star button             |

---

## 3. Component: Session Card

### Frame

| Property      | Value                         |
|---------------|-------------------------------|
| Width         | Fill (stretch to column width)|
| Min-width     | 320                           |
| Background    | `surface/card` → `#181818`   |
| Border        | 1px `border/card` → `#2A2A2A`|
| Corner radius | 12                            |
| Padding       | 20 top/bottom · 16 left/right |
| Layout        | Auto Layout, Horizontal       |

### 3.1 Track stripe

| Property      | Value                                       |
|---------------|---------------------------------------------|
| Width         | 4                                           |
| Height        | Fill (stretch to card height)               |
| Corner radius | 2 (all corners)                             |
| Fill          | Track color (e.g. `#C9F04C` for Cross-Platform) |
| Margin right  | 16                                          |
| Margin top    | 2                                           |
| Margin bottom | 2                                           |

### 3.2 Content column (Auto Layout, Vertical, fills remaining width)

**Gap between rows:** 6

#### Row A — Track pill + Day label

Auto Layout, Horizontal, gap 8, align center.

**Track pill:**

| Property      | Value                              |
|---------------|------------------------------------|
| Fill          | Track color                        |
| Corner radius | 10 (full pill)                     |
| Padding       | 10 horizontal · 2 vertical         |
| Text          | Track name (style: `label/track`)  |
| Text color    | `text/on-track-badge` → `#0A0A0A` |

**Day label:**

| Property      | Value                              |
|---------------|------------------------------------|
| Text          | e.g. "Tue, 1 Jul"                  |
| Style         | `label/day`                        |
| Color         | `text/secondary` @ **60% opacity** |

#### Row B — Session title

| Property       | Value                         |
|----------------|-------------------------------|
| Text           | Full session title             |
| Style          | `title/card` (18, SemiBold)   |
| Color          | `text/primary` → `#F5F5F5`   |
| Text wrapping  | Wrap                           |

#### Row C — Session summary

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Text           | Summary / abstract (max 2 lines, ellipsis) |
| Style          | `body/card` (13, Regular)                  |
| Color          | `text/secondary` @ **75% opacity**         |
| Text wrapping  | Wrap                                       |
| Max lines      | 2 (use Figma "line clamp" plugin or note)  |

#### Row D — Meta row (Time · Room · Speaker)

Auto Layout, Horizontal, gap 16. Margin top: 4.

Each meta item is a single text element with an emoji prefix:

| Property    | Value                                   |
|-------------|-----------------------------------------|
| Style       | `meta/card` (12, Regular)               |
| Color       | `text/secondary` @ **70% opacity**      |
| Content     | `🕒 14:00 – 15:00` / `📍 mozart1` / `👤 Alvin Ashcraft` |

### 3.3 Favorite button (top-right)

| Property          | Value                                       |
|-------------------|---------------------------------------------|
| Size              | 36 × 36 (tap target; matches 8px padding)   |
| Background        | Transparent                                 |
| Border            | None                                        |
| Vertical align    | Top                                         |
| Horizontal align  | Trailing / Right                            |
| Content           | ☆ (unfavorited) or ★ (favorited)           |
| Font size         | 20                                          |
| Margin            | 8 left (from content column), -4 top, -8 trailing |

Create two **component variants**: `Favorite=Off` (☆) and `Favorite=On` (★).

---

## 4. Full card anatomy (ASCII reference)

```
┌──────────────────────────────────────────────────────────────┐  ← CornerRadius 12, Border #2A2A2A
│  ┃  ╔══════════════════════════════════════════════╗  [☆]    │
│  ┃  ║ [Cross-Platform pill]  Tue, 1 Jul            ║         │
│  ┃  ╠══════════════════════════════════════════════╣         │
│  ┃  ║ Build Beautiful Cross-Platform Apps…         ║         │
│  ┃  ╠══════════════════════════════════════════════╣         │
│  ┃  ║ Learn how Uno Platform lets you build…       ║         │
│  ┃  ╠══════════════════════════════════════════════╣         │
│  ┃  ║ 🕒 14:00–15:00   📍 mozart1   👤 Alvin A.   ║         │
│  ┃  ╚══════════════════════════════════════════════╝         │
└──────────────────────────────────────────────────────────────┘
 ↑ 4px stripe, CornerRadius 2, color = track color
```

---

## 5. Page chrome (for demo context frame)

If you want to show the full page in the Figma file for the demo slide:

| Element           | Value                                           |
|-------------------|-------------------------------------------------|
| Canvas / page bg  | `#0A0A0A`                                       |
| Page padding      | 24 all sides                                    |
| Page title        | "Sessions" — 32, SemiBold, `#E6E8EC`           |
| Page subtitle     | "Browse the full DWX 2026 program" — 14, Reg, `#E6E8EC` @ 70% |
| Sidebar width     | 240, bg `#181818`, right border 1px `#2A2A2A`   |
| Sidebar logo      | "**DWX**" 28 Bold `#C9F04C` + "Companion" 16 Reg `#E6E8EC` |
| Nav items         | Sessions / Speakers / My Agenda / Settings — 16 Reg `#E6E8EC`, Padding 16×12, no border |
| Card gap          | 12 (vertical spacing between cards in the list)  |

---

## 6. Variants to create in Figma

Create a **Component Set** with these variants:

| Variant            | Track          | Favorite | Notes                                |
|--------------------|----------------|----------|--------------------------------------|
| Default            | Cross-Platform | Off      | The "hero" variant for the demo      |
| Windows track      | Windows        | Off      | Shows blue stripe                    |
| Architecture track | Architecture   | Off      | Purple stripe                        |
| Favorited          | Cross-Platform | On       | ★ filled — same dimensions           |

---

## 7. Step-by-step: building the component in Figma

### Phase A — Project setup

1. Create a new Figma file. Name it **DWX Companion — Session Card**.
2. **Add color variables:** open the Variables panel (right-click canvas → _Edit Variables_), create a collection named `DWX Brand`, and add every row from Section 1 as a Color variable with separate Dark and Light modes.
3. **Add text styles:** open the Styles panel (four-dot icon in the toolbar), click **+** next to Text, and add each row from Section 2. Set font family to **Inter**; if Inter isn't available, use **Roboto** as a substitute.
4. Set the canvas background to `background/app` Dark (`#0A0A0A`) so the dark card is visible while you build.

---

### Phase B — Track stripe sub-component

5. Press **F** (Frame tool), draw a frame **4 × 80** (width × height — the height is a placeholder; you'll set it to Fill later).
6. Name it `_TrackStripe`.
7. Set fill to `#C9F04C` (Cross-Platform track color).
8. Set Corner Radius to **2** (all corners).
9. Right-click → **Create Component** (⌥⌘K / Ctrl+Alt+K). This becomes the reusable stripe.

---

### Phase C — Track pill sub-component

10. Press **T** (Text tool), type "Cross-Platform". Assign text style `label/track` (11, SemiBold). Set color to `text/on-track-badge` (`#0A0A0A`).
11. Select the text layer. Press **⌥⌘G** (Ctrl+Alt+G) to wrap in a frame. Name it `_TrackPill`.
12. In the frame: set fill to `#C9F04C`, Corner Radius to **10**, Padding to **10** left/right and **2** top/bottom.
13. Switch layout to **Horizontal Auto Layout** (Shift+A) so the frame hugs the text.
14. Right-click → **Create Component**.

---

### Phase D — Favorite button sub-component

15. Press **T**, type `☆`. Assign font size **20**. Color `text/secondary` (`#E6E8EC`).
16. Wrap in a frame (⌥⌘G). Name it `_FavoriteButton`. Set size to **36 × 36**, fill transparent.
17. Center the star glyph inside (Align center + middle).
18. Right-click → **Create Component**.
19. **Duplicate** this component (⌘D). In the duplicate, change the text to `★`. Rename it `_FavoriteButton/On`.
20. Select both; right-click → **Combine as variants**. You now have a component set with `State=Off` and `State=On`.

---

### Phase E — Session card frame

21. Press **F**, draw a frame roughly **600 × 160**. Name it `SessionCard`.
22. Switch to **Horizontal Auto Layout** (Shift+A).
23. Set Padding: **16** top, **16** bottom, **20** left, **20** right.
24. Set fill to `surface/card` variable Dark (`#181818`).
25. Add a border: Stroke → color `border/card` Dark (`#2A2A2A`), weight **1**, Inside.
26. Set Corner Radius to **12**.
27. Set horizontal resizing to **Fill** (so cards stretch to their container).

---

### Phase F — Add the track stripe

28. From the Assets panel, drag an instance of `_TrackStripe` into the card frame (leftmost position).
29. In the instance, set **width to 4** and **height to Fill container**.
30. Set right margin to **16**, top/bottom margins to **2**.
31. _(You will swap the fill color per variant in Phase I.)_

---

### Phase G — Build the content column

32. Inside the card frame (after the stripe), add a new **Frame**. Name it `ContentColumn`.
33. Switch to **Vertical Auto Layout**. Set gap to **6**. Set horizontal resizing to **Fill**.

**Row A — Pill + Day:**
34. Inside `ContentColumn`, add a new frame. Name it `RowA`. Switch to **Horizontal Auto Layout**, gap **8**, align **Center**.
35. Drag an instance of `_TrackPill` into `RowA`.
36. Press **T**, type "Tue, 1 Jul". Style: `label/day` (12, Regular). Color: `text/secondary` @ **60% opacity**. Align center vertically.

**Row B — Title:**
37. Press **T**, type the full session title (e.g. "Build Beautiful Cross-Platform Apps with Uno Platform"). Style: `title/card` (18, SemiBold). Color: `text/primary` (`#F5F5F5`). Set to **Fill** width, wrapping on.

**Row C — Summary:**
38. Press **T**, type a two-line summary. Style: `body/card` (13, Regular). Color: `text/secondary` (`#E6E8EC`) @ **75% opacity**. Fill width, wrapping on. Add a design annotation note: "Max 2 lines, ellipsis in code."

**Row D — Meta row:**
39. Add a frame. Name it `RowD`. Horizontal Auto Layout, gap **16**. Top margin **4**.
40. Add three **T** text layers:
    - `🕒 14:00 – 15:00`
    - `📍 mozart1`
    - `👤 Alvin Ashcraft`
41. All three: style `meta/card` (12, Regular), color `text/secondary` @ **70% opacity**.

---

### Phase H — Add the favorite button

42. From Assets, drag an instance of `_FavoriteButton` (State=Off) into the card frame — place it **after** `ContentColumn` in the layer order.
43. Set **vertical alignment to Top**, **horizontal alignment to Trailing**.
44. Set margins: left **8**, top **-4**, right **-8**.

---

### Phase I — Convert to component & add variants

45. Select the entire `SessionCard` frame. Right-click → **Create Component** (⌥⌘K).
46. In the Component panel, click **Add variant** (the **+** at the bottom). Figma creates a `SessionCard` Component Set.
47. **Variant 1 (default):** rename property to `Track=Cross-Platform, Favorite=Off`. Stripe fill `#C9F04C`, pill fill `#C9F04C`.
48. **Variant 2:** duplicate Variant 1. Set `Track=Windows`. Change stripe fill and pill fill to `#3B82F6`. Update pill text to "Windows". Update day label and meta to match.
49. **Variant 3:** duplicate. Set `Track=Architecture`. Stripe/pill fill `#A855F7`, text "Architecture".
50. **Variant 4:** duplicate Variant 1. Set `Favorite=On`. Swap the `_FavoriteButton` instance to `State=On` (★).

---

### Phase J — Page chrome frame (optional, for slides)

51. Press **F**, draw a large frame (e.g. **1440 × 900**). Name it `SessionsPage`.
52. Set fill to `background/app` Dark (`#0A0A0A`).
53. Add a **240-wide** left panel frame: fill `#181818`, right border stroke `#2A2A2A` 1px.
54. In the sidebar, add the "**DWX**" (28, Bold, `#C9F04C`) + "Companion" (16, Regular, `#E6E8EC`) logo row with gap **8**, margin **20** left, **24** top.
55. Add nav buttons: Sessions / Speakers / My Agenda / Settings — each 16px Regular `#E6E8EC`, full-width, padding 16×12.
56. In the main content area, add a `StackPanel`-style group: "Sessions" title (32 SemiBold `#E6E8EC`) + subtitle (14 Regular `#E6E8EC` 70%), then stack **3–4 instances** of the `SessionCard` component with **12px vertical gap** between them.

---

## 8. Demo talking points (for the "Bridge Design & Code" slide)

1. Open the **Session Card** component in Figma.
2. Select the frame → run the **Uno Platform Figma Plugin** → choose **Export to XAML**.
3. Show the generated `Border + Grid` structure — it matches `SessionsPage.xaml` line-for-line.
4. Point out the color token names in the exported XAML (`StaticResource SurfaceCardBrush`, etc.) — the plugin maps Figma variables to Uno theme resources.
5. Cut to the running app. Same card, same colors, same spacing. "This is where we started."

---

## 8. Notes for the Uno Figma Plugin

- Map Figma color variables to `ColorPaletteOverride.xaml` tokens so the exported brushes match.
- The **track stripe** is a `Rectangle` with `RadiusX/Y="2"` — the plugin should export it as-is; verify the corner radius roundtrip.
- The **track pill** `CornerRadius="10"` on an 11px-font element reads as fully rounded; in Figma set it to `999` for the same visual effect.
- The favorite button uses an emoji `TextBlock`, not an icon font — the plugin may export it as a `TextBlock.Text`. That's fine for demo purposes.
- Summary text max-2-lines behaviour (`TextTrimming="CharacterEllipsis"`) has no direct Figma equivalent — add a note annotation in the Figma frame.
