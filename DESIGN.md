---
name: Eco-System Intelligence
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#2b6954'
  on-secondary: '#ffffff'
  secondary-container: '#adedd3'
  on-secondary-container: '#306d58'
  tertiary: '#416900'
  on-tertiary: '#ffffff'
  tertiary-container: '#72b400'
  on-tertiary-container: '#254000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#acf847'
  tertiary-fixed-dim: '#91db2a'
  on-tertiary-fixed: '#102000'
  on-tertiary-fixed-variant: '#304f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-mobile: 16px
  container-margin-desktop: 32px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

This design system is built on the philosophy of **Modern Eco-Pragmatism**. It balances a professional, data-driven service (waste inventory management) with a friendly, community-oriented spirit (environmental stewardship). The target audience spans from Gen-Z individual users to industrial logistical drivers and administrative controllers.

The visual style is **Corporate / Modern** with **Tactile accents**. It leverages a clean, structured layout to handle complex inventory data while using soft, rounded elements and character-driven illustrations (the owl mascot) to remain approachable. The interface must feel reliable and institutional, yet energetic and rewarding—reinforcing the message that "Waste is Value."

**Key Principles:**
- **Clarity over Clutter:** Mobile-first layouts prioritize scanning essential data (weights, types, values).
- **Environmental Trust:** Use of organic greens to signal sustainability.
- **Action-Oriented:** Large, accessible touch targets for PWA compatibility in field environments.

## Colors

The palette is derived from the natural lifecycle of flora, moving from vibrant growth to deep forest stability.

- **Primary (Emerald Green):** Used for primary actions, branding, and successful transaction states. It represents the "value" in the waste-to-value cycle.
- **Secondary (Forest Green):** Used for deep backgrounds, sidebars, and high-hierarchy text. It provides a grounded, professional foundation.
- **Tertiary (Lime Green):** Used sparingly as an accent for highlights, notification badges, and to guide the eye toward "new" or "active" elements.
- **Neutral:** A cool slate-tinted white system reduces eye strain and provides a sterile environment for data entry and inventory lists.

## Typography

The typography system focuses on high legibility under varying light conditions (indoor/outdoor).

- **Hanken Grotesk** serves as the primary typeface. Its contemporary, sharp geometry feels technical yet humanist, making it perfect for both Gen-Z mobile users and administrative dashboards.
- **JetBrains Mono** is utilized for labels, inventory weights (kg), currency values, and QR code identifiers. This monospaced choice reinforces the "precision" of the measurement and logistical side of the service.
- **Hierarchy:** Use bold weights for financial values (points/currency) to ensure they are the first thing a user sees.

## Layout & Spacing

This design system employs a **Fluid Grid** model optimized for PWA (Progressive Web App) deployment.

- **Mobile (Default):** A 4-column grid with 16px outer margins. Components are largely full-width or stacked vertically to accommodate one-handed operation in the field.
- **Desktop (Dashboard):** A 12-column grid with a fixed sidebar for navigation. Content areas use 24px gutters to allow for dense data tables and analytics charts.
- **Spacing Rhythm:** Based on an 8px baseline. Use `stack-md` for spacing between related input fields and `stack-lg` for spacing between distinct card sections.

## Elevation & Depth

To maintain a "clean and green" feel, elevation is primarily achieved through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Main background uses the Neutral color. Content blocks sit on pure white (#FFFFFF) cards.
- **Depth:** Instead of heavy shadows, use 1px solid borders in a light gray-green tint to define card boundaries.
- **Active States:** Elements being interacted with (like a selected waste category) should use a subtle inner shadow or a 2px Emerald border to indicate focus.
- **Mascot Integration:** The 'owl' mascot should appear on the highest visual plane, often overlapping the top edges of cards or floating in the corner of empty states to provide a sense of companionship.

## Shapes

The shape language is **Rounded**, reflecting the "circular economy" and the friendly nature of the brand.

- **Standard Radius:** 0.5rem (8px) for buttons, input fields, and small cards.
- **Large Radius:** 1.5rem (24px) for main container cards and the "Input Sampah" (Waste Input) action areas.
- **Circular Elements:** Avatars and status indicators are fully rounded. 
- **Iconography:** Icons should feature rounded terminals and consistent stroke weights to match the typeface's geometric qualities.

## Components

- **Primary Buttons:** High-contrast Emerald backgrounds with white text. Use large, pill-shaped variants for "Submit" and "Scan QR" actions to ensure PWA accessibility.
- **Inventory Cards:** Use a white background with a Forest Green header for the waste category. Quantities (e.g., "5.2 kg") should be in JetBrains Mono at a larger font size.
- **Status Chips:** Small, rounded pills for status tracking (e.g., "Verified," "Pending," "In-Transit"). Use Primary Green for success and Forest Green for neutral states.
- **Waste Input Fields:** Custom numeric inputs with large "+" and "-" steppers to facilitate quick entry of weights without needing a full keyboard.
- **Progress Bars:** Thin, Lime Green bars to show monthly recycling goals or point accumulation.
- **Navigation:** A bottom tab bar for mobile users (Home, Activity, Scan, Wallet, Profile) with the "Scan" button elevated and centered in Primary Emerald.