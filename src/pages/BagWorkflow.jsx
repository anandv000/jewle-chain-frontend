import React, { useState } from "react";
import { theme, STEPS } from "../theme";
import { orderAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";

const ACCES_ROWS  = ["Solder", "Wire", "Finding", "Metal"];
const DEPT_LABELS = ["SGRD", "CAST", "FIL", "EP", "POL", "SET", "FPOL"];

// ── Owner Gold Badge ──────────────────────────────────────────────────────────
const OwnerBadge = ({ style = {} }) => (
  <span style={{
    background:"#7B5EA715", border:"1px solid #7B5EA750",
    color:"#B39DDB", fontSize:11, padding:"3px 10px", borderRadius:12,
    fontFamily:"'DM Sans'", fontWeight:500, ...style,
  }}>
    ✦ Using Owner's Gold (Lariot Jweles)
  </span>
);

// ── PDF helpers ───────────────────────────────────────────────────────────────
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

function bagSheetBlock(order, manual) {
  const gWT  = order.gramHistory?.[0] ?? 0;
  const nWT  = order.gramHistory?.[order.gramHistory.length - 1] ?? 0;
  const dWT  = (order.diamondShapes || []).reduce((s, d) => s + (d.weight || 0) * (d.pcs || 1), 0);
  const dPcs = (order.diamondShapes || []).reduce((s, d) => s + (d.pcs || 1), 0);
  const imgTag = order.itemImage
    ? `<img src="${order.itemImage}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:9px;">No Image</div>`;
  const acceRows = (manual.accessories||[]).map(a=>`<tr><td class="lbl">${a.name}</td><td>${a.issue1}</td><td>${a.issue2}</td><td>${a.issue3}</td><td>${a.rec1}</td><td>${a.rec2}</td><td>${a.rec3}</td></tr>`).join("");
  const deptRows = (manual.depts||[]).map(d=>`<tr><td class="lbl">${d.dept}</td><td>${d.date}</td><td>${d.worker}</td><td>${d.issue}</td><td>${d.rec}</td><td>${d.diff}</td><td>${d.dust}</td></tr>`).join("");
  const diaRows  = (order.diamondShapes||[]).length
    ? (order.diamondShapes).map(d=>`<tr><td>${d.shapeName||"—"}</td><td>${d.sizeInMM||"—"}</td><td>${d.weight??""}</td><td>${d.pcs??1}</td><td>${((d.weight||0)*(d.pcs||1)).toFixed(3)}</td><td></td><td></td><td></td><td></td></tr>`).join("")
    : `<tr><td colspan="9" style="text-align:center;color:#aaa;font-style:italic">No diamonds</td></tr>`;
  return `<div class="sheet">
  <div class="top-header"><div class="top-left"><div class="info-grid">
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
  </div></div><div class="top-img">${imgTag}</div></div>
  <div class="instr-row"><div class="instr-cell"><b>Style: </b>${manual.styleInstr||""}</div><div class="instr-cell"><b>Finding: </b>${manual.findingInstr||""}</div></div>
  <div class="sec">Accessories</div>
  <table><thead><tr><th style="width:38px">Acces.</th><th>Iss</th><th>Iss</th><th>Iss</th><th>Rec</th><th>Rec</th><th>Rec</th></tr></thead><tbody>${acceRows}</tbody></table>
  <div class="sec">Dept Workflow</div>
  <table><thead><tr><th>Dept</th><th>Date</th><th>Worker</th><th>Issue</th><th>Rec</th><th>Diff</th><th>Dust</th></tr></thead><tbody>${deptRows}</tbody></table>
  <div class="sec">Diamond Details</div>
  <table><thead><tr><th rowspan="2">Code</th><th rowspan="2">Size</th><th rowspan="2">Wt</th><th rowspan="2">Pcs</th><th rowspan="2">Total</th><th colspan="2">Issue</th><th colspan="2">Return</th></tr><tr><th>Pcs</th><th>WT</th><th>Pcs</th><th>WT</th></tr></thead><tbody>${diaRows}</tbody></table>
  <div class="wbar">
    <div class="wc">G.WT:<b>${gWT.toFixed(3)}</b></div>
    <div class="wc">D.WT:${dPcs}pc <b>${dWT.toFixed(3)}</b></div>
    <div class="wc">N.WT:<b>${nWT.toFixed(3)}</b></div>
  </div>
  ${order.usesOwnerGold ? `<div style="font-size:8px;text-align:center;margin-top:3px;color:#888">Gold from Owner: Lariot Jweles</div>` : ""}
</div>`;
}

function generateBagSheetHTML(order, manual) {
  const block = bagSheetBlock(order, manual);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Bag Sheet — ${order.bagId||"ORDER"}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000}
.a4-page{width:210mm;height:297mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:0;overflow:hidden}
.cell{width:105mm;height:148.5mm;overflow:hidden;position:relative;border:0.3mm solid #ccc}
.sheet-wrap{position:absolute;top:0;left:0;transform-origin:top left;transform:scale(0.48);width:208.33%}
.sheet{width:760px;font-size:9px;padding:6px 8px}
.top-header{border:1.5px solid #000;display:grid;grid-template-columns:1fr 90px}
.top-left{padding:4px 6px}.info-grid{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 5px;align-items:baseline}
.il{font-weight:700;white-space:nowrap;font-size:9px}.iv{font-size:9px}
.top-img{border-left:1.5px solid #000;overflow:hidden}
.instr-row{display:grid;grid-template-columns:1fr 1fr;border:1.5px solid #000;border-top:0;margin-bottom:6px}
.instr-cell{padding:3px 5px;font-size:9px}.instr-cell:first-child{border-right:1px solid #000}
.sec{background:#d8d8d8;font-weight:700;font-size:8px;padding:2px 5px;border:1px solid #000;border-bottom:0;text-transform:uppercase;margin-top:5px}
table{width:100%;border-collapse:collapse;font-size:8px}
th{background:#ebebeb;font-weight:700;text-align:center;font-size:7px;padding:2px 3px;border:1px solid #000}
td{border:1px solid #000;padding:2px 3px;min-height:12px}.lbl{font-weight:700;background:#f7f7f7}
.wbar{display:grid;grid-template-columns:1fr 1fr 1fr;border:1.5px solid #000;margin-top:5px}
.wc{padding:4px 6px;font-weight:700;font-size:9px;text-align:center;border-right:1px solid #000}.wc:last-child{border-right:0}
@media print{body{margin:0;padding:0}@page{margin:0;size:A4 portrait}}
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
    if (!win) alert("Allow popups → use browser Print → Save as PDF");
    setTimeout(() => URL.revokeObjectURL(url), 90000);
  };
  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };
  const cellInp = { ...inp, padding:"5px 6px", fontSize:12, textAlign:"center" };
  const TH = ({ children, w }) => <th style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", padding:"7px 6px", borderBottom:`1px solid ${theme.borderGold}`, textAlign:"center", fontWeight:500, width:w }}>{children}</th>;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"94vw", maxWidth:820, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, color:theme.gold }}>✦ Bag Sheet — #{order.bagId}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
              <div style={{ fontSize:12, color:theme.textMuted }}>4 copies on 1 A4 → Print → Save as PDF</div>
              {order.usesOwnerGold && <OwnerBadge/>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <svg width="18" height="18" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${theme.borderGold}`, padding:"0 28px", flexShrink:0 }}>
          {[["info","Order Info"],["acces","Accessories"],["dept","Dept Workflow"]].map(([k,lbl]) => (
            <button key={k} onClick={()=>setTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 18px", fontSize:13, fontFamily:"'DM Sans'", color:tab===k?theme.gold:theme.textMuted, borderBottom:`2px solid ${tab===k?theme.gold:"transparent"}`, marginBottom:-1 }}>{lbl}</button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px 24px" }}>
                {[["Bag No",`#${order.bagId}`],["Customer",order.customerName],["Category",order.folder],["Item",order.item],["Order Date",fmt(order.orderDate)],["Delivery",fmt(order.deliveryDate)],["Casting Gold",order.castingGold>0?`${order.castingGold}g`:"Not cast yet"],["Labour",`₹${(order.labourTotal||0).toLocaleString()}`],["Status",order.status]].map(([l,v]) => (
                  <div key={l}><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div></div>
                ))}
              </div>
              {order.usesOwnerGold && <OwnerBadge style={{ display:"block", textAlign:"center", padding:"8px", borderRadius:8 }}/>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                {[["C.Code","cCode","e.g. GJ05-BBJ","text"],["KT","kt","e.g. 18K","text"],["Bag Qty","bagQty","1","number"]].map(([lbl,k,ph,type]) => (
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} type={type} value={manual[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[["Style Instructions","styleInstr","Style..."],["Finding Instructions","findingInstr","Finding..."]].map(([lbl,k,ph]) => (
                  <div key={k}><div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{lbl}</div><input style={inp} value={manual[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["Casting Gold (G.WT)",`${order.gramHistory?.[0]??0}g`,theme.textMuted],["D.WT",`${(order.diamondShapes||[]).reduce((s,d)=>s+(d.weight||0)*(d.pcs||1),0).toFixed(3)}g`,theme.gold],["Final Gold (N.WT)",`${order.gramHistory?.[order.gramHistory.length-1]??0}g`,theme.success]].map(([l,v,c]) => (
                  <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:theme.textMuted, marginBottom:6 }}>{l}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
                  </div>
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
                    <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500 }}>{a.name}</td>
                    {["issue1","issue2","issue3","rec1","rec2","rec3"].map(k=>(
                      <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={a[k]} onChange={e=>updAcces(idx,k,e.target.value)} placeholder="—"/></td>
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
                    <td style={{ padding:"8px 6px",fontSize:13,color:theme.gold,fontWeight:500 }}>{d.dept}</td>
                    {["date","worker","issue","rec","diff","dust"].map(k=>(
                      <td key={k} style={{ padding:"5px 4px" }}><input style={cellInp} value={d[k]} onChange={e=>updDept(idx,k,e.target.value)} placeholder="—"/></td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 28px", borderTop:`1px solid ${theme.borderGold}`, flexShrink:0 }}>
          <div style={{ fontSize:12, color:theme.textMuted }}>💡 New tab → Print → Save as PDF</div>
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

// ══════════════════════════════════════════════════════════════════════════════
//  STEP MODALS
// ══════════════════════════════════════════════════════════════════════════════

// ── Step 0: Design & Wax sub-steps ────────────────────────────────────────────
const DesignWaxModal = ({ order, onClose, onUpdated }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [designDone, setDesignDone] = useState(order.designDone || false);
  const [waxDone,    setWaxDone]    = useState(order.waxDone    || false);

  const markSubStep = async (subStep) => {
    setSaving(true); setError("");
    try {
      const res = await orderAPI.markSubStep(order._id, subStep);
      const updated = res.data.data;
      if (subStep === "design") setDesignDone(true);
      if (subStep === "wax")    setWaxDone(true);
      onUpdated(updated);
      // Close if both done (step advanced)
      if (updated.currentStep > 0) onClose();
    } catch (err) { setError(err.response?.data?.error || "Failed. Try again."); }
    finally { setSaving(false); }
  };

  const btnBase = (done) => ({
    padding:"8px 18px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13,
    fontWeight:600, cursor: done ? "default" : "pointer",
    border:"none", display:"inline-flex", alignItems:"center", gap:6,
    background: done ? `${theme.success}20` : `linear-gradient(135deg,#9A7A2E,#C9A84C)`,
    color: done ? theme.success : "#0D0B07",
    opacity: saving ? 0.6 : 1,
  });

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:520 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:6 }}>✦ Step 1: Design & Wax</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:8 }}>Bag #{order.bagId} — {order.customerName}</div>
        {order.usesOwnerGold && <div style={{ marginBottom:16 }}><OwnerBadge/></div>}
        <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>
          Mark both <strong style={{color:theme.text}}>Design</strong> and <strong style={{color:theme.text}}>Wax</strong> as done to complete this step. No gold entry required here.
        </div>

        {/* Design sub-step */}
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${designDone?`${theme.success}50`:theme.borderGold}`, borderRadius:12, padding:"16px 20px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:15, color:theme.text, fontWeight:500 }}>Design</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>Jewellery design finalization</div>
          </div>
          {designDone ? (
            <span style={{ color:theme.success, fontSize:13, fontWeight:600 }}>✓ Done</span>
          ) : (
            <button style={btnBase(false)} onClick={()=>markSubStep("design")} disabled={saving}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              Mark Done
            </button>
          )}
        </div>

        {/* Wax sub-step */}
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${waxDone?`${theme.success}50`:theme.borderGold}`, borderRadius:12, padding:"16px 20px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:15, color:theme.text, fontWeight:500 }}>Wax</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>Wax mould preparation</div>
          </div>
          {waxDone ? (
            <span style={{ color:theme.success, fontSize:13, fontWeight:600 }}>✓ Done</span>
          ) : (
            <button style={btnBase(false)} onClick={()=>markSubStep("wax")} disabled={saving}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              Mark Done
            </button>
          )}
        </div>

        {!designDone || !waxDone ? (
          <div style={{ background:`${theme.gold}08`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"10px 16px", fontSize:12, color:theme.textMuted, marginBottom:16 }}>
            ℹ️ Complete both Design and Wax to advance to the Casting step.
          </div>
        ) : (
          <div style={{ background:`${theme.success}10`, border:`1px solid ${theme.success}40`, borderRadius:10, padding:"10px 16px", fontSize:12, color:theme.success, marginBottom:16 }}>
            ✓ Both sub-steps done! Advancing to Casting step...
          </div>
        )}

        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}

        <button onClick={onClose} style={{ width:"100%", background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"10px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
};

// ── Step 1: Casting — allocate gold ───────────────────────────────────────────
const CastingModal = ({ order, onClose, onUpdated }) => {
  const [castingGrams, setCastingGrams] = useState("");
  const [error,        setError]        = useState("");
  const [saving,       setSaving]       = useState(false);

  const confirm = async () => {
    const g = parseFloat(castingGrams);
    if (!castingGrams || isNaN(g) || g <= 0) { setError("Enter grams to allocate for this bag."); return; }
    setSaving(true); setError("");
    try {
      const res = await orderAPI.castingStep(order._id, g);
      onUpdated(res.data.data);
      onClose();
    } catch (err) { setError(err.response?.data?.error || "Failed to save casting. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:460 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:6 }}>✦ Step 2: Casting</div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:8 }}>Bag #{order.bagId} — {order.customerName}</div>
        {order.usesOwnerGold && <div style={{ marginBottom:16 }}><OwnerBadge/></div>}

        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>
            {order.usesOwnerGold ? "OWNER'S GOLD (LARIOT JWELES)" : "CUSTOMER GOLD BALANCE"}
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:order.usesOwnerGold?"#B39DDB":theme.gold }}>
            {order.usesOwnerGold ? "Using Owner's Stock" : `${order.customer?.gold ?? 0}g available`}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>
            How many grams of gold for this bag? *
          </div>
          <input
            type="number" step="0.001" min="0.001" value={castingGrams} autoFocus
            onChange={e=>{ setCastingGrams(e.target.value); setError(""); }}
            placeholder="e.g. 12.000"
            style={{ width:"100%", background:theme.bg, border:`1px solid ${error?theme.danger:theme.borderGold}`, color:theme.text, padding:"12px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:16, outline:"none" }}
          />
          {error && <div style={{ fontSize:12, color:theme.danger, marginTop:6 }}>⚠ {error}</div>}
        </div>

        {castingGrams && !isNaN(parseFloat(castingGrams)) && parseFloat(castingGrams) > 0 && (
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, marginBottom:20, textAlign:"center" }}>
            <div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>GOLD ALLOCATED TO THIS BAG</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>{parseFloat(castingGrams).toFixed(3)}g</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
              This becomes the starting gold for wastage tracking from Filing step onwards.
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12 }}>
          <button onClick={confirm} disabled={saving} style={{ flex:1, background:"linear-gradient(135deg,#9A7A2E,#C9A84C)", color:"#0D0B07", border:"none", padding:"12px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:14, cursor:"pointer", opacity:saving?0.6:1 }}>
            {saving ? "Allocating..." : "Confirm Casting Gold →"}
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"12px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Steps 2-6: Remaining gold (wastage tracking) ──────────────────────────────
const WastageStepModal = ({ order, onClose, onUpdated }) => {
  const currG   = order.gramHistory[order.gramHistory.length - 1];
  const stepName = STEPS[order.currentStep];
  const [remaining, setRemaining] = useState("");
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);

  const confirm = async () => {
    const r = parseFloat(remaining);
    if (remaining === "" || isNaN(r) || r < 0) { setError("Enter valid remaining gold."); return; }
    if (r > currG) { setError(`Cannot exceed ${currG}g.`); return; }
    setSaving(true); setError("");
    try {
      const res = await orderAPI.completeStep(order._id, r);
      onUpdated(res.data.data);
      onClose();
    } catch (err) { setError(err.response?.data?.error || "Failed. Try again."); }
    finally { setSaving(false); }
  };

  const used = remaining !== "" && !isNaN(parseFloat(remaining)) ? (currG - parseFloat(remaining)).toFixed(3) : null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:32, width:"92vw", maxWidth:460 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:6 }}>
          ✦ Step {order.currentStep + 1}: {stepName}
        </div>
        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:8 }}>Bag #{order.bagId} — {order.customerName}</div>
        {order.usesOwnerGold && <div style={{ marginBottom:16 }}><OwnerBadge/></div>}

        {/* Gold before this step */}
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>GOLD BEFORE THIS STEP</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.textMuted }}>{currG}g</div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>Started at casting: {order.castingGold}g</div>
          </div>
          <div style={{ fontSize:12, color:theme.textMuted, textAlign:"right" }}>Weigh gold now,<br/>enter remaining</div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Remaining Gold After This Step (grams) *</div>
          <input type="number" step="0.001" min="0" max={currG} value={remaining} autoFocus
            onChange={e=>{ setRemaining(e.target.value); setError(""); }}
            placeholder={`max: ${currG}`}
            style={{ width:"100%", background:theme.bg, border:`1px solid ${error?theme.danger:theme.borderGold}`, color:theme.text, padding:"12px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:16, outline:"none" }}
          />
          {error && <div style={{ fontSize:12, color:theme.danger, marginTop:6 }}>⚠ {error}</div>}
        </div>

        {used !== null && (
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20, textAlign:"center" }}>
            {[["BEFORE",`${currG}g`,theme.textMuted],["USED THIS STEP",`${used}g`,theme.danger],["REMAINING",`${parseFloat(remaining).toFixed(3)}g`,theme.gold]].map(([l,v,c]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>{l}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cumulative wastage */}
        {used !== null && order.castingGold > 0 && (
          <div style={{ background:`${theme.danger}08`, border:`1px solid ${theme.danger}30`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:theme.textMuted }}>
            Total wastage from casting: <strong style={{color:theme.danger}}>{(order.castingGold - parseFloat(remaining)).toFixed(3)}g</strong> of {order.castingGold}g casting gold
          </div>
        )}

        <div style={{ display:"flex", gap:12 }}>
          <button onClick={confirm} disabled={saving} style={{ flex:1, background:"linear-gradient(135deg,#9A7A2E,#C9A84C)", color:"#0D0B07", border:"none", padding:"12px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:700, fontSize:14, cursor:"pointer", opacity:saving?0.6:1 }}>
            {saving ? "Saving..." : "Confirm Step Done →"}
          </button>
          <button onClick={onClose} style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"12px 20px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Smart Step Modal — picks right modal based on currentStep ─────────────────
const StepModal = ({ order, onClose, onUpdated }) => {
  if (!order) return null;
  if (order.currentStep === 0) return <DesignWaxModal order={order} onClose={onClose} onUpdated={onUpdated}/>;
  if (order.currentStep === 1) return <CastingModal   order={order} onClose={onClose} onUpdated={onUpdated}/>;
  return <WastageStepModal order={order} onClose={onClose} onUpdated={onUpdated}/>;
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const BagWorkflow = ({ orders, setOrders, customers = [] }) => {
  const [selectedId,  setSelectedId]  = useState(null);
  const [stepOrder,   setStepOrder]   = useState(null); // order for step modal
  const [search,      setSearch]      = useState("");
  const [stepFilter,  setStepFilter]  = useState("");
  const [pdfOrder,    setPdfOrder]    = useState(null);

  const order = orders.find(o => o._id === selectedId);

  const getCustomerGold = (customerId) => {
    const c = customers.find(c => c._id === (customerId?._id || customerId));
    return c?.gold ?? null;
  };

  const filtered = orders.filter(o => {
    const matchSearch = search ? (o.bagId||"").toString().toLowerCase().includes(search.toLowerCase()) || (o.customerName||"").toLowerCase().includes(search.toLowerCase()) : true;
    const matchStep   = stepFilter !== "" ? String(o.currentStep) === String(stepFilter) : true;
    return matchSearch && matchStep;
  });

  const handleUpdated = (updatedOrder) => {
    setOrders(p => p.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    // Also update selected if in detail view
    if (selectedId === updatedOrder._id && updatedOrder.currentStep > 0) {
      // stay in detail view with updated data
    }
  };

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (selectedId && order) {
    const castG     = order.castingGold || 0;
    const currG     = order.gramHistory?.length > 0 ? order.gramHistory[order.gramHistory.length - 1] : 0;
    const wastage   = castG > 0 ? (castG - currG).toFixed(3) : "0.000";
    const isCompleted = order.status === "Completed";

    return (
      <div className="fade-in">
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
          <button className="btn-ghost" onClick={()=>setSelectedId(null)}>← All Bags</button>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>Bag #{order.bagId}</div>
          <div style={{ color:theme.textMuted, fontSize:13 }}>— {order.customerName} · {order.item}</div>
          {order.usesOwnerGold && <OwnerBadge/>}
          <span className="tag" style={{ marginLeft:"auto", background:isCompleted?`${theme.success}20`:`${theme.gold}18`, color:isCompleted?theme.success:theme.gold }}>{order.status}</span>
          <button onClick={()=>setPdfOrder(order)} style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"8px 16px", borderRadius:8, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
            Bag Sheet PDF
          </button>
        </div>

        {/* Info cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[["ORDER DATE",fmt(order.orderDate)],["DELIVERY",fmt(order.deliveryDate)],["LABOUR",order.labourTotal>0?`₹${order.labourTotal.toLocaleString()}`:"—"],["ITEM NO.",order.itemNumber||"—"]].map(([l,v]) => (
            <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, color:theme.textMuted, marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:14 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Owner gold notice */}
        {order.usesOwnerGold && (
          <div style={{ background:"#7B5EA710", border:"1px solid #7B5EA750", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:24 }}>✦</div>
            <div>
              <div style={{ fontSize:13, color:"#B39DDB", fontWeight:600 }}>Using Owner's Gold — Lariot Jweles</div>
              <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>This customer had 0 gold. Gold is supplied from the owner's (Lariot Jweles) stock.</div>
            </div>
          </div>
        )}

        {/* Gold summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:24 }}>
          {[
            ["CUSTOMER GOLD", `${order.customer?.gold ?? 0}g`, theme.textMuted, "Customer's remaining balance"],
            ["CASTING GOLD",  castG > 0 ? `${castG}g` : "Not cast yet", theme.gold, "Gold allocated at casting"],
            ["CURRENT GOLD",  castG > 0 ? `${currG}g` : "—", theme.gold, "Remaining in this bag"],
            ["TOTAL WASTAGE", castG > 0 ? `${wastage}g` : "—", theme.danger, "Lost during production"],
          ].map(([l,v,c,sub]) => (
            <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>{l}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Diamond tags */}
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

        {/* Progress bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:theme.textMuted }}>Progress</span>
            <span style={{ fontSize:12, color:theme.gold }}>{order.currentStep}/{STEPS.length} steps</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${(order.currentStep/STEPS.length)*100}%`}}/></div>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {STEPS.map((step, i) => {
            const done    = i < order.currentStep;
            const current = i === order.currentStep && !isCompleted;
            // gramHistory[0] = castingGold (index 0 = Casting step, maps to STEPS[1])
            // For display: gramHistory index matches step-1 (since step 0 = Design has no gram)
            const gramBefore = i === 1 ? order.castingGold : order.gramHistory?.[i - 1] ?? null;
            const gramAfter  = i === 1 ? order.gramHistory?.[0] : order.gramHistory?.[i] ?? null;

            // Sub-step display for step 0
            const step0Info = i === 0 ? (
              <div style={{ fontSize:12, color:theme.textMuted, marginTop:4, display:"flex", gap:12 }}>
                <span style={{ color:order.designDone?theme.success:theme.textMuted }}>
                  {order.designDone ? "✓ Design done" : "○ Design pending"}
                </span>
                <span style={{ color:order.waxDone?theme.success:theme.textMuted }}>
                  {order.waxDone ? "✓ Wax done" : "○ Wax pending"}
                </span>
              </div>
            ) : null;

            return (
              <div key={i} className={`step-item ${done?"done":""}`}>
                <div className={`step-circle ${done?"done":current?"current":""}`}>
                  {done ? <Icon name="check" size={14} color="#0D0B07"/> : i+1}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                  {step0Info}
                  {/* Show gram data for casting and subsequent steps */}
                  {done && i === 1 && order.castingGold > 0 && (
                    <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
                      Allocated: <span style={{color:theme.gold}}>{order.castingGold}g</span>
                    </div>
                  )}
                  {done && i >= 2 && order.gramHistory?.[i-1] !== undefined && order.gramHistory?.[i] !== undefined && (
                    <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
                      {order.gramHistory[i-1]}g → <span style={{color:theme.gold}}>{order.gramHistory[i]}g</span>
                      <span style={{color:theme.danger, marginLeft:8}}>−{(order.gramHistory[i-1]-order.gramHistory[i]).toFixed(3)}g</span>
                    </div>
                  )}
                </div>
                {done && <span className="tag" style={{ background:`${theme.success}18`, color:theme.success, fontSize:11 }}>Done</span>}
                {current && (
                  <button className="btn-primary" onClick={()=>setStepOrder(order)}>Mark Done</button>
                )}
              </div>
            );
          })}
        </div>

        {isCompleted && (
          <div style={{ marginTop:24, background:`${theme.success}12`, border:`1px solid ${theme.success}40`, borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.success }}>✦ Order Complete</div>
            <div style={{ color:theme.textMuted, fontSize:13, marginTop:6 }}>
              Final: {currG}g · Casting: {castG}g · Wastage: {wastage}g
            </div>
          </div>
        )}

        {stepOrder && (
          <StepModal
            order={stepOrder}
            onClose={()=>setStepOrder(null)}
            onUpdated={(updated)=>{ handleUpdated(updated); setStepOrder(null); }}
          />
        )}
        {pdfOrder && <PDFModal order={pdfOrder} onClose={()=>setPdfOrder(null)}/>}
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

      {/* Search + filter */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}><Icon name="search" size={15} color={theme.textMuted}/></div>
          <input className="search-input" placeholder="Search Bag ID or party…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }}/>
        </div>
        <select value={stepFilter} onChange={e=>setStepFilter(e.target.value)} style={{ width:200 }}>
          <option value="">All Steps</option>
          {STEPS.map((s,i)=><option key={i} value={i}>Step {i+1}: {s}</option>)}
          <option value={STEPS.length}>Completed</option>
        </select>
        {(search || stepFilter !== "") && (
          <button className="btn-ghost" onClick={()=>{ setSearch(""); setStepFilter(""); }} style={{ padding:"8px 14px", fontSize:13 }}>Clear</button>
        )}
        <span style={{ marginLeft:"auto", fontSize:13, color:theme.textMuted }}>{filtered.length} of {orders.length}</span>
      </div>

      {/* Cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="bag" size={40} color={theme.borderGold}/><br/><br/>
            {orders.length === 0 ? "No bags yet. Create an order first!" : "No bags match your filters."}
          </div>
        )}
        {filtered.map(o => {
          const castG    = o.castingGold || 0;
          const currG    = o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length-1] : 0;
          const prog     = (o.currentStep / STEPS.length) * 100;
          const isComp   = o.status === "Completed";
          const canMark  = o.currentStep < STEPS.length && !isComp;
          const stepName = o.currentStep < STEPS.length ? STEPS[o.currentStep] : "Completed";

          return (
            <div key={o._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${o.usesOwnerGold?"#7B5EA750":theme.borderGold}`, borderRadius:14, padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                {/* Left: click to open detail */}
                <div style={{ display:"flex", gap:14, alignItems:"center", cursor:"pointer", flex:1 }} onClick={()=>setSelectedId(o._id)}>
                  {o.itemImage && <img src={o.itemImage} alt="" style={{ width:48, height:48, objectFit:"contain", borderRadius:8, border:`1px solid ${theme.borderGold}`, background:theme.surfaceAlt, padding:2 }}/>}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:theme.gold }}>#{o.bagId}</span>
                      <span style={{ fontSize:15 }}>{o.customerName}</span>
                      {o.usesOwnerGold && <OwnerBadge/>}
                    </div>
                    <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
                    <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                      {o.currentStep === 0 ? `Step 1: Design & Wax ${o.designDone?"(Design ✓)":""} ${o.waxDone?"(Wax ✓)":""}` : `Step ${o.currentStep+1}: ${stepName}`}
                      {o.deliveryDate && ` · Due: ${fmt(o.deliveryDate)}`}
                    </div>
                  </div>
                </div>

                {/* Right: gold stats + actions */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    {castG > 0 ? (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>CASTING → CURRENT</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold }}>{castG}g → {currG}g</div>
                      </div>
                    ) : (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>GOLD</div>
                        <div style={{ fontSize:13, color:theme.textMuted }}>Not allocated</div>
                      </div>
                    )}
                    <span className="tag" style={{ background:isComp?`${theme.success}20`:`${theme.gold}18`, color:isComp?theme.success:theme.gold }}>{o.status}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {canMark && (
                      <button
                        onClick={e=>{ e.stopPropagation(); setStepOrder(o); }}
                        style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.success}18`, border:`1px solid ${theme.success}50`, color:theme.success, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${theme.success}30`}
                        onMouseLeave={e=>e.currentTarget.style.background=`${theme.success}18`}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={e=>{ e.stopPropagation(); setPdfOrder(o); }}
                      style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"5px 12px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, cursor:"pointer" }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=`${theme.gold}28`; e.currentTarget.style.borderColor=theme.gold; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=`${theme.gold}15`; e.currentTarget.style.borderColor=`${theme.gold}50`; }}
                    >
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

      {/* Step modal for list view */}
      {stepOrder && (
        <StepModal
          order={stepOrder}
          onClose={()=>setStepOrder(null)}
          onUpdated={(updated)=>{ handleUpdated(updated); setStepOrder(null); }}
        />
      )}
      {pdfOrder && <PDFModal order={pdfOrder} onClose={()=>setPdfOrder(null)}/>}
    </div>
  );
};

export default BagWorkflow;
