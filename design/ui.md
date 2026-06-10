# App-Wide Visual System

This guide is the source of truth for Total Throughput's app-wide visual
direction. It covers color, typography, spacing, component treatment, and visual
composition. It does not define future Phase 2 gameplay, metrics, or
simulation behavior.

## Product Feel

Total Throughput should feel like a compact systems lab, not a marketing page or
generic SaaS dashboard.

- Use the concrete story: client request -> request queue -> worker service ->
  response.
- Favor operational hierarchy over decorative polish.
- Make the active work area obvious before secondary explanation.
- Use concise labels and measured numbers; avoid broad promotional copy.
- Keep visual density high enough for repeated play, but leave enough spacing
  that queue and metric states can be scanned.

## Semi-Retro Monochrome Revamp

BOSS approved a complete UI revamp using the attached sample UI as the visual
reference. The active implementation sequence starts with only the start screen
until the monochrome direction is tuned through screenshot feedback, then moves
into the start-page -> Educational Manual -> play workflow.

- Use a white/off-white first viewport with black foreground elements.
- Favor strong rectangular borders, minimal radius, and monospace-forward type.
- Use a subtle horizontal scanline texture and sparse node/link background
  motif on the start screen.
- Keep `Play` as the primary action and `Join Class` as the secondary visual
  action.
- Keep `Join Class`, `For Instructors`, and `Sign In` visible but
  nonfunctional until BOSS promotes real account or class behavior.
- Keep the semi-retro top navigation persistent across the start screen,
  Educational Manual, Game Menu, and calibration flow. Active gameplay uses the
  same plain navigation controls inside `TopBar`.
- The left side includes plain text `Home` and `Game Menu` controls. `Home`
  returns to the start screen; `Game Menu` returns to the recurring difficulty
  hub. If a calibration or run is active, navigation goes anyway and shows a
  system notification that the current calibration/run was not saved.
- Header/navigation text follows the local rulebook typography convention:
  Title Case labels with the same font, size, weight, and letter spacing.
  `Sign In` may differ by boxed container treatment only. Persistent header
  labels share the same source typography class so `Home`, `Game Menu`,
  `For Instructors`, and `Sign In` cannot drift apart.
- Do not add fonts, image assets, icon libraries, animation packages, component
  kits, hosted services, or paid visual tooling for this revamp.
- Gameplay and results screens should use the same monochrome lab language.
  The original Phase 2 is out of current scope until BOSS supplies a new
  concept and approves a question-first plan.
- The current approved workflow shows an Educational Manual after `Play` and
  before active play begins. The manual becomes the primary educational
  backbone for introducing the game context and purpose.

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

The app uses a semi-retro monochrome operational palette with semantic accents
only where state needs to be distinguished.

| Role | Token | Use |
| --- | --- | --- |
| App background | `--tt-bg` | Full app shell and white/off-white empty space |
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

- Use the system monospace stack defined in `src/index.css`.
- Use monospace consistently for headings, formulas, request ids/content, rates,
  timings, and typed work.
- Labels use `.tt-section-label` or `.tt-label`; values use `.tt-value`.
- Do not use viewport-scaled font sizes or negative letter spacing.
- Hero-scale type is reserved for the start screen product name only. Panels,
  modals, and charts use compact headings.

## Shape And Spacing

- Use 0-8px radius for panels, modals, controls, rows, and progress tracks.
  Rectangular controls and hard black shadows are preferred for primary frames.
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
- In the current workflow, `Play` opens the Game Menu first. On the first
  uncalibrated visit, the Game Menu is greyed and inactive except for a
  highlighted manual icon.
- Do not show difficulty, Phase 2 continuation, or other setup controls in the
  first viewport while matching the sample screenshot.
- Keep the network responsive with square hub clusters and small satellite
  nodes. Hubs should not connect directly to other hubs; each hub may send one
  faint line toward the actual center of the `Play` button.

### Educational Manual

- The Educational Manual is the next approved player-workflow slice under the
  semi-retro monochrome revamp.
- After the player clicks the highlighted manual icon, show the manual over the
  Game Menu before the player calibrates or starts a run.
- This manual replaces the old `prePhase1` popup for the first-play onboarding
  transition.
- Keep the horizontal striped Game Menu background visible behind the greyed
  discovery state, then behind a darkened modal backdrop and a foreground
  vertical manual page with rounded corners after the manual icon is clicked.
- Keep the manual page frame fixed-size per viewport so the page top, header,
  footer controls, and page count do not shift between manual pages. Sparse
  pages may keep empty white space.
- The manual now begins with the approved first page and can expand into
  follow-up pages. It should use the header `Educational Manual`, general body
  content, page-specific diagrams, a current-page/last-page display centered
  at the bottom, and a `Close` button at bottom right on the final page.
