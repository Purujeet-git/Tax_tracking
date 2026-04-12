# Trader OS Design System

## Product Story

Trader OS is a crypto tax control center for active traders. The product should feel fast, precise, and slightly defiant: less like a tax form, more like a trading terminal that happens to understand tax law.

The core promise:

- Bring every exchange into one clean ledger.
- Show tax impact before the user makes the next trade.
- Turn messy activity into filing-ready outputs for USA, UK, India, Canada, and Australia.
- Help users compare FIFO, HIFO, LIFO, ACB, and specific-ID style outcomes without spreadsheets.

The user should quickly understand that this is not just a dashboard. It is an operating system for tax-aware trading.

## Current Product Areas

- Landing page: first impression, product promise, exchange support, feature story, CTA.
- Login: authentication entry point.
- Dashboard: exchange connections, tax summary, optimizer, filing exports, trade history, strategy simulation, CSV preview.
- CSV upload and mapper: imports external exchange files and maps columns into normalized transactions.
- Tax tools: developer/admin actions for lot generation and FIFO matching.
- Tax summary: tax-year review.
- Filing center: country-specific PDF and CSV exports.
- APIs: exchange sync, upload, trades, tax calculation, strategy comparison, filing exports, loss harvesting, harvest plans.
- Engines: exchange normalizers, tax lot generation, disposal matching, country strategies, filing report generators, valuation.

## Aesthetic Direction

Use a bold black-and-white editorial style inspired by crypto wallet and trading product sites:

- Huge compressed-feeling headlines.
- Heavy black borders.
- Mostly flat surfaces.
- Small bursts of sharp accent color.
- Clear, practical product mockups.
- Confident, direct copy.
- Minimal decoration that does not explain itself.

The visual mood is: command center, not accountant portal.

## Brand Voice

Use short, concrete, trader-facing language.

Good:

- "Know the tax impact before you sell."
- "Every exchange in one ledger."
- "Harvest losses before the window closes."
- "Export CPA-ready reports."
- "Compare FIFO, HIFO, LIFO, and ACB."

Avoid:

- Generic SaaS phrases like "supercharge your workflow."
- Self-referential UI copy like "this section shows..."
- Overexplaining features users can see.
- Cute copy where money, filings, or risk are involved.

## Color System

Primary colors:

- Black: `#000000`
- Ink: `#111111`
- White: `#ffffff`
- Soft paper: `#f4f4f0`
- Muted text: `#52525b`
- Border gray: `#d4d4d8`

Accent colors:

- Action green: `#9dff7a`
- Warning yellow: `#ffdf5d`
- Signal cyan: `#74e0ff`
- Loss red: `#ff5c5c`
- Profit green: `#35c96e`

Usage:

- Marketing surfaces should be mostly white, black, and soft paper.
- Dashboard surfaces can use black or ink backgrounds, but keep cards crisp and readable.
- Use only one or two accent colors per screen.
- Reserve red and green for financial meaning where possible.
- Avoid purple gradients, beige-heavy themes, dark blue/slate themes, and decorative color blobs.

## Typography

Current font direction: Plus Jakarta Sans.

Headlines:

- Use very heavy weight: `font-black`.
- Use tight line height: `leading-none` or `leading-[0.82]` for hero moments.
- Use tight tracking only where Tailwind already provides it through `tracking-tighter`.
- Keep letter spacing normal for body and interface text.

Body:

- Use `font-semibold` for important descriptions.
- Use `text-zinc-600` or `text-zinc-500` for secondary copy.
- Keep line length constrained, usually `max-w-xl` or `max-w-2xl`.

Labels:

- Uppercase.
- Small.
- Heavy.
- Often inside pills or above cards.

## Layout Rules

Page shell:

- Use full-width sections.
- Use `max-w-7xl mx-auto` for primary content.
- Use generous vertical rhythm: `py-20`, `py-24`, or more for marketing sections.
- Use tighter app spacing for dashboards: `p-4 sm:p-6 lg:p-8`.

Marketing pages:

- Start with the actual product promise immediately.
- Use oversized headlines and a visible product mockup.
- Use feature rows, exchange ribbons, stats, FAQ, and clear CTAs.
- Do not make abstract hero art the main content.

App pages:

- Use a strong page heading, a status/action strip, then cards or tables.
- Keep data dense but readable.
- Use the same border and radius language as the landing page.
- Avoid nested cards. A card may contain controls, rows, charts, or tables, but not another decorative card.

## Components

### Navigation

Marketing nav:

- Sticky top.
- White with black bottom border.
- Logo on the left.
- Pill nav in the center on desktop.
- Black pill CTA on the right.

Dashboard nav:

- Can be a top bar or sidebar, but should use the same visual DNA.
- Active item: black fill on light surfaces, white fill on dark surfaces, or accent green where appropriate.
- Keep labels short: Dashboard, Import, Tax, Filing, Tools.

### Buttons

Primary:

- Black background.
- White text.
- Rounded full.
- Heavy uppercase or direct action copy.

Secondary:

- White background.
- Black border.
- Black text.
- Hover may use yellow or green fill.

Danger:

- Red accent only when the action is destructive or financially negative.

Button radius:

