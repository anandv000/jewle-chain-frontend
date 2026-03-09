import React from "react";
import { theme } from "../theme";
import Icon from "./Icon";

const StatBox = ({ label, value, sub, icon, color = theme.gold }) => (
  <div className="stat-box card-hover fade-in">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <span style={{ fontSize: 11, color: theme.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={17} color={color} />
      </div>
    </div>
    <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 30, fontWeight: 400, color: theme.text, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: theme.textMuted }}>{sub}</div>}
  </div>
);

export default StatBox;
