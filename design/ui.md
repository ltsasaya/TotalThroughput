# App-Wide Visual System

This guide is the source of truth for Total Throughput's app-wide visual
direction. It covers color, typography, spacing, component treatment, and visual
composition. It does not change Phase 2 gameplay, dispatch rules, metrics, or
simulation behavior.

## Product Feel

Total Throughput should feel like a compact systems lab, not a marketing page or
generic SaaS dashboard.

- Use the concrete story: client request -> RPC queue -> worker service ->
  response.
- Favor operational hierarchy over decorative polish.
- Make the active work area obvious before secondary explanation.
- Use concise labels and measured numbers; avoid broad promotional copy.
- Keep visual density high enough for repeated play, but leave enough spacing
  that queue and metric states can be scanned.

## Semi-Retro Monochrome Revamp

BOSS approved a complete UI revamp using the attached sample UI as the visual
reference. The active implementation sequence starts with only the start screen
until the monochrome direction is tuned through screenshot feedback.

- Use a white/off-white first viewport with black foreground elements.
- Favor strong rectangular borders, minimal radius, and monospace-forward type.
- Use a subtle horizontal scanline texture and sparse node/link background
  motif on the start screen.
- Keep `Play` as the primary action and `Join Class` as the secondary visual
  action.
- Keep `Join Class`, `For Instructors`, and `Sign in` visible but
  nonfunctional until BOSS promotes real account or class behavior.
- Do not add fonts, image assets, icon libraries, animation packages, component
  kits, hosted services, or paid visual tooling for this revamp.
- Later gameplay and results screens remain under the existing visual system
  until BOSS approves each next slice.

## Stack And Cost Rule

The visual system uses only existing stack pieces: React, Tailwind CSS, and
plain CSS tokens in `src/index.css`.

- Do not add icon libraries, animation packages, component kits, hosted assets,
  fonts, or paid visual services without explicit BOSS approval.
- If a new visual dependency is proposed, record setup, cost, maintenance, local
  development impact, and rejected no-cost alternatives in `TODOS.md` or the
  relevant plan.
- Prefer CSS variables, local primitives, and existing components before adding
  stack surface.

## Color Rules

The app uses a warm charcoal operational palette with semantic accents.

| Role | Token | Use |
| --- | --- | --- |
| App background | `--tt-bg` | Full app shell and dark empty space |
| Band background | `--tt-bg-band` | Alternating educational sections |
| Surface | `--tt-surface` | Primary panels and modals |
| Raised surface | `--tt-surface-raised` | Active rows, nested controls, progress tracks |
| Muted surface | `--tt-surface-muted` | Disabled controls and low-priority blocks |
| Border | `--tt-border` | Default panel, row, and divider lines |
| Strong border | `--tt-border-strong` | Active/focused emphasis |
| Text | `--tt-text` | Main labels, values, and active copy |
| Muted text | `--tt-text-muted` | Body copy and secondary values |
| Subtle text | `--tt-text-subtle` | Labels, captions, and empty states |
| Accent | `--tt-accent` | Primary actions, current progress, service work |
| Info | `--tt-info` | Reference formulas and system notes |
| Success | `--tt-success` | Correct typed characters and healthy/pass states |
| Warning | `--tt-warning` | Waiting, high load, retry-needed states |
| Danger | `--tt-danger` | Errors, drops, failed states |

Do not introduce decorative gradients, background blobs, bokeh effects, or a
one-hue palette. Color should explain system state.

## Typography

- Use the system sans-serif stack already defined in `src/index.css`.
- Use monospace only for formulas, request ids/content, rates, timings, and
  typed work.
- Labels use `.tt-section-label` or `.tt-label`; values use `.tt-value`.
- Do not use viewport-scaled font sizes or negative letter spacing.
- Hero-scale type is reserved for the start screen product name only. Panels,
  modals, and charts use compact headings.

## Shape And Spacing

- Use 8px radius for panels, modals, controls, rows, and progress tracks.
- Use full-width app bands for educational sections.
- Use cards only for real units of work: panels, modals, repeated queue rows,
  worker cards, and result containers.
- Avoid card-inside-card composition. If a panel needs internal grouping, use
  dividers, rows, small badges, and spacing before adding another framed block.
- Keep controls stable: fixed minimum button heights, bounded queues, stable
  metric columns, and predictable progress bars.

## Shared Primitives

Use `src/components/ui/primitives.tsx` for app-wide visual consistency.

- `Panel`: app panel/modal surface.
- `SectionLabel`: compact uppercase section label.
- `MetricItem`: label/value metric display.
- `AppButton`: primary and secondary buttons.
- `StatusBadge`: semantic neutral/info/success/warning/danger chips.
- `SizeBadge`: task size chip with semantic tone.
- `FormulaCallout`: bounded technical formula with caption.

Primitives are intentionally small. Add a primitive only if it removes repeated
visual rules across multiple components.

## Screen Rules

### Start Screen

- First viewport should closely match the sample UI: top horizontal nav line,
  right-aligned placeholder nav actions, centered `Total Throughput` title,
  large black `Play` button, outlined `Join Class` button, scanline texture,
  and sparse node/link background.
- The current start-screen source of truth is BOSS's pasted Figma code:
  system monospace (`font-mono`), desktop title equivalent to Tailwind
  `text-7xl font-bold`, `3px` borders, `4px 4px 0` button shadow, `20rem`
  button stack width, white background, and `2px`/`2px` scanlines at `0.03`
  opacity.
- `Play` opens the existing Phase 1 instructional popup and preserves the
  current start-game flow using the Standard difficulty default.
- Do not show difficulty, Phase 2 continuation, or other setup controls in the
  first viewport while matching the sample screenshot.
- Keep the network responsive with square hub clusters and small satellite
  nodes. Hubs should not connect directly to other hubs; each hub may send one
  faint line toward the actual center of the `Play` button.
- Keep the learning sections visually separated after the first viewport.

### Learning Sections

- Use the request-flow metaphor before formulas.
- Keep formulas visually distinct and label caveats plainly.
- Do not present `R ~= D / (1 - rho)` as an exact Phase 1 result.
- Prefer one useful flow row or compact note over multiple equal-weight
  explainer cards.

### Phase 1 Play

- The active request sits in a bounded workbench panel.
- Typing text is the dominant element in the center.
- Stats and queue collapse into stacked panels on smaller screens.
- Show queue age, task size, current progress, and typing error state without
  moving the layout.

### Phase 2 Play

- Phase 2 receives the same palette, panels, badges, and chart treatment.
- This visual pass must not change dispatch rules, worker assignment, arrival
  generation, service demand, or debrief math.
- Phase 2 polish beyond style compatibility remains deferred until BOSS
  promotes it.

### Results And Debriefs

- Promote one primary outcome first: pass/retry/fail plus the main measured
  value.
- Group secondary metrics into tight rows instead of many equal-weight cards.
- Put formula caveats next to the formula.
- Charts use the shared semantic colors and should include enough margin that
  axes and labels do not crowd small chart heights.

## Validation

Before claiming visual implementation is done:

- Run `npm test`, `npm run lint`, and `npm run build`.
- Use browser QA on the start screen and at least one active gameplay screen.
- Check mobile and desktop screenshots for text overlap, missing tokens,
  unreadable contrast, and unstyled primitive classes.
