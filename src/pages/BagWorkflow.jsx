import React, { useState } from "react";
import { theme, STEPS } from "../theme";
import { orderAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";

const ACCES_ROWS  = ["Solder", "Wire", "Finding", "Metal"];
const DEPT_LABELS = ["SGRD", "CAST", "FIL", "EP", "POL", "SET", "FPOL"];

const buildDefaults = (o) => ({
  cCode: o.itemNumber || "", kt: "", bagQty: "1", styleInstr: "", findingInstr: "",
  accessories: ACCES_ROWS.map(name => ({ name, issue1:"", issue2:"", issue3:"", rec1:"", rec2:"", rec3:"" })),
  depts: DEPT_LABELS.map((dept, i) => ({
    dept, date:"", worker:"",
    issue: o.gramHistory?.[i]     != null ? String(o.gramHistory[i])     : "",
    rec:   o.gramHistory?.[i + 1] != null ? String(o.gramHistory[i + 1]) : "",
    diff:"", dust:"",
  })),
});

// ── Single bag sheet HTML block (used 4 times) ─────────────────────────────────
function bagSheetBlock(order, manual) {
  const gWT  = order.gramHistory?.[0] ?? 0;
  const nWT  = order.gramHistory?.[order.gramHistory.length - 1] ?? 0;
  const dWT  = (order.diamondShapes || []).reduce((s, d) => s + (d.weight || 0) * (d.pcs || 1), 0);
  const dPcs = (order.diamondShapes || []).reduce((s, d) => s + (d.pcs || 1), 0);
  const imgTag = order.itemImage
    ? `<img src="${order.itemImage}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:9px;font-style:italic;">No Image</div>`;
  const acceRows = (manual.accessories || []).map(a => `
    <tr><td class="lbl">${a.name}</td>
    <td>${a.issue1||""}</td><td>${a.issue2||""}</td><td>${a.issue3||""}</td>
    <td>${a.rec1||""}</td><td>${a.rec2||""}</td><td>${a.rec3||""}</td></tr>`).join("");
  const deptRows = (manual.depts || []).map(d => `
    <tr><td class="lbl">${d.dept}</td>
    <td>${d.date||""}</td><td>${d.worker||""}</td>
    <td>${d.issue||""}</td><td>${d.rec||""}</td>
    <td>${d.diff||""}</td><td>${d.dust||""}</td></tr>`).join("");
  const diamondRows = (order.diamondShapes || []).length
    ? (order.diamondShapes).map(d => `
      <tr><td>${d.shapeName||"—"}</td>
      <td>${d.sizeInMM||"—"}</td><td>${d.weight??""}</td>
      <td>${d.pcs??1}</td><td>${((d.weight||0)*(d.pcs||1)).toFixed(3)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join("")
    : `<tr><td colspan="9" style="text-align:center;color:#aaa;font-style:italic">No diamonds</td></tr>`;

  return `
<div class="sheet">
  <div class="top-header">
    <div class="top-left"><div class="info-grid">
      <span class="il">Bag No :</span><span class="iv"><b>${order.bagId||"—"}</b></span>
      <span class="il">C.Code :</span><span class="iv"><b>${manual.cCode||"—"}</b></span>
      <span class="il">Design No :</span><span class="iv">${order.itemNumber||order.item||"—"}</span>
      <span class="il">KT :</span><span class="iv">${manual.kt||"—"} <b>Qty:${manual.bagQty||"1"}</b></span>
      <span class="il">Order :</span><span class="iv">${fmt2(order.orderDate)}</span>
      <span class="il">Order No :</span><span class="iv"><b>ORD-${order.bagId||"—"}</b></span>
      <span class="il">Delivery :</span><span class="iv">${fmt2(order.deliveryDate)}</span>
      <span class="il">Customer :</span><span class="iv">${order.customerName||"—"}</span>
      <span class="il">Category :</span><span class="iv">${order.folder||"—"}</span>
      <span class="il">Size :</span><span class="iv">${order.size||"—"}</span>
    </div></div>
    <div class="top-img">${imgTag}</div>
  </div>
  <div class="instr-row">
    <div class="instr-cell"><b>Style: </b>${manual.styleInstr||""}</div>
    <div class="instr-cell"><b>Finding: </b>${manual.findingInstr||""}</div>
  </div>
  <div class="sec">Accessories</div>
  <table><thead><tr><th style="width:38px">Acces.</th><th>Iss</th><th>Iss</th><th>Iss</th><th>Rec</th><th>Rec</th><th>Rec</th></tr></thead>
  <tbody>${acceRows}</tbody></table>
  <div class="sec">Dept Workflow</div>
  <table><thead><tr><th style="width:28px">Dept</th><th>Date</th><th>Worker</th><th>Issue</th><th>Rec</th><th>Diff</th><th>Dust</th></tr></thead>
  <tbody>${deptRows}</tbody></table>
  <div class="sec">Diamond Details</div>
  <table><thead>
    <tr><th rowspan="2">Code</th><th rowspan="2">Size</th><th rowspan="2">Wt</th><th rowspan="2">Pcs</th><th rowspan="2">Total</th><th colspan="2">Issue</th><th colspan="2">Return</th></tr>
    <tr><th>Pcs</th><th>WT</th><th>Pcs</th><th>WT</th></tr>
  </thead><tbody>${diamondRows}</tbody></table>
  <div class="wbar">
    <div class="wc">G.WT:<b>${gWT.toFixed(3)}</b></div>
    <div class="wc">D.WT:${dPcs}pc <b>${dWT.toFixed(3)}</b></div>
    <div class="wc">N.WT:<b>${nWT.toFixed(3)}</b></div>
  </div>
  ${order.notes ? `<div class="notes"><b>Notes:</b> ${order.notes}</div>` : ""}
</div>`;
}

// ── 4-UP PDF: prints 4 identical copies on one A4 page ────────────────────────
function generateBagSheetHTML(order, manual) {
  const block = bagSheetBlock(order, manual);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Bag Sheet — ${order.bagId||"ORDER"}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000}

/* ── 2×2 grid on A4 ── */
.a4-page{
  width:210mm;
  height:297mm;
  display:grid;
  grid-template-columns:1fr 1fr;
  grid-template-rows:1fr 1fr;
  gap:0;
  overflow:hidden;
}

/* Each cell clips to exactly half A4 */
.cell{
  width:105mm;
  height:148.5mm;
  overflow:hidden;
  position:relative;
  border:0.3mm solid #ccc;
}

/* Scale-down inner sheet to fit the half-A4 cell */
/* Original sheet is ~760px wide; target cell ~396px (105mm@96dpi) */
/* Scale factor ≈ 0.48 */
.sheet-wrap{
  position:absolute;
  top:0; left:0;
  transform-origin:top left;
  transform:scale(0.48);
  width:208.33%; /* 100/0.48 */
}

/* ── Sheet internal layout ── */
.sheet{
  width:760px;
  font-size:9px;
  padding:6px 8px;
}
.top-header{border:1.5px solid #000;display:grid;grid-template-columns:1fr 90px;margin-bottom:0}
.top-left{padding:4px 6px}
.info-grid{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 5px;align-items:baseline}
.il{font-weight:700;white-space:nowrap;font-size:9px}.iv{font-size:9px}
.top-img{border-left:1.5px solid #000;overflow:hidden}
.instr-row{display:grid;grid-template-columns:1fr 1fr;border:1.5px solid #000;border-top:0;margin-bottom:6px}
.instr-cell{padding:3px 5px;font-size:9px}.instr-cell:first-child{border-right:1px solid #000}
.sec{background:#d8d8d8;font-weight:700;font-size:8px;padding:2px 5px;border:1px solid #000;border-bottom:0;letter-spacing:.3px;text-transform:uppercase;margin-top:5px}
table{width:100%;border-collapse:collapse;font-size:8px}
th{background:#ebebeb;font-weight:700;text-align:center;font-size:7px;padding:2px 3px;border:1px solid #000}
td{border:1px solid #000;padding:2px 3px;min-height:12px}
.lbl{font-weight:700;background:#f7f7f7}
.wbar{display:grid;grid-template-columns:1fr 1fr 1fr;border:1.5px solid #000;margin-top:5px}
.wc{padding:4px 6px;font-weight:700;font-size:9px;text-align:center;border-right:1px solid #000}
.wc:last-child{border-right:0}
.notes{margin-top:4px;border:1px solid #bbb;padding:3px 5px;font-size:8px}

@media print{
  body{margin:0;padding:0}
  @page{margin:0;size:A4 portrait}
  .a4-page{page-break-after:avoid}
}
</style></head><body>
<div class="a4-page">
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
  <div class="cell"><div class="sheet-wrap">${block}</div></div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;
}

// ── PDF Modal ─────────────────────────────────────────────────────────────────
const PDFModal = ({ order, onClose }) => {
  const [manual, setManual] = useState(() => buildDefaults(order));
  const [tab, setTab] = useState("info");
  const set = (k, v) => setManual(p => ({ ...p, [k]: v }));
  const updAcces = (idx, k, v) => setManual(p => { const a=[...p.accessories]; a[idx]={...a[idx],[k]:v}; return {...p,accessories:a}; });
  const updDept  = (idx, k, v) => setManual(p => { const d=[...p.depts]; d[idx]={...d[idx],[k]:v}; return {...p,depts:d}; });
  const generate = () => {
    const html = generateBagSheetHTML(order, manual);
    const blob = new Blob([html], { type:"text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (!win) alert("Allow popups to generate the PDF, then use browser Print → Save as PDF.");
    setTimeout(() => URL.revokeObjectURL(url), 90000);
  };
  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };
  const cellInp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"5px 6px", borderRadius:5, fontFamily:"'DM Sans'", fontSize:12, width:"100%", outline:"none", textAlign:"center" };
  const TH = ({ children, w }) => (
    <th style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", padding:"7px 6px", borderBottom:`1px solid ${theme.borderGold}`, textAlign:"center", fontWeight:500, width:w }}>{children}</th>
  );
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"94vw", maxWidth:820, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, color:theme.gold }}>✦ Bag Sheet PDF — #{order.bagId}</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>
              Fill fields → Generate PDF → prints <strong style={{color:theme.gold}}>4 copies on 1 A4 page</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${theme.borderGold}`, padding:"0 28px", flexShrink:0 }}>
          {[["info","Order Info"],["acces","Accessories"],["dept","Dept Workflow"]].map(([k,lbl]) => (
            <button key={k} onClick={()=>setTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 18px", fontSize:13, fontFamily:"'DM Sans'", color:tab===k?theme.gold:theme.textMuted, borderBottom:`2px solid ${tab===k?theme.gold:"transparent"}`, marginBottom:-1, transition:"all 0.2s" }}>{lbl}</button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px 24px" }}>
                {[["Bag No",`#${order.bagId}`],["Customer",order.customerName],["Category",order.folder],["Item",order.item],["Order Date",fmt(order.orderDate)],["Delivery",fmt(order.deliveryDate)],["Size",order.size||"—"],["Labour",`₹${(order.labourTotal||0).toLocaleString()}`],["Status",order.status]].map(([l,v]) => (
                  <div key={l}><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                {[["C.Code","cCode","e.g. GJ05-BBJ","text"],["KT (Karat)","kt","e.g. 18K, 22K","text"],["Bag Qty","bagQty","1","number"]].map(([lbl,k,ph,type]) => (
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} type={type} value={manual[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[["Style Instructions","styleInstr","Style instructions..."],["Finding Instructions","findingInstr","Finding instructions..."]].map(([lbl,k,ph]) => (
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} value={manual[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              {/* 4-up info box */}
              <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"12px 16px", fontSize:12, color:theme.textMuted }}>
                🖨️ This PDF will print <strong style={{color:theme.gold}}>4 identical copies</strong> of the bag sheet arranged in a 2×2 grid on a single A4 page. Perfect for cutting and distributing to workshop departments.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["G.WT",`${order.gramHistory?.[0]??0}g`,theme.textMuted],["D.WT",`${(order.diamondShapes||[]).reduce((s,d)=>s+(d.weight||0)*(d.pcs||1),0).toFixed(3)}g`,theme.gold],["N.WT",`${order.gramHistory?.[order.gramHistory.length-1]??0}g`,theme.success]].map(([l,v,c]) => (
                  <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "acces" && (
            <div>
              <div style={{ fontSize:12, color:theme.textMuted, marginBottom:16 }}>Enter issue and return quantities for each accessory material.</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
                  <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={80}>Acces.</TH><TH>Issue 1</TH><TH>Issue 2</TH><TH>Issue 3</TH><TH>Rec 1</TH><TH>Rec 2</TH><TH>Rec 3</TH></tr></thead>
                  <tbody>{manual.accessories.map((a,idx)=>(
                    <tr key={a.name} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                      <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500 }}>{a.name}</td>
                      {["issue1","issue2","issue3","rec1","rec2","rec3"].map(k=>(
                        <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={a[k]} onChange={e=>updAcces(idx,k,e.target.value)} placeholder="—"/></td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          {tab === "dept" && (
            <div>
              <div style={{ fontSize:12, color:theme.textMuted, marginBottom:16 }}>Gram history from workflow is pre-filled. Add worker names, dates, diff, and dust.</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
                  <thead><tr style={{ borderBottom:`1px solid ${theme.borderGold}` }}><TH w={52}>Dept</TH><TH>Date</TH><TH>Worker</TH><TH>Issue (g)</TH><TH>Rec (g)</TH><TH>Diff</TH><TH>Dust</TH></tr></thead>
                  <tbody>{manual.depts.map((d,idx)=>(
                    <tr key={d.dept} style={{ borderBottom:`1px solid ${theme.borderGold}` }}>
                      <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500,whiteSpace:"nowrap" }}>{d.dept}</td>
                      {["date","worker","issue","rec","diff","dust"].map(k=>(
                        <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={d[k]} onChange={e=>updDept(idx,k,e.target.value)} placeholder="—"/></td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 28px", borderTop:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div style={{ fontSize:12, color:theme.textMuted }}>💡 New tab opens → browser Print → Save as PDF</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"9px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={generate} style={{ background:"linear-gradient(135deg,#9A7A2E,#C9A84C)", color:"#0D0B07", border:"none", padding:"10px 26px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <svg width="14" height="14" fill="none" stroke="#0D0B07" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
              Generate PDF (4-up)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Quick Gram Modal (mark done from list card) ────────────────────────────────
const QuickGramModal = ({ order, onClose, onConfirm }) => {
  const currG = order.gramHistory[order.gramHistory.length - 1];
  const [gramRemaining, setGramRemaining] = useState("");
  const [gramError,     setGramError]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const confirm = async () => {
    const remaining = parseFloat(gramRemaining);
    if (!gramRemaining || isNaN(remaining)) { setGramError("Please enter remaining gold."); return; }
    if (remaining > currG) { setGramError(`Cannot exceed ${currG}g.`); return; }
    if (remaining < 0)     { setGramError("Cannot be negative."); return; }
    setSaving(true);
    try {
      const res = await orderAPI.updateStep(order._id, remaining);
      onConfirm(res.data.data);
    } catch (err) { setGramError(err.response?.data?.error || "Failed to update."); }
    finally { setSaving(false); }
  };
  const used = gramRemaining !== "" && !isNaN(parseFloat(gramRemaining)) ? (currG - parseFloat(gramRemaining)).toFixed(2) : null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(3px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:28, width:"92vw", maxWidth:420 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:theme.gold, marginBottom:6 }}>✦ Step {order.currentStep + 1}: {STEPS[order.currentStep]}</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:18 }}>Bag #{order.bagId} — {order.customerName}</div>
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, marginBottom:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>GOLD BEFORE THIS STEP</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.textMuted }}>{currG}g</div></div>
          <div style={{ fontSize:12, color:theme.textMuted, textAlign:"right" }}>Weigh gold now,<br/>enter remaining</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Remaining Gold (grams)</div>
          <input type="number" value={gramRemaining} placeholder={`max: ${currG}`} autoFocus onChange={e=>{setGramRemaining(e.target.value);setGramError("");}}
            style={{ width:"100%", background:theme.bg, border:`1px solid ${gramError?theme.danger:theme.borderGold}`, color:theme.text, padding:"10px 14px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:14, outline:"none" }}/>
          {gramError && <div style={{ fontSize:12, color:theme.danger, marginTop:5 }}>⚠ {gramError}</div>}
        </div>
        {used !== null && (
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, display:"flex", justifyContent:"space-around", marginBottom:18 }}>
            {[["BEFORE",`${currG}g`,theme.textMuted],["USED",`${used}g`,theme.danger],["REMAINING",`${parseFloat(gramRemaining)}g`,theme.gold]].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>{l}</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div></div>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={confirm} disabled={saving} className="btn-primary" style={{ flex:1, padding:12, fontSize:14 }}>{saving?"Saving...":"Confirm Step Done"}</button>
          <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const BagWorkflow = ({ orders, setOrders, customers = [] }) => {
  const [selectedId,     setSelectedId]     = useState(null);
  const [showGramModal,  setShowGramModal]  = useState(false);
  const [gramRemaining,  setGramRemaining]  = useState("");
  const [gramError,      setGramError]      = useState("");
  const [search,         setSearch]         = useState("");
  const [stepFilter,     setStepFilter]     = useState("");
  const [pdfOrder,       setPdfOrder]       = useState(null);
  const [quickMarkOrder, setQuickMarkOrder] = useState(null);

  const order = orders.find(o => o._id === selectedId);

  const getCustomerGold = (customerId) => {
    const c = customers.find(c => c._id === (customerId?._toString?.() || customerId));
    return c?.gold ?? null;
  };

  const filtered = orders.filter(o => {
    const matchSearch = search ? (o.bagId||"").toLowerCase().includes(search.toLowerCase()) : true;
    const matchStep   = stepFilter !== "" ? String(o.currentStep) === String(stepFilter) : true;
    return matchSearch && matchStep;
  });

  const confirmStep = async () => {
    const remaining = parseFloat(gramRemaining);
    const prev      = order.gramHistory[order.gramHistory.length - 1];
    if (!gramRemaining || isNaN(remaining)) { setGramError("Please enter remaining gold."); return; }
    if (remaining > prev) { setGramError(`Cannot exceed ${prev}g.`); return; }
    if (remaining < 0)    { setGramError("Cannot be negative."); return; }
    try {
      const res = await orderAPI.updateStep(order._id, remaining);
      setOrders(p => p.map(o => o._id === order._id ? res.data.data : o));
      setShowGramModal(false); setGramRemaining("");
    } catch (err) { setGramError(err.response?.data?.error || "Failed to update."); }
  };

  const handleQuickConfirm = (updatedOrder) => {
    setOrders(p => p.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setQuickMarkOrder(null);
  };

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selectedId && order) {
    const currG       = order.gramHistory[order.gramHistory.length - 1];
    const startG      = order.gramHistory[0];
    const wastage     = (startG - currG).toFixed(2);
    const custGold    = getCustomerGold(order.customer);
    const isCompleted = order.status === "Completed";

    return (
      <div className="fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
          <button className="btn-ghost" onClick={()=>setSelectedId(null)}>← Orders</button>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>Bag #{order.bagId}</div>
          <div style={{ color:theme.textMuted, fontSize:13 }}>— {order.customerName} · {order.item}</div>
          <span className="tag" style={{ marginLeft:"auto", background:isCompleted?`${theme.success}20`:`${theme.gold}18`, color:isCompleted?theme.success:theme.gold }}>{order.status}</span>
          <button onClick={()=>setPdfOrder(order)} style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"8px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
            Bag Sheet PDF
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[["ORDER DATE",fmt(order.orderDate)],["DELIVERY DATE",fmt(order.deliveryDate)],["LABOUR TOTAL",order.labourTotal>0?`₹${order.labourTotal.toLocaleString()}`:"—"],["ITEM NO.",order.itemNumber||"—"]].map(([label,val]) => (
            <div key={label} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, color:theme.textMuted, marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:14 }}>{val}</div>
            </div>
          ))}
        </div>
        {custGold !== null && (
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>CUSTOMER GOLD BALANCE</div><div style={{ fontSize:13, color:theme.textMuted }}>{order.customerName}</div></div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>{custGold}g</div>
          </div>
        )}
        {order.diamondShapes?.length > 0 && (
          <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, color:theme.textMuted, marginBottom:10 }}>DIAMONDS USED</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {order.diamondShapes.map((s,i) => (
                <span key={i} className="tag" style={{ background:"#7EC8E315", border:"1px solid #7EC8E340", color:"#7EC8E3" }}>{s.shapeName} · {s.sizeInMM&&`${s.sizeInMM}mm · `}{s.pcs} pcs</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24 }}>
          {[["CURRENT ITEM GOLD",`${currG}g`,theme.gold],["INITIAL ITEM GOLD",`${startG}g`,theme.textMuted],["TOTAL WASTAGE",`${wastage}g`,theme.danger]].map(([label,val,color]) => (
            <div key={label} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:8 }}>{label}</div>
              <div className="gram-display" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:theme.textMuted }}>Progress</span>
            <span style={{ fontSize:12, color:theme.gold }}>{order.currentStep}/{STEPS.length} steps</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${(order.currentStep/STEPS.length)*100}%`}}/></div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {STEPS.map((step, i) => {
            const done    = i < order.currentStep;
            const current = i === order.currentStep;
            const before  = order.gramHistory[i];
            const after   = order.gramHistory[i + 1];
            return (
              <div key={i} className={`step-item ${done?"done":""}`}>
                <div className={`step-circle ${done?"done":current?"current":""}`}>{done ? <Icon name="check" size={14} color="#0D0B07"/> : i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                  {done && after !== undefined && (
                    <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
                      {before}g → <span style={{ color:theme.gold }}>{after}g</span>
                      <span style={{ color:theme.danger, marginLeft:8 }}>−{(before-after).toFixed(2)}g used</span>
                    </div>
                  )}
                </div>
                {done && <span className="tag" style={{ background:`${theme.success}18`, color:theme.success, fontSize:11 }}>Done</span>}
                {current && !isCompleted && (
                  <button className="btn-primary" onClick={()=>{setGramRemaining("");setGramError("");setShowGramModal(true);}}>Mark Done</button>
                )}
              </div>
            );
          })}
        </div>
        {isCompleted && (
          <div style={{ marginTop:24, background:`${theme.success}12`, border:`1px solid ${theme.success}40`, borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.success }}>✦ Order Complete</div>
            <div style={{ color:theme.textMuted, fontSize:13, marginTop:6 }}>Final: {currG}g · Wastage: {wastage}g</div>
          </div>
        )}
        {showGramModal && (
          <Modal title={`✦ Step ${order.currentStep+1}: ${STEPS[order.currentStep]}`} onClose={()=>setShowGramModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:theme.surfaceAlt, borderRadius:10, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>GOLD BEFORE THIS STEP</div><div className="gram-display" style={{ fontSize:32, color:theme.textMuted }}>{currG}g</div></div>
                <div style={{ fontSize:12, color:theme.textMuted, textAlign:"right" }}>Weigh gold now<br/>enter remaining</div>
              </div>
              <Field label="Remaining Gold After Step (grams)" error={gramError}>
                <input type="number" value={gramRemaining} onChange={e=>{setGramRemaining(e.target.value);setGramError("");}} placeholder={`max: ${currG}`} autoFocus/>
              </Field>
              {gramRemaining !== "" && !isNaN(parseFloat(gramRemaining)) && (
                <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, display:"flex", justifyContent:"space-around", alignItems:"center" }}>
                  {[["BEFORE",`${currG}g`,theme.textMuted],[" "],["USED",`${(currG-parseFloat(gramRemaining)).toFixed(2)}g`,theme.danger],[" "],["REMAINING",`${parseFloat(gramRemaining)}g`,theme.gold]].map((item,idx) =>
                    item[1] ? (
                      <div key={idx} style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>{item[0]}</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:item[2] }}>{item[1]}</div></div>
                    ) : <div key={idx} style={{ fontSize:20, color:theme.borderGold }}>−</div>
                  )}
                </div>
              )}
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn-primary" onClick={confirmStep} style={{ flex:1 }}>Confirm Step Done</button>
                <button className="btn-ghost" onClick={()=>setShowGramModal(false)}>Cancel</button>
              </div>
            </div>
          </Modal>
        )}
        {pdfOrder && <PDFModal order={pdfOrder} onClose={()=>setPdfOrder(null)}/>}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div className="section-title">Bag Workflow</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{orders.length} total orders</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}><Icon name="search" size={15} color={theme.textMuted}/></div>
          <input className="search-input" placeholder="Search by Bag ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="filter" size={15} color={theme.textMuted}/>
          <select value={stepFilter} onChange={e=>setStepFilter(e.target.value)} style={{ width:200 }}>
            <option value="">All Steps</option>
            {STEPS.map((s,i)=><option key={i} value={i}>Step {i+1}: {s}</option>)}
            <option value={STEPS.length}>Completed</option>
          </select>
        </div>
        {(search || stepFilter !== "") && (
          <button className="btn-ghost" onClick={()=>{setSearch("");setStepFilter("");}} style={{ padding:"8px 14px", fontSize:13 }}>Clear filters</button>
        )}
        <span style={{ marginLeft:"auto", fontSize:13, color:theme.textMuted }}>{filtered.length} of {orders.length} orders</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="bag" size={40} color={theme.borderGold}/><br/><br/>
            {orders.length === 0 ? "No orders yet. Create one first!" : "No orders match your filters."}
          </div>
        )}
        {filtered.map(o => {
          const currG      = o.gramHistory[o.gramHistory.length - 1];
          const prog       = (o.currentStep / STEPS.length) * 100;
          const custGold   = getCustomerGold(o.customer);
          const isComplete = o.status === "Completed";
          const canMark    = o.currentStep < STEPS.length && !isComplete;
          return (
            <div key={o._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ display:"flex", gap:14, alignItems:"center", cursor:"pointer", flex:1 }} onClick={()=>setSelectedId(o._id)}>
                  {o.itemImage && <img src={o.itemImage} alt="" style={{ width:48, height:48, objectFit:"contain", borderRadius:8, border:`1px solid ${theme.borderGold}`, background:theme.surfaceAlt, padding:2 }}/>}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:theme.gold }}>#{o.bagId}</span>
                      <span style={{ fontSize:15 }}>{o.customerName}</span>
                    </div>
                    <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
                    <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                      {o.currentStep < STEPS.length ? `Step ${o.currentStep+1}: ${STEPS[o.currentStep]}` : "Completed"}
                      {o.deliveryDate && ` · Due: ${fmt(o.deliveryDate)}`}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:theme.textMuted }}>ITEM GOLD</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{currG}g</div>
                    </div>
                    {custGold !== null && (
                      <div style={{ textAlign:"right", borderLeft:`1px solid ${theme.borderGold}`, paddingLeft:10 }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>CUSTOMER TOTAL</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#E8C97A" }}>{custGold}g</div>
                      </div>
                    )}
                    <span className="tag" style={{ background:isComplete?`${theme.success}20`:`${theme.gold}18`, color:isComplete?theme.success:theme.gold }}>{o.status}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {canMark && (
                      <button onClick={e=>{e.stopPropagation();setQuickMarkOrder(o);}}
                        style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.success}18`, border:`1px solid ${theme.success}50`, color:theme.success, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${theme.success}30`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${theme.success}18`}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        Mark Done
                      </button>
                    )}
                    <button onClick={e=>{e.stopPropagation();setPdfOrder(o);}}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer" }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${theme.gold}28`;e.currentTarget.style.borderColor=theme.gold;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=`${theme.gold}15`;e.currentTarget.style.borderColor=`${theme.gold}50`;}}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
                      PDF
                    </button>
                  </div>
                </div>
              </div>
              <div className="progress-bar" style={{ cursor:"pointer" }} onClick={()=>setSelectedId(o._id)}>
                <div className="progress-fill" style={{ width:`${prog}%`}}/>
              </div>
              <div style={{ fontSize:11, color:theme.textMuted, marginTop:6 }}>Step {o.currentStep}/{STEPS.length}</div>
            </div>
          );
        })}
      </div>
      {quickMarkOrder && <QuickGramModal order={quickMarkOrder} onClose={()=>setQuickMarkOrder(null)} onConfirm={handleQuickConfirm}/>}
      {pdfOrder && <PDFModal order={pdfOrder} onClose={()=>setPdfOrder(null)}/>}
    </div>
  );
};

export default BagWorkflow;
