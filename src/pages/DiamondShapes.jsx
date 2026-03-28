import React, { useState } from "react";
import { theme } from "../theme";
import { diamondFolderAPI } from "../services/api";
import Icon  from "../components/Icon";
import Modal from "../components/Modal";
import Field from "../components/Field";

const DiamondShapes = ({ diamondFolders = [], setDiamondFolders }) => {
  const [selectedFolder,  setSelectedFolder]  = useState(null);
  const [showAddFolder,   setShowAddFolder]   = useState(false);
  const [newFolderName,   setNewFolderName]   = useState("");
  const [showAddDiamond,  setShowAddDiamond]  = useState(false);
  const [editDiamond,     setEditDiamond]     = useState(null); // {diamond, folderIdx}
  const [form,            setForm]            = useState({ name:"", sizeInMM:"", weight:"" });
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState("");

  const currentFolder = selectedFolder !== null ? diamondFolders[selectedFolder] : null;

  // ── Add folder ──────────────────────────────────────────────────────────────
  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await diamondFolderAPI.create({ name: newFolderName.trim() });
      setDiamondFolders(prev => [...prev, res.data.data]);
      setNewFolderName(""); setShowAddFolder(false);
    } catch (err) { alert(err.response?.data?.error || "Failed to create folder."); }
  };

  // ── Open add / edit diamond modal ───────────────────────────────────────────
  const openAdd = () => {
    setForm({ name:"", sizeInMM:"", weight:"" });
    setEditDiamond(null); setError(""); setShowAddDiamond(true);
  };
  const openEdit = (diamond) => {
    setForm({ name:diamond.name, sizeInMM:diamond.sizeInMM||"", weight:String(diamond.weight||"") });
    setEditDiamond(diamond); setError(""); setShowAddDiamond(true);
  };

  // ── Save diamond ────────────────────────────────────────────────────────────
  const saveDiamond = async () => {
    if (!form.name.trim()) { setError("Diamond name is required."); return; }
    setSaving(true); setError("");
    const folderId = currentFolder._id;
    try {
      if (editDiamond) {
        const res = await diamondFolderAPI.updateDiamond(folderId, editDiamond._id, {
          name: form.name.trim(), sizeInMM: form.sizeInMM, weight: parseFloat(form.weight)||0,
        });
        setDiamondFolders(prev => prev.map((f, i) =>
          i === selectedFolder
            ? { ...f, diamonds: f.diamonds.map(d => d._id === editDiamond._id ? res.data.data : d) }
            : f
        ));
      } else {
        const res = await diamondFolderAPI.addDiamond(folderId, {
          name: form.name.trim(), sizeInMM: form.sizeInMM, weight: parseFloat(form.weight)||0,
        });
        setDiamondFolders(prev => prev.map((f, i) =>
          i === selectedFolder ? { ...f, diamonds: [...f.diamonds, res.data.data] } : f
        ));
      }
      setShowAddDiamond(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally { setSaving(false); }
  };

  // ── Remove diamond ──────────────────────────────────────────────────────────
  const removeDiamond = async (diamond) => {
    if (!window.confirm(`Remove "${diamond.name}"?`)) return;
    try {
      await diamondFolderAPI.removeDiamond(currentFolder._id, diamond._id);
      setDiamondFolders(prev => prev.map((f, i) =>
        i === selectedFolder ? { ...f, diamonds: f.diamonds.filter(d => d._id !== diamond._id) } : f
      ));
    } catch { alert("Failed to remove diamond."); }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Diamonds</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>
            {selectedFolder === null ? `${diamondFolders.length} categories` : `${currentFolder?.diamonds.length} diamonds in ${currentFolder?.name}`}
          </div>
        </div>
        {selectedFolder === null ? (
          <button className="btn-primary" onClick={() => setShowAddFolder(true)}>
            <span style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Icon name="plus" size={15} color="#0D0B07"/> New Folder
            </span>
          </button>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={() => setSelectedFolder(null)}>← Back</button>
            <button className="btn-primary" onClick={openAdd}>
              <span style={{ display:"flex", alignItems:"center", gap:7 }}>
                <Icon name="plus" size={15} color="#0D0B07"/> Add Diamond
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Folder Grid ── */}
      {selectedFolder === null && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:18 }}>
          {diamondFolders.map((f, i) => (
            <div
              key={f._id}
              className="card-hover fade-in"
              onClick={() => setSelectedFolder(i)}
              style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24, cursor:"pointer", transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.gold}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.borderGold}
            >
              <div style={{ width:52, height:52, borderRadius:14, background:`${theme.gold}18`, border:`1px solid ${theme.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <Icon name="diamond" size={24} color={theme.gold}/>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.text, marginBottom:6 }}>{f.name}</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{f.diamonds.length} {f.diamonds.length === 1 ? "diamond" : "diamonds"}</div>
            </div>
          ))}
          {diamondFolders.length === 0 && (
            <div style={{ gridColumn:"1/-1", padding:56, textAlign:"center", color:theme.textMuted, background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:14 }}>
              <Icon name="diamond" size={40} color={theme.borderGold}/>
              <div style={{ marginTop:16, fontSize:15 }}>No diamond folders yet</div>
              <div style={{ marginTop:6, fontSize:13 }}>Click "New Folder" to create a diamond category</div>
            </div>
          )}
        </div>
      )}

      {/* ── Diamonds inside folder ── */}
      {selectedFolder !== null && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {currentFolder?.diamonds.map(d => (
            <div key={d._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${theme.gold}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name="diamond" size={20} color={theme.gold}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, color:theme.text, fontWeight:500 }}>{d.name}</div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:3, display:"flex", gap:14 }}>
                  {d.sizeInMM && <span>{d.sizeInMM} mm</span>}
                  {d.weight > 0 && <span style={{ color:theme.gold }}>{d.weight} ct/pc</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-edit" onClick={() => openEdit(d)} style={{ fontSize:12, padding:"5px 12px" }}>
                  <Icon name="edit" size={12} color={theme.gold}/> Edit
                </button>
                <button className="btn-icon-danger" onClick={() => removeDiamond(d)}>
                  <Icon name="trash" size={13} color={theme.danger}/>
                </button>
              </div>
            </div>
          ))}
          {currentFolder?.diamonds.length === 0 && (
            <div style={{ padding:56, textAlign:"center", color:theme.textMuted, background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:12 }}>
              <Icon name="diamond" size={36} color={theme.borderGold}/>
              <div style={{ marginTop:14, fontSize:14 }}>No diamonds yet</div>
              <div style={{ marginTop:6, fontSize:13 }}>Click "Add Diamond" to add a diamond size</div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Folder Modal ── */}
      {showAddFolder && (
        <Modal title="✦ Create Diamond Folder" onClose={() => setShowAddFolder(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Field label="Folder Name *">
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Oval, Round Brilliant, Princess..." autoFocus/>
            </Field>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-primary" onClick={addFolder} style={{ flex:1 }}>Create Folder</button>
              <button className="btn-ghost" onClick={() => setShowAddFolder(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Diamond Modal ── */}
      {showAddDiamond && (
        <Modal title={editDiamond ? `✦ Edit — ${editDiamond.name}` : `✦ Add Diamond to ${currentFolder?.name}`} onClose={() => setShowAddDiamond(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Field label="Diamond Name *">
              <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Oval 3mm, Round 2.5mm..." autoFocus/>
            </Field>
            <Field label="Size (mm)">
              <input value={form.sizeInMM} onChange={e => setForm({...form, sizeInMM:e.target.value})} placeholder="e.g. 3.5"/>
            </Field>
            <Field label="Weight per piece (carats)">
              <input type="number" step="0.001" value={form.weight} onChange={e => setForm({...form, weight:e.target.value})} placeholder="e.g. 0.05"/>
            </Field>
            {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-primary" onClick={saveDiamond} style={{ flex:1 }} disabled={saving}>
                {saving ? "Saving..." : editDiamond ? "Save Changes" : "Add Diamond"}
              </button>
              <button className="btn-ghost" onClick={() => setShowAddDiamond(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DiamondShapes;
