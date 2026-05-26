---
name: Intervention Analytics System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-stakes corporate environments where clarity, speed of cognition, and professional trust are paramount. The visual language balances the "Urgent but Calm" dichotomy — using precise data visualization and structured layouts to flag risks without inducing panic.

The style is **Corporate / Modern**, characterized by a rigorous adherence to grid systems, a restrained but functional color palette, and high-readability typography. It avoids decorative flourishes in favor of utility, ensuring that administrators can identify at-risk learners and execute interventions with minimal cognitive load. The aesthetic emphasizes "Early Detection" through clear status signals and organized information density.

## Colors

The palette is anchored in **Deep Navy (#0F172A)** to establish authority and institutional trust. **Professional Blue (#3B82F6)** serves as the primary action color, guiding the eye to interactive elements and primary interventions.

A strict semantic system governs the UI:
- **Emerald Green**: Indicates compliance and successful completion.
- **Amber**: Signals "At-Risk" status, requiring observation.
- **Crimson Red**: Signals "Non-Compliant" or critical failure, requiring immediate intervention.

Neutral grays are used to create structural hierarchy and "quiet" background areas, ensuring the high-contrast status colors remain impactful and easy to scan in dense data environments.

## Typography

The typography utilizes **Inter** exclusively to leverage its exceptional legibility in digital interfaces and data-heavy contexts.

Key typographic rules:
- **Tabular Numerals**: For all tables and progress metrics, the `tnum` feature is enabled to ensure columns of numbers align vertically for easier comparison.
- **Hierarchical Contrast**: Headlines use a Semi-Bold (600) weight to anchor sections, while body text remains Regular (400) for long-form readability.
- **Micro-labels**: Labels for data points and sparkline axes use an All-Caps, Semi-Bold style with increased letter spacing to remain legible at small sizes (12px).

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to ensure data visualizations maintain their intended aspect ratios and readability. A 12-column grid is used with a 24px gutter.

To prevent "data fatigue," the design system employs a generous whitespace strategy:
- **Vertical Rhythm**: A base-8 unit system ensures consistent spacing between dashboard widgets and table rows.
- **Section Padding**: Large blocks of data are separated by `lg` (40px) or `xl` (64px) margins to give the eye a place to rest.
- **Mobile Reflow**: On smaller screens, the 12-column grid collapses into a single-column stack, with horizontal scrolling enabled for data tables to maintain cell integrity.

## Elevation & Depth

The design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to convey depth. This keeps the interface feeling "flat" and professional, preventing visual clutter in complex dashboards.

- **Surface 0**: The background is a very light gray (#F8FAFC).
- **Surface 1 (Cards/Tables)**: Pure white (#FFFFFF) with a 1px border in a subtle gray (#E2E8F0).
- **Surface 2 (Intervention Modals)**: Uses a soft, ambient shadow (0px 4px 20px rgba(15, 23, 42, 0.08)) to draw focus for urgent actions.

Elements that require immediate attention (Intervention Triggers) may use a subtle glow effect using the semantic status color to draw the user's eye without obstructing other data.

## Shapes

The shape language is **Soft** (4px / 0.25rem) to maintain a disciplined, professional appearance while avoiding the harshness of sharp corners.

- **Components**: Buttons, input fields, and status badges use the base 4px radius.
- **Containers**: Dashboard cards and tables use an 8px (0.5rem) radius to create a distinct framing for grouped data.
- **Progress Bars**: Track containers and fills use the same 4px radius, creating a cohesive, structured look within tables.

## Components

### Data-Dense Tables
Tables are the primary tool for progress monitoring. Use 48px row heights for standard density and 40px for high density. The header should be sticky with a subtle bottom border. Use alternating row stripes (zebra striping) only in tables exceeding 20 rows.

### Status Badges
Badges are used to categorize compliance levels. They should feature a low-saturation background with a high-saturation text/icon color for legibility (e.g., Light Red background with Crimson Red text).

### Progress Bars
Bars should be thin (8px height) to fit within table rows. Use semantic colors (Green/Amber/Red) for the fill to indicate not just completion percentage, but also status.

### Trend Sparklines
Sparklines provide context for learner progress over time. They should be rendered in Primary Blue or a neutral gray, turning Crimson Red only if the most recent data point indicates a critical downward trend.

### Intervention Buttons
Action buttons for intervention must be clearly differentiated. The "Primary Intervention" button (e.g., "Assign Remediation") uses a solid Navy or Blue background, while "Secondary" actions use an outlined style.

### Input Fields
Fields should have a 1px border that shifts to Primary Blue on focus. Error states must use the Crimson Red border and include an icon for accessibility.
