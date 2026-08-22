---
name: Industrial Tactile HMI
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#121212'
  on-primary-container: '#7e7d7d'
  inverse-primary: '#5f5e5e'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b6b5b4'
  tertiary: '#78dc77'
  on-tertiary: '#00390a'
  tertiary-container: '#001702'
  on-tertiary-container: '#2a9035'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#94f990'
  tertiary-fixed-dim: '#78dc77'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005313'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  readout-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  readout-md:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  panel-margin: 24px
  gutter: 16px
  touch-target-min: 48px
  element-gap: 8px
  bezel-width: 2px
---

## Brand & Style
This design system is engineered for high-stakes industrial environments, prioritizing physical intuition and immediate status recognition on a 7-inch HMI. The visual language utilizes **Industrial Skeuomorphism**, bridging the gap between legacy physical control panels and modern digital displays. 

The interface mimics a machined hardware housing with recessed display areas and raised tactile controls. This approach leverages muscle memory by providing clear "affordance"—buttons look pressable, and status indicators mimic physical LEDs. The atmosphere is professional, rugged, and reliable, ensuring operators feel a sense of physical mechanical feedback through visual depth and high-contrast lighting.

## Colors
The palette is rooted in industrial materials and safety standards.
- **Primary (#121212):** Used for the outer chassis and deep recessed backgrounds. It provides the "void" that makes interactive elements pop.
- **Surface (#2A2A2A):** Represents the metallic faceplate. Most controls sit on this surface.
- **Functional LEDs:** Green (#4CAF50), Amber (#FFC107), and Red (#F44336) follow standard industrial signaling. These colors should use a "glow" effect (bloom) when active to simulate a physical light source.
- **Text (#E0E0E0):** A high-contrast off-white to ensure legibility against dark backgrounds without the vibration of pure white.

## Typography
Typography is optimized for glanceability from a distance of 1–2 meters. 
- **Inter** is the primary typeface for its exceptional legibility and neutral, modern feel.
- **Readout** levels are specifically for critical data like temperature and humidity, using heavy weights to dominate the hierarchy.
- **JetBrains Mono** is used for technical labels and hardware-style tags (e.g., "ZONE 01", "AC-INPUT"), mimicking monospaced industrial engravings.
- All labels for buttons should be uppercase to enhance the "machined" aesthetic.

## Layout & Spacing
The layout follows a **Fixed Grid** model optimized for a 1280x800 px landscape orientation. 
- **Structural Zones:** The screen is divided into a Header (Status/Clock), a Main Content Area (Data Visualization/Controls), and a Bottom Navigation Bar (Physical Command Simulation).
- **Safe Zones:** A 24px outer margin acts as a "physical bezel" area. 
- **Touch Targets:** No interactive element should be smaller than 48x48px to accommodate gloved hands or rapid interaction.
- **Grouping:** Use recessed "wells" (inner shadows) to group related data points.

## Elevation & Depth
Depth is the core of this design system's usability.
- **Raised Elements (Buttons):** Use a 2px top-left highlight (#FFFFFF at 10% opacity) and a 3px bottom-right drop shadow (#000000 at 50% opacity) to create a "beveled" extrusion.
- **Recessed Elements (Data Panels):** Use `box-shadow: inset 0px 4px 8px rgba(0,0,0,0.6)` to make the screen feel like it is behind a protective cutout in the metal.
- **Active States:** When pressed, buttons should lose their outer shadow and gain a slight inner shadow to simulate physical displacement into the panel.
- **LED Glow:** Active status indicators use a `drop-shadow` with a 10px blur in the indicator's own color to simulate luminosity.

## Shapes
The shape language is "Soft-Industrial." 
- Use **0.25rem (4px)** as the base radius for most buttons and panels to imply machined metal rather than injection-molded plastic. 
- Circular shapes are reserved exclusively for LED indicators and toggle-switch nodes.
- Horizontal dividers should be rendered as "scored lines"—a 1px dark line with a 1px lighter highlight beneath it to create an etched effect.

## Components
- **Tactile Push Buttons:** Rectangular with a distinct bevel. In their "On" state, the label text or a small embedded LED circle should illuminate.
- **Recessed Data Panels:** Use these as containers for graphs or large readouts. The background should be slightly darker (#1A1A1A) than the main faceplate (#2A2A2A).
- **LED Indicators:** Small circular elements. "Off" state is a dark desaturated version of the color; "On" state is the vibrant color with a radial gradient and outer glow.
- **Industrial Toggle Switches:** A vertical track (recessed) with a circular handle (raised). The handle moves physically between top and bottom positions.
- **Bottom Navigation Bar:** Styled as a "Control Strip." This bar is separated from the main content by a physical-looking seam. Buttons here should feel more like primary hardware toggles.
- **Input Fields:** Styled as "segmented digital displays" for numerical entry, using a slightly thicker recessed border.