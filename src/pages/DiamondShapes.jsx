import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { diamondAPI } from "../services/api";
import Icon  from "../components/Icon";
import Modal from "../components/Modal";
import Field from "../components/Field";

const emptyForm = { name: "", sizeInMM: "", weight: "" };

const DiamondShapes = () => {
  const [shapes,    setShapes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    diamondAPI.getAll()
      .then(res => setShapes(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = ()  => { setForm(emptyForm); setEditId(null);       setError(""); setShowModal(true); };
  const openEdit = (s) => { setForm({ name:s.name, sizeInMM:s.sizeInMM, weight:String(s.weight) }); setEditId(s._id); setError(""); setShowModal(true); };

  const save = async () => {
    if (!form.name.trim()) { setError("Diamond name is required."); return; }
    setSaving(true); setError("");
    try {
      if (editId) {
        const res = await diamondAPI.update(editId, { ...form, weight: parseFloat(form.weight) || 0 });
        setShapes(p => p.map(s => s._id === editId ? res.data.data : s));
      } else {
        const res = await diamondAPI.create({ ...form, weight: parseFloat(form.weight) || 0 });
        setShapes(p => [...p, res.data.data]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this diamond shape?")) return;
    try {
      await diamondAPI.remove(id);
      setShapes(p => p.filter(s => s._id !== id));
    } catch { alert("Failed to delete."); }
  };

  if (loading) return <div style={{ color:theme.textMuted }}>Loading...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Diamond Shapes</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{shapes.length} shapes configured</div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <span style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Icon name="plus" size={15} color="#0D0B07"/> Add Diamond Shape
          </span>
        </button>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:16 }}>
        {shapes.map(s => (
          <div key={s._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${theme.gold}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="diamond" size={22} color={theme.gold}/>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-edit" onClick={()=>openEdit(s)}><Icon name="edit" size={13} color={theme.gold}/> Edit</button>
                <button className="btn-icon-danger" onClick={()=>remove(s._id)}><Icon name="trash" size={13} color={theme.danger}/></button>
              </div>
            </div>

            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.text, marginBottom:8 }}>{s.name}</div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {s.sizeInMM && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:theme.textMuted }}>Size</span>
                  <span style={{ fontSize:13, color:theme.text }}>{s.sizeInMM} mm</span>
                </div>
              )}
              {s.weight > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:theme.textMuted }}>Weight</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{s.weight} ct</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {shapes.length === 0 && (
          <div style={{ gridColumn:"1/-1", padding:48, textAlign:"center", color:theme.textMuted, background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14 }}>
            <Icon name="diamond" size={40} color={theme.borderGold}/><br/><br/>
            No diamond shapes yet. Click "Add Diamond Shape" to start.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editId ? "✦ Edit Diamond Shape" : "✦ Add Diamond Shape"} onClose={()=>setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Field label="Diamond Name *">
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Round Brilliant, Princess..." autoFocus/>
            </Field>
            <Field label="Size in MM">
              <input value={form.sizeInMM} onChange={e=>setForm({...form,sizeInMM:e.target.value})} placeholder="e.g. 3.5"/>
            </Field>
            <Field label="Weight (carats)">
              <input type="number" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="e.g. 0.25"/>
            </Field>
            {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-primary" onClick={save} style={{ flex:1 }} disabled={saving}>{saving?"Saving...":editId?"Save Changes":"Add Shape"}</button>
              <button className="btn-ghost" onClick={()=>setShowModal(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DiamondShapes;
