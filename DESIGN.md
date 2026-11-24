# DESIGN.md — EduAsset, Wildcat revision

**Status:** approved design revision (owner, 2026-11-24), with the approved unslop craft pass applied
the same day. Supersedes the SRS §3.3.1 maroon/gold branding; functional requirements are unchanged.

## The world

**Wildcat paper & amber.** Warm butter paper, ink typography, burnt-orange brand marks and amber
actions. It comes from the WILCAT Innovation Labs poster and the approved sign-in sample: a light,
editorial, high-contrast system that feels printed rather than “SaaS gradient.” The app screens are
**Operate** surfaces: the brand lives in the shell, type and precise details, while the tables and
forms stay quiet.

The craft pass sharpened that split. Brand surfaces — the wordmark, the sign-in hero and one amber
action or document moment — may be loud. Operational chrome is calm: app headings stop at 600,
labels and metadata at 500, nav groups and eyebrows are sentence case, counts are muted text, and
pills are reserved for real status.

No purple, no gradient text, no glass, no glow, no neobrutalist offset shadows, no stock photos.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--butter` | `#FFF3B0` | sidebar, sign-in left panel, launcher band |
| `--butter-soft` | `#FFF9DD` | table headers, selected rows, hover |
| `--butter-line` | `#E8D98A` | tinted borders on butter surfaces |
| `--amber` | `#F5A623` | primary buttons, active-nav bar, one signature marker |
| `--amber-hover` | `#E8961A` | primary hover |
| `--amber-press` | `#D98A0B` | pressed / outline buttons |
| `--rust` | `#B45309` | wordmark, links, section markers |
| `--rust-deep` | `#8A3E07` | link hover |
| `--ink` | `#171717` | headings, body, icon strokes |
| `--paper` | `#FAF9F6` | app background |
| `--surface` | `#FFFFFF` | cards, forms, dialogs |
| `--muted` | `#5F5F5F` | secondary text |
| `--muted-warm` | `#6B5B3E` | secondary text on butter |
| `--line` | `#E7E2D6` | default hairline |
| `--line-soft` | `#F0ECE3` | table row dividers |
| `--success` | `#2F6B3A` | success text |
| `--success-bg` | `#E8F3EA` | success tint |
| `--warning` | `#92400E` | warning text |
| `--warning-bg` | `#FFF3C4` | warning tint |
| `--danger` | `#B3261E` | danger text and destructive action |
| `--danger-bg` | `#FDECEC` | danger tint |

Semantic green/amber/red stay only for status meaning. Amber is never used for normal body text on
white; it is a surface or a mark. Counts, module codes and filter totals are muted text, not amber
chrome.

## Type

- **Inter** only (SRS). Weights 400/500/600/700/800, assigned by role:
  - **800** — wordmark and the sign-in hero only. The sign-in is the brand poster; app screens are
    the ledger.
  - **700** — monospace asset IDs and rare tag-like data references.
  - **600** — app H1/H2, key figures and primary button labels.
  - **500** — labels, metadata, nav groups, quiet links, tabs and status badges.
  - **400** — body and table text.
- H1: `clamp(26px, 2.4vw, 30px)`, 600, `-0.02em`, `text-wrap: balance`.
- H2 / card title: 15px / 600. Body: 14px / 1.55. Table: 13px. Labels: 12px / 500.
- No uppercase tracked labels. Nav groups, eyebrows, dialog kickers and step labels are sentence
  case. SRS status values keep their uppercase vocabulary inside status badges.
- No decorative kicker above the H1. The breadcrumb carries the module; the H1 carries the page.
- Tabular numerals in tables (`font-variant-numeric: tabular-nums`).
- Paragraph measure ≤ 75ch; table cells never wrap a number away from its unit.

## Shell

- **Top bar**: 72px, `--paper`, 1px `--line` bottom, ink text. Logo lockup, quiet prototype meta
  (11px/500, sentence case, rust dot), alerts, user, sign out. The alert count is a small surface
  counter with rust text, not an amber badge. The logo is cream/white square + black E + amber dots;
  wordmark rust.
- **Sidebar**: 264px, `--butter`. Group labels 11px / 500, sentence case, `--warm-muted`, no
  tracking, using the stage names (Demand, Turnover, Units & assets, Intake; module numbers live in
  `docs/SCREEN-MAP.md`, not the nav). Nav items ink with rust icons. Active: white background, ink
  text, 3px amber leading bar — the signature marker. Counts: quiet 11px tabular `--warm-muted`
  text, not pills. Hover: `--butter-soft`.
- **Content**: `--paper`, max 1200px, 20px section gap, 24–40px page padding.
- **Sign-in**: butter left panel (logo, one accent rule, H1, three facts), warm-white right panel
  (portal cards, inputs, amber sign-in). No decorative illustration.
- **Launcher**: butter band, ink H1, three portal cards, then a two-column index of all screens.
  No numbered steps, no kicker.

## Components

