import React, { useState } from "react";
import { theme, STEPS } from "../theme";
import { StatBox } from "../components/Modal";
import { orderAPI } from "../services/api";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const DEPT_LABELS = ["SGRD", "CAST", "FIL", "EP", "POL", "SET", "FPOL"];
const ACCES_ROWS  = ["Solder", "Wire", "Finding", "Metal"];

// ── Build default manual fields — pre-fill from saved billingData if it exists ─
const buildDefaults = (o) => {
  const saved = o.billingData;
  if (saved && saved.savedAt) return saved; // already saved in DB — restore everything
  return {
    cCode:        o.itemNumber || "",
    kt:           "",
    bagQty:       "1",
    styleInstr:   "",
    findingInstr: "",
    accessories: ACCES_ROWS.map((name) => ({
      name,
      issue1:"", issue2:"", issue3:"",
      rec1:"",   rec2:"",   rec3:"",
    })),
    depts: DEPT_LABELS.map((dept, i) => ({
      dept,
      date:   "",
      worker: "",
      issue:  o.gramHistory?.[i]     != null ? String(o.gramHistory[i])     : "",
      rec:    o.gramHistory?.[i + 1] != null ? String(o.gramHistory[i + 1]) : "",
      diff:   "",
      dust:   "",
    })),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
//  HTML BAG SHEET GENERATOR  (opens in new tab → browser Print → Save as PDF)
// ═══════════════════════════════════════════════════════════════════════════════
function generateBagSheetHTML(order, manual) {
  const gWT  = order.gramHistory?.[0] ?? 0;
  const nWT  = order.gramHistory?.[order.gramHistory.length - 1] ?? 0;
  const dWT  = (order.diamondShapes || []).reduce((s, d) => s + (d.weight || 0) * (d.pcs || 1), 0);
  const dPcs = (order.diamondShapes || []).reduce((s, d) => s + (d.pcs || 1), 0);

  const imgTag = order.itemImage
    ? `<img src="${order.itemImage}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:10px;font-style:italic;">No Image</div>`;

  const acceRows = (manual.accessories || []).map((a) => `
    <tr>
      <td class="lbl">${a.name}</td>
      <td>${a.issue1||""}</td><td>${a.issue2||""}</td><td>${a.issue3||""}</td>
      <td>${a.rec1||""}</td><td>${a.rec2||""}</td><td>${a.rec3||""}</td>
    </tr>`).join("");

  const deptRows = (manual.depts || []).map((d) => `
    <tr>
      <td class="lbl">${d.dept}</td>
      <td>${d.date||""}</td><td>${d.worker||""}</td>
      <td>${d.issue||""}</td><td>${d.rec||""}</td>
      <td>${d.diff||""}</td><td>${d.dust||""}</td>
    </tr>`).join("");

  const diamondRows = (order.diamondShapes || []).length
    ? (order.diamondShapes).map((d) => `
      <tr>
        <td>${d.shapeName||"—"}</td>
        <td style="text-align:center">${d.sizeInMM||"—"}</td>
        <td style="text-align:center">${d.weight??""}</td>
        <td style="text-align:center">${d.pcs??1}</td>
        <td style="text-align:center">${((d.weight||0)*(d.pcs||1)).toFixed(3)}</td>
        <td></td><td></td><td></td><td></td>
      </tr>`).join("")
    : `<tr><td colspan="9" style="text-align:center;color:#aaa;padding:8px;font-style:italic">No diamonds</td></tr>`;

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<title>Bag Sheet — ${order.bagId||"ORDER"}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;background:#fff;padding:14px 16px}
  .page{max-width:760px;margin:0 auto}
  .top-header{border:2px solid #000;display:grid;grid-template-columns:1fr 130px}
  .top-left{padding:7px 10px}
  .info-grid{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:3px 8px;align-items:baseline}
  .il{font-weight:700;white-space:nowrap;font-size:11px}
  .iv{font-size:11px}
  .top-img{border-left:2px solid #000;overflow:hidden}
  .instr-row{display:grid;grid-template-columns:1fr 1fr;border:2px solid #000;border-top:0;margin-bottom:10px}
  .instr-cell{padding:5px 8px;font-size:11px}
  .instr-cell:first-child{border-right:1px solid #000}
  .sec{background:#d8d8d8;font-weight:700;font-size:11px;padding:3px 8px;border:1.5px solid #000;border-bottom:0;letter-spacing:.5px;text-transform:uppercase;margin-top:10px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#ebebeb;font-weight:700;text-align:center;font-size:10px;padding:4px 5px;border:1px solid #000}
  td{border:1px solid #000;padding:4px 5px;min-height:20px}
  .lbl{font-weight:700;background:#f7f7f7}
  .wbar{display:grid;grid-template-columns:1fr 1fr 1fr;border:2px solid #000;margin-top:10px}
  .wc{padding:8px 12px;font-weight:700;font-size:12px;text-align:center;border-right:1px solid #000}
  .wc:last-child{border-right:0}
  .wv{font-size:15px;font-weight:900}
  @media print{body{padding:6px 8px}@page{margin:8mm;size:A4 portrait}}
</style>
</head><body>
<div class="page">

<div class="top-header">
  <div class="top-left">
    <div class="info-grid">
      <span class="il">Bag No :</span><span class="iv"><strong>${order.bagId||"—"}</strong></span>
      <span class="il">C.Code :</span><span class="iv"><strong>${manual.cCode||"—"}</strong></span>
      <span class="il">Design No :</span><span class="iv">${order.itemNumber||order.item||"—"}</span>
      <span class="il">KT :</span><span class="iv">${manual.kt||"—"} &nbsp; <strong>Bag Qty : ${manual.bagQty||"1"}</strong></span>
      <span class="il">Order Date :</span><span class="iv">${fmt(order.orderDate)}</span>
      <span class="il">Order No :</span><span class="iv"><strong>ORD-${order.bagId||"—"}</strong></span>
      <span class="il">Delivery Date :</span><span class="iv">${fmt(order.deliveryDate)}</span>
      <span class="il">Customer :</span><span class="iv">${order.customerName||"—"}</span>
      <span class="il">Category :</span><span class="iv">${order.folder||"—"}</span>
      <span class="il">Size :</span><span class="iv">${order.size||"—"}</span>
    </div>
  </div>
  <div class="top-img">${imgTag}</div>
</div>
<div class="instr-row">
  <div class="instr-cell"><strong>Style Instr : </strong>${manual.styleInstr||""}</div>
  <div class="instr-cell"><strong>Finding Instr : </strong>${manual.findingInstr||""}</div>
</div>

<div class="sec">Accessories</div>
<table><thead><tr>
  <th style="width:70px">Acces.</th>
  <th>Issue</th><th>Issue</th><th>Issue</th>
  <th>Rec</th><th>Rec</th><th>Rec</th>
</tr></thead><tbody>${acceRows}</tbody></table>

<div class="sec">Department Workflow</div>
<table><thead><tr>
  <th style="width:52px">Dept</th><th>Date</th><th>Worker</th>
  <th>Issue</th><th>Rec</th><th>Diff</th><th>Dust</th>
</tr></thead><tbody>${deptRows}</tbody></table>

<div class="sec">Diamond Details</div>
<table><thead>
  <tr>
    <th rowspan="2">Diamond Code</th><th rowspan="2">Size (mm)</th>
    <th rowspan="2">Wt/pc</th><th rowspan="2">Pcs</th><th rowspan="2">Total WT</th>
    <th colspan="2">Issue</th><th colspan="2">Return</th>
  </tr>
  <tr><th>Pcs</th><th>WT</th><th>Pcs</th><th>WT</th></tr>
</thead><tbody>${diamondRows}</tbody></table>

<div class="wbar">
  <div class="wc">G.WT : <span class="wv">${gWT.toFixed(3)}</span></div>
  <div class="wc">D.WT : ${dPcs} pcs &nbsp; <span class="wv">${dWT.toFixed(3)}</span></div>
  <div class="wc">N.WT : <span class="wv">${nWT.toFixed(3)}</span></div>
</div>
${order.notes ? `<div style="margin-top:8px;border:1px solid #bbb;padding:6px 10px;font-size:11px"><strong>Notes : </strong>${order.notes}</div>` : ""}

</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const PDFModal = ({ order, onClose, onSaved }) => {
  const [manual,  setManual]  = useState(() => buildDefaults(order));
  const [tab,     setTab]     = useState("info");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(!!order.billingData?.savedAt);
  const [saveErr, setSaveErr] = useState("");

  const set = (k, v) => setManual((p) => ({ ...p, [k]: v }));
  const updAcces = (idx, k, v) =>
    setManual((p) => { const a = [...p.accessories]; a[idx] = { ...a[idx], [k]: v }; return { ...p, accessories: a }; });
  const updDept = (idx, k, v) =>
    setManual((p) => { const d = [...p.depts]; d[idx] = { ...d[idx], [k]: v }; return { ...p, depts: d }; });

  // ── Save to MongoDB ──────────────────────────────────────────────────────────
  const saveToDB = async () => {
    setSaving(true); setSaveErr("");
    try {
      await orderAPI.saveBilling(order._id, manual);
      setSaved(true);
      onSaved(order._id, manual); // update parent state
    } catch (err) {
      setSaveErr(err.response?.data?.error || "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  // ── Generate PDF (uses latest manual state — no need to save first) ──────────
  const generate = () => {
    const html = generateBagSheetHTML(order, manual);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (!win) alert("Allow popups to generate the PDF, then use browser Print → Save as PDF.");
    setTimeout(() => URL.revokeObjectURL(url), 90000);
  };

  /* ── shared styles ── */
  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };
  const cellInp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"5px 6px", borderRadius:5, fontFamily:"'DM Sans'", fontSize:12, width:"100%", outline:"none", textAlign:"center" };
  const TH = ({ children, w }) => (
    <th style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", padding:"7px 6px", borderBottom:`1px solid ${theme.borderGold}`, textAlign:"center", fontWeight:500, width:w }}>
      {children}
    </th>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"94vw", maxWidth:820, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, color:theme.gold }}>
              ✦ Final Billing Sheet — Bag #{order.bagId}
            </div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3, display:"flex", alignItems:"center", gap:8 }}>
              Fill fields, Save to DB, then Generate PDF
              {saved && (
                <span style={{ background:`${theme.success}18`, border:`1px solid ${theme.success}40`, color:theme.success, fontSize:11, padding:"2px 8px", borderRadius:20 }}>
                  ✓ Saved
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${theme.borderGold}`, padding:"0 28px", flexShrink:0 }}>
          {[["info","Order Info"],["acces","Accessories"],["dept","Dept Workflow"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 18px", fontSize:13, fontFamily:"'DM Sans'", color:tab===k?theme.gold:theme.textMuted, borderBottom:`2px solid ${tab===k?theme.gold:"transparent"}`, marginBottom:-1, transition:"all 0.2s" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {/* ── TAB: ORDER INFO ── */}
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Auto-filled summary */}
              <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px 24px" }}>
                {[["Bag No",`#${order.bagId}`],["Customer",order.customerName],["Category",order.folder],["Item",order.item],["Order Date",fmt(order.orderDate)],["Delivery",fmt(order.deliveryDate)],["Size",order.size||"—"],["Labour",`₹${(order.labourTotal||0).toLocaleString()}`],["Status",order.status]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
                  </div>
                ))}
              </div>

              {/* Manual fields */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                {[["C.Code","cCode","e.g. GJ05-BBJ","text"],["KT (Karat)","kt","e.g. 18K, 22K","text"],["Bag Qty","bagQty","1","number"]].map(([lbl,k,ph,type]) => (
                  <div key={k}>
                    <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div>
                    <input style={inp} type={type} value={manual[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[["Style Instructions","styleInstr","Style / design instructions..."],["Finding Instructions","findingInstr","Finding / fitting instructions..."]].map(([lbl,k,ph]) => (
                  <div key={k}>
                    <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div>
                    <input style={inp} value={manual[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}/>
                  </div>
                ))}
              </div>

              {/* Diamond read-only */}
              {(order.diamondShapes||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Diamonds (auto from order)</div>
                  <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:8, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                        {["Shape","Size (mm)","Wt/pc","Pcs","Total WT"].map(h => <TH key={h}>{h}</TH>)}
                      </tr></thead>
                      <tbody>
                        {order.diamondShapes.map((d,i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                            <td style={{ padding:"7px 10px",fontSize:13 }}>{d.shapeName}</td>
                            <td style={{ padding:"7px 10px",fontSize:13,textAlign:"center" }}>{d.sizeInMM||"—"}</td>
                            <td style={{ padding:"7px 10px",fontSize:13,textAlign:"center",color:theme.gold }}>{d.weight}</td>
                            <td style={{ padding:"7px 10px",fontSize:13,textAlign:"center" }}>{d.pcs}</td>
                            <td style={{ padding:"7px 10px",fontSize:14,textAlign:"center",color:theme.gold,fontFamily:"'Cormorant Garamond',serif" }}>{((d.weight||0)*(d.pcs||1)).toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Weight summary */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["G.WT (Initial)",`${order.gramHistory?.[0]??0}g`,theme.textMuted],["D.WT (Diamonds)",`${(order.diamondShapes||[]).reduce((s,d)=>s+(d.weight||0)*(d.pcs||1),0).toFixed(3)}g`,theme.gold],["N.WT (Final)",`${order.gramHistory?.[order.gramHistory.length-1]??0}g`,theme.success]].map(([l,v,c]) => (
                  <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: ACCESSORIES ── */}
          {tab === "acces" && (
            <div>
              <div style={{ fontSize:12, color:theme.textMuted, marginBottom:16 }}>
                Enter issue and return quantities for each accessory material.
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
                  <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <TH w={80}>Acces.</TH>
                    <TH>Issue 1</TH><TH>Issue 2</TH><TH>Issue 3</TH>
                    <TH>Rec 1</TH><TH>Rec 2</TH><TH>Rec 3</TH>
                  </tr></thead>
                  <tbody>
                    {manual.accessories.map((a, idx) => (
                      <tr key={a.name} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                        <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500 }}>{a.name}</td>
                        {["issue1","issue2","issue3","rec1","rec2","rec3"].map(k => (
                          <td key={k} style={{ padding:"5px 4px" }}>
                            <input style={cellInp} value={a[k]} onChange={(e) => updAcces(idx,k,e.target.value)} placeholder="—"/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: DEPT WORKFLOW ── */}
          {tab === "dept" && (
            <div>
              <div style={{ fontSize:12, color:theme.textMuted, marginBottom:16 }}>
                Gram history is pre-filled from workflow. Add worker names, dates, diff, and dust.
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
                  <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                    <TH w={52}>Dept</TH>
                    <TH>Date</TH><TH>Worker</TH>
                    <TH>Issue (g)</TH><TH>Rec (g)</TH>
                    <TH>Diff</TH><TH>Dust</TH>
                  </tr></thead>
                  <tbody>
                    {manual.depts.map((d, idx) => (
                      <tr key={d.dept} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                        <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500,whiteSpace:"nowrap" }}>{d.dept}</td>
                        {["date","worker","issue","rec","diff","dust"].map(k => (
                          <td key={k} style={{ padding:"5px 4px" }}>
                            <input style={cellInp} value={d[k]} onChange={(e) => updDept(idx,k,e.target.value)} placeholder="—"/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 28px", borderTop:`1px solid ${theme.borderGold}`, flexShrink:0, gap:12 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ fontSize:12, color:theme.textMuted }}>
              💡 Save first to persist data, then Generate PDF
            </div>
            {saveErr && <div style={{ fontSize:12, color:theme.danger }}>⚠ {saveErr}</div>}
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0 }}>
            <button onClick={onClose} style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"9px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>
              Cancel
            </button>
            {/* Save to MongoDB */}
            <button
              onClick={saveToDB}
              disabled={saving}
              style={{ background:`${theme.success}18`, border:`1px solid ${theme.success}50`, color:theme.success, padding:"9px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:saving?0.6:1 }}
              onMouseEnter={(e) => e.currentTarget.style.background=`${theme.success}28`}
              onMouseLeave={(e) => e.currentTarget.style.background=`${theme.success}18`}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {saving ? "Saving..." : "Save to DB"}
            </button>
            {/* Generate PDF */}
            <button
              onClick={generate}
              style={{ background:"linear-gradient(135deg,#9A7A2E,#C9A84C)", color:"#0D0B07", border:"none", padding:"10px 24px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}
            >
              <svg width="14" height="14" fill="none" stroke="#0D0B07" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 15V3M7 10l5 5 5-5M20 21H4"/>
              </svg>
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const WastageReport = ({ orders, setOrders }) => {
  const [pdfOrder, setPdfOrder] = useState(null);

  const completed    = orders.filter((o) => o.status === "Completed");
  const totalWastage = completed.reduce((s, o) => s + (o.gramHistory[0] - o.gramHistory[o.gramHistory.length - 1]), 0);
  const totalLabour  = completed.reduce((s, o) => s + (o.labourTotal || 0), 0);

  // Update billingData in parent orders state after save
  const handleSaved = (orderId, billingData) => {
    if (setOrders) {
      setOrders((prev) => prev.map((o) =>
        o._id === orderId ? { ...o, billingData: { ...billingData, savedAt: new Date() } } : o
      ));
    }
    // Also update pdfOrder so the "Saved" badge shows immediately
    setPdfOrder((prev) => prev ? { ...prev, billingData: { ...billingData, savedAt: new Date() } } : prev);
  };

  return (
    <div className="fade-in">
      <div className="section-title" style={{ marginBottom:6 }}>Wastage Report</div>
      <div style={{ color:theme.textMuted, fontSize:13, marginBottom:28 }}>Gold wastage summary for all completed orders</div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:28 }}>
        <StatBox label="Completed Orders"   value={completed.length}                   icon="order"   color={theme.success}/>
        <StatBox label="Total Gold Wastage" value={`${totalWastage.toFixed(2)}g`}      icon="wastage" color={theme.danger}/>
        <StatBox label="Total Labour"       value={`₹${totalLabour.toLocaleString()}`} icon="gold"    color={theme.gold}/>
      </div>

      {/* Table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>

        <div className="table-row" style={{ gridTemplateColumns:"1fr 2fr 2fr 1fr 1fr 1fr 1fr 1.5fr", background:theme.surfaceAlt }}>
          {["Bag ID","Customer","Product","Initial","Final","Wastage","Labour","Final Billing PDF"].map((h) => (
            <span key={h} style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>

        {completed.map((o, i) => {
          const wastage = (o.gramHistory[0] - o.gramHistory[o.gramHistory.length - 1]).toFixed(2);
          const hasSavedBilling = !!o.billingData?.savedAt;
          return (
            <div key={i} className="table-row" style={{ gridTemplateColumns:"1fr 2fr 2fr 1fr 1fr 1fr 1fr 1.5fr", alignItems:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.gold }}>#{o.bagId}</div>
              <div style={{ fontSize:14 }}>{o.customerName}</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.textMuted }}>{o.gramHistory[0]}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{o.gramHistory[o.gramHistory.length-1]}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.danger }}>{wastage}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.success }}>₹{(o.labourTotal||0).toLocaleString()}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {/* Saved badge */}
                {hasSavedBilling && (
                  <span title="Billing data saved in DB" style={{ fontSize:10, color:theme.success, background:`${theme.success}15`, border:`1px solid ${theme.success}40`, padding:"2px 7px", borderRadius:20 }}>
                    ✓ Saved
                  </span>
                )}
                <button
                  onClick={() => setPdfOrder(o)}
                  style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"6px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background=`${theme.gold}28`; e.currentTarget.style.borderColor=theme.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background=`${theme.gold}15`; e.currentTarget.style.borderColor=`${theme.gold}50`; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M12 15V3M7 10l5 5 5-5M20 21H4"/>
                  </svg>
                  {hasSavedBilling ? "Edit / PDF" : "Download"}
                </button>
              </div>
            </div>
          );
        })}

        {completed.length === 0 && (
          <div style={{ padding:40, textAlign:"center", color:theme.textMuted }}>No completed orders yet</div>
        )}
      </div>

      {pdfOrder && (
        <PDFModal
          order={pdfOrder}
          onClose={() => setPdfOrder(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default WastageReport;