- If BOSS later expands the manual to multiple pages, use a `Next` button at
  bottom right, a `Close` button at bottom right on the final page, and a
  `Back` button at bottom left except on the first page.
- The manual should introduce the game premise and server request/response
  context before mechanics. Current BOSS-provided direction: the player had
  the misfortune of being born as a server and must handle client requests.
- Do not use protocol-specific wording in the player-facing manual, diagrams,
  gameplay labels, or instructional copy. It is too distracting for this
  learning flow.
- The queueing page should stay visually simple: incoming requests enter a server
  container, the server contains a request queue and worker, one named front
  request moves to the worker, the queue can show `P1`, `P2`, `P3`, and a
  partial fourth slot to imply stacking, and the server sends a response. Do
  not introduce API wording or duplicate work-list labels in that diagram.
  Show the main client request/response as a closed loop and use secondary
  arrows for other clients' inbound requests and outbound responses.
  Do not label the diagram arrows with protocol terms; the page should use
  arrows to show requests and responses.
- The third manual page may include a nonfunctional typing-run preview image
  that foreshadows the real play surface: a request queue, one active typing
  task, and compact live stats.

### Game Menu

- The Game Menu is the recurring hub after `Play`, after calibration, and after
  each run summary.
- On the first uncalibrated visit from `Play`, grey the entire Game Menu and
  leave only the manual icon visually active and clickable. This teaches players
  where to find the manual without opening it automatically.
- Store whether the manual icon has been clicked. Once clicked, do not show the
  highlighted/manual-discovery lock again in the same app session, even if the
  player later returns through `Game Menu`, `Home`, or `Play`.
- Persistent `Home` and `Game Menu` navigation stays above the discovery scrim;
  the manual modal stays above both the navigation and the greyed menu.
- Before a valid calibration exists, show the difficulty cards in a disabled
  state and mark the calibration button with a red required indicator.
- Show a named `Baseline` panel in the menu header. Inside it, use plain stat
  labels: `WPM` and `Display bin`.
- Keep the calibration/recalibration action inside the Baseline panel as the
  panel action row. Before valid calibration exists, mark that action with a
  red required indicator.
- After calibration, enable the difficulty cards themselves as full-card
  controls rather than nesting separate `Start` buttons inside each card.
  Use subdued retro game colors for their load accents: green for Easy, yellow
  for Medium, orange for Hard, and red for Impossible, while preserving the
  hard black borders and shadows.
- Include a compact icon-only manual control in the Game Menu intro area so
  players can reopen the Educational Manual without putting Manual inside the
  Baseline panel.

### Phase 1 Play

- Phase 1 now starts with a 30-second calibration screen. Keep it visually
  close to a compact typing tool: fixed five-row generated-word row area,
  bottom start prompt overlay, countdown, live WPM, live accuracy, and no
  explanatory feature callouts.
- After calibration ends, show a small completion card using the same
  semi-retro panel and button treatment. It should show WPM, accuracy, display
  bin, plus `Recalibrate` and `Game Menu` actions.
- After calibration, show four calibrated choices: Easy, Medium, Hard, and
  Impossible. Each choice should show the derived WPM range and target load
  without implying the range is an exact pass/fail requirement.
- After each 60-second run, show a compact run summary and return controls:
  continue to difficulty selection or recalibrate.
- The active request and waiting queue sit in one bounded workbench panel.
- Typing text is the dominant element in the center. The active typing task is
  position-anchored at the workbench center; waiting requests render in a
  separate fixed slot immediately beneath it, similar to the calibration row
  stack, so queue arrivals never push the active task upward.
- Show up to five queued requests below the active task. Each queued row shows
  the request text and its elapsed response time so far. If more are waiting,
  show a muted overflow row below the fifth request.
- Stats collapse below the workbench on smaller screens.
- Show queue age and typing error state without moving the layout. Do not show
  `S`/`M`/`L` size chips for current Phase 1 requests.
- Do not show a Phase 1 progress bar or separate error-count badge. Incorrect
  characters turn red, receive a red underline, and the whole incorrect word
  receives a light red highlight. The red underline is required so incorrectly
  typed spaces are visible.
- Preserve the existing keyboard, queue, arrival-rate, task-length, and metric
  mechanics during this UI pass.

### Future Phase 2

- Do not add or tune Phase 2 UI until BOSS supplies the new Phase 2 concept.
- When Phase 2 resumes, reuse the same restrained lab language unless BOSS
  approves a different visual direction.
- Define the future Phase 2 workflow, interaction model, metrics, and debrief
  requirements before editing UI components.

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
