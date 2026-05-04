# SOLINA BIJOUX

> Capturer la lumière.

An immersive, sensorial e-commerce experience for the SOLINA BIJOUX house —
solar, minimal, Mediterranean. Conceived as a digital gallery rather than a
storefront.

## The experience

The site revolves around a persistent **3D Sun** rendered with React Three
Fiber. It serves as logo, light source, navigation guide, and emotional
anchor. The same store drives:

- A custom GLSL fragment shader (organic noise + corona + procedural rays).
- A WebGL water shader with mouse-driven ripples and Fresnel-style sun glints.
- DOM-side lighting (CSS variables on `<html>` are written from the same
  pointer/scroll listeners, so non-WebGL elements also breathe with the sun).
- A narrative phase router that re-tunes light temperature, sun scale, and
  intensity per route (hero → collection → product → checkout).

A cinematic logo intro plays once per session: a point of light blooms into
an orb, rays unfurl, the wordmark rises, the orb migrates into the "O" of
SOLINA, and the veil dissolves to release the sun into the page.

## Architecture

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Mounts SunCanvas, intro, nav, footer
│   ├── page.tsx             # Home (Hero + Narrative)
│   ├── collection/          # Filterable grid
│   ├── product/[handle]/    # 3D viewer + editorial detail
│   ├── about/               # Maison
│   ├── cart/                # Distraction-free cart
│   └── checkout/            # Quiet, minimal checkout
├── components/
│   ├── sun/                 # Sun shader, store, phase router
│   ├── intro/               # Logo cinematic
│   ├── water/               # Shader-driven water
│   ├── home/                # Hero, narrative chapters
│   ├── product/             # Card, grid, viewer, add-to-cart
│   ├── nav/                 # Floating header
│   └── ui/                  # Footer, sound toggle
└── lib/
    ├── shopify.ts           # Storefront API adapter (mock fallback)
    ├── products.ts          # Mock catalog
    └── cart.ts              # Persisted Zustand cart
```

## Tech

- **Next.js 14** (App Router, RSC where possible)
- **React Three Fiber + drei + postprocessing** for 3D
- **GSAP + ScrollTrigger** for cinematic timelines
- **Tailwind CSS 3** with a tight luxury palette
- **Zustand** for sun + cart stores
- **Shopify Storefront API** with a mock fallback so the site runs
  without secrets

## Running

```bash
npm install
npm run dev
```

For a real Shopify backend, set:

```env
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=xxx
```

The adapter in `src/lib/shopify.ts` switches automatically; no other code
changes are needed.

## Performance notes

- The global Sun canvas is `orthographic` with a single shader plane —
  cheap on mobile.
- The product viewer uses `Suspense` + drei's `Environment` preset, with
  conservative shadow map sizes.
- All images are lazy-loaded; remote patterns are configured for
  Unsplash + Shopify CDN.
- Reduced-motion users get a static experience (intro skipped, all
  animations collapsed to 0.01ms).
