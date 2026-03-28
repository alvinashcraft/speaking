---
name: marp
description: 'Create and edit slideshows with Marp, the Markdown-based presentation tool. Use when asked to "create a slideshow", "make a presentation", "build a slide deck", "edit slides", "add a slide", "marp presentation", "markdown slides", or when working with .md files that have marp: true in front matter. Supports themes, directives, image syntax, math typesetting, pagination, and export to HTML/PDF/PPTX.'
---

# Marp Slideshow Skill

Create and edit presentation slide decks using Marp (Markdown Presentation Ecosystem). Marp converts Markdown files into HTML, PDF, and PPTX presentations.

## When to Use This Skill

- User asks to create a slideshow, presentation, or slide deck
- User wants to edit, add, or modify slides in a Marp file
- User is working with a `.md` file containing `marp: true` in front matter
- User asks about Marp syntax, directives, themes, or image handling
- User wants to export a presentation to PDF, PPTX, or HTML

## Basic Slide Structure

Every Marp file must have `marp: true` in the YAML front matter. Slides are separated by horizontal rulers (`---`).

```markdown
---
marp: true
---

# Slide 1

Hello, world!

---

# Slide 2

Marp splits slides by horizontal ruler.
```

- Marp uses [CommonMark](https://commonmark.org/) Markdown syntax
- Line breaks in a paragraph convert to `<br />` automatically
- The `<style>` tag is allowed for tweaking theme CSS
- Most other HTML tags are disabled by default for security

Alternative rulers `___`, `***`, or `- - -` also work as slide separators.

## Directives

Directives control theme, pagination, headers, footers, and slide styling. Define them in YAML front matter or HTML comments.

### Front Matter (Global)

```markdown
---
marp: true
theme: default
paginate: true
header: 'My Presentation'
footer: '© 2026'
---
```

### HTML Comment (Anywhere)

```markdown
<!--
theme: default
paginate: true
-->
```

### Global Directives

Settings that apply to the entire slide deck.

| Directive | Description |
|---|---|
| `theme` | Set theme name (`default`, `gale`, `uncover`) |
| `style` | Specify CSS for tweaking theme |
| `headingDivider` | Auto-split slides at heading level (1-6 or array) |
| `size` | Slide size preset (`16:9`, `4:3`) |
| `math` | Math library: `mathjax` (default) or `katex` |
| `title` | Slide deck title |
| `author` | Slide deck author |
| `description` | Slide deck description |
| `keywords` | Comma-separated keywords |
| `url` | Canonical URL (HTML export) |
| `image` | Open Graph image URL (HTML export) |
| `marp` | Enable Marp in VS Code (`true`/`false`) |

### Local Directives

Settings that apply to the current slide and subsequent slides (inherited).

| Directive | Description |
|---|---|
| `paginate` | Show page number: `true`, `false`, `hold`, `skip` |
| `header` | Slide header content |
| `footer` | Slide footer content |
| `class` | HTML class for the slide `<section>` element |
| `backgroundColor` | Slide background color |
| `backgroundImage` | Slide background image |
| `backgroundPosition` | Background position (default: `center`) |
| `backgroundRepeat` | Background repeat (default: `no-repeat`) |
| `backgroundSize` | Background size (default: `cover`) |
| `color` | Text color |

### Directive Inheritance

Local directives inherit to subsequent slides until overridden:

```markdown
<!-- backgroundColor: lightblue -->

# Page 1 — light blue background

---

# Page 2 — also light blue (inherited)

---

<!-- backgroundColor: white -->

# Page 3 — white background
```

### Scoped Directives (Single Slide Only)

Prefix with `_` to apply only to the current slide, without inheriting:

```markdown
<!-- _backgroundColor: lightblue -->

# This slide only has a light blue background

---

# This slide is back to the default
```

## Built-in Themes

Marp ships with three built-in themes: `default`, `gale`, and `uncover`.

```markdown
---
marp: true
theme: uncover
---
```

### Tweaking Theme with CSS

Use the `style` global directive or a `<style>` tag to override theme styles. Use `<style scoped>` to apply CSS to only the current slide.

```markdown
---
marp: true
theme: default
style: |
  section { background-color: #fefefe; }
  h1 { color: #333; }
---
```

```markdown
<style scoped>
section {
  background: linear-gradient(to bottom, #67b8e3, #0288d1);
  color: white;
}
</style>
```

### Class-Based Styling

Use the `class` directive to apply theme-specific layouts:

```markdown
<!-- _class: lead -->

# Centered Lead Slide
```

## Image Syntax

Marp extends Markdown image syntax with keywords in the alt text.

### Resizing

```markdown
![width:200px](image.jpg)
![height:30cm](image.jpg)
![w:300 h:200](image.jpg)
```

### Image Filters

Apply CSS filters via alt text keywords:

| Filter | Example |
|---|---|
| `blur` | `![blur:10px](image.jpg)` |
| `brightness` | `![brightness:1.5](image.jpg)` |
| `contrast` | `![contrast:200%](image.jpg)` |
| `drop-shadow` | `![drop-shadow:0,5px,10px,rgba(0,0,0,.4)](image.jpg)` |
| `grayscale` | `![grayscale:1](image.jpg)` |
| `hue-rotate` | `![hue-rotate:180deg](image.jpg)` |
| `invert` | `![invert:100%](image.jpg)` |
| `opacity` | `![opacity:.5](image.jpg)` |
| `saturate` | `![saturate:2.0](image.jpg)` |
| `sepia` | `![sepia:1.0](image.jpg)` |

Combine multiple filters: `![brightness:.8 sepia:50%](image.jpg)`

### Background Images

Add `bg` to the alt text to use an image as a slide background:

```markdown
![bg](https://example.com/background.jpg)
```

#### Background Size

| Keyword | Effect |
|---|---|
| `cover` | Scale to fill slide (default) |
| `contain` | Scale to fit slide |
| `fit` | Alias for contain |
| `auto` | Original size |
| `x%` | Scale by percentage, e.g. `150%` |

```markdown
![bg contain](image.jpg)
![bg 80%](image.jpg)
```

#### Multiple Backgrounds

Multiple `bg` images arrange horizontally by default:

```markdown
![bg](image1.jpg)
![bg](image2.jpg)
![bg](image3.jpg)
```

Use `vertical` for vertical arrangement:

```markdown
![bg vertical](image1.jpg)
![bg](image2.jpg)
```

#### Split Backgrounds

Use `left` or `right` to create a split layout (image on one side, content on the other):

```markdown
![bg left](image.jpg)

# Content on the right side
```

Specify split size with a percentage:

```markdown
![bg left:33%](image.jpg)

# Content takes up 67% of the slide
```

## Fitting Header

Use `<!-- fit -->` inside a heading to auto-scale text to fit one line:

```markdown
# <!-- fit --> This Long Title Will Shrink to Fit
```

Combine with `headingDivider` for Takahashi-style one-word-per-slide decks:

```markdown
---
marp: true
theme: uncover
headingDivider: 1
---

# <!-- fit --> Takahashi-style presentation

# <!-- fit --> One idea per slide
```

## Fragmented Lists

Fragmented lists appear incrementally in HTML export only (not PDF/PPTX).

Use `*` instead of `-` for bullet lists:

```markdown
* Item appears first
* Then this item
* Then this one
```

Use `)` instead of `.` for ordered lists:

```markdown
1) First
2) Second
3) Third
```

## Heading Divider

Automatically split slides at headings of a specified level using the `headingDivider` directive:

```markdown
---
marp: true
headingDivider: 2
---

# Main Title

Introduction text

## Topic A

Content for topic A

## Topic B

Content for topic B
```

`headingDivider: 2` splits at heading levels 1 and 2. Use an array for specific levels only: `headingDivider: [1, 3]`.

## Math Typesetting

Marp supports math rendering with MathJax (default) or KaTeX.

### Inline Math

```markdown
Euler's identity: $e^{i\pi} + 1 = 0$
```

### Math Block

```markdown
$$
f(x) = \int_{-\infty}^\infty \hat{f}(\xi)\,e^{2\pi i \xi x}\,d\xi
$$
```

### Choosing a Library

Set `math: mathjax` (default) or `math: katex` in front matter.

## Pagination

Enable page numbers with the `paginate` directive:

```markdown
---
marp: true
paginate: true
---
```

### Pagination Options

| Value | Page Number Visible | Counter Increments |
|---|---|---|
| `true` | Yes | Yes |
| `false` | No | Yes |
| `hold` | Yes | No |
| `skip` | No | No |

### Skip Pagination on Title Slide

Use `_paginate: false` on the title slide to hide its page number, or move `paginate: true` to the second slide:

```markdown
---
marp: true
paginate: true
_paginate: false
---

# Title Slide (no page number)

---

## Slide 2 (page number starts here)
```

## Header and Footer

Set `header` and `footer` directives in front matter or HTML comments. They support inline Markdown (bold, italic, images). Wrap values in quotes for valid YAML.

```markdown
---
marp: true
header: '**My Presentation**'
footer: '_© 2026 Author Name_'
---
```

Reset by setting to empty string: `header: ''`

## Presenter Notes

Add presenter notes as HTML comments (after any directives):

```markdown
# My Slide

Content here

<!-- This is a presenter note visible in presenter view -->
```

## Exporting

**VS Code**: Install [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode), then use `Marp: Export Slide Deck` from the command palette. Supports HTML, PDF, PPTX, PNG, JPEG.

**Marp CLI**:

```bash
brew install marp-cli                  # macOS install
marp slides.md                         # Export to HTML
marp slides.md -o slides.pdf           # Export to PDF
marp slides.md -o slides.pptx          # Export to PPTX
marp slides.md --images png            # Export slides as PNG images
marp slides.md --preview               # Live preview server
```

## Complete Example

```markdown
---
marp: true
theme: default
paginate: true
_paginate: false
title: My Presentation
author: Author Name
---

# My Presentation

### Author Name — July 1, 2026

---

<!-- header: '**My Presentation**' -->
<!-- footer: '_Author Name_' -->

## Agenda

- Introduction
- Key Concepts
- Demo

---

## Key Concepts

- Marp converts **Markdown** to slides
- Supports themes, directives, and image syntax
- Export to HTML, PDF, or PPTX

---

![bg right:40%](https://picsum.photos/720?image=29)

## Split Layout

Content on the left, image on the right.

---

## Math

Euler's identity: $e^{i\pi} + 1 = 0$

---

<!-- _backgroundColor: #1a1a2e -->
<!-- _color: #eee -->

## <!-- fit --> Thank You!
```

## Best Practices

- **Always include `marp: true`** in front matter so Marp tools recognize the file
- **Use `---` consistently** to separate slides; keep an empty line before and after the ruler
- **Set the `theme` directive** at the top of the deck for consistent styling
- **Use scoped directives (`_` prefix)** for one-off slide styling instead of changing and reverting values
- **Keep slides focused** — one idea per slide, minimal text
- **Use `<!-- fit -->` headers** for impact slides with short phrases
- **Test exports** in your target format (PDF, PPTX) since some features like fragmented lists only work in HTML
- **Declare `math` directive** explicitly (`mathjax` or `katex`) for consistent rendering
- **Use `<style scoped>`** for per-slide CSS instead of global style overrides
- **Quote directive values** containing YAML special characters (colons, brackets) in single quotes

## References

- Marp Official Site: <https://marp.app/>
- Marp GitHub: <https://github.com/marp-team/marp>
- Marpit Framework (directives, image syntax): <https://marpit.marp.app/>
- Marp CLI: <https://github.com/marp-team/marp-cli>
- Marp for VS Code: <https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode>
- Marp Core: <https://github.com/marp-team/marp-core>