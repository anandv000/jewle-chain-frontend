import React from "react";
import { theme } from "../theme";
import Icon from "./Icon";

export const Modal = ({ title, onClose, children, width }) => (
  <div className="overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: width || 580 }} onClick={e => e.stopPropagation()}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
          <Icon name="close" size={18} color={theme.textMuted}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const Field = ({ label, children, error }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    <label style={{ fontSize:11, color:theme.textMuted, letterSpacing:0.6, textTransform:"uppercase" }}>{label}</label>
    {children}
    {error && <span style={{ color:theme.danger, fontSize:12 }}>{error}</span>}
  </div>
);

export const StatBox = ({ label, value, sub, icon, color }) => (
  <div className="stat-box card-hover fade-in">
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
      <span style={{ fontSize:12, color:theme.textMuted, letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color||theme.gold}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon name={icon} size={18} color={color||theme.gold}/>
      </div>
    </div>
    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:300, color:color||theme.gold, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:theme.textMuted, marginTop:8 }}>{sub}</div>}
  </div>
);

export default Modal;
