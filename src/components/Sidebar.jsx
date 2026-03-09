import React from "react";
import { theme, NAV_ITEMS } from "../theme";
import Icon from "./Icon";

const Sidebar = ({ page, setPage, customers, orders, user, onLogout }) => (
  <div style={{
    width: 240, background: theme.surface,
    borderRight: `1px solid ${theme.borderGold}`,
    padding: "28px 16px", display: "flex",
    flexDirection: "column", gap: 4,
    position: "sticky", top: 0, height: "100vh",
  }}>
    {/* Logo */}
    <div style={{ padding: "0 8px 28px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, color: theme.gold, letterSpacing: 1 }}>
        ✦ AtelierGold
      </div>
      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, letterSpacing: 0.5 }}>
        JEWELLERY MANAGEMENT
      </div>
    </div>

    {/* Nav links */}
    {NAV_ITEMS.map((n) => (
      <div
        key={n.id}
        className={`nav-item ${page === n.id ? "active" : ""}`}
        onClick={() => setPage(n.id)}
      >
        <Icon name={n.icon} size={16} color={page === n.id ? theme.gold : theme.textMuted} />
        <span>{n.label}</span>
      </div>
    ))}

    {/* Footer — user info + logout */}
    <div style={{ marginTop: "auto", borderTop: `1px solid ${theme.borderGold}`, paddingTop: 16 }}>
      {/* Logged in user */}
      {user && (
        <div style={{ padding: "0 8px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: theme.text }}>{user.name}</div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>{user.email}</div>
        </div>
      )}

      {/* Stats */}
      <div style={{ padding: "0 8px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: theme.textMuted }}>
          {customers.length} Clients · {orders.length} Orders
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        style={{
          width: "100%", padding: "9px 16px",
          background: "transparent", color: theme.danger,
          border: `1px solid #C94C4C40`, borderRadius: 8,
          fontFamily: "'DM Sans'", fontSize: 13,
          cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        ⎋ Logout
      </button>
    </div>
  </div>
);

export default Sidebar;
