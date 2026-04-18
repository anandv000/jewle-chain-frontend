// ── Dark theme (original brand) ───────────────────────────────────────────────
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

// ── Light theme — Premium Deep Blue + Rose Gold ────────────────────────────────
// Clean, professional, unique — NOT warm ivory.
// Think: luxury stationery, premium jewellery catalogue, high-end SaaS.
const lightTheme = {
  gold:       "#A0522D",      // sienna / rich copper-gold — excellent on white
  goldLight:  "#C9784A",      // warm copper highlight
  goldDark:   "#7B3F1E",      // deep copper for gradients
  bg:         "#F0F4FA",      // cool blue-tinted white — professional
  surface:    "#FFFFFF",      // pure white cards
  surfaceAlt: "#E8EDF8",      // cool blue-grey for alternating rows/hover
  border:     "#C8D3E8",      // cool slate border
  borderGold: "#C4A882",      // warm gold-tinted border for accents
  text:       "#0F1C3F",      // deep navy — premium feel on white
  textMuted:  "#5A6A8A",      // cool slate-blue muted text
  danger:     "#C0392B",
  success:    "#1A7A3C",
};

// ── Init from localStorage ────────────────────────────────────────────────────
if (typeof window !== "undefined" && window.__atelierDark === undefined) {
  window.__atelierDark = localStorage.getItem("atelierDark") !== "false";
}

// ── Proxy — reads window.__atelierDark on every access ───────────────────────
// When App toggles isDark state, React re-renders all components.
// Every theme.xxx access reads the fresh value — zero prop drilling.
export const theme = new Proxy({}, {
  get(_, key) {
    const isDark = typeof window === "undefined" ? true : window.__atelierDark !== false;
    return (isDark ? darkTheme : lightTheme)[key];
  },
});

export { darkTheme, lightTheme };

export const STEPS = [
  "Design & Wax", "Casting", "Filing & Polishing",
  "Stone Setting", "Quality Check", "Final Polish", "Packaging"
];

export const ALLOWED_IMAGE_TYPES = ["image/avif", "image/jpeg", "image/png"];

export const ALL_PERMISSIONS = [
  "dashboard","admin-stock","customers","products",
  "diamonds","create-order","bag","wastage","ledger","bag-status",
];

export const PERMISSION_LABELS = {
  "dashboard":    "Dashboard",
  "admin-stock":  "Admin Stock",
  "customers":    "Customers",
  "products":     "Products",
  "diamonds":     "Diamonds",
  "create-order": "Create Order",
  "bag":          "Bag Workflow",
  "wastage":      "Wastage Report",
  "ledger":       "Party Ledger",
  "bag-status":   "Bag Status Report",
};
