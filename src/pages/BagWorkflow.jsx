import React, { useState } from "react";
import { theme, STEPS } from "../theme";
import { orderAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";

const ACCES_ROWS  = ["Solder", "Wire", "Finding", "Metal"];
const DEPT_LABELS = ["SGRD", "CAST", "FIL", "EP", "POL", "SET", "FPOL"];

// ── Metal helpers ─────────────────────────────────────────────────────────────
const metalColor = (o) => (o?.metalType === "silver") ? "#C0C0C0" : theme.gold;
const metalLabel = (o) => (o?.metalType === "silver") ? "Silver" : "Gold";
const metalIcon  = (o) => (o?.metalType === "silver") ? "◆" : "✦";

// ── Owner Badge ───────────────────────────────────────────────────────────────
const OwnerBadge = ({ order, style = {} }) => {
  if (!order?.usesOwnerGold && !order?.usesOwnerSilver) return null;
  return (
    <span style={{ background:"#7B5EA715", border:"1px solid #7B5EA750", color:"#B39DDB", fontSize:11, padding:"3px 10px", borderRadius:12, fontFamily:"'DM Sans'", fontWeight:500, ...style }}>
      {metalIcon(order)} Using Owner's {metalLabel(order)} (Lariot Jweles)
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PDF HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildDefaults = (o) => ({
  cCode:"", kt:"", bagQty:"1", styleInstr:"", findingInstr:"",
  accessories: ACCES_ROWS.map(name => ({ name, issue1:"", issue2:"", issue3:"", rec1:"", rec2:"", rec3:"" })),
  depts: DEPT_LABELS.map((dept, i) => ({
    dept, date:"", worker:"",
    issue: o.gramHistory?.[i]     != null ? String(o.gramHistory[i])     : "",
    rec:   o.gramHistory?.[i + 1] != null ? String(o.gramHistory[i + 1]) : "",
    diff:"", dust:"",
  })),
});

// ── Bag Sheet Block — job card layout matching physical example
// 760×1075px fills half-A4 at scale(0.5222) — zero blank space
// Design: two-column info header + large image | gray section headers | bold footer
function bagSheetBlock(order, manual) {
  const mc   = (order.metalType || "gold") === "silver" ? "Silver" : "Gold";
  const gWT  = order.castingGold || order.castingSilver || order.gramHistory?.[0] || 0;
  const nWT  = order.gramHistory?.length > 0 ? order.gramHistory[order.gramHistory.length - 1] : 0;
  const dWT  = (order.diamondShapes||[]).reduce((s,d) => s+(d.weight||0)*(d.pcs||1), 0);
  const dPcs = (order.diamondShapes||[]).reduce((s,d) => s+(d.pcs||1), 0);

  const img = order.itemImage
    ? `<img src="${order.itemImage}" style="width:100%;height:100%;object-fit:cover;display:block;"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:9px;font-style:italic;background:#f9f9f9;">No Image</div>`;

  // ── Row builders ──────────────────────────────────────────────────────────
  const TD  = `border:1px solid #000;padding:4px 5px;font-size:9px;`;
  const TDL = `${TD}font-weight:bold;background:#f0f0f0;white-space:nowrap;`;

  const acceRows = (manual.accessories||[]).map(a =>
    `<tr><td style="${TDL}width:68px;">${a.name}</td>
     <td style="${TD}">${a.issue1||""}</td><td style="${TD}">${a.issue2||""}</td><td style="${TD}">${a.issue3||""}</td>
     <td style="${TD}">${a.rec1||""}</td><td style="${TD}">${a.rec2||""}</td><td style="${TD}">${a.rec3||""}</td></tr>`
  ).join("");

  const deptRows = (manual.depts||[]).map(d =>
    `<tr><td style="${TDL}width:48px;">${d.dept}</td>
     <td style="${TD}">${d.date||""}</td><td style="${TD}">${d.worker||""}</td>
     <td style="${TD}">${d.issue||""}</td><td style="${TD}">${d.rec||""}</td>
     <td style="${TD}">${d.diff||""}</td><td style="${TD}">${d.dust||""}</td></tr>`
  ).join("");

  const diaRows = (order.diamondShapes||[]).length
    ? order.diamondShapes.map(d =>
        `<tr><td style="${TD}">${d.shapeName||"—"}</td><td style="${TD}">${d.sizeInMM||"—"}</td>
         <td style="${TD}">${d.weight??""}</td><td style="${TD}">${d.pcs??1}</td>
         <td style="${TD}">${((d.weight||0)*(d.pcs||1)).toFixed(3)}</td>
         <td style="${TD}"></td><td style="${TD}"></td><td style="${TD}"></td><td style="${TD}"></td></tr>`
      ).join("")
    : `<tr><td colspan="9" style="${TD}text-align:center;color:#bbb;font-style:italic;">No diamonds</td></tr>`;

  // ── Reusable style strings ─────────────────────────────────────────────────
  // Section header (gray label bar — matches example PDF)
  const SEC = `flex:0 0 auto;background:#c8c8c8;font-weight:bold;font-size:9px;padding:3px 7px;border-top:1.5px solid #000;border-bottom:1px solid #000;text-transform:uppercase;letter-spacing:.5px;`;
  // Table header cell
  const TH  = `background:#e6e6e6;font-weight:bold;text-align:center;font-size:8.5px;padding:4px 3px;border:1px solid #000;`;
  // Table section wrapper (fills available flex space)
  const TW  = `flex:1;min-height:0;overflow:hidden;`;
  // Full-height table inside flex wrapper
  const TBL = `width:100%;height:100%;border-collapse:collapse;font-size:9px;`;

  return `
<div style="width:760px;height:1075px;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;border:2px solid #000;">

  <!-- ═══ HEADER: info grid (75%) + product image (25%) ══════════════════ -->
  <div style="display:flex;flex:0 0 172px;border-bottom:2px solid #000;">

    <!-- Left: 4-column info table matching example layout -->
    <div style="flex:0 0 75%;border-right:2px solid #000;padding:6px 8px;display:flex;flex-direction:column;justify-content:space-between;">
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <tr>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;width:27%;">Bag No&nbsp;:</td>
          <td style="padding:3px 6px;width:22%;"><b>${order.bagId||"—"}</b></td>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;width:20%;">C.Code&nbsp;:</td>
          <td style="padding:3px 5px;">${manual.cCode||"—"}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;">Design No&nbsp;:</td>
          <td style="padding:3px 6px;">${order.itemNumber||order.item||"—"}</td>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;">KT&nbsp;:</td>
          <td style="padding:3px 5px;">${manual.kt||"—"}&nbsp;&nbsp;Bag Qty&nbsp;:&nbsp;${manual.bagQty||"1"}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;">Order Date&nbsp;:</td>
          <td style="padding:3px 6px;">${fmt2(order.orderDate)}</td>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;">Order&nbsp;:</td>
          <td style="padding:3px 5px;">ORD-${order.bagId||"—"}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;padding:3px 0;white-space:nowrap;">Delivery Date&nbsp;:</td>
          <td style="padding:3px 6px;">${fmt2(order.deliveryDate)}</td>
          <td style="font-weight:bold;padding:3px 0;">Tone&nbsp;:</td>
          <td style="padding:3px 5px;">${mc}</td>
        </tr>
        <tr>
          <td style="font-weight:bold;padding:3px 0;">Category&nbsp;:</td>
          <td style="padding:3px 6px;">${order.folder||"—"}</td>
          <td style="font-weight:bold;padding:3px 0;">Size&nbsp;:</td>
          <td style="padding:3px 5px;">${order.size||"—"}</td>
        </tr>
      </table>
      <!-- Customer name row at the bottom of header -->
      <div style="font-size:10px;padding-top:5px;border-top:1px solid #ddd;margin-top:4px;">
        <b>Customer&nbsp;:</b>&nbsp;${order.customerName||"—"}
        ${(order.usesOwnerGold||order.usesOwnerSilver) ? `&nbsp;<span style="font-size:8px;color:#888;">(${mc} from Owner: Lariot Jweles)</span>` : ""}
      </div>
    </div>

    <!-- Right: product image (fills full header height) -->
    <div style="flex:1;overflow:hidden;">${img}</div>
  </div>

  <!-- ═══ STYLE / FINDING INSTRUCTION ROW ══════════════════════════════════ -->
  <div style="display:flex;flex:0 0 30px;border-bottom:1.5px solid #000;">
    <div style="flex:1;padding:4px 8px;border-right:1px solid #000;font-size:9.5px;display:flex;align-items:center;overflow:hidden;">
      <b>Style&nbsp;Instr&nbsp;:&nbsp;</b><span style="color:#444;">${manual.styleInstr||""}</span>
    </div>
    <div style="flex:1;padding:4px 8px;font-size:9.5px;display:flex;align-items:center;overflow:hidden;">
      <b>Finding&nbsp;Instr&nbsp;:&nbsp;</b><span style="color:#444;">${manual.findingInstr||""}</span>
    </div>
  </div>

  <!-- ═══ ACCESSORIES ═════════════════════════════════════════════════════ -->
  <div style="${SEC}">ACCESSORIES</div>
  <div style="${TW}">
    <table style="${TBL}">
      <thead><tr>
        <th style="${TH}width:68px;text-align:left;">Acces.</th>
        <th style="${TH}">Issue</th><th style="${TH}">Issue</th><th style="${TH}">Issue</th>
        <th style="${TH}">Rec</th><th style="${TH}">Rec</th><th style="${TH}">Rec</th>
      </tr></thead>
      <tbody>${acceRows}</tbody>
    </table>
  </div>

  <!-- ═══ DEPT WORKFLOW ════════════════════════════════════════════════════ -->
  <div style="${SEC}">DEPT WORKFLOW</div>
  <div style="${TW}">
    <table style="${TBL}">
      <thead><tr>
        <th style="${TH}width:48px;text-align:left;">Dept</th>
        <th style="${TH}">Date</th><th style="${TH}">Worker</th>
        <th style="${TH}">Issue</th><th style="${TH}">Rec</th>
        <th style="${TH}">Diff</th><th style="${TH}">Dust</th>
      </tr></thead>
      <tbody>${deptRows}</tbody>
    </table>
  </div>

  <!-- ═══ DIAMOND DETAILS ══════════════════════════════════════════════════ -->
  <div style="${SEC}">DIAMOND DETAILS</div>
  <div style="${TW}">
    <table style="${TBL}">
      <thead>
        <tr>
          <th rowspan="2" style="${TH}text-align:left;">Diamond Code</th>
          <th rowspan="2" style="${TH}">Size</th>
          <th rowspan="2" style="${TH}">WT</th>
          <th rowspan="2" style="${TH}">Pcs</th>
          <th rowspan="2" style="${TH}">Total</th>
          <th colspan="2" style="${TH}">Issue</th>
          <th colspan="2" style="${TH}">Return</th>
        </tr>
        <tr>
          <th style="${TH}">Pcs</th><th style="${TH}">WT</th>
          <th style="${TH}">Pcs</th><th style="${TH}">WT</th>
        </tr>
      </thead>
      <tbody>${diaRows}</tbody>
    </table>
  </div>

  <!-- ═══ WEIGHT FOOTER (matches example: G.WT | D.WT | N.WT) ═══════════ -->
  <div style="display:flex;flex:0 0 58px;border-top:2px solid #000;">
    <div style="flex:1;display:flex;align-items:center;justify-content:center;border-right:1.5px solid #000;gap:8px;padding:6px;">
      <span style="font-size:9px;color:#555;">G.WT:</span>
      <span style="font-weight:bold;font-size:15px;">${gWT.toFixed(3)}</span>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;border-right:1.5px solid #000;gap:8px;padding:6px;">
      <span style="font-size:9px;color:#555;">D.WT:</span>
      <span style="font-weight:bold;font-size:15px;">${dPcs}&nbsp;&nbsp;${dWT.toFixed(3)}</span>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px;">
      <span style="font-size:9px;color:#555;">N.WT:</span>
      <span style="font-weight:bold;font-size:15px;">${nWT.toFixed(3)}</span>
    </div>
  </div>

</div>`;
}

// Empty cell placeholder
const emptyCell = () => `
<div style="width:760px;height:1075px;display:flex;align-items:center;justify-content:center;border:3px dashed #ddd;box-sizing:border-box;background:#fafafa;">
  <div style="text-align:center;color:#bbb;font-family:Arial,sans-serif;font-size:11px;">
    // <div style="font-size:30px;margin-bottom:8px;line-height:1;">+</div>
    // <div>Empty Slot</div>
  </div>
</div>`;

// ── Shared CSS for 4-up layout ─────────────────────────────────────────────────
// ── PDF CSS ─────────────────────────────────────────────────────────────────
// Scale math:  cell width = 105mm × (96dpi ÷ 25.4mm/in) = 396.85px
//              scale = 396.85 ÷ 760 = 0.5222
//              cell height = 148.5mm × (96 ÷ 25.4) = 561.26px
//              required sheet height = 561.26 ÷ 0.5222 = 1075px
// ➜  A 760×1075px sheet scaled 0.5222 fills 105×148.5mm with 0% blank space.
const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; }
  @media print { body { margin:0; padding:0; } @page { margin:0; size: A4 portrait; } }

  .a4-page {
    width: 210mm; height: 297mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    overflow: hidden;
  }

  /* Each cell naturally gets 105mm × 148.5mm from the 1fr grid */
  .cell { overflow: hidden; position: relative; border: 0.2mm solid #ccc; }

  /* Sheet is 760×1075px — scaled to fill the cell with zero leftover space */
  .sheet-wrap {
    position: absolute; top: 0; left: 0;
    transform-origin: top left;
    transform: scale(0.5222);
    width: 760px; height: 1075px;
  }
`;

// ── 4-up PDF: 4 DIFFERENT bags in 4 slots ─────────────────────────────────────
// slots: array of 4 items, each is {order, manual} or null
function generate4UpHTML(slots) {
  const cells = slots.map(slot =>
    slot
      ? `<div class="cell"><div class="sheet-wrap">${bagSheetBlock(slot.order, slot.manual)}</div></div>`
      : `<div class="cell"><div class="sheet-wrap">${emptyCell()}</div></div>`
  ).join("\n");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>4-up Bag Sheet</title>
<style>${SHARED_CSS}</style>
</head><body>
<div class="a4-page">${cells}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;
}

// ── Single-bag legacy PDF (4 same copies) still available from detail view ────
function generateSingleBagHTML(order, manual) {
  const block = bagSheetBlock(order, manual);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Bag Sheet — ${order.bagId||"ORDER"}</title>
<style>${SHARED_CSS}</style>
</head><body>
<div class="a4-page">
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;
}

const openHTML = (html) => {
  const blob = new Blob([html], { type:"text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) alert("Allow popups → Print → Save as PDF");
  setTimeout(() => URL.revokeObjectURL(url), 90000);
};

// ─────────────────────────────────────────────────────────────────────────────
//  POSITION PICKER MODAL
//  Opens when a user clicks "PDF" on a bag card from the list view
//  Shows a 2×2 grid of positions — user picks where to place this bag
// ─────────────────────────────────────────────────────────────────────────────
const PositionPickerModal = ({ order, slots, onClose, onPick }) => {
  const mc = metalColor(order);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"92vw", maxWidth:480 }}>
        {/* Header */}
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:mc, marginBottom:4 }}>
          {metalIcon(order)} Choose Print Position — Bag #{order.bagId}
        </div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:20 }}>
          Select which position on the A4 sheet this bag should occupy.
        </div>

        {/* 2×2 grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[0,1,2,3].map(i => {
            const slot     = slots[i];
            const isEmpty  = !slot;
            const isSame   = slot?.order?._id === order._id;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                style={{
                  background: isSame ? `${mc}20` : isEmpty ? theme.surfaceAlt : `${theme.danger}08`,
                  border: `2px solid ${isSame ? mc : isEmpty ? theme.borderGold : `${theme.danger}40`}`,
                  borderRadius:12, padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = mc; e.currentTarget.style.background = `${mc}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isSame ? mc : isEmpty ? theme.borderGold : `${theme.danger}40`; e.currentTarget.style.background = isSame ? `${mc}20` : isEmpty ? theme.surfaceAlt : `${theme.danger}08`; }}
              >
                {/* Position number badge */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:isSame?mc:`${mc}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:isSame?"#0D0B07":mc, flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>
                    {i === 0 ? "Top Left" : i === 1 ? "Top Right" : i === 2 ? "Bottom Left" : "Bottom Right"}
                  </div>
                </div>
                {/* Current slot content */}
                {isEmpty ? (
                  <div style={{ fontSize:12, color:theme.textMuted }}>— Empty slot —</div>
                ) : isSame ? (
                  <div style={{ fontSize:12, color:mc, fontWeight:500 }}>✓ This bag (current)</div>
                ) : (
                  <div>
                    <div style={{ fontSize:12, color:theme.danger }}>⚠ Will replace:</div>
                    <div style={{ fontSize:13, color:theme.text, fontWeight:500, marginTop:2 }}>Bag #{slot.order.bagId}</div>
                    <div style={{ fontSize:11, color:theme.textMuted }}>{slot.order.customerName}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Layout diagram hint */}
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:11, color:theme.textMuted }}>
          <div style={{ marginBottom:6, color:theme.text, fontWeight:500 }}>A4 Layout:</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, width:120 }}>
            {["1","2","3","4"].map(n=>(
              <div key={n} style={{ background:theme.bg, border:`1px solid ${theme.borderGold}`, borderRadius:4, padding:"4px 0", textAlign:"center", fontSize:12, color:theme.gold, fontWeight:700 }}>{n}</div>
            ))}
          </div>
        </div>

        <button onClick={onClose} style={{ width:"100%", background:"transparent", color:theme.textMuted, border:`1px solid ${theme.borderGold}`, padding:"10px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  SLOT MANUAL FIELDS MODAL
//  Edit KT, CCode, instructions etc. for one slot, then generate
// ─────────────────────────────────────────────────────────────────────────────
const SlotManualModal = ({ slotIndex, slot, onClose, onUpdate }) => {
  const [manual, setManual] = useState(() => slot.manual);
  const { order } = slot;
  const mc = metalColor(order);
  const set = (k,v) => setManual(p=>({...p,[k]:v}));
  const updAcces = (idx,k,v) => setManual(p=>{const a=[...p.accessories];a[idx]={...a[idx],[k]:v};return{...p,accessories:a};});
  const updDept  = (idx,k,v) => setManual(p=>{const d=[...p.depts];d[idx]={...d[idx],[k]:v};return{...p,depts:d};});
  const [tab, setTab] = useState("info");

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };
  const cellInp = { ...inp, padding:"5px 6px", fontSize:12, textAlign:"center" };
  const TH = ({ children, w }) => <th style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", padding:"6px", borderBottom:`1px solid ${theme.borderGold}`, textAlign:"center", fontWeight:500, width:w }}>{children}</th>;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(4px)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"92vw", maxWidth:780, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${theme.borderGold}`, flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:mc }}>
              Position {slotIndex+1} — Bag #{order.bagId}
            </div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>{order.customerName} · {order.item}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${theme.borderGold}`, padding:"0 24px", flexShrink:0 }}>
          {[["info","Info"],["acces","Accessories"],["dept","Dept Workflow"]].map(([k,lbl])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 16px", fontSize:13, fontFamily:"'DM Sans'", color:tab===k?mc:theme.textMuted, borderBottom:`2px solid ${tab===k?mc:"transparent"}`, marginBottom:-1 }}>{lbl}</button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["C.Code","cCode","e.g. GJ05","text"],["KT/Grade","kt","e.g. 18K","text"],["Bag Qty","bagQty","1","number"]].map(([lbl,k,ph,type])=>(
                  <div key={k}><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:4 }}>{lbl}</div><input style={inp} type={type} value={manual[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["Style Instructions","styleInstr","Style..."],["Finding Instructions","findingInstr","Finding..."]].map(([lbl,k,ph])=>(
                  <div key={k}><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:4 }}>{lbl}</div><input style={inp} value={manual[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
            </div>
          )}
          {tab === "acces" && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:520 }}>
                <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={80}>Acces.</TH><TH>Issue 1</TH><TH>Issue 2</TH><TH>Issue 3</TH><TH>Rec 1</TH><TH>Rec 2</TH><TH>Rec 3</TH></tr></thead>
                <tbody>{(manual.accessories||[]).map((a,idx)=>(
                  <tr key={a.name} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <td style={{ padding:"7px 6px", fontSize:13, color:mc, fontWeight:500 }}>{a.name}</td>
                    {["issue1","issue2","issue3","rec1","rec2","rec3"].map(k=>(
                      <td key={k} style={{ padding:"4px 3px" }}><input style={cellInp} value={a[k]||""} onChange={e=>updAcces(idx,k,e.target.value)} placeholder="—"/></td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab === "dept" && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
                <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={50}>Dept</TH><TH>Date</TH><TH>Worker</TH><TH>Issue(g)</TH><TH>Rec(g)</TH><TH>Diff</TH><TH>Dust</TH></tr></thead>
                <tbody>{(manual.depts||[]).map((d,idx)=>(
                  <tr key={d.dept} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <td style={{ padding:"7px 6px", fontSize:13, color:mc, fontWeight:500 }}>{d.dept}</td>
                    {["date","worker","issue","rec","diff","dust"].map(k=>(
                      <td key={k} style={{ padding:"4px 3px" }}><input style={cellInp} value={d[k]||""} onChange={e=>updDept(idx,k,e.target.value)} placeholder="—"/></td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding:"14px 24px", borderTop:`1px solid ${theme.borderGold}`, flexShrink:0, display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ background:"transparent", color:mc, border:`1px solid ${theme.borderGold}`, padding:"8px 18px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>{ onUpdate(manual); onClose(); }} style={{ background:`linear-gradient(135deg,#9A7A2E,#C9A84C)`, color:"#0D0B07", border:"none", padding:"9px 22px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Save Fields
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  FOUR-UP BUILDER PANEL (shown in list view below filters)
// ─────────────────────────────────────────────────────────────────────────────
const FourUpBuilderPanel = ({ slots, onClearSlot, onEditSlot, onGenerate }) => {
  const filledCount = slots.filter(Boolean).length;

  return (
    <div style={{ background:theme.surface, border:`1px solid ${theme.gold}40`, borderRadius:14, padding:20, marginBottom:20 }}>
      {/* Panel header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:14, color:theme.gold, fontWeight:600 }}>
            📄 4-up PDF Builder
            <span style={{ marginLeft:10, fontSize:12, color:theme.textMuted, fontWeight:400 }}>
              {filledCount}/4 slots filled
            </span>
          </div>
          <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>
            Click a bag's <strong style={{color:theme.gold}}>PDF</strong> button to assign it to a position
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={filledCount === 0}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:filledCount>0?"linear-gradient(135deg,#9A7A2E,#C9A84C)":"#2a2210",
            color:filledCount>0?"#0D0B07":theme.textMuted,
            border:"none", padding:"10px 22px", borderRadius:9,
            fontFamily:"'DM Sans'", fontWeight:700, fontSize:13,
            cursor:filledCount>0?"pointer":"not-allowed", transition:"all 0.2s",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
          Generate 4-up PDF
        </button>
      </div>

      {/* 2×2 slot grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {slots.map((slot, i) => {
          const mc = slot ? metalColor(slot.order) : theme.borderGold;
          return (
            <div key={i} style={{ background:slot?`${mc}08`:theme.surfaceAlt, border:`1.5px ${slot?"solid":"dashed"} ${slot?mc:theme.borderGold}`, borderRadius:10, padding:"12px 14px", minHeight:80, display:"flex", alignItems:"center", gap:12, transition:"all 0.2s" }}>
              {/* Position badge */}
              <div style={{ width:32, height:32, borderRadius:8, background:slot?mc:`${theme.borderGold}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:slot?"#0D0B07":theme.textMuted, flexShrink:0 }}>
                {i+1}
              </div>
              {slot ? (
                <>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, color:mc, fontFamily:"'Cormorant Garamond',serif" }}>#{slot.order.bagId}</div>
                    <div style={{ fontSize:12, color:theme.text, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{slot.order.customerName}</div>
                    <div style={{ fontSize:11, color:theme.textMuted, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{slot.order.item}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
                    <button onClick={()=>onEditSlot(i)} style={{ background:`${mc}15`, border:`1px solid ${mc}40`, color:mc, padding:"3px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans'" }}>
                      Edit
                    </button>
                    <button onClick={()=>onClearSlot(i)} style={{ background:`${theme.danger}10`, border:`1px solid ${theme.danger}30`, color:theme.danger, padding:"3px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans'" }}>
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex:1, fontSize:12, color:theme.textMuted }}>
                  — Empty —<br/>
                  <span style={{ fontSize:11 }}>Click PDF on any bag →</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  SINGLE-BAG PDF MODAL (detail view — 4 same copies)
// ─────────────────────────────────────────────────────────────────────────────
const PDFModal = ({ order, onClose }) => {
  const [manual, setManual] = useState(() => buildDefaults(order));
  const [tab, setTab] = useState("info");
  const mc = metalColor(order);
  const set = (k,v) => setManual(p=>({...p,[k]:v}));
  const updAcces = (idx,k,v) => setManual(p=>{const a=[...p.accessories];a[idx]={...a[idx],[k]:v};return{...p,accessories:a};});
  const updDept  = (idx,k,v) => setManual(p=>{const d=[...p.depts];d[idx]={...d[idx],[k]:v};return{...p,depts:d};});
  const generate = () => openHTML(generateSingleBagHTML(order, manual));
  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };
  const cellInp = { ...inp, padding:"5px 6px", fontSize:12, textAlign:"center" };
  const TH = ({ children, w }) => <th style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", padding:"7px 6px", borderBottom:`1px solid ${theme.borderGold}`, textAlign:"center", fontWeight:500, width:w }}>{children}</th>;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"94vw", maxWidth:820, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, color:mc }}>{metalIcon(order)} Bag #{order.bagId} — 4 Same Copies</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
              <div style={{ fontSize:12, color:theme.textMuted }}>Fill fields → Generate → Print → Save as PDF</div>
              <OwnerBadge order={order}/>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${theme.borderGold}`, padding:"0 28px", flexShrink:0 }}>
          {[["info","Order Info"],["acces","Accessories"],["dept","Dept Workflow"]].map(([k,lbl])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 18px", fontSize:13, fontFamily:"'DM Sans'", color:tab===k?mc:theme.textMuted, borderBottom:`2px solid ${tab===k?mc:"transparent"}`, marginBottom:-1 }}>{lbl}</button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px 24px" }}>
                {[["Bag",`#${order.bagId}`],["Customer",order.customerName],["Metal",metalLabel(order)],["Category",order.folder],["Item",order.item],["Casting",order.castingGold>0?`${order.castingGold}g`:order.castingSilver>0?`${order.castingSilver}g`:"Not cast"]].map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:13 }}>{v||"—"}</div></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["C.Code","cCode","e.g. GJ05","text"],["KT/Grade","kt","e.g. 18K","text"],["Bag Qty","bagQty","1","number"]].map(([lbl,k,ph,type])=>(
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} type={type} value={manual[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["Style Instructions","styleInstr","Style..."],["Finding Instructions","findingInstr","Finding..."]].map(([lbl,k,ph])=>(
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} value={manual[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
            </div>
          )}
          {tab === "acces" && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
                <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={80}>Acces.</TH><TH>Issue 1</TH><TH>Issue 2</TH><TH>Issue 3</TH><TH>Rec 1</TH><TH>Rec 2</TH><TH>Rec 3</TH></tr></thead>
                <tbody>{manual.accessories.map((a,idx)=>(
                  <tr key={a.name} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <td style={{ padding:"8px 6px", fontSize:13, color:mc, fontWeight:500 }}>{a.name}</td>
                    {["issue1","issue2","issue3","rec1","rec2","rec3"].map(k=>(
                      <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={a[k]||""} onChange={e=>updAcces(idx,k,e.target.value)} placeholder="—"/></td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab === "dept" && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
                <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={52}>Dept</TH><TH>Date</TH><TH>Worker</TH><TH>Issue(g)</TH><TH>Rec(g)</TH><TH>Diff</TH><TH>Dust</TH></tr></thead>
                <tbody>{manual.depts.map((d,idx)=>(
                  <tr key={d.dept} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <td style={{ padding:"8px 6px", fontSize:13, color:mc, fontWeight:500 }}>{d.dept}</td>
                    {["date","worker","issue","rec","diff","dust"].map(k=>(
                      <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={d[k]||""} onChange={e=>updDept(idx,k,e.target.value)} placeholder="—"/></td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 28px", borderTop:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div style={{ fontSize:12, color:theme.textMuted }}>Prints 4 identical copies of this bag on one A4</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ background:"transparent", color:mc, border:`1px solid ${theme.borderGold}`, padding:"9px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={generate} style={{ background:`linear-gradient(135deg,${order.metalType==="silver"?"#808080,#C0C0C0":"#9A7A2E,#C9A84C"})`, color:"#0D0B07", border:"none", padding:"10px 26px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <svg width="14" height="14" fill="none" stroke="#0D0B07" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
              Generate PDF (4 same)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STEP MODALS (Design & Wax, Casting, Filing etc.)
// ─────────────────────────────────────────────────────────────────────────────
const DesignWaxModal = ({ order, onClose, onUpdated }) => {
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [designDone, setDesignDone] = useState(order.designDone || false);
  const [waxDone,    setWaxDone]    = useState(order.waxDone    || false);
  const markSubStep = async (subStep) => {
    setSaving(true); setError("");
    try {
      const res = await orderAPI.markSubStep(order._id, subStep);
      const updated = res.data.data;
      if (subStep==="design") setDesignDone(true);
      if (subStep==="wax")    setWaxDone(true);
      onUpdated(updated);
      if (updated.currentStep > 0) onClose();
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:520 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:6 }}>✦ Step 1: Design & Wax</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:24 }}>Bag #{order.bagId} — {order.customerName}. Mark both sub-steps done to advance.</div>
        {[["Design","Jewellery design finalization",designDone,()=>markSubStep("design")],["Wax","Wax mould preparation",waxDone,()=>markSubStep("wax")]].map(([label,desc,done,fn])=>(
          <div key={label} style={{ background:theme.surfaceAlt, border:`1px solid ${done?`${theme.success}50`:theme.borderGold}`, borderRadius:12, padding:"16px 20px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontSize:15, color:theme.text, fontWeight:500 }}>{label}</div><div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{desc}</div></div>
            {done ? <span style={{ color:theme.success, fontSize:13, fontWeight:600 }}>✓ Done</span>
                  : <button disabled={saving} onClick={fn} style={{ padding:"8px 18px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, fontWeight:600, cursor:"pointer", border:"none", background:"linear-gradient(135deg,#9A7A2E,#C9A84C)", color:"#0D0B07", opacity:saving?0.6:1 }}>Mark Done</button>}
          </div>
        ))}
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}
        <button onClick={onClose} style={{ width:"100%", background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"10px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer", marginTop:8 }}>Close</button>
      </div>
    </div>
  );
};

const CastingModal = ({ order, onClose, onUpdated }) => {
  const [castingGrams, setCastingGrams] = useState("");
  const [error,        setError]        = useState("");
  const [saving,       setSaving]       = useState(false);
  const mc = metalColor(order); const mLabel = metalLabel(order);
  const confirm = async () => {
    const g = parseFloat(castingGrams);
    if (!castingGrams || isNaN(g) || g <= 0) { setError("Enter grams > 0."); return; }
    setSaving(true); setError("");
    try { const res = await orderAPI.castingStep(order._id, g); onUpdated(res.data.data); onClose(); }
    catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:460 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:mc, marginBottom:6 }}>{metalIcon(order)} Step 2: Casting ({mLabel})</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:20 }}>Bag #{order.bagId} — {order.customerName}</div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{mLabel} grams for this bag *</div>
          <input type="number" step="0.001" min="0.001" value={castingGrams} autoFocus onChange={e=>{setCastingGrams(e.target.value);setError("");}} placeholder="e.g. 12.000"
            style={{ width:"100%", background:theme.bg, border:`1px solid ${error?theme.danger:theme.borderGold}`, color:theme.text, padding:"12px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:16, outline:"none" }}/>
          {error && <div style={{ fontSize:12, color:theme.danger, marginTop:6 }}>⚠ {error}</div>}
        </div>
        {castingGrams && !isNaN(parseFloat(castingGrams)) && parseFloat(castingGrams) > 0 && (
          <div style={{ background:`${mc}0D`, border:`1px solid ${mc}40`, borderRadius:10, padding:14, marginBottom:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:mc }}>{parseFloat(castingGrams).toFixed(3)}g {mLabel}</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>allocated to this bag</div>
          </div>
        )}
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={confirm} disabled={saving} style={{ flex:1, background:`linear-gradient(135deg,${order.metalType==="silver"?"#808080,#C0C0C0":"#9A7A2E,#C9A84C"})`, color:"#0D0B07", border:"none", padding:"12px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:14, cursor:"pointer", opacity:saving?0.6:1 }}>
            {saving?"Allocating...":"Confirm Casting →"}
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:mc, border:`1px solid ${theme.borderGold}`, padding:"12px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const WastageStepModal = ({ order, onClose, onUpdated }) => {
  const currG = order.gramHistory[order.gramHistory.length - 1];
  const mc = metalColor(order); const mLabel = metalLabel(order);
  const [remaining, setRemaining] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const confirm = async () => {
    const r = parseFloat(remaining);
    if (remaining===""||isNaN(r)||r<0) { setError("Enter valid remaining grams."); return; }
    if (r > currG) { setError(`Cannot exceed ${currG}g.`); return; }
    setSaving(true); setError("");
    try { const res = await orderAPI.completeStep(order._id, r); onUpdated(res.data.data); onClose(); }
    catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };
  const used = remaining!==""&&!isNaN(parseFloat(remaining)) ? (currG-parseFloat(remaining)).toFixed(3) : null;
  const castG = order.castingGold || order.castingSilver || 0;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:460 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:mc, marginBottom:6 }}>{metalIcon(order)} Step {order.currentStep+1}: {STEPS[order.currentStep]}</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:20 }}>Bag #{order.bagId} — {order.customerName} ({mLabel})</div>
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>{mLabel.toUpperCase()} BEFORE</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.textMuted }}>{currG}g</div><div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>Cast: {castG}g</div></div>
          <div style={{ fontSize:12, color:theme.textMuted, textAlign:"right" }}>Weigh now,<br/>enter remaining</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Remaining After This Step *</div>
          <input type="number" step="0.001" min="0" max={currG} value={remaining} autoFocus onChange={e=>{setRemaining(e.target.value);setError("");}} placeholder={`max: ${currG}`}
            style={{ width:"100%", background:theme.bg, border:`1px solid ${error?theme.danger:theme.borderGold}`, color:theme.text, padding:"12px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:16, outline:"none" }}/>
          {error && <div style={{ fontSize:12, color:theme.danger, marginTop:6 }}>⚠ {error}</div>}
        </div>
        {used !== null && (
          <div style={{ background:`${mc}0D`, border:`1px solid ${mc}40`, borderRadius:10, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16, textAlign:"center" }}>
            {[["BEFORE",`${currG}g`,theme.textMuted],["USED",`${used}g`,theme.danger],["REMAINING",`${parseFloat(remaining).toFixed(3)}g`,mc]].map(([l,v,c])=>(
              <div key={l}><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>{l}</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:c }}>{v}</div></div>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={confirm} disabled={saving} style={{ flex:1, background:`linear-gradient(135deg,${order.metalType==="silver"?"#808080,#C0C0C0":"#9A7A2E,#C9A84C"})`, color:"#0D0B07", border:"none", padding:"12px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:14, cursor:"pointer", opacity:saving?0.6:1 }}>
            {saving?"Saving...":"Confirm Step Done →"}
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:mc, border:`1px solid ${theme.borderGold}`, padding:"12px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const StepModal = ({ order, onClose, onUpdated }) => {
  if (!order) return null;
  if (order.currentStep === 0) return <DesignWaxModal order={order} onClose={onClose} onUpdated={onUpdated}/>;
  if (order.currentStep === 1) return <CastingModal   order={order} onClose={onClose} onUpdated={onUpdated}/>;
  return <WastageStepModal order={order} onClose={onClose} onUpdated={onUpdated}/>;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const BagWorkflow = ({ orders, setOrders, customers = [] }) => {
  const [selectedId,    setSelectedId]    = useState(null);
  const [stepOrder,     setStepOrder]     = useState(null);
  const [search,        setSearch]        = useState("");
  const [stepFilter,    setStepFilter]    = useState("");

  // ── Detail view PDF (4 same copies) ──────────────────────────────────────────
  const [detailPdfOrder, setDetailPdfOrder] = useState(null);

  // ── 4-up builder state ────────────────────────────────────────────────────────
  // slots: array of 4 items, each is {order, manual} or null
  const [pdfSlots,       setPdfSlots]     = useState([null, null, null, null]);
  const [showBuilder,    setShowBuilder]  = useState(false);
  // position picker: which order is being assigned a position
  const [positionOrder,  setPositionOrder] = useState(null);
  // slot manual editor: {slotIndex}
  const [editingSlot,    setEditingSlot]   = useState(null);

  const order = orders.find(o => o._id === selectedId);

  const filtered = orders.filter(o => {
    const matchSearch = search ? (o.bagId||"").toString().toLowerCase().includes(search.toLowerCase()) || (o.customerName||"").toLowerCase().includes(search.toLowerCase()) : true;
    const matchStep   = stepFilter !== "" ? String(o.currentStep) === String(stepFilter) : true;
    return matchSearch && matchStep;
  });

  const handleUpdated = (updatedOrder) => {
    setOrders(p => p.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };

  // ── 4-up builder actions ──────────────────────────────────────────────────────
  const assignToSlot = (slotIndex, orderToAssign) => {
    setPdfSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { order: orderToAssign, manual: buildDefaults(orderToAssign) };
      return next;
    });
    setPositionOrder(null);
    setShowBuilder(true); // auto-open builder when assigning
  };

  const clearSlot = (slotIndex) => {
    setPdfSlots(prev => { const next = [...prev]; next[slotIndex] = null; return next; });
  };

  const updateSlotManual = (slotIndex, manual) => {
    setPdfSlots(prev => {
      const next = [...prev];
      if (next[slotIndex]) next[slotIndex] = { ...next[slotIndex], manual };
      return next;
    });
  };

  const generate4Up = () => {
    openHTML(generate4UpHTML(pdfSlots));
  };

  const filledCount = pdfSlots.filter(Boolean).length;

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (selectedId && order) {
    const mc      = metalColor(order);
    const mLabel  = metalLabel(order);
    const castG   = order.castingGold || order.castingSilver || 0;
    const currG   = order.gramHistory?.length > 0 ? order.gramHistory[order.gramHistory.length - 1] : 0;
    const wastage = castG > 0 ? (castG - currG).toFixed(3) : "0.000";
    const isComp  = order.status === "Completed";

    return (
      <div className="fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
          <button className="btn-ghost" onClick={()=>setSelectedId(null)}>← All Bags</button>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:mc }}>{metalIcon(order)} Bag #{order.bagId}</div>
          <div style={{ color:theme.textMuted, fontSize:13 }}>— {order.customerName} · {order.item}</div>
          <OwnerBadge order={order}/>
          <span className="tag" style={{ marginLeft:"auto", background:isComp?`${theme.success}20`:`${mc}18`, color:isComp?theme.success:mc }}>{order.status}</span>
          <button onClick={()=>setDetailPdfOrder(order)} style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${mc}15`, border:`1px solid ${mc}50`, color:mc, padding:"8px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
            Bag Sheet PDF (4 same)
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[["ORDER DATE",fmt(order.orderDate)],["DELIVERY",fmt(order.deliveryDate)],["LABOUR",order.labourTotal>0?`₹${order.labourTotal.toLocaleString()}`:"—"],["ITEM NO.",order.itemNumber||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, color:theme.textMuted, marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:14 }}>{v}</div>
            </div>
          ))}
        </div>

        {(order.usesOwnerGold||order.usesOwnerSilver) && (
          <div style={{ background:"#7B5EA710", border:"1px solid #7B5EA750", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:24 }}>✦</div>
            <div><div style={{ fontSize:13, color:"#B39DDB", fontWeight:600 }}>Using Owner's {mLabel} — Lariot Jweles</div><div style={{ fontSize:12, color:theme.textMuted }}>Supplied from manufacturer's stock.</div></div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:24 }}>
          {[[`${mLabel} Allocated`,castG>0?`${castG}g`:"Not cast",mc],[`${mLabel} Remaining`,castG>0?`${currG}g`:"—",mc],["Wastage",castG>0?`${wastage}g`:"—",theme.danger],["Labour",order.labourTotal>0?`₹${order.labourTotal.toLocaleString()}`:"—",theme.success]].map(([l,v,c])=>(
            <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>{l}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {order.diamondShapes?.length > 0 && (
          <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, color:theme.textMuted, marginBottom:10 }}>DIAMONDS USED</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {order.diamondShapes.map((s,i)=>(
                <span key={i} className="tag" style={{ background:"#7EC8E315", border:"1px solid #7EC8E340", color:"#7EC8E3" }}>{s.shapeName} · {s.pcs} pcs</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:theme.textMuted }}>Progress</span>
            <span style={{ fontSize:12, color:mc }}>{order.currentStep}/{STEPS.length} steps</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${(order.currentStep/STEPS.length)*100}%`, background:order.metalType==="silver"?undefined:undefined }}/></div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {STEPS.map((step,i)=>{
            const done    = i < order.currentStep;
            const current = i === order.currentStep && !isComp;
            return (
              <div key={i} className={`step-item ${done?"done":""}`}>
                <div className={`step-circle ${done?"done":current?"current":""}`}>{done?<Icon name="check" size={14} color="#0D0B07"/>:i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                  {i===0&&done&&<div style={{ fontSize:12,color:theme.textMuted,marginTop:4,display:"flex",gap:12 }}><span style={{color:order.designDone?theme.success:theme.textMuted}}>{order.designDone?"✓ Design":"○ Design"}</span><span style={{color:order.waxDone?theme.success:theme.textMuted}}>{order.waxDone?"✓ Wax":"○ Wax"}</span></div>}
                  {i===1&&done&&castG>0&&<div style={{ fontSize:12,color:theme.textMuted,marginTop:4 }}>Allocated: <span style={{color:mc}}>{castG}g {mLabel}</span></div>}
                  {i>=2&&done&&order.gramHistory?.[i-1]!==undefined&&order.gramHistory?.[i]!==undefined&&<div style={{ fontSize:12,color:theme.textMuted,marginTop:4 }}>{order.gramHistory[i-1]}g → <span style={{color:mc}}>{order.gramHistory[i]}g</span><span style={{color:theme.danger,marginLeft:8}}>−{(order.gramHistory[i-1]-order.gramHistory[i]).toFixed(3)}g</span></div>}
                </div>
                {done&&<span className="tag" style={{background:`${theme.success}18`,color:theme.success,fontSize:11}}>Done</span>}
                {current&&<button className="btn-primary" onClick={()=>setStepOrder(order)}>Mark Done</button>}
              </div>
            );
          })}
        </div>

        {isComp && (
          <div style={{ marginTop:24, background:`${theme.success}12`, border:`1px solid ${theme.success}40`, borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.success }}>✦ Order Complete</div>
            <div style={{ color:theme.textMuted, fontSize:13, marginTop:6 }}>Final: {currG}g · Cast: {castG}g · Wastage: {wastage}g</div>
          </div>
        )}

        {stepOrder     && <StepModal order={stepOrder}     onClose={()=>setStepOrder(null)}     onUpdated={(u)=>{handleUpdated(u);setStepOrder(null);}}/>}
        {detailPdfOrder && <PDFModal  order={detailPdfOrder} onClose={()=>setDetailPdfOrder(null)}/>}
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div className="section-title">Bag Workflow</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{orders.length} total bags</div>
        </div>
      </div>

      {/* ── Filters + 4-up PDF toggle ── */}
      <div style={{ display:"flex", gap:12, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        {/* Search */}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}><Icon name="search" size={15} color={theme.textMuted}/></div>
          <input className="search-input" placeholder="Search Bag ID or party…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }}/>
        </div>
        {/* Step filter */}
        <select value={stepFilter} onChange={e=>setStepFilter(e.target.value)} style={{ width:200 }}>
          <option value="">All Steps</option>
          {STEPS.map((s,i)=><option key={i} value={i}>Step {i+1}: {s}</option>)}
          <option value={STEPS.length}>Completed</option>
        </select>
        {(search||stepFilter!=="") && <button className="btn-ghost" onClick={()=>{setSearch("");setStepFilter("");}} style={{ padding:"8px 14px", fontSize:13 }}>Clear</button>}

        {/* ── 4-up PDF builder toggle button ── */}
        <button
          onClick={() => setShowBuilder(v => !v)}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:showBuilder?`${theme.gold}20`:`${theme.gold}08`,
            border:`1.5px solid ${showBuilder?theme.gold:theme.borderGold}`,
            color:theme.gold, padding:"8px 16px", borderRadius:9,
            fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer", transition:"all 0.2s",
          }}
        >
          📄 4-up PDF Builder
          {filledCount > 0 && (
            <span style={{ background:theme.gold, color:"#0D0B07", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{filledCount}/4</span>
          )}
        </button>

        <span style={{ marginLeft:"auto", fontSize:13, color:theme.textMuted }}>{filtered.length} of {orders.length}</span>
      </div>

      {/* ── 4-up Builder Panel ── */}
      {showBuilder && (
        <FourUpBuilderPanel
          slots={pdfSlots}
          onClearSlot={clearSlot}
          onEditSlot={(i) => setEditingSlot(i)}
          onGenerate={generate4Up}
        />
      )}

      {/* ── Bag Cards ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="bag" size={40} color={theme.borderGold}/><br/><br/>
            {orders.length === 0 ? "No bags yet. Create an order first!" : "No bags match your filters."}
          </div>
        )}
        {filtered.map(o => {
          const castG   = o.castingGold || o.castingSilver || 0;
          const currG   = o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length - 1] : 0;
          const prog    = (o.currentStep / STEPS.length) * 100;
          const isComp  = o.status === "Completed";
          const canMark = o.currentStep < STEPS.length && !isComp;
          const mc      = metalColor(o);

          // Find if this order is already in a slot
          const assignedSlotIndex = pdfSlots.findIndex(s => s?.order?._id === o._id);
          const isAssigned = assignedSlotIndex >= 0;

          return (
            <div key={o._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${(o.usesOwnerGold||o.usesOwnerSilver)?"#7B5EA750":theme.borderGold}`, borderRadius:14, padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                {/* Left */}
                <div style={{ display:"flex", gap:14, alignItems:"center", cursor:"pointer", flex:1 }} onClick={()=>setSelectedId(o._id)}>
                  {o.itemImage && <img src={o.itemImage} alt="" style={{ width:48, height:48, objectFit:"contain", borderRadius:8, border:`1px solid ${theme.borderGold}`, background:theme.surfaceAlt, padding:2 }}/>}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:mc }}>#{o.bagId}</span>
                      <span style={{ fontSize:15 }}>{o.customerName}</span>
                      <span style={{ fontSize:11, color:mc, background:`${mc}15`, border:`1px solid ${mc}40`, padding:"1px 7px", borderRadius:10 }}>{metalIcon(o)} {metalLabel(o)}</span>
                      <OwnerBadge order={o}/>
                      {/* Slot assignment badge */}
                      {isAssigned && (
                        <span style={{ fontSize:11, color:theme.gold, background:`${theme.gold}20`, border:`1px solid ${theme.gold}50`, padding:"1px 8px", borderRadius:10 }}>
                          📄 Position {assignedSlotIndex+1}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
                    <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                      {o.currentStep===0?`Step 1: Design & Wax ${o.designDone?"(D✓)":""} ${o.waxDone?"(W✓)":""}`:`Step ${o.currentStep+1}: ${STEPS[o.currentStep]||"Completed"}`}
                      {o.deliveryDate&&` · Due: ${fmt(o.deliveryDate)}`}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {castG > 0 ? (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>CAST → NOW</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:mc }}>{castG}g → {currG}g</div>
                      </div>
                    ) : (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>NOT CAST</div>
                      </div>
                    )}
                    <span className="tag" style={{ background:isComp?`${theme.success}20`:`${mc}18`, color:isComp?theme.success:mc }}>{o.status}</span>
                  </div>

                  <div style={{ display:"flex", gap:8 }}>
                    {canMark && (
                      <button onClick={e=>{e.stopPropagation();setStepOrder(o);}}
                        style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.success}18`, border:`1px solid ${theme.success}50`, color:theme.success, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${theme.success}30`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${theme.success}18`}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        Mark Done
                      </button>
                    )}
                    {/* PDF button — opens position picker */}
                    <button
                      onClick={e=>{e.stopPropagation(); setPositionOrder(o); setShowBuilder(true);}}
                      style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        background:isAssigned?`${theme.gold}25`:`${theme.gold}15`,
                        border:`1px solid ${isAssigned?theme.gold:`${theme.gold}50`}`,
                        color:theme.gold, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer", transition:"all 0.2s",
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${theme.gold}35`;e.currentTarget.style.borderColor=theme.gold;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=isAssigned?`${theme.gold}25`:`${theme.gold}15`;e.currentTarget.style.borderColor=isAssigned?theme.gold:`${theme.gold}50`;}}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
                      {isAssigned ? `PDF ✓Pos.${assignedSlotIndex+1}` : "PDF"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="progress-bar" style={{ cursor:"pointer" }} onClick={()=>setSelectedId(o._id)}>
                <div className="progress-fill" style={{ width:`${prog}%` }}/>
              </div>
              <div style={{ fontSize:11, color:theme.textMuted, marginTop:6 }}>Step {o.currentStep}/{STEPS.length}</div>
            </div>
          );
        })}
      </div>

      {/* ── Modals ── */}
      {stepOrder && (
        <StepModal order={stepOrder} onClose={()=>setStepOrder(null)} onUpdated={(u)=>{handleUpdated(u);setStepOrder(null);}}/>
      )}

      {/* Position picker — opened when clicking PDF on a bag card */}
      {positionOrder && (
        <PositionPickerModal
          order={positionOrder}
          slots={pdfSlots}
          onClose={() => setPositionOrder(null)}
          onPick={(slotIndex) => assignToSlot(slotIndex, positionOrder)}
        />
      )}

      {/* Slot manual editor */}
      {editingSlot !== null && pdfSlots[editingSlot] && (
        <SlotManualModal
          slotIndex={editingSlot}
          slot={pdfSlots[editingSlot]}
          onClose={() => setEditingSlot(null)}
          onUpdate={(manual) => updateSlotManual(editingSlot, manual)}
        />
      )}
    </div>
  );
};

export default BagWorkflow;
