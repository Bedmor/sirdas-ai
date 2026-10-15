---
name: Spiritual Sanctuary
colors:
  surface: '#101412'
  surface-dim: '#101412'
  surface-bright: '#363a38'
  surface-container-lowest: '#0b0f0d'
  surface-container-low: '#181c1a'
  surface-container: '#1c211e'
  surface-container-high: '#272b28'
  surface-container-highest: '#313633'
  on-surface: '#e0e3df'
  on-surface-variant: '#dbc2b0'
  inverse-surface: '#e0e3df'
  inverse-on-surface: '#2d312f'
  outline: '#a38c7c'
  outline-variant: '#554336'
  surface-tint: '#ffb77d'
  primary: '#ffb77d'
  on-primary: '#4d2600'
  primary-container: '#d97707'
  on-primary-container: '#432100'
  inverse-primary: '#904d00'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#f9bd22'
  on-tertiary: '#402d00'
  tertiary-container: '#b88900'
  on-tertiary-container: '#372700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#101412'
  on-background: '#e0e3df'
  surface-variant: '#313633'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 34px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a dignified, serene sanctuary at the intersection of classical spiritual reverence and calm contemporary technology. The interface serves as a contemplative "Soul Mirror"—a quiet space of clarity, grounding, and inward reflection away from transactional digital noise.

### Visual Style: Sacred Minimalist Glassmorphism
The aesthetic fuses deep nocturnal architectural spaces with frosted devotional craft:
- **Atmospheric Depth:** Deep obsidian and nocturnal pine tones evoke pre-dawn meditation (*Tahajjud*) and the solemn quietude of ancient stone courtyards.
- **Dignified Restraint:** Rejection of electric, sci-fi "AI" clichés (no floating holographic orbs, chaotic mesh gradients, or robotic neon chatter). Interactions are deliberate, graceful, and paced with reverence.
- **Sacred Materiality:** Tactile sensations of gilded parchment, dark polished stone, and frosted celestial lanterns. Accents are applied with the precision of illuminated manuscript gold-leafing.
- **Architectural Ornamentation:** Restrained architectural silhouettes—gentle pointed arches (*mihrab* contours), micro-fine tessellated hair lines, and geometric star dividers—anchor the digital space in timeless sacred geometry.

## Colors

The color system operates strictly in a deep, contemplative dark mode. It draws directly from sanctuary midnight palettes, vegetal inks, and aged gold illuminated foliage.

