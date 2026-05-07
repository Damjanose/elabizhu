---
name: Luxury Jewellery Design System
colors:
  surface: '#fff8f3'
  surface-dim: '#e1d9d0'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2e9'
  surface-container: '#f5ede4'
  surface-container-high: '#efe7de'
  surface-container-highest: '#e9e1d8'
  on-surface: '#1e1b16'
  on-surface-variant: '#4e4639'
  inverse-surface: '#34302a'
  inverse-on-surface: '#f8efe6'
  outline: '#7f7667'
  outline-variant: '#d1c5b4'
  surface-tint: '#775a19'
  primary: '#775a19'
  on-primary: '#ffffff'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#e9c176'
  secondary: '#556156'
  on-secondary: '#ffffff'
  secondary-container: '#d6e3d5'
  on-secondary-container: '#59665a'
  tertiary: '#7d562d'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc9c6d'
  on-tertiary-container: '#55340d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#d9e6d7'
  secondary-fixed-dim: '#bdcabc'
  on-secondary-fixed: '#131e15'
  on-secondary-fixed-variant: '#3e4a3f'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#f0bd8b'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#623f18'
  background: '#fff8f3'
  on-background: '#1e1b16'
  surface-variant: '#e9e1d8'
typography:
  display-xl:
    fontFamily: Noto Serif
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 32px
  margin-desktop: 80px
  margin-mobile: 24px
  section-gap: 120px
---

## Brand & Style
This design system is anchored in the concept of "Quiet Luxury." It prioritizes an editorial aesthetic that mirrors high-end print magazines, emphasizing the storytelling behind every piece of jewellery. The brand personality is sophisticated, calm, and exclusive, targeting a discerning audience that values craftsmanship over clutter.

The visual style is **Minimalism** with a tactile edge. It uses vast expanses of whitespace to create a "gallery" effect, ensuring the products remain the focal point. The emotional response is intended to be one of serenity and aspiration, achieved through a balanced composition of classical serif typography and a modern, functional UI.

## Colors
The palette is inspired by natural elements: raw silk, aged gold, and botanical hues. 
- **Warm White (#F9F8F6):** Serves as the primary canvas, providing a softer, more premium feel than pure white.
- **Deep Gold/Champagne (#C5A059):** Reserved for primary actions, subtle iconography, and highlighting craftsmanship details.
- **Charcoal (#333333):** Used for all primary text to ensure high legibility while maintaining a softer contrast than black.
- **Muted Green & Amber:** Provide organic variety for secondary elements like "Ethics" or "Collection" tags.
- **Soft Crimson (#BC4749):** Used sparingly for urgent notifications or subtle sale indicators, designed to be noticeable without disrupting the calm atmosphere.

## Typography
The typographic hierarchy relies on the tension between the classic **Noto Serif** and the utilitarian **Inter**. 

Headlines use Noto Serif to convey heritage and elegance. Large "Display" sizes should be used for hero sections and collection titles, often with slightly tightened letter-spacing to enhance the editorial look. All UI elements, descriptions, and functional labels use Inter to ensure clarity and a contemporary feel. The "label-sm" style utilizes uppercase and increased tracking for a refined, branded touch on small buttons and categories.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain a curated, boutique-like experience. Content is centered within a 1440px container with generous side margins (80px) to prevent the UI from feeling cramped. 

The rhythm is defined by a "Section Gap" of 120px, forcing a slow, deliberate scroll that allows the user to digest one piece of content at a time. Gutters are intentionally wide (32px) to provide significant breathing room between product cards and text blocks.

## Elevation & Depth
Depth in this design system is achieved through **Ambient Shadows** and tonal layering. Avoid heavy, dark dropshadows. Instead, use highly diffused, low-opacity (4-8%) shadows with a slight warm tint (#332211) to mimic objects resting on a soft surface.

Layers should be used sparingly. Surfaces like modals or dropdowns should match the background color (#F9F8F6) but be elevated by a subtle shadow or a 1px border in a slightly darker stone shade. This creates a flat but sophisticated hierarchy where elements feel "placed" rather than "floating."

## Shapes
The shape language is understated. A **Soft (0.25rem)** roundedness is applied to buttons and input fields to remove the harshness of sharp corners while maintaining a professional, structured look. 

Product images and large cards should retain sharper edges or use the smallest possible radius to keep the editorial magazine feel. Soft circles may be used for decorative elements or functional "swatches" (metal colors), but primary structural containers remain rectangular.

## Components
- **Buttons:** Primary buttons use a solid Charcoal background with Warm White text or a "Ghost" style with a 1px Charcoal border. Labels are always uppercase with letter-spacing.
- **Product Cards:** Minimalist design with no visible borders. The focus is a high-resolution image that triggers a 1.03x zoom on hover. Product name (Serif) and price (Sans-serif) appear centered below.
- **Input Fields:** Use a single bottom border (underlined style) in Charcoal to maintain the "clean" aesthetic, with floating labels in Inter.
- **Chips/Tags:** Small, pill-shaped elements using the Muted Green or Amber palettes with low-opacity backgrounds (10-15%) for subtle categorization.
- **Navigation:** A centered, minimalist header with thin-weight icons. Hover states for nav links should use a simple fade-in underline or opacity change.
- **Motion:** All interactions must use `cubic-bezier(0.4, 0, 0.2, 1)`. Transitions (like page reveals) should involve a 20px "fade-up" motion over 450ms to create a feeling of grace and weight.