- **Cards**: `--surface`, 1px `--line`, 12px radius, no shadow by default; hover raises 2px with a
  soft shadow only on linked cards. One surface per region: do not nest a bordered table, panel or
  metric card inside another bordered card.
- **Metric strip**: four metrics share one bordered surface, divided by 1px `--line` hairlines.
  Values are ink 600, CTAs rust 500. Use this instead of four identical KPI cards on dashboards.
- **Buttons**: one primary pair.
  - Primary: amber background, ink text, 1px `--amber-press` border, 10px radius, 44px min height.
  - Secondary: white, 1px `--amber-press`, ink text.
  - Quiet: transparent, rust text at 500 weight.
  - Destructive: `--danger` background, white text (semantic exception).
- **Inputs**: white, 1px `--line`, 8px radius, 44px; focus ring ink 3px at 2px offset; placeholder
  `--muted` at 4.5:1.
- **Tables**: the parent card is the frame; header `--butter-soft`, rust 12px/500 labels; 1px
  `--line-soft` rows; row hover `#FFFBEA`; numeric columns right-aligned with tabular numerals.
  A table inside a card gets no second outer border.
- **Tabs**: underline filters, not pill buttons. 44px minimum height; 2px ink indicator on the active
  tab; counts are 11px tabular numerals (rust on active, muted otherwise).
- **Badges**: status only, 999px; success/warning/danger/neutral tints above; 11px/500; text at
  4.5:1. No white on amber. Counts, module codes and filter totals are never badges.
- **Dialogs**: white, 14px radius, soft shadow with offset and blur; overlay `rgba(23,23,23,.45)`.
- **Toasts**: tinted surface + 1px semantic border; close is a drawn SVG X, not a text glyph.

## Motion

Quiet, authored, not scattered: 160ms ease-out; linked cards lift 2px; metrics tint on hover;
dialogs fade/scale in; buttons darken/translate 1px on press; focus ring appears immediately. No
scroll-triggered fades, no parallax, no looping decoration. Reduced motion leaves everything visible.

## Browser surfaces

`::selection` amber/ink; `caret-color` rust; thin warm scrollbars; focus-visible ring on every
control; `text-underline-offset: 3px`; tabular numerals in tables.

## Implementation

The React + Tailwind app implements this system in code:

- **Tokens:** `src/index.css` declares the palette, radii and Inter stack as Tailwind 4 `@theme`
  variables. Use utilities such as `bg-butter`, `text-rust`, `bg-amber`, `rounded-card` and
  `rounded-control`; do not hard-code hex values in screens.
- **Components:** shared primitives live in `src/components/ui/` (`Button`, `Card`, `Badge`,
  `Field`, `Dialog`, `Table`, `Tabs`, `MetricStrip`, `EmptyState`, `PageHeader`). Extend those rather
  than recreating patterns per screen.
- **Shell:** `src/components/layout/` holds the top bar, butter sidebar, nav counts and responsive
  drawer. Active nav is a white surface with an amber inset bar; counts are quiet warm-muted
  numerals. The sign-out control keeps an accessible name when its visible label is hidden at narrow
  widths.
- **Routing:** React Router with `HashRouter`, so static hosting refreshes work without a server
  rewrite. Role guards redirect a signed-in user to their own portal.
- **Reference:** `design/screens/` remains the approved layout and screen-flow record. The React app
  and this document are authoritative for the 24 November craft refinements (type weight, sentence
  case, quiet counts, underline tabs); do not edit the static reference to match.
- **Current port state:** all 17 screens are implemented on `main`, including the full Lab portal,
  Central decisions, ledger/audit tools, repair/BER, verified replacement and intake. See
  `docs/HANDOFF.md` for verification and the remaining backend/API work.

## Accessibility

- All text ≥ 4.5:1; large text ≥ 3:1. Amber surfaces use ink text; never white on amber.
- 44px targets for controls, nav, tabs, chips, breadcrumbs.
- Icon-only controls keep an accessible name at every breakpoint; sign-out is labelled even when its
  text is hidden.
- Visible labels on inputs; one H1 per page; logical heading order.
- Status is never conveyed by colour alone: the badge text names the state.
- The SRS’s 44px and AA rules still hold; the palette change does not relax them.

## What not to do

- Do not reintroduce maroon `#7B1113`, gold `#F2B705`, `#5A0F14`, or the old circle-E colours.
- Do not add a kicker/eyebrow above headings, numbered section labels, gradient text, glass, or
  emoji icons.
- Do not turn counts, module codes, filters or nav groups into pills. Pills are for status only.
- Do not use uppercase tracked labels outside SRS status badges.
- Do not exceed 600 on app headings or key figures; 700/800 belong to the wordmark, the sign-in hero
  and monospace asset IDs.
- Do not use amber count badges or decorative amber dots; amber is a surface, a primary action, or
  the single active-nav marker.
- Do not make every section a card; tables and rows are the content. Do not frame a table inside a
  bordered card inside another bordered card.
- Do not fill the app with decorative photography or marketing sections.
- Do not change copy, data, state logic, routes or SRS behaviour in this pass.