### Palette Strategy
- **Base Canvas (`neutral_color_hex` #080c0a):** An obsidian-charcoal foundation carrying a microscopic undertone of pine green, absorbing ambient glare and directing total focus to reflective contemplation.
- **Sanctuary Primaries (`primary_color_hex` #d97706 & `tertiary_color_hex` #fbbf24):** Burnished amber and luminous matte gold used for focal points, sacred scripture references, and interactive highlights.
- **Nocturnal Emeralds (`secondary_color_hex` #10b981):** A subdued botanical emerald aura evoking growth, renewal, and tranquil presence. Used for affirmations, active status indications, and ambient depth.

### Surface Hierarchy & Translucency
- **Base Canvas:** `#080c0a` (Solid obsidian).
- **Surface Deep:** `#041f18` at 60% opacity with `backdrop-filter: blur(16px)` for recessed utility zones.
- **Surface Elevation 1 (Cards):** `#062a22` at 45% opacity overlaid on `#022c22` with a `1px` inner rule tinted `rgba(217, 119, 6, 0.20)`.
- **Surface Elevation 2 (Active Sheets/Overlays):** `#0a3d31` at 70% opacity with delicate gilded edges (`rgba(251, 191, 36, 0.35)`).
- **Text & Glyphs:** High-clarity pearl white (`#f8fafc`) for primary verses and dialogue; muted jade-silver (`#94a3b8`) for secondary commentary; dimmed gold (`#b45309`) for structural metadata.

## Typography

Typography balances historical sacred scholarship with modern digital ergonomics. 

- **Headlines & Sacral Passages (Playfair Display):** Selected for its graceful serifs, transitional high-contrast strokes, and classical gravitas. It provides an immediate sense of quiet reverence, reminiscent of gold-leafed vellum and fine bookmaking.
- **Body & UI Elements (Plus Jakarta Sans):** Selected for its modern, humanist geometry, generous counter spaces, and exceptional readability on high-density displays. Its rounded terminals soften clinical tension while remaining clean and structured.
- **Typographic Guidelines:**
  - Verses, reflections, and deep contemplation quotes must be set with generous line heights (minimum 1.6x) and ample letter spacing to encourage contemplative reading.
  - Category tags and theological citations use `label-sm` or `label-md` styled with uppercase treatment and `0.08em` letter spacing for an engraved inscription feel.

## Layout & Spacing

The spatial model enforces meditative calm through expansive breathing room, balanced columns, and deliberate vertical pacing. Avoid cluttered multi-column densities.

### Grid Architecture
- **Desktop (min-width: 1024px):** 12-column fluid grid, maximum content width `1200px` centered. Margins fixed at `2rem`, gutters at `1.25rem`. Dialogue views maintain an intimate reading width of `680px` to preserve psychological safety.
- **Tablet (768px – 1023px):** 8-column grid with `1.5rem` margins and `1rem` gutters.
- **Mobile (under 768px):** 4-column structure with `1rem` outer canvas padding (`margin-mobile`), ensuring chat cards and contemplative widgets comfortably span the edge-to-edge safe area.

### Spatial Rhythm
- Apply `space-xl` (2.5rem) as rhythm dividers between distinct theological themes or reflective sections.
- Apply `space-md` (1rem) for message card internal padding, maintaining sufficient buffer against glowing borders.

## Elevation & Depth

Visual depth is achieved through layered frosted glass, dark nocturnal volume, and soft ambient bioluminescence rather than harsh, opaque drop shadows.

### Atmospheric Glass Stacking
1. **Sanctuary Floor (Level 0):** Pure dark background (`#080c0a`) subtly accented by anchored, diffused radial blurs in midnight emerald (`rgba(6, 78, 59, 0.18)` at 120px blur).
2. **Contemplative Vessel / Cards (Level 1):** 
   - Background: `linear-gradient(135deg, rgba(6, 42, 34, 0.55), rgba(4, 31, 24, 0.40))`
   - Backdrop Filter: `blur(12px)`
   - Border: `1px solid rgba(217, 119, 6, 0.18)`
   - Shadow: `0 4px 20px -2px rgba(2, 44, 34, 0.50)`
3. **Floating Portals & Dialog Overlays (Level 2):**
   - Background: `rgba(4, 31, 24, 0.85)`
   - Backdrop Filter: `blur(20px)`
   - Border: `1px solid rgba(251, 191, 36, 0.32)`
   - Shadow: `0 12px 40px -4px rgba(0, 0, 0, 0.8), 0 0 24px 0 rgba(16, 185, 129, 0.08)` (subtle emerald halo)

### Architectural Light Traces
All raised surfaces use an ultra-fine 1px top highlight (`rgba(255, 255, 255, 0.08)`) simulating overhead lantern light washing down a polished marble wall.

## Shapes

The geometry of the interface bridges modern organic ergonomics with sacred Moorish and Ottoman architectural forms.

### Corner Curvature (`roundedness: 2`)
- **Standard UI Cards & Containers:** Default corner radius of `0.5rem` (8px), scaling to `1rem` (16px) for prominent reflection cards.
- **Mihrab / Arch Motifs:** Specialized containers (e.g., daily verse displays, prayer direction panels) feature asymmetrical rounding: the top corners adopt an elongated arch radius (`2.5rem 2.5rem 0.5rem 0.5rem`), echoing the silhouette of a classical prayer niche (*Mihrab*).
- **Interactive Chips & Controls:** Subtle `0.5rem` rounding to preserve an intentional, sculpted stone tablet appearance rather than hyper-casual pill shapes.

## Components

### Buttons & Intent Triggers
- **Primary Sacred Action (e.g., "Begin Reflection", "Seek Counsel"):**
  - Background: Gilded linear gradient from `#d97706` to `#b45309`.
  - Color: Rich deep obsidian (`#080c0a`) in semibold weights for maximum contrast.
  - Border: Subtle inner bevel with `rgba(251, 191, 36, 0.4)`.
  - State Transitions: Hover elevates brightness and activates a soft amber halo (`0 0 16px rgba(217, 119, 6, 0.35)`).
- **Secondary Contemplative Action:**
  - Background: `rgba(6, 78, 59, 0.35)` with backdrop blur.
  - Border: `1px solid rgba(217, 119, 6, 0.25)`.
  - Color: Parchment gold (`#fbbf24`).

### Spiritual Prompt & Category Chips
- Rendered in deep emerald glass (`rgba(2, 44, 34, 0.6)`) with `1px solid rgba(16, 185, 129, 0.20)`.
- Text styled in `label-md` with neutral silver-green (`#94a3b8`).
- Selected state turns the border into luminous gold (`#f59e0b`) with a faint internal ember glow (`rgba(245, 158, 11, 0.12)`).

### Verse & Soul Mirror Cards
- **Geometry:** Frosted rectangular card, optionally capped with the arched Mihrab header.
- **Framing:** Continuous `1px` border in `rgba(217, 119, 6, 0.20)` that subtly highlights along the top edge.
- **Accents:** Centered micro gold-leaf star or geometric eight-point knot divider (`space-md` vertical padding) delineating the sacred scriptural text from personalized AI soul-mirror reflections.

### Input Fields & WhatsApp Web Conversational Shells
- Background: `#041f18` at 70% opacity.
- Border: `1px solid rgba(16, 185, 129, 0.25)`.
- Text: Crisp ivory white (`#f8fafc`). Placeholder rendered in muted sage (`rgba(148, 163, 184, 0.5)`).
- Focus: Border shifts seamlessly to burnished amber (`#d97706`), accompanied by an ambient emerald base glow (`0 0 12px rgba(16, 185, 129, 0.15)`).

### Specialized Domain Component: Ayah & Hadith Citation Ribbons
- Left-bordered with a refined 2px solid gold blade (`#fbbf24`).
- Subtle background gradient trailing horizontally into transparent obsidian.
- Typography sets the sacred Arabic/transliteration in high-contrast Playfair Display, with academic sourcing tag in `label-sm` gilded letterspacing.