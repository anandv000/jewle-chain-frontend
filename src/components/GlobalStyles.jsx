import React from "react";
import { theme } from "../theme";

// GlobalStyles re-renders when parent App calls setIsDark() → all ${theme.xxx}
// template interpolations are re-evaluated with fresh Proxy values → browser
// applies the new <style> text → the whole UI switches theme. Zero prop drilling.

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: ${theme.bg};
      color: ${theme.text};
      font-family: 'DM Sans', sans-serif;
      transition: background 0.25s ease, color 0.2s ease;
    }

    /* ── Scrollbar ─────────────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${theme.surface}; }
    ::-webkit-scrollbar-thumb { background: ${theme.borderGold}; border-radius: 2px; }

    /* ── Animations ────────────────────────────────────────────────────────── */
    @keyframes fadeIn   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer  { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
    @keyframes glow     { 0%,100% { box-shadow:0 0 10px ${theme.gold}30; } 50% { box-shadow:0 0 25px ${theme.gold}60; } }
    @keyframes spin     { to { transform: rotate(360deg); } }

    .fade-in { animation: fadeIn 0.35s ease forwards; }

    /* ── Card hover ─────────────────────────────────────────────────────────── */
    .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${theme.gold}18; }

    /* ── Buttons ────────────────────────────────────────────────────────────── */
    .btn-primary {
      background: linear-gradient(135deg, ${theme.goldDark}, ${theme.gold});
      color: #0D0B07;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-family: 'DM Sans';
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px ${theme.gold}50; filter: brightness(1.08); }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

    .btn-ghost {
      background: transparent;
      color: ${theme.gold};
      border: 1px solid ${theme.borderGold};
      padding: 9px 20px;
      border-radius: 8px;
      font-family: 'DM Sans';
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover { background: ${theme.surfaceAlt}; border-color: ${theme.gold}; }

    .btn-danger {
      background: transparent;
      color: ${theme.danger};
      border: 1px solid ${theme.danger}40;
      padding: 8px 16px;
      border-radius: 7px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'DM Sans';
    }
    .btn-danger:hover { background: ${theme.danger}15; }

    .btn-icon-danger {
      background: transparent;
      color: ${theme.danger};
      border: 1px solid ${theme.danger}40;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-icon-danger:hover { background: ${theme.danger}15; }

    .btn-edit {
      background: transparent;
      color: ${theme.gold};
      border: 1px solid ${theme.borderGold};
      padding: 7px 14px;
      border-radius: 7px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'DM Sans';
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .btn-edit:hover { background: ${theme.gold}15; border-color: ${theme.gold}; }

    /* ── Theme toggle button ─────────────────────────────────────────────────── */
    .btn-theme {
      width: 100%;
      padding: 9px 16px;
      background: ${theme.surfaceAlt};
      color: ${theme.textMuted};
      border: 1px solid ${theme.borderGold};
      border-radius: 8px;
      font-family: 'DM Sans';
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 9px;
      transition: all 0.2s;
    }
    .btn-theme:hover { background: ${theme.gold}12; border-color: ${theme.gold}; color: ${theme.gold}; }

    /* ── Form elements ──────────────────────────────────────────────────────── */
    input, select, textarea {
      background: ${theme.bg};
      border: 1px solid ${theme.borderGold};
      color: ${theme.text};
      padding: 10px 14px;
      border-radius: 8px;
      font-family: 'DM Sans';
      font-size: 14px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }
    input:focus, select:focus, textarea:focus { border-color: ${theme.gold}; }
    input::placeholder, textarea::placeholder { color: ${theme.textMuted}; }
    select option { background: ${theme.surface}; color: ${theme.text}; }

    /* ── Overlay / Modal ────────────────────────────────────────────────────── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    .modal {
      background: ${theme.surface};
      border: 1px solid ${theme.borderGold};
      border-radius: 16px;
      padding: 32px;
      min-width: 360px;
      max-width: 580px;
      width: 90vw;
      animation: slideUp 0.3s ease;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* ── Stat box ───────────────────────────────────────────────────────────── */
    .stat-box {
      background: linear-gradient(145deg, ${theme.surface}, ${theme.surfaceAlt});
      border: 1px solid ${theme.borderGold};
      border-radius: 14px;
      padding: 24px;
      animation: glow 3s ease-in-out infinite;
    }

    /* ── Sidebar nav items ──────────────────────────────────────────────────── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 9px;
      cursor: pointer;
      transition: all 0.2s;
      color: ${theme.textMuted};
      font-size: 14px;
    }
    .nav-item:hover { background: ${theme.surfaceAlt}; color: ${theme.text}; }
    .nav-item.active {
      background: linear-gradient(135deg, ${theme.goldDark}22, ${theme.gold}15);
      color: ${theme.gold};
      border: 1px solid ${theme.borderGold};
    }

    /* ── Step timeline ──────────────────────────────────────────────────────── */
    .step-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: ${theme.surfaceAlt};
      border: 1px solid ${theme.borderGold};
      border-radius: 12px;
      transition: all 0.25s;
    }
    .step-item.done { border-color: ${theme.goldDark}; background: ${theme.goldDark}12; }

    .step-circle {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 2px solid ${theme.borderGold};
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 500;
      transition: all 0.25s;
      flex-shrink: 0;
      color: ${theme.textMuted};
    }
    .step-circle.done {
      background: linear-gradient(135deg, ${theme.goldDark}, ${theme.gold});
      border-color: ${theme.gold};
      color: #0D0B07;
    }
    .step-circle.current {
      border-color: ${theme.gold};
      color: ${theme.gold};
      animation: shimmer 1.5s ease-in-out infinite;
    }

    /* ── Tag pill ───────────────────────────────────────────────────────────── */
    .tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
    }

    /* ── Progress bar ───────────────────────────────────────────────────────── */
    .progress-bar { height: 4px; background: ${theme.borderGold}; border-radius: 2px; overflow: hidden; }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${theme.goldDark}, ${theme.gold});
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    /* ── Typography ─────────────────────────────────────────────────────────── */
    .gram-display { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; color: ${theme.gold}; letter-spacing: -1px; }
    .section-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 400; color: ${theme.text}; letter-spacing: 0.5px; }

    /* ── Table rows ─────────────────────────────────────────────────────────── */
    .table-row {
      display: grid;
      padding: 14px 20px;
      border-bottom: 1px solid ${theme.borderGold};
      transition: background 0.15s;
      align-items: center;
    }
    .table-row:hover { background: ${theme.surfaceAlt}; }

    /* ── Image upload ───────────────────────────────────────────────────────── */
    .img-upload-box {
      border: 2px dashed ${theme.borderGold};
      border-radius: 10px;
      padding: 22px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: ${theme.bg};
    }
    .img-upload-box:hover { border-color: ${theme.gold}; background: ${theme.goldDark}10; }

    /* ── Search input ───────────────────────────────────────────────────────── */
    .search-input {
      background: ${theme.surfaceAlt};
      border: 1px solid ${theme.borderGold};
      color: ${theme.text};
      padding: 9px 14px 9px 36px;
      border-radius: 8px;
      font-family: 'DM Sans';
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      width: 220px;
    }
    .search-input:focus { border-color: ${theme.gold}; }
    .search-input::placeholder { color: ${theme.textMuted}; }
  `}</style>
);

export default GlobalStyles;
