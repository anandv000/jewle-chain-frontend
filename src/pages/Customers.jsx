import React, { useState } from "react";
import { theme } from "../theme";
import { customerAPI, goldEntryAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmt2 = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }).replace(/\//g,"-") : "—";

const emptyCustomer = { name:"", company:"", phone:"", gold:"", goldCarats:"", silver:"", diamonds:"", diamondKarats:"" };
const emptyItem     = { item:"", shape:"", quality:"", accessories:"", size:"", description:"", pieces:"", weight:"", pureWt:"" };

const flattenDiamonds = (diamondFolders) =>
  (diamondFolders || []).flatMap(f => (f.diamonds || []).map(d => ({ ...d, folderName: f.name })));

// ── Gold Receipt HTML ─────────────────────────────────────────────────────────
function generateGoldReceiptHTML(entry) {
  const tdS = "border:1px solid #000;padding:5px 4px;text-align:center;font-size:10px;";
  const itemRows = (entry.items||[]).map((it,i)=>`<tr><td style="${tdS}">${i+1}</td><td style="${tdS}">${it.item||""}</td><td style="${tdS}">${it.shape||""}</td><td style="${tdS}">${it.quality||""}</td><td style="${tdS}">${it.accessories||""}</td><td style="${tdS}">${it.size||""}</td><td style="${tdS}">${it.description||""}</td><td style="${tdS}">${it.pieces||""}</td><td style="${tdS}">${it.weight?Number(it.weight).toFixed(3):""}</td><td style="${tdS}">${it.pureWt?Number(it.pureWt).toFixed(3):""}</td></tr>`).join("");
  const thRow = ["Sr.","Item","Shape","Quality","Accessories","Size","Description","Pieces","Weight","Pure Wt"].map(h=>`<th style="border:1px solid #000;padding:6px 4px;text-align:center;font-weight:bold;font-size:10px;background:#f0f0f0">${h}</th>`).join("");
  const metalLabel = entry.entryType === "silver_deposit" ? "Silver" : "Gold";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${metalLabel} Receipt — ${entry.receiptNo}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:20px}@media print{body{padding:8px}@page{margin:8mm;size:A4}}</style></head><body>
<table style="width:100%;border-collapse:collapse;border:2px solid #000;margin-bottom:0"><tbody><tr>
<td style="padding:10px 14px;width:35%;border-right:1px solid #ccc;vertical-align:top"><div style="font-weight:bold;font-size:16px">ATELIER GOLD</div><div style="font-size:10px;margin-top:6px">From</div><div style="font-weight:bold;font-size:13px;margin-top:2px">${(entry.customerName||"").toUpperCase()}</div></td>
<td style="padding:10px;text-align:center;width:30%;border-right:1px solid #ccc;vertical-align:middle"><div style="font-weight:bold;font-size:18px;color:#9A7A2E">✦</div><div style="font-weight:bold;font-size:13px;margin-top:4px">ATELIER GOLD</div></td>
<td style="padding:10px 14px;width:35%;text-align:right;vertical-align:top"><div style="font-weight:bold;font-size:13px">Party Receive ${metalLabel}</div><table style="margin-left:auto;margin-top:8px;font-size:11px"><tbody><tr><td style="font-weight:bold;padding-right:6px">NO</td><td>: ${entry.receiptNo}</td></tr><tr><td style="font-weight:bold">DATE</td><td>: ${fmt2(entry.date)}</td></tr><tr><td style="font-weight:bold;white-space:nowrap">Party Voucher No</td><td>: ${entry.partyVoucherNo||""}</td></tr></tbody></table></td>
</tr></tbody></table>
<table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-top:0"><thead><tr>${thRow}</tr></thead><tbody>${itemRows}
<tr style="background:#f9f9f9"><td colspan="6" style="${tdS}font-weight:bold">Page 1 of 1</td><td style="${tdS}text-align:right;font-weight:bold">Total</td><td style="${tdS}"></td><td style="${tdS}font-weight:bold">${(entry.totalWeight||0).toFixed(3)}</td><td style="${tdS}font-weight:bold">${(entry.totalPureWt||0).toFixed(3)}</td></tr></tbody></table>
<div style="margin-top:10px">Remark : ${entry.remark||""}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>`;
}

function generateDiamondReceiptHTML(entry) {
  const tdS = "border:1px solid #000;padding:5px 4px;text-align:center;font-size:10px;";
  const diaRows = (entry.diamonds||[]).map((d,i)=>`<tr><td style="${tdS}">${i+1}</td><td style="${tdS}">${d.shapeName||""}</td><td style="${tdS}">${d.sizeInMM||""}</td><td style="${tdS}">${d.pcs||0}</td><td style="${tdS}">${(d.karats||0).toFixed(4)}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Diamond Receipt — ${entry.receiptNo}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:20px}@media print{body{padding:8px}@page{margin:8mm;size:A4}}</style></head><body>
