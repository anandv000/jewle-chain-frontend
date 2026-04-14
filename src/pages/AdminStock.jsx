import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { orderAPI, goldEntryAPI } from "../services/api";
import { Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const emptyItem = { item:"", shape:"", quality:"", accessories:"", size:"", description:"", pieces:"", weight:"", pureWt:"" };

// ── Add Metal Modal (gold or silver) for owner ─────────────────────────────────
const AddMetalModal = ({ owner, metalType, onClose, onSaved }) => {
  const isGold = metalType === "gold";
  const color  = isGold ? theme.gold : "#C0C0C0";
  const label  = isGold ? "Gold" : "Silver";
  const entryT = isGold ? "gold_deposit" : "silver_deposit";

  const [rows,   setRows]   = useState([{ ...emptyItem }]);
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const addRow    = () => setRows(r => [...r, { ...emptyItem }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(r => r.filter((_,idx) => idx !== i)); };
  const updateRow = (i, f, v) => setRows(r => r.map((row,idx) => idx===i ? {...row,[f]:v} : row));
  const totalWeight = rows.reduce((s,r) => s + (parseFloat(r.weight)||0), 0);
  const totalPureWt = rows.reduce((s,r) => s + (parseFloat(r.pureWt)||0), 0);

  const submit = async () => {
    if (rows.every(r => !r.weight)) { setError("Enter weight for at least one row."); return; }
    setSaving(true); setError("");
    try {
      const res = await goldEntryAPI.create({
        customerId: owner._id, entryType: entryT, date, remark,
        items: rows.map(r => ({ ...r, pieces:parseFloat(r.pieces)||0, weight:parseFloat(r.weight)||0, pureWt:parseFloat(r.pureWt)||0 })),
      });
      onSaved(res.data.data, res.data.newTotals);
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"5px 7px", borderRadius:5, fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%" };
  const thS = { border:`1px solid ${theme.borderGold}`, padding:"8px 6px", fontSize:10, color:theme.textMuted, textTransform:"uppercase", background:theme.surfaceAlt };
  const tdS = { border:`1px solid ${theme.borderGold}`, padding:"5px 4px" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"96vw", maxWidth:1000, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color }}>
            {isGold ? "✦" : "◆"} Add {label} Stock — Lariot Jweles
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ colorScheme:"dark" }}/></Field>
          <Field label="Remark"><input value={remark} onChange={e=>setRemark(e.target.value)} placeholder={`e.g. Monthly ${label.toLowerCase()} purchase`}/></Field>
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
          <button className="btn-ghost" onClick={addRow} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px" }}><Icon name="plus" size={14} color={theme.gold}/> Add Row</button>
          <div style={{ display:"flex", gap:28 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted }}>TOTAL WEIGHT</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color }}>{totalWeight.toFixed(3)}g</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:10, color:theme.textMuted }}>PURE WEIGHT</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.success }}>{totalPureWt.toFixed(3)}g</div></div>
          </div>
        </div>
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex:1, padding:14, fontSize:15 }}>{saving?"Saving...":"Save Entry →"}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Add Diamond Modal for owner ────────────────────────────────────────────────
const AddDiamondModal = ({ owner, onClose, onSaved }) => {
  const [rows,   setRows]   = useState([{ shapeName:"", sizeInMM:"", pcs:"", karats:"" }]);
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const addRow    = () => setRows(r=>[...r,{shapeName:"",sizeInMM:"",pcs:"",karats:""}]);
  const removeRow = (i) => { if(rows.length>1)setRows(r=>r.filter((_,idx)=>idx!==i)); };
  const updateRow = (i,f,v) => setRows(r=>r.map((row,idx)=>idx===i?{...row,[f]:v}:row));
  const totalPcs    = rows.reduce((s,r)=>s+(parseInt(r.pcs)||0),0);
  const totalKarats = rows.reduce((s,r)=>s+(parseFloat(r.karats)||0),0);

  const submit = async () => {
    if(rows.every(r=>!r.karats||parseFloat(r.karats)<=0)){setError("Karats required.");return;}
    setSaving(true);setError("");
    try {
      const res = await goldEntryAPI.create({ customerId:owner._id, entryType:"diamond_deposit", date, remark, diamonds:rows.map(r=>({shapeName:r.shapeName,sizeInMM:r.sizeInMM,pcs:parseInt(r.pcs)||0,karats:parseFloat(r.karats)||0})) });
      onSaved(res.data.data,res.data.newTotals);
    } catch(err){setError(err.response?.data?.error||"Failed.");}
    finally{setSaving(false);}
  };

  const inp={background:theme.bg,border:`1px solid ${theme.borderGold}`,color:theme.text,padding:"8px 12px",borderRadius:7,fontFamily:"'DM Sans'",fontSize:13,outline:"none",width:"100%"};

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{background:theme.surface,border:`1px solid ${theme.borderGold}`,borderRadius:16,padding:28,width:"92vw",maxWidth:680,maxHeight:"90vh",overflowY:"auto",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#7EC8E3"}}>💎 Add Diamond Stock — Lariot Jweles</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:theme.textMuted,fontSize:20}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{colorScheme:"dark"}}/></Field>
          <Field label="Remark"><input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="e.g. Stock purchase"/></Field>
        </div>
        {rows.map((row,i)=>(
          <div key={i} style={{background:theme.surfaceAlt,border:`1px solid ${theme.borderGold}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
              {[["Shape Name","shapeName","text","e.g. Round"],["Size (mm)","sizeInMM","text","e.g. 1.3"],["Pcs","pcs","number","0"],["Karats *","karats","number","0.0000"]].map(([lbl,f,type,ph])=>(
                <div key={f}><div style={{fontSize:10,color:theme.textMuted,textTransform:"uppercase",marginBottom:4}}>{lbl}</div><input style={inp} type={type} value={row[f]} onChange={e=>updateRow(i,f,e.target.value)} placeholder={ph} min="0" step="0.0001"/></div>
              ))}
              <div><button onClick={()=>removeRow(i)} className="btn-icon-danger" style={{opacity:rows.length===1?0.3:1}}><Icon name="trash" size={13} color={theme.danger}/></button></div>
            </div>
          </div>
        ))}
        <button className="btn-ghost" onClick={addRow} style={{marginBottom:16,display:"flex",alignItems:"center",gap:6,padding:"7px 14px"}}><Icon name="plus" size={13} color={theme.gold}/> Add Row</button>
        <div style={{background:"#7EC8E310",border:"1px solid #7EC8E340",borderRadius:10,padding:"12px 18px",display:"flex",gap:28,marginBottom:16}}>
          <div><div style={{fontSize:10,color:theme.textMuted}}>TOTAL PCS</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#7EC8E3"}}>{totalPcs}</div></div>
          <div><div style={{fontSize:10,color:theme.textMuted}}>TOTAL KARATS</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#7EC8E3"}}>{totalKarats.toFixed(4)} ct</div></div>
        </div>
        {error&&<div style={{color:theme.danger,fontSize:13,background:`${theme.danger}12`,padding:"10px 14px",borderRadius:8,marginBottom:12}}>⚠ {error}</div>}
        <div style={{display:"flex",gap:12}}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{flex:1,padding:14}}>{saving?"Saving...":"Save Diamond Entry →"}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN — Admin Stock Page
// ═══════════════════════════════════════════════════════════════════════════════
const AdminStock = ({ orders = [] }) => {
  const [owner,       setOwner]       = useState(null);
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showGold,    setShowGold]    = useState(false);
  const [showSilver,  setShowSilver]  = useState(false);   // ← NEW
  const [showDiamond, setShowDiamond] = useState(false);
  const [error,       setError]       = useState("");

  const ownerBags       = orders.filter(o => o.usesOwnerGold);
  const ownerSilverBags = orders.filter(o => o.usesOwnerSilver);  // ← NEW

  useEffect(() => {
    const load = async () => {
      try {
        const res    = await orderAPI.getOwner();
        const ownerData = res.data.data;
        setOwner(ownerData);
        const entrRes = await goldEntryAPI.getByCustomer(ownerData._id);
        setEntries(entrRes.data.data || []);
      } catch { setError("Failed to load owner data."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleEntrySaved = (entry, newTotals) => {
    setShowGold(false); setShowSilver(false); setShowDiamond(false);
    setEntries(prev => [entry, ...prev]);
    if (newTotals && owner) {
      setOwner(prev => ({ ...prev, gold:newTotals.gold, silver:newTotals.silver, diamonds:newTotals.diamonds, diamondKarats:newTotals.diamondKarats }));
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try { await goldEntryAPI.delete(id); setEntries(prev => prev.filter(e => e._id !== id)); }
    catch { alert("Delete failed."); }
  };

  if (loading) return <div style={{ padding:80, textAlign:"center", color:theme.textMuted }}>Loading owner data...</div>;
  if (error)   return <div style={{ background:`${theme.danger}12`, border:`1px solid ${theme.danger}40`, borderRadius:12, padding:24, color:theme.danger }}>⚠ {error}</div>;

  const goldAllocated   = ownerBags.reduce((s,o) => s + (o.castingGold||0), 0);
  const silverAllocated = ownerSilverBags.reduce((s,o) => s + (o.castingSilver||0), 0);

  const typeColor = { gold_deposit:theme.gold, silver_deposit:"#C0C0C0", diamond_deposit:"#7EC8E3", return:theme.danger };
  const typeLabel = { gold_deposit:"Gold", silver_deposit:"Silver", diamond_deposit:"Diamonds", return:"Return" };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <div className="section-title">Admin Stock</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginTop:4 }}>Manufacturer Party — <strong style={{color:theme.gold}}>Lariot Jweles</strong></div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setShowGold(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, background:`${theme.gold}18`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"9px 16px", borderRadius:9, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}28`} onMouseLeave={e=>e.currentTarget.style.background=`${theme.gold}18`}>✦ Add Gold</button>
          <button onClick={()=>setShowSilver(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#C0C0C015", border:"1px solid #C0C0C050", color:"#C0C0C0", padding:"9px 16px", borderRadius:9, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#C0C0C025"} onMouseLeave={e=>e.currentTarget.style.background="#C0C0C015"}>◆ Add Silver</button>
          <button onClick={()=>setShowDiamond(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#7EC8E310", border:"1px solid #7EC8E340", color:"#7EC8E3", padding:"9px 16px", borderRadius:9, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }}>💎 Add Diamond</button>
        </div>
      </div>

      {/* Owner banner */}
      <div style={{ background:"#7B5EA712", border:"1px solid #7B5EA750", borderRadius:12, padding:"16px 22px", marginBottom:24, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontSize:32 }}>✦</div>
        <div><div style={{ fontSize:16, color:"#B39DDB", fontWeight:600 }}>{owner?.name}</div><div style={{ fontSize:12, color:theme.textMuted }}>{owner?.company} · Auto-created manufacturer party</div></div>
        <div style={{ marginLeft:"auto", fontSize:12, color:theme.textMuted, textAlign:"right" }}>Gold/Silver used when customer has 0 balance</div>
      </div>

      {/* Balance cards — now 6 (add silver) */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:28 }}>
        {[
          ["Gold Balance",    `${(owner?.gold||0).toFixed(3)}g`,                   theme.gold,    "Available"],
          ["Gold Allocated",  `${goldAllocated.toFixed(3)}g`,                       theme.danger,  "In bags"],
          ["Silver Balance",  `${(owner?.silver||0).toFixed(3)}g`,                  "#C0C0C0",     "Available"],
          ["Silver Allocated",`${silverAllocated.toFixed(3)}g`,                     "#FF8C8C",     "In bags"],
          ["Diamond Karats",  `${(owner?.diamondKarats||0).toFixed(4)} ct`,         "#7EC8E3",     "In stock"],
          ["Bags (Owner)",    `${ownerBags.length + ownerSilverBags.length}`,        "#B39DDB",     "Active"],
        ].map(([l,v,c,sub])=>(
          <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Bags using owner's metals */}
      {(ownerBags.length > 0 || ownerSilverBags.length > 0) && (
        <div style={{ background:theme.surface, border:"1px solid #7B5EA750", borderRadius:14, overflow:"hidden", marginBottom:24 }}>
          <div style={{ background:"#7B5EA715", padding:"12px 18px", fontSize:13, color:"#B39DDB", fontWeight:600 }}>✦ Bags Using Owner's Metal ({ownerBags.length + ownerSilverBags.length})</div>
          {[...ownerBags.map(o=>({...o,_metalLabel:"Gold"})), ...ownerSilverBags.map(o=>({...o,_metalLabel:"Silver"}))].map(o=>(
            <div key={o._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${theme.borderGold}` }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>#{o.bagId}</span>
                  <span style={{ fontSize:14 }}>{o.customerName}</span>
                  <span style={{ fontSize:11, color:o._metalLabel==="Silver"?"#C0C0C0":theme.gold, background:`${o._metalLabel==="Silver"?"#C0C0C0":theme.gold}15`, border:`1px solid ${o._metalLabel==="Silver"?"#C0C0C050":`${theme.gold}40`}`, padding:"2px 7px", borderRadius:10 }}>{o._metalLabel}</span>
                  <span className="tag" style={{ background:o.status==="Completed"?`${theme.success}20`:`${theme.gold}18`, color:o.status==="Completed"?theme.success:theme.gold, fontSize:11 }}>{o.status}</span>
                </div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>{o.folder} · {o.item}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:o._metalLabel==="Silver"?"#C0C0C0":theme.gold }}>{o._metalLabel==="Silver"?(o.castingSilver||0):(o.castingGold||0)}g allocated</div>
                <div style={{ fontSize:11, color:theme.textMuted }}>{o.gramHistory?.length>0?`${o.gramHistory[o.gramHistory.length-1]}g remaining`:"Not cast yet"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entry history */}
      <div style={{ fontSize:14, color:theme.gold, fontWeight:600, marginBottom:16 }}>Transaction History</div>
      {entries.length === 0 && <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:40, textAlign:"center", color:theme.textMuted }}>No entries yet.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {entries.map(entry => {
          const tc = typeColor[entry.entryType]||theme.gold;
          const tl = typeLabel[entry.entryType]||"Entry";
          return (
            <div key={entry._id} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:tc }}>{entry.receiptNo}</span>
                    <span style={{ fontSize:11, color:tc, background:`${tc}15`, border:`1px solid ${tc}40`, padding:"2px 8px", borderRadius:12 }}>{tl}</span>
                  </div>
                  <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(entry.date)}{entry.remark&&` · ${entry.remark}`}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {(entry.entryType==="gold_deposit"||entry.entryType==="silver_deposit") && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:tc }}>{(entry.totalWeight||0).toFixed(3)}g</div>}
                  {entry.entryType==="diamond_deposit" && <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>{entry.totalDiamondPcs||0} pcs</div><div style={{ fontSize:12, color:"#7EC8E3" }}>{(entry.totalDiamondKarats||0).toFixed(4)} ct</div></div>}
                </div>
              </div>
              <div style={{ marginTop:12, display:"flex" }}>
                <button onClick={()=>deleteEntry(entry._id)} className="btn-icon-danger" style={{ marginLeft:"auto" }}><Icon name="trash" size={13} color={theme.danger}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {showGold    && owner && <AddMetalModal   owner={owner} metalType="gold"   onClose={()=>setShowGold(false)}    onSaved={handleEntrySaved}/>}
      {showSilver  && owner && <AddMetalModal   owner={owner} metalType="silver" onClose={()=>setShowSilver(false)}  onSaved={handleEntrySaved}/>}
      {showDiamond && owner && <AddDiamondModal owner={owner}                    onClose={()=>setShowDiamond(false)} onSaved={handleEntrySaved}/>}
    </div>
  );
};

export default AdminStock;
