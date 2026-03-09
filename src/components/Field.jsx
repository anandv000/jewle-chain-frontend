// ── Field ─────────────────────────────────────────────────────────────────────
import React from "react";
import { theme } from "../theme";

export const Field = ({ label, children, error }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, color: theme.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>
      {label}
    </label>
    {children}
    {error && <span className="error-msg">⚠ {error}</span>}
  </div>
);

export default Field;
