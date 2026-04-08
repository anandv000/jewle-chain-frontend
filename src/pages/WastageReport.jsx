import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { StatBox } from "../components/Modal";
import { goldRecoveryAPI } from "../services/api";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

// ── Date range helpers ─────────────────────────────────────────────────────────
const getRange = (filter) => {
  const now  = new Date();
  const from = new Date();
  if (filter === "week")    from.setDate(now.getDate() - 7);
  if (filter === "month")   from.setMonth(now.getMonth() - 1);
  if (filter === "6months") from.setMonth(now.getMonth() - 6);
  if (filter === "year")    from.setFullYear(now.getFullYear() - 1);
  return filter === "all" ? null : from;
};

const inRange = (order, from) => {
  if (!from) return true;
  const d = new Date(order.deliveryDate || order.orderDate || order.createdAt);
  return d >= from;
};

// ── Gold Recovery Modal ────────────────────────────────────────────────────────
const GoldRecoveryModal = ({ onClose, onSave }) => {
  const [grams,  setGrams]  = useState("");
  const [source, setSource] = useState("");
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [note,   setNote]   = useState("");
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  const SOURCE_OPTIONS = [
    "Floor Sweeping", "Brush Dust", "Worker Clothes Burning",
    "Machine Cleaning", "Unit Deep Cleaning", "Polishing Dust", "Other",
  ];

  const save = async () => {
    if (!grams || parseFloat(grams) <= 0) { setError("Please enter grams recovered."); return; }
    if (!source) { setError("Please select a recovery source."); return; }
    setSaving(true); setError("");
    try {
      const res = await goldRecoveryAPI.create({ grams: parseFloat(grams), source, date, note });
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"8px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, width:"100%", outline:"none" };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"92vw", maxWidth:480 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>⚗ Record Gold Recovery</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>Log gold found from floor, clothes, equipment etc.</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Gold Recovered (grams) *</div>
            <input style={inp} type="number" step="0.001" min="0" value={grams} onChange={e=>{ setGrams(e.target.value); setError(""); }} placeholder="e.g. 0.500" autoFocus/>
          </div>
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Recovery Source *</div>
            <select style={inp} value={source} onChange={e=>{ setSource(e.target.value); setError(""); }}>
              <option value="">— Select source —</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Date</div>
            <input style={{ ...inp, colorScheme:"dark" }} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Notes (optional)</div>
            <input style={inp} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Found during monthly unit cleaning..."/>
          </div>
          {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
          <div style={{ background:`${theme.success}08`, border:`1px solid ${theme.success}30`, borderRadius:10, padding:"12px 16px", fontSize:12, color:theme.textMuted }}>
            ℹ️ This gold will be <strong style={{color:theme.success}}>subtracted from total wastage</strong> and saved permanently to database.
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ flex:1, padding:12, fontSize:14 }}>
              {saving ? "Saving..." : "Save Recovery Entry"}
            </button>
            <button onClick={onClose} className="btn-ghost" disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const WastageReport = ({ orders }) => {
  const [filter,       setFilter]       = useState("all");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveries,   setRecoveries]   = useState([]);
  const [loadingRec,   setLoadingRec]   = useState(true);
  const [showLog,      setShowLog]      = useState(false);

  const filterLabels = {
    all:"All Time", week:"This Week", month:"This Month",
    "6months":"Last 6 Months", year:"This Year",
  };

  // ── Load recoveries from DB on mount ──────────────────────────────────────
  useEffect(() => {
    goldRecoveryAPI.getAll()
      .then(res => setRecoveries(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingRec(false));
  }, []);

  const from      = getRange(filter);
  const completed = orders.filter(o => o.status === "Completed" && inRange(o, from));

  const totalWastage   = completed.reduce((s,o) => s + (o.gramHistory[0] - o.gramHistory[o.gramHistory.length-1]), 0);
  const totalLabour    = completed.reduce((s,o) => s + (o.labourTotal || 0), 0);
  const totalRecovered = recoveries.reduce((s,r) => s + (r.grams || 0), 0);
  const netWastage     = Math.max(0, totalWastage - totalRecovered);

  const handleSaveRecovery = (entry) => {
    setRecoveries(prev => [entry, ...prev]);
    setShowRecovery(false);
  };

  const deleteRecovery = async (id) => {
    if (!window.confirm("Remove this recovery entry?")) return;
    try {
      await goldRecoveryAPI.remove(id);
      setRecoveries(prev => prev.filter(r => r._id !== id));
    } catch { alert("Failed to delete. Try again."); }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div className="section-title">Wastage Report</div>
        <button
          onClick={() => setShowRecovery(true)}
          style={{ display:"inline-flex", alignItems:"center", gap:8, background:`${theme.success}15`, border:`1px solid ${theme.success}50`, color:theme.success, padding:"9px 18px", borderRadius:9, fontFamily:"'DM Sans'", fontWeight:600, fontSize:13, cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.background=`${theme.success}28`}
          onMouseLeave={e=>e.currentTarget.style.background=`${theme.success}15`}
        >
          ⚗ Record Gold Recovery
        </button>
      </div>
      <div style={{ color:theme.textMuted, fontSize:13, marginBottom:20 }}>Gold wastage summary for completed orders</div>

      {/* Time filter tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {Object.entries(filterLabels).map(([k,lbl]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding:"7px 16px", borderRadius:20, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans'", border:`1px solid ${filter===k?theme.gold:theme.borderGold}`, background:filter===k?`${theme.gold}18`:"transparent", color:filter===k?theme.gold:theme.textMuted, transition:"all 0.2s" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Stats — 4 boxes */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Completed Orders</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.success }}>{completed.length}</div>
        </div>
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Gross Wastage</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.danger }}>{totalWastage.toFixed(3)}g</div>
        </div>
        <div style={{ background:theme.surface, border:`1px solid ${theme.success}40`, borderRadius:12, padding:18, position:"relative" }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Gold Recovered</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.success }}>
            {loadingRec ? "…" : `+${totalRecovered.toFixed(3)}g`}
          </div>
          {recoveries.length > 0 && (
            <button onClick={()=>setShowLog(v=>!v)}
              style={{ position:"absolute", top:12, right:12, fontSize:11, color:theme.success, background:`${theme.success}15`, border:`1px solid ${theme.success}40`, padding:"2px 8px", borderRadius:12, cursor:"pointer", fontFamily:"'DM Sans'" }}>
              {recoveries.length} {showLog ? "▲" : "▼"}
            </button>
          )}
        </div>
        <div style={{ background:theme.surface, border:`2px solid ${theme.gold}40`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Net Wastage</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>{netWastage.toFixed(3)}g</div>
          {totalRecovered > 0 && (
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>{totalWastage.toFixed(3)} − {totalRecovered.toFixed(3)}</div>
          )}
        </div>
      </div>

      {/* Recovery Log */}
      {showLog && recoveries.length > 0 && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.success}40`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:13, color:theme.success, fontWeight:600, marginBottom:14 }}>⚗ Gold Recovery Log</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recoveries.map(r => (
              <div key={r._id} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:9, padding:"10px 16px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.success, minWidth:70 }}>+{(r.grams||0).toFixed(3)}g</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:theme.text }}>{r.source}</div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>{fmt(r.date)}{r.note && ` · ${r.note}`}</div>
                </div>
                <button onClick={()=>deleteRecovery(r._id)} className="btn-icon-danger">
                  <Icon name="trash" size={13} color={theme.danger}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labour summary */}
      <div style={{ background:`${theme.gold}08`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"12px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color:theme.textMuted }}>Total Labour ({filterLabels[filter]})</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold }}>₹{totalLabour.toLocaleString()}</span>
      </div>

      {/* Orders table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        <div className="table-row" style={{ gridTemplateColumns:"1fr 2fr 2fr 1fr 1fr 1fr 1fr", background:theme.surfaceAlt }}>
          {["Bag ID","Customer","Product","Initial","Final","Wastage","Labour"].map(h => (
            <span key={h} style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>
        {completed.map((o,i) => {
          const w = (o.gramHistory[0] - o.gramHistory[o.gramHistory.length-1]).toFixed(3);
          return (
            <div key={i} className="table-row" style={{ gridTemplateColumns:"1fr 2fr 2fr 1fr 1fr 1fr 1fr" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.gold }}>#{o.bagId}</div>
              <div style={{ fontSize:14 }}>{o.customerName}</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.textMuted }}>{o.gramHistory[0]}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{o.gramHistory[o.gramHistory.length-1]}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.danger }}>{w}g</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.success }}>₹{(o.labourTotal||0).toLocaleString()}</div>
            </div>
          );
        })}
        {completed.length === 0 && (
          <div style={{ padding:40, textAlign:"center", color:theme.textMuted }}>
            No completed orders for {filterLabels[filter].toLowerCase()}
          </div>
        )}
      </div>

      {showRecovery && <GoldRecoveryModal onClose={()=>setShowRecovery(false)} onSave={handleSaveRecovery}/>}
    </div>
  );
};

export default WastageReport;
