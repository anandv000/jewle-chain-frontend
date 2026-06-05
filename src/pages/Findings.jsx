import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { findingAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

// ── Add / Edit finding-type modal ─────────────────────────────────────────────
const FindingFormModal = ({ existing, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name:     existing?.name     || "",
    category: existing?.category || "",
    karat:    existing?.karat    || "",
    pcs:      existing ? "" : "",
    weight:   existing ? "" : "",
    note:     "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const submit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      if (existing) {
        const res = await findingAPI.update(existing._id, { name:form.name, category:form.category, karat:form.karat });
        onSaved(res.data.data);
      } else {
        const res = await findingAPI.create({
          name:form.name, category:form.category, karat:form.karat,
          pcs:parseInt(form.pcs)||0, weight:parseFloat(form.weight)||0, note:form.note,
        });
        onSaved(res.data.data);
      }
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={existing ? "✦ Edit Finding" : "✦ New Finding Type"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Finding Name *"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Lobster Clasp" autoFocus/></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Category"><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Clasp"/></Field>
          <Field label="Karat / Metal"><input value={form.karat} onChange={e=>setForm({...form,karat:e.target.value})} placeholder="e.g. 18K"/></Field>
        </div>
        {!existing && (
          <>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5 }}>Opening Stock (optional)</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Pieces"><input type="number" min="0" value={form.pcs} onChange={e=>setForm({...form,pcs:e.target.value})} placeholder="0"/></Field>
              <Field label="Weight (g)"><input type="number" step="0.001" min="0" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="0.000"/></Field>
            </div>
          </>
        )}
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12, marginTop:4 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex:1 }}>{saving?"Saving...":existing?"Save Changes":"Create Finding"}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

// ── Deposit-stock modal ───────────────────────────────────────────────────────
const DepositModal = ({ finding, onClose, onSaved }) => {
  const [pcs,    setPcs]    = useState("");
  const [weight, setWeight] = useState("");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const submit = async () => {
    if ((parseInt(pcs)||0) <= 0 && (parseFloat(weight)||0) <= 0) { setError("Enter pieces or weight."); return; }
    setSaving(true); setError("");
    try {
      const res = await findingAPI.deposit(finding._id, { pcs:parseInt(pcs)||0, weight:parseFloat(weight)||0, note });
      onSaved(res.data.data);
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`✦ Add Stock — ${finding.name}`} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ fontSize:12, color:theme.textMuted }}>Current: <strong style={{color:theme.gold}}>{finding.pcs} pcs · {(finding.weight||0).toFixed(3)}g</strong></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Add Pieces"><input type="number" min="0" value={pcs} onChange={e=>setPcs(e.target.value)} placeholder="0" autoFocus/></Field>
          <Field label="Add Weight (g)"><input type="number" step="0.001" min="0" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="0.000"/></Field>
        </div>
        <Field label="Note"><input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Purchased from supplier"/></Field>
        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
        <div style={{ display:"flex", gap:12, marginTop:4 }}>
          <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex:1 }}>{saving?"Saving...":"Add Stock →"}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

