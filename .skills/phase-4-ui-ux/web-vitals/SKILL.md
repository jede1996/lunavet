---
name: web-vitals
description: Core Web Vitals optimization (LCP, CLS, INP), bundle chunk analysis, image compression, and render cost minimization.
---

# Core Web Vitals & Frontend Performance Skill

Guarantees sub-second loads and smooth 60fps interactions across mobile and desktop.

## Directives
1. **Largest Contentful Paint (LCP < 2.5s)**: Optimize hero assets with preconnect, modern formats (WebP/AVIF), and priority hints.
2. **Cumulative Layout Shift (CLS < 0.1)**: Always provide explicit aspect ratios for images, canvas elements, and loading placeholders.
3. **Interaction to Next Paint (INP < 200ms)**: Avoid synchronous long tasks on main thread; use `requestAnimationFrame` or transition hooks.
4. **Code Splitting**: Keep vendor chunks partitioned (`vendor-charts`, `vendor-calendar`, `vendor-bootstrap`).
