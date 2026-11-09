# Antigravity UI & Design Engineering Guidelines

Default standards for frontend, web, and mobile UI engineering in Antigravity.

## 1. Antigravity Spatial & Motion Principles
- **Weightlessness & Depth**: Use layered, soft, diffused drop-shadows and subtle CSS perspective for spatial hierarchy.
- **Glassmorphism**: When appropriate, use subtle translucency, background blur (`backdrop-filter: blur(12px)`), and semi-transparent borders for a polished, modern feel.
- **Micro-Interactions**: Smooth, purposeful transitions. Respect `prefers-reduced-motion` at all times.

## 2. Anti-UI Slop (Zero Generic Templates)
- **Product-Specific**: Work directly from the project's domain and data. Never generate generic filler text, fake metrics, or placeholder cards.
- **Complete State Coverage**: Every UI view must account for:
  - Loading states (skeletons or spinners)
  - Empty states (with clear calls-to-action)
  - Error states (actionable recovery)
  - Success and disabled states
- **Design System Cohesion**: Reuse the project's tokens, typography, and spacing before introducing new styles.

## 3. Accessibility & Performance Guardrails
- **Color Contrast**: Maintain a minimum 4.5:1 ratio for normal text.
- **Touch Targets**: Minimum 44x44px for touchable controls on mobile.
- **Visible Focus**: Never strip outline without providing a visible focus ring for keyboard navigation.
- **Performance**: Animate `transform` and `opacity`; avoid animating expensive properties (`box-shadow`, `filter`) continuously.
