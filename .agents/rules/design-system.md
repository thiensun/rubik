# CubeMaster AI — Workspace Design System Rule

This rule enforces strict compliance with the established CubeMaster AI design system whenever modifying or adding UI components, pages, or features.

## 1. Core Visual Aesthetic
- **Design Style:** Bento Grid layout, Apple-inspired clean aesthetics, soft neutral tones.
- **Backgrounds:** Canvas `#F8F9FA`, Cards `#FFFFFF` with `rounded-[20px] sm:rounded-[24px]` and `border border-[#EAECEF]`.
- **Primary Action (CTA):** `#111111` with white text, `rounded-xl`, accompanying `.keycap-dark` badge.
- **Typography:** `Inter` for general copy, `JetBrains Mono` for scrambles, WCA notations, HUD telemetry, and cube face labels.

## 2. Geometry & Proportions (Crucial)
- **Strict 1:1 Aspect Ratio:** All 2D Rubik faces, 3x3 grids, and individual sticker cells MUST be strict squares (`aspect-square`). Never allow facelets or stickers to stretch horizontally or vertically into rectangles.
- **3x3 Grid Specification:**
  - Always use: `w-full aspect-square grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-neutral-200/80 rounded-md`.
  - Every sticker inside must use: `w-full h-full aspect-square rounded-[2px]`.

## 3. 2D Net Cube Projection (WCA Standard)
- Maintain the 3-row cross layout:
  - Row 1: `U - VÀNG (ĐỈNH)` at `col-start-2`
  - Row 2: 4 cards spanning all 4 columns: `L - CAM`, `F - XANH LÁ`, `R - ĐỎ`, `B - XANH DƯƠNG`
  - Row 3: `D - TRẮNG (CROSS)` at `col-start-2`
- Face Card styling:
  - Default: `bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl`
  - Active: `ring-2 ring-red-500 bg-red-50/40 rounded-xl`
  - Verified: `bg-neutral-50/80 rounded-xl`
  - Unverified cells use `#DFE5ED` placeholder background; center cell shows center color with `w-1.5 h-1.5 rounded-full bg-black/40`.

## 4. Camera Reticle HUD
- Reticle outer container: `w-[205px] h-[205px] sm:w-[260px] sm:h-[260px] aspect-square rounded-2xl border border-white/30`.
- Reticle 9 cells: `grid-cols-3 grid-rows-3 aspect-square`, each cell `rounded-xl border-2 aspect-square w-full h-full`.

Refer to [DESIGN_GUIDELINES.md](file:///d:/Projects/rubik/DESIGN_GUIDELINES.md) for full color tables and token definitions.