<table style="width:100%;border-collapse:collapse;border:2px solid #000"><tbody><tr>
<td style="padding:10px 14px;width:35%;border-right:1px solid #ccc;vertical-align:top"><div style="font-weight:bold;font-size:16px">ATELIER GOLD</div><div style="font-size:10px;margin-top:6px">From</div><div style="font-weight:bold;font-size:13px;margin-top:2px">${(entry.customerName||"").toUpperCase()}</div></td>
<td style="padding:10px;text-align:center;width:30%;border-right:1px solid #ccc;vertical-align:middle"><div style="font-weight:bold;font-size:18px;color:#7EC8E3">💎</div><div style="font-weight:bold;font-size:13px;margin-top:4px">ATELIER GOLD</div></td>
<td style="padding:10px 14px;width:35%;text-align:right;vertical-align:top"><div style="font-weight:bold;font-size:13px">Diamond Deposit Receipt</div><table style="margin-left:auto;margin-top:8px;font-size:11px"><tbody><tr><td style="font-weight:bold;padding-right:6px">NO</td><td>: ${entry.receiptNo}</td></tr><tr><td style="font-weight:bold">DATE</td><td>: ${fmt2(entry.date)}</td></tr></tbody></table></td>
</tr></tbody></table>
<table style="width:100%;border-collapse:collapse;border:1px solid #000"><thead><tr>${["Sr.","Shape","Size (mm)","Pcs","Karats"].map(h=>`<th style="border:1px solid #000;padding:6px 4px;text-align:center;font-weight:bold;font-size:10px;background:#f0f0f0">${h}</th>`).join("")}</tr></thead><tbody>${diaRows}
<tr style="background:#f9f9f9;font-weight:bold"><td colspan="3" style="${tdS}text-align:right">Total</td><td style="${tdS}">${entry.totalDiamondPcs||0}</td><td style="${tdS}">${(entry.totalDiamondKarats||0).toFixed(4)}</td></tr></tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>`;
}

function generateReturnReceiptHTML(entry) {
  const tdS = "border:1px solid #000;padding:5px 4px;text-align:center;font-size:10px;";
  const diaRows = (entry.returnDiamonds||[]).map((d,i)=>`<tr><td style="${tdS}">${i+1}</td><td style="${tdS}">${d.shapeName||""}</td><td style="${tdS}">${d.sizeInMM||""}</td><td style="${tdS}">${d.pcs||0}</td><td style="${tdS}">${(d.karats||0).toFixed(4)}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Return Receipt — ${entry.receiptNo}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:20px}@media print{body{padding:8px}@page{margin:8mm;size:A4}}</style></head><body>