- Pills are allowed for navigation and CTAs.
- Rectangular controls should use `rounded-md` or `rounded-lg`.
- Avoid radii larger than 8px on cards and fixed UI controls unless the element is intentionally a pill.

### Cards

Use cards for repeated items, panels, reports, and dashboard modules.

Card style:

- `border-2 border-black`
- `rounded-lg`
- White or soft paper on marketing pages.
- Black/ink with subtle borders on dense dashboard pages.
- Optional hard shadow: `shadow-[6px_6px_0_#111]` or `shadow-[12px_12px_0_#111]`

Avoid:

- Glassmorphism as the default.
- Gradients as the main brand device.
- Cards inside cards.
- Decorative frames around the main product experience.

### Tables

Tables should feel like a trading ledger:

- Sticky or clear header row.
- Monospace optional for hashes, IDs, symbols, and exact values.
- Use compact rows with strong dividers.
- Right-align currency and quantity columns.
- Use red/green only for gain/loss semantics.
- Add summary strips above long tables.

### Forms And Import Flows

CSV import should feel guided and robust:

- Big drop zone with black border.
- Supported exchanges listed as pills.
- Show parsing status immediately.
- Mapping controls should use clear labels and short helper text.
- Preview tables should appear before final import.
- Error states should be direct: "Missing Date column", "Unsupported fee currency", "No trades found".

### Product Mockups

Mockups should look like real Trader OS surfaces:

- Browser/terminal header.
- Tax summary metrics.
- Mini chart or ledger rows.
- Action list with specific tax moves.
- Exchange badges.

Use fake data only when it illustrates a real workflow.

## Screen Guidance

### Landing Page

Goal: make users eager to try the product.

Must include:

- One-line product category.
- Giant headline.
- Clear user outcome.
- Product mockup.
- Primary CTA.
- Exchange support.
- Tax strategy support.
- Filing country support.
- FAQ that removes adoption friction.

Suggested copy:

- "Take Ctrl."
- "Crypto tax control center."
- "Optimize every trade, minimize every tax, and keep every exchange in one clean portfolio ledger."

### Dashboard

Goal: give the user immediate confidence in their tax position.

Top area:

- "Tax position" headline.
- Connected exchanges count.
- Current tax year.
- Last sync.
- Primary action: Import trades or Sync exchanges.

Cards:

- Realized gain/loss.
- Unrealized PnL.
- Estimated tax.
- Harvest opportunities.
- Filing readiness.
- Recent trades.

Design:

- Prefer a command-center dark surface or high-contrast light surface.
- Use accent green for opportunities, yellow for warnings, red for risk.

### Filing Center

Goal: make export feel reliable and professional.

Use:

- Country selector as bold pill tabs.
- Year selector as segmented cards.
- Summary tiles for the selected country.
- Two primary export panels: PDF report and CSV data.
- Legal note in small, calm copy.

Tone:

- "CPA-ready" is useful.
- "File directly" should only be used when the product truly supports direct filing.

### CSV Mapper

Goal: convert a stressful import into a clear checklist.

Flow:

- Upload file.
- Detect exchange if possible.
- Map required fields.
- Preview normalized rows.
- Confirm import.

Design:

- Step indicator at top.
- Big bordered upload zone.
- Mapping rows with required badges.
- Preview table with clear accepted/rejected row counts.

### Tax Tools

Goal: keep technical actions controlled.

Design:

- Treat as admin/dev utilities.
- Use warning copy for recompute or mutation actions.
- Show last run status and affected records.
- Avoid bare buttons on a blank page.

## Interaction And Motion

Use motion sparingly:

- Marquee for exchange logos/pills.
- Hover state for pills and buttons.
- Small chart or status animations.
- Loading spinners only when needed.

Avoid:

- Scroll effects that block core content.
- Long intro animations before users can act.
- Layout shifts when data loads.

## Accessibility

- Maintain strong contrast.
- Do not rely on color alone for gains/losses or status.
- Buttons and links need visible focus states.
- Text must fit on mobile without viewport-width font scaling.
- Tables need readable mobile alternatives or horizontal overflow with clear affordance.

## Implementation Notes

Tailwind patterns to reuse:

```jsx
<section className="px-4 py-24 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl">
    ...
  </div>
</section>
```

```jsx
<div className="rounded-lg border-2 border-black bg-white p-6 shadow-[6px_6px_0_#111]">
  ...
</div>
```

```jsx
<button className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-black uppercase text-white">
  Start tracking
</button>
```

```jsx
<p className="inline-flex rounded-full border-2 border-black bg-[#9dff7a] px-4 py-2 text-sm font-black uppercase">
  Crypto tax control center
</p>
```

## Migration Plan

1. Align global tokens: font, colors, base body background, focus states.
2. Convert `components/ui` primitives to the new card, button, input, and select style.
3. Restyle dashboard cards one by one, preserving behavior.
4. Redesign CSV upload and mapper as a guided import flow.
5. Restyle filing center with the shared tabs, tiles, and export panels.
6. Replace bare tax tools with a controlled admin utility page.
7. Remove old mixed visual patterns after each screen is migrated.

## Quality Bar

Every page should answer three questions within five seconds:

- What is my current tax position?
- What can I do next?
- Can I trust the data behind this?

If a screen does not answer at least one of those questions, simplify it or move it deeper in the flow.
