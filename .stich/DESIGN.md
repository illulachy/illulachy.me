# Design System Strategy: High-End Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"illulachy.me"**

This system moves beyond the generic "Dark Mode" aesthetic into a realm of high-end digital editorialism. It is designed for deep focus, intellectual rigor, and modern minimalism. We reject the "boxed-in" nature of standard web templates. Instead, we embrace generous, intentional whitespace (breathing room) and a hierarchy driven by sophisticated typography and tonal depth rather than structural lines. The goal is to make the interface feel like a premium physical journal—tactile, layered, and quiet.

## 2. Colors
Our palette is a study in monochromatic nuance, utilizing deep obsidian tones and crisp, stark whites to create maximum focus. The default color mode for the system is **light**.

### Tonal Foundations
* **Surface & Background (`#131313`):** The canvas. This isn't a pure black, but a deep charcoal that allows for "lower" depths.
* **Primary (`#FFFFFF`):** Reserved for high-contrast elements, key typography, and primary actions.
* **Secondary (`#E0AFFF`):** Mauve is a soft and subtle color that straddles the line between pink and violet on the color wheel, leaning towards a cooler, pastel tone. In color theory, it beautifully balances the warmth of red with the tranquility of blue, creating a light, inviting hue. This shade of mauve evokes a sense of serenity and refined elegance, making it ideal for designs that aim to convey a modern yet nostalgic feel.

### The "No-Line" Rule
**Designers are strictly prohibited from using 1px solid borders for sectioning content.** Standard dividers create visual noise. Instead, boundaries must be defined by:
1. **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2. **Negative Space:** Using the Spacing Scale (specifically `12` to `24`) to separate concepts.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. To create depth:
* **The Base:** `surface` or `surface-dim`.
* **The Section:** `surface-container-low` (for secondary content areas).
* **The Priority Card:** `surface-container-highest` (to pop a specific interactive element).
Always nest darker within lighter or lighter within darker to create natural logic without "outlining" the logic.

### Signature Textures (The "Glass & Gradient" Rule)
Flat surfaces can feel sterile. For high-impact elements like CTAs or Hero sections:
* Use a subtle gradient transition from `primary` to `primary-container` to give buttons a "soul."
* Use **Glassmorphism** for floating navigation or overlays: `surface-container-high` at 70% opacity with a `20px` backdrop-blur. This integrates the element into the layout rather than making it feel "pasted" on.

## 3. Typography
Typography is the primary architecture of this system. We pair a timeless Serif for authority with a hyper-functional Sans-Serif for clarity.

* **Display & Headline (Noto Serif):** Used for titles and key pull-quotes. This conveys the "Intellectual" aspect of the brand. Use `display-lg` (3.5rem) with tighter letter-spacing for a bold, editorial statement.
* **Title & Body (Inter / system-ui):** Used for navigation, labels, and long-form reading. Inter provides a neutral, modern balance to the serif's weight.
* **Hierarchy as Identity:** By maximizing the scale difference between `display-lg` and `body-md`, we create a "rhythm" that mimics a high-end magazine.

## 4. Elevation & Depth
In "The Stoic Curator" system, depth is felt, not seen.

### The Layering Principle
We achieve hierarchy through **Tonal Layering**. Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a soft, natural "lift" that mimics how paper sits on a desk.

### Ambient Shadows
Shadows must be invisible. When an element must "float" (like a modal or dropdown):
* **Blur:** 40px - 60px.
* **Opacity:** 4% - 8%.
* **Color:** Use a tinted version of `on-surface` rather than pure black to avoid a "dirty" look.

### The "Ghost Border" Fallback
If accessibility requirements demand a container boundary, use a **Ghost Border**: `outline-variant` at 15% opacity. It should be just visible enough to define a shape, but not enough to be perceived as a line.

## 5. Components

### Buttons
* **Primary:** `primary` background with `on-primary` text. Use **subtle roundedness** (roundedness 1). No border.
* **Secondary (The Outlined Minimalist):** No background. A `ghost-border` (outline-variant @ 20%).
* **Tertiary:** Pure text using `label-md`, adding an underline only on hover.

### Cards & Lists
* **Forbid Divider Lines:** Separate list items using the `spacing-4` (1.4rem) increment.
* **Interaction:** On hover, a card should shift from `surface-container-low` to `surface-container-high`. No shadow change, just a tonal "glow."

### Input Fields
* **Style:** `surface-container-lowest` background with a bottom-only "Ghost Border."
* **Focus State:** The bottom border transitions to 100% `primary` (#FFFFFF) opacity. The transition must be a `200ms ease-in-out` to feel premium.

### Signature Component: The "Focus Quote"
A specific component for this system: Large `headline-lg` Noto Serif text, centered, with `spacing-24` (8.5rem) padding above and below. This forces the user to pause and reflect, embodying the "Focused" brand pillar.

## 6. Do's and Don'ts

### Do
* **DO** use extreme whitespace. If a section feels "almost empty," it is likely correct.
* **DO** use `secondary` (#E0AFFF) sparingly for emphasis—think of it as a highlighter, not a primary paint.
* **DO** prioritize typography over icons. If a word can replace an icon, use the word.

### Don't
* **DON'T** use 100% opaque borders or high-contrast dividers. It breaks the "editorial" flow.
* **DON'T** use standard "Drop Shadows." Use tonal shifts or ambient, wide-blur blurs only.
* **DON'T** crowd the edges. The distance from the content to the screen edge should never be less than `spacing-8` (2.75rem) on desktop.