<table style="width:100%;border-collapse:collapse;border:2px solid #000"><tbody><tr>
<td style="padding:10px 14px;width:35%;border-right:1px solid #ccc;vertical-align:top"><div style="font-weight:bold;font-size:16px">ATELIER GOLD</div><div style="font-size:10px;margin-top:6px">To</div><div style="font-weight:bold;font-size:13px;margin-top:2px">${(entry.customerName||"").toUpperCase()}</div></td>
<td style="padding:10px;text-align:center;width:30%;border-right:1px solid #ccc;vertical-align:middle"><div style="font-weight:bold;font-size:18px;color:#C94C4C">↩</div><div style="font-weight:bold;font-size:13px;margin-top:4px">ATELIER GOLD</div></td>
<td style="padding:10px 14px;width:35%;text-align:right;vertical-align:top"><div style="font-weight:bold;font-size:13px">Return Receipt</div><table style="margin-left:auto;margin-top:8px;font-size:11px"><tbody><tr><td style="font-weight:bold;padding-right:6px">NO</td><td>: ${entry.receiptNo}</td></tr><tr><td style="font-weight:bold">DATE</td><td>: ${fmt2(entry.date)}</td></tr></tbody></table></td>
</tr></tbody></table>
${entry.returnGold>0?`<p style="margin:10px 0 4px;font-weight:bold">Gold Returned: ${entry.returnGold.toFixed(3)} grams</p>`:""}
${entry.returnSilver>0?`<p style="margin:4px 0;font-weight:bold">Silver Returned: ${entry.returnSilver.toFixed(3)} grams</p>`:""}
${diaRows?`<table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-top:10px"><thead><tr>${["Sr.","Shape","Size","Pcs","Karats"].map(h=>`<th style="border:1px solid #000;padding:6px 4px;text-align:center;font-weight:bold;font-size:10px;background:#f0f0f0">${h}</th>`).join("")}</tr></thead><tbody>${diaRows}</tbody></table>`:""}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>`;
}

const openReceiptPDF = (entry) => {
  let html;
  if (entry.entryType === "diamond_deposit")                        html = generateDiamondReceiptHTML(entry);
  else if (entry.entryType === "return")                            html = generateReturnReceiptHTML(entry);
  else /* gold_deposit | silver_deposit */                          html = generateGoldReceiptHTML(entry);
  const blob = new Blob([html], { type:"text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) alert("Allow popups to open the receipt.");
  setTimeout(() => URL.revokeObjectURL(url), 90000);
};

// ── Add Gold / Silver Deposit Modal ───────────────────────────────────────────
const AddMetalModal = ({ customer, metalType, onClose, onSaved }) => {
  // metalType: "gold" | "silver"
  const isGold   = metalType === "gold";
  const color    = isGold ? theme.gold : "#C0C0C0";
  const label    = isGold ? "Gold" : "Silver";
  const entryT   = isGold ? "gold_deposit" : "silver_deposit";

  const [rows,           setRows]           = useState([{ ...emptyItem }]);
  const [partyVoucherNo, setPartyVoucherNo] = useState("");
  const [remark,         setRemark]         = useState("");
  const [date,           setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [sending,        setSending]        = useState(false);
  const [sendWA,         setSendWA]         = useState(isGold); // WA only for gold
  const [error,          setError]          = useState("");

  const addRow    = () => setRows(r => [...r, { ...emptyItem }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(r => r.filter((_,idx) => idx !== i)); };
  const updateRow = (i, f, v) => setRows(r => r.map((row,idx) => idx===i ? {...row,[f]:v} : row));
  const totalWeight = rows.reduce((s,r) => s + (parseFloat(r.weight)||0), 0);
  const totalPureWt = rows.reduce((s,r) => s + (parseFloat(r.pureWt)||0), 0);

  const submit = async () => {
    if (rows.every(r => !r.weight)) { setError("Enter weight for at least one item."); return; }
    setSending(true); setError("");
    try {
      const res = await goldEntryAPI.create({
        customerId: customer._id, entryType: entryT, partyVoucherNo, date, remark,
        sendWhatsapp: sendWA,
        items: rows.map(r => ({ ...r, pieces:parseFloat(r.pieces)||0, weight:parseFloat(r.weight)||0, pureWt:parseFloat(r.pureWt)||0 })),
      });
      onSaved(res.data.data, res.data.whatsapp, res.data.newTotals);
    } catch (err) { setError(err.response?.data?.error || "Failed to save."); }
    finally { setSending(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"5px 7px", borderRadius:5, fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%" };
  const thS = { border:`1px solid ${theme.borderGold}`, padding:"8px 6px", fontSize:10, color:theme.textMuted, textTransform:"uppercase", background:theme.surfaceAlt };
  const tdS = { border:`1px solid ${theme.borderGold}`, padding:"5px 4px" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"96vw", maxWidth:1000, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color }}>
              {isGold ? "✦" : "◆"} Add {label} Entry — {customer.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ colorScheme:"dark" }}/></Field>
          <Field label="Party Voucher No (optional)"><input value={partyVoucherNo} onChange={e=>setPartyVoucherNo(e.target.value)} placeholder="e.g. PVN-001"/></Field>
          <div style={{ background:`${color}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:9, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:theme.textMuted }}>CUSTOMER PHONE</div>
            <div style={{ fontSize:15, color:theme.text, marginTop:4 }}>{customer.phone||"—"}</div>
          </div>
        </div>
        <div style={{ overflowX:"auto", marginBottom:14 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={thS}>#</th>{["Item","Shape","Quality","Accessories","Size","Description"].map(h=><th key={h} style={thS}>{h}</th>)}<th style={thS}>Pieces</th><th style={thS}>Weight(g)</th><th style={thS}>Pure Wt(g)</th><th style={thS}></th></tr></thead>
            <tbody>{rows.map((row,i)=>(
              <tr key={i}>
                <td style={{ ...tdS, textAlign:"center", color:theme.textMuted, fontSize:12 }}>{i+1}</td>
                {["item","shape","quality","accessories","size","description"].map(f=>(
                  <td key={f} style={tdS}><input value={row[f]} onChange={e=>updateRow(i,f,e.target.value)} style={inp} placeholder="—"/></td>
                ))}
                {["pieces","weight","pureWt"].map(f=>(
                  <td key={f} style={tdS}><input type="number" value={row[f]} onChange={e=>updateRow(i,f,e.target.value)} style={{ ...inp, textAlign:"right" }} placeholder="0" min="0" step="0.001"/></td>
                ))}
                <td style={{ ...tdS, textAlign:"center" }}>
                  <button onClick={()=>removeRow(i)} className="btn-icon-danger" style={{ opacity:rows.length===1?0.3:1 }}><Icon name="trash" size={12} color={theme.danger}/></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button className="btn-ghost" onClick={addRow} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px" }}>
            <Icon name="plus" size={14} color={theme.gold}/> Add Row
          </button>
          <div style={{ display:"flex", gap:28 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted }}>TOTAL WEIGHT</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color }}>{totalWeight.toFixed(3)} g</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted }}>PURE WEIGHT</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.success }}>{totalPureWt.toFixed(3)} g</div></div>
          </div>
        </div>
        <Field label="Remark (optional)"><input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Any notes..." style={{ marginBottom:14 }}/></Field>
        {isGold && (
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:theme.surfaceAlt, border:`1px solid ${sendWA?"#25D36640":theme.borderGold}`, borderRadius:9, marginBottom:16, cursor:"pointer" }} onClick={()=>setSendWA(v=>!v)}>
            <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${sendWA?"#25D366":theme.borderGold}`, background:sendWA?"#25D366":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {sendWA && <Icon name="check" size={13} color="#fff"/>}
            </div>
            <div><div style={{ fontSize:13, color:theme.text }}>📱 Send receipt to WhatsApp</div><div style={{ fontSize:11, color:theme.textMuted }}>{customer.phone}</div></div>
          </div>
        )}
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-primary" onClick={submit} disabled={sending} style={{ flex:1, padding:14, fontSize:15 }}>{sending?"Saving...":"Save Entry & Generate Receipt →"}</button>
          <button className="btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Add Diamond Modal ──────────────────────────────────────────────────────────
const AddDiamondModal = ({ customer, diamondFolders, onClose, onSaved }) => {
  const allDiamonds = flattenDiamonds(diamondFolders);
  const [rows,   setRows]   = useState([{ shapeId:"", shapeName:"", sizeInMM:"", folderName:"", pcs:"", karats:"" }]);
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const addRow    = () => setRows(r => [...r, { shapeId:"", shapeName:"", sizeInMM:"", folderName:"", pcs:"", karats:"" }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(r => r.filter((_,idx) => idx !== i)); };
  const updateRow = (i,f,v) => setRows(r => r.map((row,idx) => idx===i ? {...row,[f]:v} : row));
  const selectShape = (i, diamond) => setRows(r => r.map((row,idx) => idx===i ? { ...row, shapeId:diamond._id, shapeName:diamond.name, sizeInMM:diamond.sizeInMM||"", folderName:diamond.folderName } : row));

  const totalPcs    = rows.reduce((s,r) => s + (parseInt(r.pcs)||0), 0);
  const totalKarats = rows.reduce((s,r) => s + (parseFloat(r.karats)||0), 0);

  const submit = async () => {
    if (rows.some(r => !r.karats || parseFloat(r.karats) <= 0)) { setError("Each row needs karats > 0."); return; }
    setSaving(true); setError("");
    try {
      const res = await goldEntryAPI.create({ customerId:customer._id, entryType:"diamond_deposit", date, remark, diamonds:rows.map(r=>({shapeId:r.shapeId,shapeName:r.shapeName,sizeInMM:r.sizeInMM,pcs:parseInt(r.pcs)||0,karats:parseFloat(r.karats)||0})) });
      onSaved(res.data.data, null, res.data.newTotals);
    } catch (err) { setError(err.response?.data?.error||"Failed."); }
    finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"94vw", maxWidth:780, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>💎 Add Diamond Deposit — {customer.name}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ colorScheme:"dark" }}/></Field>
          <Field label="Remark"><input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Any notes..."/></Field>
        </div>
        {rows.map((row,i)=>(
          <div key={i} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
              <div>
                <div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>Diamond Shape</div>
                <select value={row.shapeId} onChange={e=>{ const d=allDiamonds.find(d=>d._id===e.target.value); if(d)selectShape(i,d); else updateRow(i,"shapeId",""); }} style={inp}>
                  <option value="">— Select —</option>
                  {allDiamonds.map(d=><option key={d._id} value={d._id}>{d.folderName}/{d.name}{d.sizeInMM?` (${d.sizeInMM}mm)`:""}</option>)}
                  <option value="custom">Custom</option>
                </select>
                {row.shapeId==="custom" && <input style={{ ...inp, marginTop:6 }} value={row.shapeName} onChange={e=>updateRow(i,"shapeName",e.target.value)} placeholder="Shape name..."/>}
              </div>
              <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>Pcs</div><input style={inp} type="number" min="0" value={row.pcs} onChange={e=>updateRow(i,"pcs",e.target.value)} placeholder="0"/></div>
              <div><div style={{ fontSize:11, color:theme.danger, marginBottom:4 }}>Karats *</div><input style={inp} type="number" min="0" step="0.0001" value={row.karats} onChange={e=>updateRow(i,"karats",e.target.value)} placeholder="0.0000"/></div>
              <div><button onClick={()=>removeRow(i)} className="btn-icon-danger" style={{ opacity:rows.length===1?0.3:1 }}><Icon name="trash" size={13} color={theme.danger}/></button></div>
            </div>
          </div>
        ))}
        <button className="btn-ghost" onClick={addRow} style={{ marginBottom:16, display:"flex", alignItems:"center", gap:6, padding:"8px 16px" }}>
          <Icon name="plus" size={13} color={theme.gold}/> Add Row
        </button>
        <div style={{ background:"#7EC8E310", border:"1px solid #7EC8E340", borderRadius:10, padding:"12px 18px", display:"flex", gap:28, marginBottom:16 }}>
          <div><div style={{ fontSize:10, color:theme.textMuted }}>TOTAL PCS</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#7EC8E3" }}>{totalPcs}</div></div>
          <div><div style={{ fontSize:10, color:theme.textMuted }}>TOTAL KARATS</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#7EC8E3" }}>{totalKarats.toFixed(4)} ct</div></div>
        </div>
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex:1, padding:14 }}>{saving?"Saving...":"Save Diamond Deposit →"}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Return Modal — gold + silver + diamonds ────────────────────────────────────
const ReturnModal = ({ customer, diamondFolders, onClose, onSaved }) => {
  const allDiamonds = flattenDiamonds(diamondFolders);
  const [returnGold,     setReturnGold]     = useState("");
  const [returnSilver,   setReturnSilver]   = useState("");   // ← NEW
  const [returnDiamonds, setReturnDiamonds] = useState([{ shapeId:"", shapeName:"", sizeInMM:"", pcs:"", karats:"" }]);
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const addDiaRow    = () => setReturnDiamonds(r => [...r, { shapeId:"", shapeName:"", sizeInMM:"", pcs:"", karats:"" }]);
  const removeDiaRow = (i) => { if (returnDiamonds.length > 1) setReturnDiamonds(r => r.filter((_,idx) => idx !== i)); };
  const updateDia    = (i,f,v) => setReturnDiamonds(r => r.map((row,idx) => idx===i ? {...row,[f]:v} : row));
  const selectDiaShape = (i, diamond) => setReturnDiamonds(r => r.map((row,idx) => idx===i ? {...row, shapeId:diamond._id, shapeName:diamond.name, sizeInMM:diamond.sizeInMM||""} : row));

  const submit = async () => {
    const hasGold   = parseFloat(returnGold)   > 0;
    const hasSilver = parseFloat(returnSilver) > 0;
    const hasDia    = returnDiamonds.some(d => parseFloat(d.karats) > 0);
    if (!hasGold && !hasSilver && !hasDia) { setError("Enter gold, silver, or diamond return amount."); return; }
    setSaving(true); setError("");
    try {
      const res = await goldEntryAPI.create({
        customerId:customer._id, entryType:"return", date, remark,
        returnGold:   parseFloat(returnGold)   || 0,
        returnSilver: parseFloat(returnSilver) || 0,  // ← NEW
        returnDiamonds: returnDiamonds.filter(d=>parseFloat(d.karats)>0).map(d=>({ shapeId:d.shapeId, shapeName:d.shapeName, sizeInMM:d.sizeInMM, pcs:parseInt(d.pcs)||0, karats:parseFloat(d.karats)||0 })),
      });
      onSaved(res.data.data, null, res.data.newTotals);
    } catch (err) { setError(err.response?.data?.error||"Failed."); }
    finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"7px 10px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"92vw", maxWidth:680, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.danger }}>↩ Return Receipt — {customer.name}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ colorScheme:"dark" }}/></Field>
          <Field label="Remark"><input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Any notes..."/></Field>
        </div>

        {/* Current balances for reference */}
        <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"12px 18px", marginBottom:18, display:"flex", gap:24 }}>
          <div><div style={{ fontSize:10, color:theme.textMuted }}>CURRENT GOLD</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{(customer.gold||0).toFixed(3)}g</div></div>
          <div><div style={{ fontSize:10, color:theme.textMuted }}>CURRENT SILVER</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#C0C0C0" }}>{(customer.silver||0).toFixed(3)}g</div></div>
          <div><div style={{ fontSize:10, color:theme.textMuted }}>DIAMOND KARATS</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>{(customer.diamondKarats||0).toFixed(4)}ct</div></div>
        </div>

        <div style={{ fontSize:12, color:theme.textMuted, marginBottom:16 }}>Enter gold, silver, and/or diamonds to return to customer. All fields are optional.</div>

        {/* Gold return */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
          <Field label="Gold Returned (grams)">
            <input type="number" step="0.001" value={returnGold} onChange={e=>setReturnGold(e.target.value)} placeholder="e.g. 88.000"/>
          </Field>
          <Field label="Silver Returned (grams)">
            <input type="number" step="0.001" value={returnSilver} onChange={e=>setReturnSilver(e.target.value)} placeholder="e.g. 50.000"/>
          </Field>
        </div>

        {/* Diamond return */}
        <div style={{ marginBottom:8, fontSize:12, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>Diamonds Returned (optional)</div>
        {returnDiamonds.map((row,i)=>(
          <div key={i} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, marginBottom:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
              <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>Shape</div>
                <select value={row.shapeId} onChange={e=>{ const d=allDiamonds.find(d=>d._id===e.target.value); if(d)selectDiaShape(i,d); else updateDia(i,"shapeId",""); }} style={inp}>
                  <option value="">— Shape (optional) —</option>
                  {allDiamonds.map(d=><option key={d._id} value={d._id}>{d.folderName}/{d.name}</option>)}
                </select></div>
              <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>Pcs</div><input style={inp} type="number" min="0" value={row.pcs} onChange={e=>updateDia(i,"pcs",e.target.value)} placeholder="0"/></div>
              <div><div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>Karats</div><input style={inp} type="number" min="0" step="0.0001" value={row.karats} onChange={e=>updateDia(i,"karats",e.target.value)} placeholder="0.0000"/></div>
              <div><button onClick={()=>removeDiaRow(i)} className="btn-icon-danger" style={{ opacity:returnDiamonds.length===1?0.3:1 }}><Icon name="trash" size={13} color={theme.danger}/></button></div>
            </div>
          </div>
        ))}
        <button className="btn-ghost" onClick={addDiaRow} style={{ marginBottom:20, display:"flex", alignItems:"center", gap:6, padding:"7px 14px", fontSize:13 }}>
          <Icon name="plus" size={13} color={theme.gold}/> Add Diamond Row
        </button>

        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex:1, padding:14, fontSize:15 }}>{saving?"Saving...":"Save Return Receipt →"}</button>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Gold History Panel ─────────────────────────────────────────────────────────
const GoldHistory = ({ customer, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  React.useEffect(() => {
    goldEntryAPI.getByCustomer(customer._id).then(r=>setEntries(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [customer._id]);

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try { await goldEntryAPI.delete(id); setEntries(p=>p.filter(e=>e._id!==id)); }
    catch { alert("Delete failed."); }
  };

  const typeColor = { gold_deposit:theme.gold, silver_deposit:"#C0C0C0", diamond_deposit:"#7EC8E3", return:theme.danger };
  const typeLabel = { gold_deposit:"Gold", silver_deposit:"Silver", diamond_deposit:"Diamonds", return:"Return" };
  const typeIcon  = { gold_deposit:"✦", silver_deposit:"◆", diamond_deposit:"💎", return:"↩" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"88vw", maxWidth:700, maxHeight:"88vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>History — {customer.name}</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>{entries.length} receipt(s)</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        {loading && <div style={{ color:theme.textMuted, textAlign:"center", padding:40 }}>Loading...</div>}
        {!loading && entries.length === 0 && <div style={{ color:theme.textMuted, textAlign:"center", padding:48 }}>No entries yet.</div>}
        {!loading && entries.map(entry => (
          <div key={entry._id} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:typeColor[entry.entryType]||theme.gold }}>{entry.receiptNo}</span>
                  <span style={{ fontSize:11, color:typeColor[entry.entryType]||theme.gold, background:`${typeColor[entry.entryType]||theme.gold}15`, border:`1px solid ${typeColor[entry.entryType]||theme.gold}40`, padding:"2px 8px", borderRadius:12 }}>
                    {typeIcon[entry.entryType]} {typeLabel[entry.entryType]||"Entry"}
                  </span>
                </div>
                <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(entry.date)}{entry.partyVoucherNo && ` · PVN: ${entry.partyVoucherNo}`}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {(entry.entryType==="gold_deposit"||entry.entryType==="silver_deposit") && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:typeColor[entry.entryType] }}>{(entry.totalWeight||0).toFixed(3)} g</div>}
                {entry.entryType==="diamond_deposit" && <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>{entry.totalDiamondPcs||0} pcs</div><div style={{ fontSize:12, color:"#7EC8E3" }}>{(entry.totalDiamondKarats||0).toFixed(4)} ct</div></div>}
                {entry.entryType==="return" && (
                  <div>
                    {entry.returnGold>0   && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.danger }}>−{entry.returnGold.toFixed(3)}g gold</div>}
                    {entry.returnSilver>0 && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.danger }}>−{entry.returnSilver.toFixed(3)}g silver</div>}
                    {entry.returnDiamondKarats>0 && <div style={{ fontSize:12, color:theme.danger }}>−{entry.returnDiamondKarats.toFixed(4)} ct</div>}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="btn-edit" style={{ fontSize:12, padding:"5px 12px" }} onClick={()=>setPreview(entry)}>👁 View</button>
              <button onClick={()=>openReceiptPDF(entry)} style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"5px 12px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans'" }}>⬇ PDF</button>
              {entry.whatsappSent && <span className="tag" style={{ background:"#25D36615", border:"1px solid #25D36640", color:"#25D366", fontSize:11 }}>✓ WhatsApp</span>}
              <button className="btn-icon-danger" style={{ marginLeft:"auto" }} onClick={()=>remove(entry._id)}><Icon name="trash" size={13} color={theme.danger}/></button>
            </div>
          </div>
        ))}
        {preview && (
          <div className="overlay" onClick={()=>setPreview(null)}>
            <div style={{ background:"#fff", borderRadius:12, width:"92vw", maxWidth:820, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
              <div style={{ background:"#1C1710", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"12px 12px 0 0" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#C9A84C" }}>{preview.receiptNo}</span>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>openReceiptPDF(preview)} style={{ background:"#C9A84C", color:"#0D0B07", padding:"7px 16px", borderRadius:7, fontSize:13, border:"none", cursor:"pointer" }}>⬇ PDF</button>
                  <button onClick={()=>setPreview(null)} style={{ background:"transparent", border:"none", color:"#8A7A5A", cursor:"pointer", fontSize:20 }}>✕</button>
                </div>
              </div>
              <div style={{ padding:24, fontSize:12, color:"#000" }}>
                {(preview.entryType==="gold_deposit"||preview.entryType==="silver_deposit") && <div><strong>{preview.entryType==="silver_deposit"?"Silver":"Gold"} Deposit</strong> — {(preview.totalWeight||0).toFixed(3)}g</div>}
                {preview.entryType==="diamond_deposit" && <div><strong>Diamond Deposit</strong> — {preview.totalDiamondPcs} pcs / {(preview.totalDiamondKarats||0).toFixed(4)} ct</div>}
                {preview.entryType==="return" && <div>
                  {preview.returnGold>0 && <div>Gold: {preview.returnGold.toFixed(3)}g returned</div>}
                  {preview.returnSilver>0 && <div>Silver: {preview.returnSilver.toFixed(3)}g returned</div>}
                  {preview.returnDiamondKarats>0 && <div>Diamonds: {preview.returnDiamondKarats.toFixed(4)} ct returned</div>}
                </div>}
                {preview.remark && <div style={{ marginTop:8 }}>Remark: {preview.remark}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Customers = ({ customers, setCustomers, diamondFolders = [] }) => {
  const [showModal,     setShowModal]     = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [form,          setForm]          = useState(emptyCustomer);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [goldCustomer,  setGoldCustomer]  = useState(null);
  const [silverCustomer,setSilverCustomer]= useState(null);   // ← NEW
  const [diaCustomer,   setDiaCustomer]   = useState(null);
  const [retCustomer,   setRetCustomer]   = useState(null);
  const [histCustomer,  setHistCustomer]  = useState(null);
  const [toast,         setToast]         = useState("");

  const openAdd  = () => { setForm(emptyCustomer); setEditId(null); setError(""); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ name:c.name, company:c.company||"", phone:c.phone, gold:String(c.gold||0), goldCarats:String(c.goldCarats||0), silver:String(c.silver||0), diamonds:String(c.diamonds||0), diamondKarats:String(c.diamondKarats||0) });
    setEditId(c._id); setError(""); setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setError("Name and Phone are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name:form.name, company:form.company, phone:form.phone, gold:parseFloat(form.gold)||0, goldCarats:parseFloat(form.goldCarats)||0, silver:parseFloat(form.silver)||0, diamonds:parseInt(form.diamonds)||0, diamondKarats:parseFloat(form.diamondKarats)||0 };
      if (editId) {
        const res = await customerAPI.update(editId, payload);
        setCustomers(p => p.map(c => c._id===editId ? res.data.data : c));
      } else {
        const res = await customerAPI.create(payload);
        setCustomers(p => [...p, res.data.data]);
      }
      setShowModal(false);
    } catch (err) { setError(err.response?.data?.error||"Failed."); }
    finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try { await customerAPI.remove(id); setCustomers(p => p.filter(c => c._id !== id)); }
    catch { alert("Delete failed."); }
  };

  const handleEntrySaved = (entry, whatsapp, newTotals) => {
    setGoldCustomer(null); setSilverCustomer(null); setDiaCustomer(null); setRetCustomer(null);
    if (newTotals) {
      setCustomers(prev => prev.map(c =>
        c._id === entry.customer
          ? { ...c, gold:newTotals.gold, silver:newTotals.silver, diamonds:newTotals.diamonds, diamondKarats:newTotals.diamondKarats }
          : c
      ));
    }
    const typeLabel = entry.entryType==="diamond_deposit"?"Diamond":entry.entryType==="return"?"Return":entry.entryType==="silver_deposit"?"Silver":"Gold";
    const msg = whatsapp?.sent ? `✅ ${typeLabel} receipt ${entry.receiptNo} saved! WhatsApp sent.` : `✅ ${typeLabel} receipt ${entry.receiptNo} saved.`;
    setToast(msg);
    setTimeout(() => setToast(""), 6000);
  };

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && <div style={{ position:"fixed", top:24, right:24, background:"#151209", border:"1px solid #4CC97A50", color:"#4CC97A", padding:"12px 20px", borderRadius:10, fontSize:13, zIndex:9999, maxWidth:380 }}>{toast}</div>}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Customers</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{customers.length} total clients</div>
        </div>
        <button className="btn-primary" onClick={openAdd}><span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={15} color="#0D0B07"/> Add Customer</span></button>
      </div>

      {/* Table — now includes Silver column */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        <div className="table-row" style={{ gridTemplateColumns:"1.8fr 1.4fr 1.4fr 0.8fr 0.7fr 0.8fr 0.7fr 0.7fr 3.2fr", background:theme.surfaceAlt }}>
          {["Name","Company","Phone","Gold(g)","Silv(g)","Carats","D.Pcs","D.Kts","Actions"].map(h=>(
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</span>
          ))}
        </div>
        {customers.map(c => (
          <div key={c._id} className="table-row" style={{ gridTemplateColumns:"1.8fr 1.4fr 1.4fr 0.8fr 0.7fr 0.8fr 0.7fr 0.7fr 3.2fr" }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{c.name}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{c.company||"—"}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{c.phone}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{(c.gold||0).toFixed(2)}g</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#C0C0C0" }}>{(c.silver||0).toFixed(2)}g</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#E8C97A" }}>{c.goldCarats||0}ct</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#7EC8E3" }}>{c.diamonds||0}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#7EC8E3" }}>{(c.diamondKarats||0).toFixed(2)}ct</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={()=>setGoldCustomer(c)}   style={{ background:"#1a3020", color:"#4CC97A", border:"1px solid #2d5a3a", padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>✦ Gold</button>
              <button onClick={()=>setSilverCustomer(c)} style={{ background:"#1a1a2e", color:"#C0C0C0", border:"1px solid #404060", padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>◆ Silver</button>
              <button onClick={()=>setDiaCustomer(c)}    style={{ background:"#0D1B2A", color:"#7EC8E3", border:"1px solid #7EC8E340", padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>💎 Dia</button>
              <button onClick={()=>setRetCustomer(c)}    style={{ background:`${theme.danger}10`, color:theme.danger, border:`1px solid ${theme.danger}40`, padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>↩ Ret</button>
              <button onClick={()=>setHistCustomer(c)}   style={{ background:theme.surfaceAlt, color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>📋</button>
              <button className="btn-edit" style={{ padding:"5px 9px", fontSize:11 }} onClick={()=>openEdit(c)}><Icon name="edit" size={12} color={theme.gold}/></button>
              <button className="btn-icon-danger" onClick={()=>remove(c._id,c.name)}><Icon name="trash" size={12} color={theme.danger}/></button>
            </div>
          </div>
        ))}
        {customers.length === 0 && <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>No customers yet.</div>}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editId?"✦ Edit Customer":"✦ Add New Customer"} onClose={()=>setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Field label="Customer Name *"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Priya Mehta" autoFocus/></Field>
            <Field label="Company"><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Mehta Jewellers"/></Field>
            <Field label="Phone * (for WhatsApp)"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210"/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <Field label="Gold (g) — manual"><input type="number" value={form.gold} onChange={e=>setForm({...form,gold:e.target.value})} placeholder="0" min="0"/></Field>
              <Field label="Gold Carats — manual"><input type="number" value={form.goldCarats} onChange={e=>setForm({...form,goldCarats:e.target.value})} placeholder="0" min="0"/></Field>
              <Field label="Silver (g) — manual"><input type="number" value={form.silver} onChange={e=>setForm({...form,silver:e.target.value})} placeholder="0" min="0"/></Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Diamond Pcs — manual"><input type="number" value={form.diamonds} onChange={e=>setForm({...form,diamonds:e.target.value})} placeholder="0" min="0"/></Field>
              <Field label="Diamond Karats — manual"><input type="number" step="0.0001" value={form.diamondKarats} onChange={e=>setForm({...form,diamondKarats:e.target.value})} placeholder="0" min="0"/></Field>
            </div>
            <div style={{ fontSize:11, color:theme.textMuted, background:`${theme.gold}08`, padding:"10px 14px", borderRadius:8 }}>
              ℹ Use Add Gold/Silver/Diamond buttons to track transactions properly after setup.
            </div>
            {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
            <div style={{ display:"flex", gap:12, marginTop:4 }}>
              <button className="btn-primary" onClick={save} style={{ flex:1 }} disabled={saving}>{saving?"Saving...":editId?"Save Changes":"Create Customer"}</button>
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {goldCustomer   && <AddMetalModal   customer={goldCustomer}   metalType="gold"   onClose={()=>setGoldCustomer(null)}   onSaved={handleEntrySaved}/>}
      {silverCustomer && <AddMetalModal   customer={silverCustomer} metalType="silver" onClose={()=>setSilverCustomer(null)} onSaved={handleEntrySaved}/>}
      {diaCustomer    && <AddDiamondModal customer={diaCustomer}    diamondFolders={diamondFolders} onClose={()=>setDiaCustomer(null)} onSaved={handleEntrySaved}/>}
      {retCustomer    && <ReturnModal     customer={retCustomer}    diamondFolders={diamondFolders} onClose={()=>setRetCustomer(null)} onSaved={handleEntrySaved}/>}
      {histCustomer   && <GoldHistory     customer={histCustomer}   onClose={()=>setHistCustomer(null)}/>}
    </div>
  );
};

export default Customers;
