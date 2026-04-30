import React from "react";
import { theme } from "../theme";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: ${theme.bg};
      color: ${theme.text};
      font-family: 'DM Sans', sans-serif;
      transition: background 0.25s ease, color 0.2s ease;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: ${theme.surface}; }
    ::-webkit-scrollbar-thumb { background: ${theme.borderGold}; border-radius: 2px; }

    /* ── Animations ───────────────────────────────────────────────────────── */
    @keyframes fadeIn   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn  { from { transform:translateX(-100%); } to { transform:translateX(0); } }
    @keyframes shimmer  { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
    @keyframes glow     { 0%,100% { box-shadow:0 0 10px ${theme.gold}30; } 50% { box-shadow:0 0 25px ${theme.gold}60; } }
    @keyframes spin     { to { transform: rotate(360deg); } }

    .fade-in { animation: fadeIn 0.35s ease forwards; }

    /* ── Card hover ───────────────────────────────────────────────────────── */
    .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${theme.gold}18; }

    /* ── Buttons ──────────────────────────────────────────────────────────── */
    .btn-primary {
      background: linear-gradient(135deg, ${theme.goldDark}, ${theme.gold});
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-family: 'DM Sans';
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
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
      white-space: nowrap;
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

    /* ── Theme toggle ─────────────────────────────────────────────────────── */
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

    /* ── Form elements ────────────────────────────────────────────────────── */
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

    /* ── Modal / Overlay ──────────────────────────────────────────────────── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
      padding: 16px;
    }
    .modal {
      background: ${theme.surface};
      border: 1px solid ${theme.borderGold};
      border-radius: 16px;
      padding: 32px;
      min-width: 320px;
      max-width: 580px;
      width: 100%;
      animation: slideUp 0.3s ease;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* ── Stat box ─────────────────────────────────────────────────────────── */
    .stat-box {
      background: linear-gradient(145deg, ${theme.surface}, ${theme.surfaceAlt});
      border: 1px solid ${theme.borderGold};
      border-radius: 14px;
      padding: 24px;
      animation: glow 3s ease-in-out infinite;
    }

    /* ── Sidebar nav items ────────────────────────────────────────────────── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
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

    /* ── Step timeline ────────────────────────────────────────────────────── */
    .step-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: ${theme.surfaceAlt};
      border: 1px solid ${theme.borderGold};
      border-radius: 12px;
      transition: all 0.25s;
    }
    .step-item.done { border-color: ${theme.goldDark}; background: ${theme.goldDark}12; }

    .step-circle {
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 2px solid ${theme.borderGold};
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 500;
      transition: all 0.25s;
      flex-shrink: 0;
      color: ${theme.textMuted};
    }
    .step-circle.done  { background: linear-gradient(135deg, ${theme.goldDark}, ${theme.gold}); border-color: ${theme.gold}; color: #fff; }
    .step-circle.current { border-color: ${theme.gold}; color: ${theme.gold}; animation: shimmer 1.5s ease-in-out infinite; }

    /* ── Tag ──────────────────────────────────────────────────────────────── */
    .tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
    }

    /* ── Progress bar ─────────────────────────────────────────────────────── */
    .progress-bar { height: 4px; background: ${theme.borderGold}; border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, ${theme.goldDark}, ${theme.gold}); border-radius: 2px; transition: width 0.4s ease; }

    /* ── Typography ───────────────────────────────────────────────────────── */
    .gram-display { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; color: ${theme.gold}; }
    .section-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 400; color: ${theme.text}; letter-spacing: 0.5px; }

    /* ── Table rows ───────────────────────────────────────────────────────── */
    .table-row { display: grid; padding: 12px 18px; border-bottom: 1px solid ${theme.borderGold}; transition: background 0.15s; align-items: center; }
    .table-row:hover { background: ${theme.surfaceAlt}; }

    /* ── Image upload ─────────────────────────────────────────────────────── */
    .img-upload-box { border: 2px dashed ${theme.borderGold}; border-radius: 10px; padding: 22px; text-align: center; cursor: pointer; transition: all 0.2s; background: ${theme.bg}; }
    .img-upload-box:hover { border-color: ${theme.gold}; background: ${theme.goldDark}10; }

    /* ── Search input ─────────────────────────────────────────────────────── */
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

    /* ══════════════════════════════════════════════════════════════════════
       RESPONSIVE LAYOUT
    ══════════════════════════════════════════════════════════════════════ */

    /* ── Sidebar overlay (mobile backdrop) ───────────────────────────────── */
    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 199;
    }
    .sidebar-overlay.open { display: block; }

    /* ── Sidebar ──────────────────────────────────────────────────────────── */
    .app-sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }

    /* ── Main content ─────────────────────────────────────────────────────── */
    .app-content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
    }

    /* ── Hamburger button (hidden on desktop) ─────────────────────────────── */
    .hamburger-btn {
      display: none;
      position: fixed;
      top: 14px;
      left: 14px;
      z-index: 300;
      background: ${theme.surface};
      border: 1px solid ${theme.borderGold};
      color: ${theme.gold};
      border-radius: 9px;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }

    /* ── Responsive grid helpers ─────────────────────────────────────────── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }

    /* ─── TABLET (≤ 900px) ────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .grid-4 { grid-template-columns: 1fr 1fr; }
      .grid-3 { grid-template-columns: 1fr 1fr; }
      .section-title { font-size: 22px; }
      .search-input { width: 180px; }
    }

    /* ─── MOBILE (≤ 640px) ────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      /* Show hamburger, hide sticky sidebar */
      .hamburger-btn { display: flex; }

      /* Sidebar becomes fixed drawer on mobile */
      .app-sidebar {
        position: fixed;
        top: 0; left: 0;
        height: 100vh;
        z-index: 200;
        transform: translateX(-100%);
      }
      .app-sidebar.open {
        transform: translateX(0);
        animation: slideIn 0.3s ease;
      }

      /* Content takes full width */
      .app-content { padding: 56px 16px 24px !important; }

      /* Grids collapse to single column */
      .grid-2 { grid-template-columns: 1fr; }
      .grid-3 { grid-template-columns: 1fr; }
      .grid-4 { grid-template-columns: 1fr 1fr; }

      .section-title { font-size: 20px; }
      .modal { padding: 20px 16px; border-radius: 12px; }
      .stat-box { padding: 16px; }

      /* Tables scroll horizontally */
      .table-scroll { overflow-x: auto; }

      /* Buttons */
      .btn-primary, .btn-ghost { padding: 9px 16px; font-size: 13px; }

      /* Search input full width on mobile */
      .search-input { width: 100%; }
    }
  `}</style>
);

export default GlobalStyles;
