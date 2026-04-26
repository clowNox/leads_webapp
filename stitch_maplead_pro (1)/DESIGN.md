# Design System Strategy: The Precision Architect

## 1. Overview & Creative North Star
Lead generation is often a chaotic landscape of raw data and noise. This design system is built to be the "Precision Architect"—a digital environment that transforms high-velocity data into actionable, premium intelligence. 

We are moving away from the "Dashboard Template" look. Our signature style is defined by **Soft Editorialism**: the use of expansive white space, dramatic typographic scale shifts, and structural depth achieved through tonal layering rather than borders. By utilizing intentional asymmetry and overlapping "glass" surfaces, we convey a sense of elite craftsmanship and results-driven authority.

---

## 2. Colors: Tonal Architecture
The palette centers on an authoritative Professional Blue (`primary`), supported by a disciplined range of functional accents.

### The "No-Line" Rule
**Borders are a design failure of the past.** To maintain a premium, high-end feel, designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
*   **Background Shifts:** Placing a `surface-container-low` component against a `surface` background.
*   **Tonal Transitions:** Using depth to signal the end of one zone and the start of another.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials. Use the `surface-container` tokens to create a "nested" ecosystem:
1.  **Base Layer:** `surface` (#f8f9ff) – The expansive canvas.
2.  **Sectioning:** `surface-container-low` (#eff4ff) – Used for large sidebar backgrounds or secondary content zones.
3.  **Active Components:** `surface-container-lowest` (#ffffff) – Used for primary data cards to make them "pop" against the gray-wash background.
4.  **Interaction Layers:** `surface-container-high` (#dce9ff) – Reserved for hover states or active selection indicators.

### The "Glass & Gradient" Rule
Flat color is for utilities; depth is for brands. 
*   **Signature Textures:** For primary CTAs and high-level lead metrics, use a subtle linear gradient from `primary` (#0044a7) to `primary_container` (#005ad8). 
*   **Glassmorphism:** Floating elements (tooltips, dropdowns, or mobile overlays) should use `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. This ensures the data-heavy background is felt but not distracting.

---

## 3. Typography: The Editorial Voice
We use a dual-font strategy to balance character with utility.

*   **Headlines (Manrope):** This is our "Architectural" font. It is wide, modern, and high-contrast. Use `display-lg` and `headline-md` for lead counts and names to instill a sense of importance.
*   **Body & Labels (Inter):** Our "Functional" font. It provides maximum legibility for dense lead data. 
*   **Hierarchy Note:** Always maintain a minimum 2:1 scale ratio between headlines and body text to create an editorial, high-end rhythmic flow.

---

## 4. Elevation & Depth: Tonal Layering
In this system, "Elevation" does not mean "Shadow." It means "Light."

*   **The Layering Principle:** Achieve depth by "stacking." A `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#eff4ff) background creates a natural, crisp lift.
*   **Ambient Shadows:** If a floating state is required (e.g., a dragged lead card), use a shadow with a `40px` blur, `0%` spread, and `6%` opacity, tinted with the `on_surface` (#0b1c30) color. Never use pure black shadows.
*   **The "Ghost Border":** If accessibility requirements demand a container edge, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons & CTAs
*   **Primary:** Gradient-filled (`primary` to `primary_container`) with `xl` (1.5rem) roundedness. 
*   **Secondary:** `surface_container_high` background with `on_secondary_container` text. No border.
*   **Tertiary:** Transparent background with `primary` text. Use for low-priority actions like "Cancel" or "Export."

### High-Contrast Status Chips
Lead status is binary: Success or Risk.
*   **Qualified:** `tertiary_container` background with `on_tertiary_fixed` text.
*   **Warning/Error:** `error_container` background with `on_error_container` text.
*   **Shape:** Always `full` (9999px) roundedness to contrast against the `lg` (1rem) card corners.

### Lead Cards & Lists
*   **Constraint:** **Prohibit divider lines.** 
*   **Alternative:** Use a `1.5rem` vertical spacing (padding) between list items. For cards, use `surface-container-lowest` on top of `surface` to create separation.
*   **Asymmetry:** Align lead names to the far left and "Qualified" chips to the far right to maximize the horizontal "breathing room."

### Input Fields
*   **State:** Default inputs use `surface_container_low`. On focus, transition the background to `surface_container_lowest` and add a `2px` ghost-border using `primary`.
*   **Typography:** Labels must use `label-md` in `on_surface_variant` for a subtle, professional look.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use `xl` (1.5rem) rounding for large containers and `sm` (0.25rem) for small utility icons.
*   **DO** leave more white space than you think is necessary. "Crowded" equals "Cheap."
*   **DO** use `surface_bright` to highlight the most important lead in a list.

### Don't
*   **DON’T** use a 1px solid border to separate the sidebar from the main content; use a background color shift to `surface_container_low`.
*   **DON’T** use pure black (#000000) for text. Always use `on_surface` (#0b1c30) to maintain a soft, premium contrast.
*   **DON’T** use "Drop Shadows" on standard cards. Let the tonal shifts do the work.