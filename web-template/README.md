# Base Theme Template

A small, framework-free stylesheet you can drop into any website. It gives you a
light/dark design system (backgrounds, text, palette) plus a curated set of base
elements and components — buttons, forms, cards, badges, alerts, tables, modal.

Derived from the ctrlTAB theme, generalised for reuse.

## Use it

```html
<link rel="stylesheet" href="theme.css">
```

Write plain, semantic HTML — headings, paragraphs, links, `<button>`, `<input>`,
tables, etc. are styled out of the box. Reach for the helper classes
(`.btn-primary`, `.card`, `.badge`, `.alert`, `.modal`, `.container`, `.grid`…)
when you want more. Open `index.html` to see everything live and as copy-paste
reference.

## Light & dark

- **Default:** follows the operating system via `prefers-color-scheme`.
- **Force a mode** by setting an attribute on `<html>`:

  ```html
  <html data-theme="light">  <!-- always light -->
  <html data-theme="dark">   <!-- always dark  -->
  <html>                     <!-- follow the OS -->
  ```

To remember the user's choice and avoid a flash on load, set the attribute from
`localStorage` before the stylesheet renders (see the inline script at the top of
`index.html`).

## Re-skinning

Everything visual is a CSS custom property in the token block at the top of
`theme.css`:

- **Colors / backgrounds / text** — `--color-*`
- **Type** — `--font-*`, `--text-*` (scale), `--weight-*`, `--leading-*`
- **Spacing** — `--space-*` · **Radii** — `--radius-*` · **Shadows** — `--shadow-*`
- **Motion** — `--transition-*`

Change a value once and it propagates everywhere. The brand accent
(`--color-accent`) is the single most useful override per project.

> **Dark tokens live in two blocks** in `theme.css` (a `prefers-color-scheme`
> media query and a `[data-theme="dark"]` rule). They hold identical values and
> must be edited together. The same goes for the `<select>` dropdown arrow — its
> color is baked into an SVG data-URI (a `var()` can't be used there), so a dark
> copy sits alongside those blocks.

## Handy classes

- **Buttons:** `.btn-primary` · `.btn-secondary` · `.btn-ghost` · `.btn-danger` · sizes `.btn-sm` / `.btn-lg` · `.btn-block` · `.btn-icon`
- **Forms:** `.field` wrapper, `.field-hint`, `.check` (checkbox/radio + label row), and an opt-in error state via `aria-invalid="true"` or a `.field.error` wrapper (pair with `.field-hint.error`)
- **Surfaces:** `.card` (+`.card-hover`), `.badge[-accent|-success|-danger|-warning|-secondary]`, `.alert[-accent|-success|-danger|-warning]`, `.modal` (`.open` to show; body scrolls when tall)
- **Navigation & overlays:** `.tabs` + `.tab` / `.tab-panel`; `[data-tooltip="…"]` on any element (hover + keyboard focus); `.dropdown` + `.dropdown-menu` / `.dropdown-item` (`.danger`) / `.dropdown-divider` (toggle `.open` on `.dropdown`)
- **Layout:** `.container` · `.row` · `.grid` · `.stack` · utilities `.text-muted` / `.text-accent` / `.text-center` / `.surface` / `.visually-hidden`

Tooltips are CSS-only. **Tabs and the dropdown get their behavior from
`components.js`** — drop it in once:

```html
<script src="components.js"></script>
```

It progressively enhances every `.tabs` and `.dropdown` on the page with the
full WAI-ARIA roles/state and keyboard navigation (you only write the markup —
see `index.html`). It self-initializes on load; after injecting markup
dynamically, call `ThemeComponents.init(rootElement)` again.

**Keyboard**

| Where | Keys |
|-------|------|
| Tabs | `←` / `→` (or `↑` / `↓`) move and activate · `Home` / `End` first/last |
| Dropdown button | `Enter` / `Space` / `↓` open (focus first item) · `↑` open (focus last) |
| Dropdown menu | `↑` / `↓` move · `Home` / `End` first/last · `Esc` close (focus returns to button) · `Tab` close |

Required markup hooks: tabs use `.tab` with `data-tab="<panel-id>"` and a matching
`.tab-panel` (mark the initial one `class="tab active"`); the dropdown uses a
`[data-dropdown-toggle]` trigger beside a `.dropdown-menu` of `.dropdown-item`s.

## ctrlTAB compatibility

The token block ends with aliases so stylesheets written for **ctrlTAB** run on
this template unchanged: `--spacing-xs … --spacing-2xl` map onto `--space-*`, and
`--glow-*` are defined as `none` (they only do anything in ctrlTAB's cyberpunk /
batman themes, which this light/dark template omits). Prefer `--space-*` in new
code; the `--spacing-*` names are there purely for drop-in reuse.

## Files

| File | What |
|------|------|
| `theme.css`     | The template — tokens, base styles, components |
| `components.js` | ARIA + keyboard behavior for `.tabs` and `.dropdown` |
| `index.html`    | Live showcase + theme toggle |
| `README.md`     | This file |