// ── History panel ─────────────────────────────────────────────────────────────
const HistoryModal = ({ finding, onClose }) => {
  const actionColor = { deposit:theme.success, used:theme.danger, restored:theme.gold, adjust:theme.textMuted };
  const actionLabel = { deposit:"+ Deposit", used:"− Used", restored:"↩ Restored", adjust:"Adjust" };
  const rows = [...(finding.history||[])].reverse();
  return (
    <Modal title={`📋 History — ${finding.name}`} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:"60vh", overflowY:"auto" }}>
        {rows.length === 0 && <div style={{ color:theme.textMuted, textAlign:"center", padding:30 }}>No movements yet.</div>}
        {rows.map((h,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"10px 14px" }}>
            <div>
              <div style={{ fontSize:13, color:actionColor[h.action]||theme.text, fontWeight:600 }}>{actionLabel[h.action]||h.action}{h.bagId?` · Bag #${h.bagId}`:""}</div>
              <div style={{ fontSize:11, color:theme.textMuted }}>{fmt(h.date)}{h.note?` · ${h.note}`:""}</div>
            </div>
            <div style={{ textAlign:"right", fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:actionColor[h.action]||theme.text }}>
              {h.pcs?`${h.pcs} pcs`:""}{h.pcs&&h.weight?" · ":""}{h.weight?`${(h.weight||0).toFixed(3)}g`:""}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN — Findings inventory page
// ═══════════════════════════════════════════════════════════════════════════════
const Findings = () => {
  const [findings, setFindings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [depositOf,setDepositOf]= useState(null);
  const [historyOf,setHistoryOf]= useState(null);

  useEffect(() => {
    findingAPI.getAll()
      .then(r => setFindings(r.data.data || []))
      .catch(() => setError("Failed to load findings."))
      .finally(() => setLoading(false));
  }, []);

  const upsert = (f) => setFindings(prev => {
    const i = prev.findIndex(x => x._id === f._id);
    if (i >= 0) { const next = [...prev]; next[i] = f; return next; }
    return [f, ...prev];
  });

  const remove = async (id, name) => {
    if (!window.confirm(`Delete finding "${name}"? (stock history will be lost)`)) return;
    try { await findingAPI.remove(id); setFindings(prev => prev.filter(f => f._id !== id)); }
    catch { alert("Delete failed."); }
  };

  const totalPcs = findings.reduce((s,f)=>s+(f.pcs||0),0);
  const totalWt  = findings.reduce((s,f)=>s+(f.weight||0),0);

  if (loading) return <div style={{ padding:80, textAlign:"center", color:theme.textMuted }}>Loading findings...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <div className="section-title">Findings</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginTop:4 }}>Clasps, posts, jump rings & other parts — added to bags at Packaging, billed separately.</div>
        </div>
        <button className="btn-primary" onClick={()=>{ setEditing(null); setShowForm(true); }}>
          <span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={15} color="#0D0B07"/> New Finding</span>
        </button>
      </div>

      {error && <div style={{ background:`${theme.danger}12`, border:`1px solid ${theme.danger}40`, borderRadius:12, padding:16, color:theme.danger, marginBottom:16 }}>⚠ {error}</div>}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          ["Finding Types", `${findings.length}`, theme.gold],
          ["Total Pieces",  `${totalPcs}`,        "#7EC8E3"],
          ["Total Weight",  `${totalWt.toFixed(3)}g`, theme.success],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        <div className="table-row" style={{ gridTemplateColumns:"2fr 1.3fr 1fr 1fr 1fr 2.4fr", background:theme.surfaceAlt }}>
          {["Name","Category","Karat","Pcs","Weight","Actions"].map(h=>(
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</span>
          ))}
        </div>
        {findings.map(f => (
          <div key={f._id} className="table-row" style={{ gridTemplateColumns:"2fr 1.3fr 1fr 1fr 1fr 2.4fr" }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{f.name}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{f.category||"—"}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{f.karat||"—"}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#7EC8E3" }}>{f.pcs||0}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{(f.weight||0).toFixed(3)}g</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={()=>setDepositOf(f)} style={{ background:"#1a3020", color:"#4CC97A", border:"1px solid #2d5a3a", padding:"5px 10px", borderRadius:7, fontSize:11, cursor:"pointer" }}>✦ Add Stock</button>
              <button onClick={()=>setHistoryOf(f)} style={{ background:theme.surfaceAlt, color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"5px 9px", borderRadius:7, fontSize:11, cursor:"pointer" }}>📋</button>
              <button className="btn-edit" style={{ padding:"5px 9px", fontSize:11 }} onClick={()=>{ setEditing(f); setShowForm(true); }}><Icon name="edit" size={12} color={theme.gold}/></button>
              <button className="btn-icon-danger" onClick={()=>remove(f._id,f.name)}><Icon name="trash" size={12} color={theme.danger}/></button>
            </div>
          </div>
        ))}
        {findings.length === 0 && <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>No findings yet. Add your first finding type.</div>}
      </div>

      {showForm   && <FindingFormModal existing={editing} onClose={()=>setShowForm(false)} onSaved={(f)=>{ upsert(f); setShowForm(false); }}/>}
      {depositOf  && <DepositModal     finding={depositOf} onClose={()=>setDepositOf(null)} onSaved={(f)=>{ upsert(f); setDepositOf(null); }}/>}
      {historyOf  && <HistoryModal     finding={historyOf} onClose={()=>setHistoryOf(null)}/>}
    </div>
  );
};

export default Findings;
