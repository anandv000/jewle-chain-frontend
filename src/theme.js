// ── Dark theme ────────────────────────────────────────────────────────────────
const darkTheme = {
  gold:       "#C9A84C",
  goldLight:  "#E8C97A",
  goldDark:   "#9A7A2E",
  bg:         "#0D0B07",
  surface:    "#151209",
  surfaceAlt: "#1C1710",
  border:     "#2A2210",
  borderGold: "#3A2E15",
  text:       "#F0E8D5",
  textMuted:  "#8A7A5A",
  danger:     "#C94C4C",
  success:    "#4CC97A",
};

// ── Light theme — warm ivory / antique gold ────────────────────────────────────
const lightTheme = {
  gold:       "#B8860B",   // dark goldenrod — crisp on white
  goldLight:  "#DAA520",   // goldenrod for highlights
  goldDark:   "#8B6914",   // deep gold for gradients
  bg:         "#FAF8F2",   // warm ivory paper
  surface:    "#FFFFFF",   // pure white cards
  surfaceAlt: "#F5F1E8",   // warm cream rows
  border:     "#DDD0B0",   // soft warm border
  borderGold: "#D4C090",   // warm gold-tinted border
  text:       "#1A1206",   // very dark warm brown
  textMuted:  "#7A6A4A",   // mid warm brown
  danger:     "#B83030",
  success:    "#267A3C",
};

// ── Initialize from localStorage before first render ─────────────────────────
if (typeof window !== "undefined" && window.__atelierDark === undefined) {
  window.__atelierDark = localStorage.getItem("atelierDark") !== "false";
}

// ── Proxy — reads current mode on every property access ───────────────────────
// When App toggles window.__atelierDark and calls setIsDark() → all components
// re-render → theme.xxx reads fresh values → no context / prop drilling needed.
export const theme = new Proxy({}, {
  get(_, key) {
    const isDark = typeof window === "undefined" ? true : window.__atelierDark !== false;
    return (isDark ? darkTheme : lightTheme)[key];
  },
});

// ── Named exports for direct access ──────────────────────────────────────────
export { darkTheme, lightTheme };

export const STEPS = [
  "Design & Wax", "Casting", "Filing & Polishing",
  "Stone Setting", "Quality Check", "Final Polish", "Packaging"
];

export const ALLOWED_IMAGE_TYPES = ["image/avif", "image/jpeg", "image/png"];
