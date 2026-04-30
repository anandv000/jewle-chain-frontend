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

// Warm Sand / Parchment — NOT white, NOT eye-straining
// Like afternoon light on handmade paper — artisan jewellery aesthetic
const lightTheme = {
  gold:       "#8B5E1A",
  goldLight:  "#B5823E",
  goldDark:   "#6B3F0E",
  bg:         "#EDE5D8",   // warm sand background
  surface:    "#F5EFE3",   // warm parchment cards
  surfaceAlt: "#E4D9C8",   // deeper sand for hover / alt rows
  border:     "#C9B99A",   // warm tan border
  borderGold: "#B89260",   // gold-tinted accent border
  text:       "#1C1006",   // near-black warm brown
  textMuted:  "#6B5030",   // warm medium brown
  danger:     "#B83020",
  success:    "#2A7040",
};

if (typeof window !== "undefined" && window.__atelierDark === undefined) {
  window.__atelierDark = localStorage.getItem("atelierDark") !== "false";
}

export const theme = new Proxy({}, {
  get(_, key) {
    const isDark = typeof window === "undefined" ? true : window.__atelierDark !== false;
    return (isDark ? darkTheme : lightTheme)[key];
  },
});

export { darkTheme, lightTheme };

export const STEPS = [
  "Design & Wax", "Casting", "Filing & Polishing",
  "Stone Setting", "Quality Check", "Final Polish", "Packaging",
];

export const ALLOWED_IMAGE_TYPES = ["image/avif", "image/jpeg", "image/png"];

export const ALL_PERMISSIONS = [
  "dashboard", "admin-stock", "customers", "products",
  "diamonds", "create-order", "bag", "wastage", "ledger", "bag-status", "billing",
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
  "billing":      "Billing & Invoices",
};
