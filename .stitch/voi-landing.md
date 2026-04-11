# Voi — Landing Page Design

## Project Context

- **Project Name**: Voi (The Living Vocabulary Network)
- **Type**: Web App Landing Page
- **Tech Stack**: HTML/Tailwind/Framer Motion
- **Purpose**: An AI-powered language acquisition platform that transforms real-world captures into visually engaging knowledge graphs with a 7-layer study framework for deep vocabulary retention.

## Enhanced Design Prompt

**Atmosphere**: Vibrant, educational, playful, and modern. Inspired by next-generation learning dashboards. The design uses a clean "bento box" grid layout with heavily rounded corners, blending a dark, sleek header with bright, pastel-driven accent cards. It should feel state-of-the-art, game-like, and highly engaging.

### DESIGN SYSTEM:

- **Platform**: Web (Landing Page), visually structured to resemble a premium software dashboard.
- **Palette**:
  - Background: Soft Blue-Gray (#DFE3F6) or muted lavender for the main page body to let white cards pop.
  - Core UI (Header/Nav): Deep Charcoal (#23252B) - to anchor the top structure just like the reference.
  - Card Backgrounds: Pure White (#FFFFFF) - for clean readability inside bento grids.
  - Accents: 
    - Soft Lavender/Purple (#9DA4F4) - calming, modern tech feel.
    - Energetic Orange/Peach (#F5A475) - for active stats, important highlights, and progress elements.
  - Text: Dark Slate (#1e2025) for primary readability inside white cards.
- **Styles**: Bento box layout (grid with irregularly sized but perfectly aligned rectangles). Heavy border radii on cards (approx 24px-32px). Soft, diffuse, transparent drop shadows. Flat but detailed vector illustrations featuring micro-decorations (stars, squiggles, math overlays). Integrated emojis for a friendly touch.

### PAGE STRUCTURE:

1. **Header (App-Like Top Bar)**:
   - A dark, floating container spanning the top (`bg-[#23252B]`, heavily rounded).
   - "Voi" logo on the left (brain or floating nodes icon in white/lavender).
   - Centered pill-shaped navigation inside a darker sub-container (e.g., Features, Setup, Knowledge Graph).
   - Right side: Mock User profile indicator or primary CTA "Start Capturing" in a solid white or pastel pill.

2. **Hero Section (Bento Grid Layout)**:
   - Instead of a traditional top-to-bottom flow, utilize a highly compact layout resembling a dashboard view.
   - **Main Splash Card** (Span 2x2): Soft Lavender background. Headline: "Turn the world into your classroom." Includes a vector illustration of a smartphone scanning the real world and generating glowing vocabulary nodes. Features floating squiggles and decorative stars.
   - **Progress/Analytics Card**: Soft Orange (#F5A475) card showing a mock "Vocabulary Growth" bar chart or the 7-layer progress to immediately show the app's internal value. 
   - **Numeric Stat Cards**: Small white cards showing mock statistics (e.g., "7 Study Layers", "∞ Contexts").

3. **Features Section (The Knowledge Engine)**:
   - Secondary bento grid highlighting the core pipeline.
   - **Capture & Input**: A dark-mode miniature card illustrating computer vision/OCR scanning real objects.
   - **The 7 Layers Framework**: A vertical timeline or stacked card arrangement breaking down the study methodology (Definition, Collocation, Context, Synonym, Etymology, Usage, Active Recall) with pastel accent tags.
   - **Context Map Representation**: A wide bento card showcasing an interconnected "Knowledge Graph" (Nodes and Edges) visualization.

4. **Footer**:
   - Minimalist and integrated into the bottom of the bento grid. 
   - Clean rounded container holding Copyright, Social Links, and a final "Join the Beta" call to action.

### Visual Elements:

- **Structure**: Heavy use of CSS Grid (`display: grid`) or prominent Flexbox layouts for the bento box appearance. Ensure consistent gap spacing (e.g., `gap-6`).
- **Rounding**: Exaggerated, soft corners (`rounded-3xl` or `rounded-[32px]`).
- **Imagery**: Flat, colorful 2.5D vector illustrations (e.g., rockets, books, trophies).
- **Decorations**: Subtle background noise, translucent wavy lines (`opacity-20`), and floating geometric elements inside the colored accent cards.
- **Buttons**: Pill-shaped (`rounded-full`) forms for badges, links, and CTAs.

### Typography:

- Headings: Poppins or Outfit (bold, rounded, friendly geometry).
- Body: Inter or Quicksand (clean, legible, approachable).
