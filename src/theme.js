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

// Crystal Clear White + Dark Blue — clean, professional, modern
// White backgrounds, dark navy accents — easy on the eyes, business-appropriate
// NOTE: "gold" keys are reused as the navy accent in light mode (no rename needed
//        across 17 pages that reference theme.gold / theme.goldDark / theme.goldLight)
const lightTheme = {
  gold:       "#1E3A8A",   // deep navy — primary accent (replaces gold)
  goldLight:  "#3B5BC9",   // brighter blue for hover / gradients
  goldDark:   "#152C6B",   // darker navy for pressed / gradients
  bg:         "#F7F9FC",   // very light blue-gray page background
  surface:    "#FFFFFF",   // pure white cards
  surfaceAlt: "#EEF2F8",   // soft blue-gray for hover / alt rows
  border:     "#D6DEEA",   // light blue-gray border
  borderGold: "#B8C5DC",   // slightly stronger blue-gray accent border
  text:       "#0F1B33",   // deep navy near-black text
  textMuted:  "#5A6B85",   // medium slate-blue for secondary text
  danger:     "#D32F2F",   // clear red
  success:    "#2E7D5B",   // clear green
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
