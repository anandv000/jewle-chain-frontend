import React, { useState, useRef, useEffect, useMemo } from "react";
import { theme } from "../theme";
import { folderAPI } from "../services/api";
import Icon  from "../components/Icon";
import Modal from "../components/Modal";
import Field from "../components/Field";

const GENDER_OPTIONS = ["Gents", "Ladies", "Kids", "Unisex"];

// ── Flatten all diamonds from diamondFolders for picker ──────────────────────
const flattenDiamonds = (diamondFolders) =>
  (diamondFolders || []).flatMap(f =>
    (f.diamonds || []).map(d => ({ ...d, folderName: f.name, folderId: f._id }))
  );

// ── Diamond Picker Row ────────────────────────────────────────────────────────
const DiamondRow = ({ diamond, onAdd }) => (
  <div
    onClick={() => onAdd(diamond)}
    style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", cursor:"pointer", transition:"background 0.15s", borderBottom:`1px solid ${theme.borderGold}` }}
    onMouseEnter={e => e.currentTarget.style.background = `${theme.gold}10`}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <div style={{ width:8, height:8, borderRadius:"50%", background:theme.gold, flexShrink:0 }}/>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13, color:theme.text }}>{diamond.name}</div>
      <div style={{ fontSize:11, color:theme.textMuted }}>
        {diamond.folderName}{diamond.sizeInMM && ` · ${diamond.sizeInMM}mm`}
        {diamond.weight > 0 && ` · ${diamond.weight}ct/pc`}
      </div>
    </div>
    <span style={{ fontSize:11, color:theme.gold }}>+ Add</span>
  </div>
);

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ items, startIdx, onClose }) => {
  const [idx, setIdx] = useState(startIdx);
  const item = items[idx];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, onClose]);

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position:"fixed", top:20, right:24, background:"none", border:"none", cursor:"pointer", color:"#fff", fontSize:28, lineHeight:1, zIndex:10 }}>✕</button>

      {/* Counter */}
      <div style={{ position:"fixed", top:22, left:"50%", transform:"translateX(-50%)", fontSize:13, color:"rgba(255,255,255,0.5)", zIndex:10 }}>
        {idx + 1} / {items.length}
      </div>

      {/* Image */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth:"88vw", maxHeight:"78vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ maxWidth:"88vw", maxHeight:"78vh", objectFit:"contain", borderRadius:10, boxShadow:"0 8px 40px rgba(0,0,0,0.8)" }}/>
        ) : (
          <div style={{ width:300, height:300, background:theme.surfaceAlt, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, color:theme.textMuted }}>
            <Icon name="image" size={48} color={theme.borderGold}/>
            <span style={{ fontSize:13 }}>No Image</span>
          </div>
        )}
      </div>

      {/* Item info */}
      <div style={{ marginTop:20, textAlign:"center", color:"#fff" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22 }}>{item.name}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4, display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          {item.itemNumber && <span>#{item.itemNumber}</span>}
          {item.weight  > 0 && <span>{item.weight}g gross</span>}
          {item.netWeight > 0 && <span>{item.netWeight}g net</span>}
          {item.purity  && <span>{item.purity}</span>}
          {item.tone    && <span>{item.tone}</span>}
          {item.gender  && <span>{item.gender}</span>}
          {item.designedBy && <span>By {item.designedBy}</span>}
        </div>
        {item.diamonds?.length > 0 && (
          <div style={{ fontSize:12, color:"rgba(201,168,76,0.7)", marginTop:6 }}>
            💎 {item.diamonds.map(d => `${d.diamondName} × ${d.pcs}pc (${d.totalKarats}ct)`).join("  ·  ")}
          </div>
        )}
      </div>

      {/* Left arrow */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
          style={{ position:"fixed", left:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:"50%", width:48, height:48, fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
        >‹</button>
      )}
      {/* Right arrow */}
      {idx < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
          style={{ position:"fixed", right:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:"50%", width:48, height:48, fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
        >›</button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PRODUCTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Products = ({ folders, setFolders, diamondFolders = [] }) => {
  const [showAddFolder,  setShowAddFolder]  = useState(false);
  const [newFolderName,  setNewFolderName]  = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showAddItem,    setShowAddItem]    = useState(false);
  const [lightboxIdx,    setLightboxIdx]    = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [itemErrors,     setItemErrors]     = useState({});
  const [diamondSearch,  setDiamondSearch]  = useState("");
  const [showDiamondPicker, setShowDiamondPicker] = useState(false);
  const [designerQuery,  setDesignerQuery]  = useState("");
  const [showDesignerSuggestions, setShowDesignerSuggestions] = useState(false);

  const imgRef = useRef();

  const emptyItemForm = (folderName = "") => ({
    name:       `${folderName}_`,
    weight:     "",
    netWeight:  "",
    purity:     "",
    tone:       "",
    gender:     "Unisex",
    designedBy: "",
    desc:       "",
    imagePreview: null,
    imageFile:    null,
    diamonds:   [], // [{diamondId, diamondName, folderName, sizeInMM, weightPerPc, pcs, totalKarats}]
  });

  const [itemForm, setItemForm] = useState(emptyItemForm());

  // All existing designer names (for autocomplete)
  const allDesigners = useMemo(() =>
    [...new Set(folders.flatMap(f => f.items.map(it => it.designedBy)).filter(Boolean))].sort(),
    [folders]
  );

  const filteredDesigners = useMemo(() =>
    allDesigners.filter(d => d.toLowerCase().includes(designerQuery.toLowerCase()) && d !== itemForm.designedBy),
    [allDesigners, designerQuery, itemForm.designedBy]
  );

  // Flattened diamonds for picker
  const allDiamonds = useMemo(() => flattenDiamonds(diamondFolders), [diamondFolders]);
  const filteredDiamonds = useMemo(() =>
    allDiamonds.filter(d =>
      d.name.toLowerCase().includes(diamondSearch.toLowerCase()) ||
      d.folderName.toLowerCase().includes(diamondSearch.toLowerCase())
    ),
    [allDiamonds, diamondSearch]
  );

  // ── Add folder ──────────────────────────────────────────────────────────────
  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await folderAPI.create({ name: newFolderName.trim() });
      setFolders(prev => [...prev, res.data.data]);
      setNewFolderName(""); setShowAddFolder(false);
    } catch (err) { alert(err.response?.data?.error || "Failed to create folder."); }
  };

  // ── Image selection ─────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setItemForm(f => ({ ...f, imagePreview: ev.target.result, imageFile: file }));
    reader.readAsDataURL(file);
  };

  // ── Open add item modal ─────────────────────────────────────────────────────
  const openAddItem = () => {
    const name = folders[selectedFolder]?.name || "";
    setItemForm(emptyItemForm(name));
    setItemErrors({});
    setDiamondSearch("");
    setShowDiamondPicker(false);
    setShowAddItem(true);
  };

  // ── Diamond management in item form ────────────────────────────────────────
  const addDiamondToItem = (diamond) => {
    const exists = itemForm.diamonds.find(d => d.diamondId === diamond._id);
    if (exists) return;
    const weightPerPc = diamond.weight || 0;
    const pcs         = 1;
    const totalKarats = parseFloat((pcs * weightPerPc).toFixed(4));
    setItemForm(f => ({
      ...f,
      diamonds: [...f.diamonds, {
        diamondId:   diamond._id,
        diamondName: diamond.name,
        folderName:  diamond.folderName,
        sizeInMM:    diamond.sizeInMM || "",
        weightPerPc,
        pcs,
        totalKarats,
      }],
    }));
    setDiamondSearch("");
    setShowDiamondPicker(false);
  };

  const updateDiamondPcs = (diamondId, pcs) => {
    setItemForm(f => ({
      ...f,
      diamonds: f.diamonds.map(d => {
        if (d.diamondId !== diamondId) return d;
        const newPcs = parseInt(pcs) || 1;
        return { ...d, pcs: newPcs, totalKarats: parseFloat((newPcs * d.weightPerPc).toFixed(4)) };
      }),
    }));
  };

  const removeDiamondFromItem = (diamondId) => {
    setItemForm(f => ({ ...f, diamonds: f.diamonds.filter(d => d.diamondId !== diamondId) }));
  };

  // ── Save item ───────────────────────────────────────────────────────────────
  const addItem = async () => {
    const errs = {};
    if (!itemForm.name.trim()) errs.name = "Item name is required.";
    else {
      const isDupe = folders[selectedFolder].items.some(
        it => it.name.trim().toLowerCase() === itemForm.name.trim().toLowerCase()
      );
      if (isDupe) errs.name = `"${itemForm.name}" already exists in this folder.`;
    }
    setItemErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await folderAPI.addItem(
        folders[selectedFolder]._id,
        { name: itemForm.name, weight: itemForm.weight, netWeight: itemForm.netWeight, purity: itemForm.purity, tone: itemForm.tone, gender: itemForm.gender, designedBy: itemForm.designedBy, desc: itemForm.desc, diamonds: itemForm.diamonds },
        itemForm.imageFile
      );
      setFolders(prev => prev.map((f, i) =>
        i === selectedFolder ? { ...f, items: [...f.items, res.data.data] } : f
      ));
      setShowAddItem(false);
    } catch (err) {
      setItemErrors({ name: err.response?.data?.error || "Failed to add item." });
    } finally { setSaving(false); }
  };

  const currentFolder = selectedFolder !== null ? folders[selectedFolder] : null;

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"8px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, outline:"none", width:"100%" };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Product Folders</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>Manage your jewellery catalogue</div>
        </div>
        {selectedFolder === null ? (
          <button className="btn-primary" onClick={() => setShowAddFolder(true)}>
            <span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={15} color="#0D0B07"/> New Folder</span>
          </button>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={() => setSelectedFolder(null)}>← Back</button>
            <button className="btn-primary" onClick={openAddItem}>
              <span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={15} color="#0D0B07"/> Add Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Folder title */}
      {selectedFolder !== null && (
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:20 }}>
          {currentFolder?.name}
          <span style={{ fontFamily:"'DM Sans'", fontSize:13, color:theme.textMuted, marginLeft:12 }}>{currentFolder?.items.length} items</span>
        </div>
      )}

      {/* ── Folder Grid ── */}
      {selectedFolder === null && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:18 }}>
          {folders.map((f, i) => (
            <div
              key={f._id}
              className="card-hover fade-in"
              onClick={() => setSelectedFolder(i)}
              style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24, cursor:"pointer", transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.gold}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.borderGold}
            >
              <div style={{ width:52, height:52, borderRadius:14, background:`${theme.gold}18`, border:`1px solid ${theme.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <Icon name="folder" size={24} color={theme.gold}/>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.text, marginBottom:6 }}>{f.name}</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{f.items.length} {f.items.length === 1 ? "item" : "items"}</div>
            </div>
          ))}
          {folders.length === 0 && (
            <div style={{ gridColumn:"1/-1", padding:56, textAlign:"center", color:theme.textMuted, background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:14 }}>
              <Icon name="folder" size={40} color={theme.borderGold}/>
              <div style={{ marginTop:16, fontSize:15 }}>No folders yet</div>
              <div style={{ marginTop:6, fontSize:13 }}>Click "New Folder" to create your first category</div>
            </div>
          )}
        </div>
      )}

      {/* ── Items Grid ── */}
      {selectedFolder !== null && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16 }}>
          {currentFolder?.items.map((item, j) => (
            <div
              key={item._id}
              className="card-hover"
              onClick={() => setLightboxIdx(j)}
              style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:13, overflow:"hidden", cursor:"pointer", transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.gold}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.borderGold}
            >
              {/* Image — contain (no crop) */}
              <div style={{ width:"100%", height:160, background:theme.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", padding:4 }}/>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:theme.borderGold }}>
                    <Icon name="image" size={34} color={theme.borderGold}/>
                    <span style={{ fontSize:11 }}>No image</span>
                  </div>
                )}
              </div>

              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:14, color:theme.text, fontWeight:500, marginBottom:4 }}>{item.name}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                  {item.weight > 0 && <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>{item.weight}g</span>}
                  {item.purity && <span style={{ fontSize:11, color:theme.textMuted, background:`${theme.gold}15`, border:`1px solid ${theme.borderGold}`, padding:"1px 6px", borderRadius:4 }}>{item.purity}</span>}
                  {item.gender && item.gender !== "Unisex" && <span style={{ fontSize:11, color:theme.textMuted }}>{item.gender}</span>}
                </div>
                {item.diamonds?.length > 0 && (
                  <div style={{ fontSize:11, color:"#7EC8E3", marginTop:2 }}>
                    💎 {item.diamonds.length} diamond{item.diamonds.length > 1 ? "s" : ""}
                  </div>
                )}
                {item.designedBy && (
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>By {item.designedBy}</div>
                )}
              </div>
            </div>
          ))}

          {currentFolder?.items.length === 0 && (
            <div style={{ gridColumn:"1/-1", padding:56, textAlign:"center", color:theme.textMuted, background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:13 }}>
              <Icon name="image" size={36} color={theme.borderGold}/>
              <div style={{ marginTop:14, fontSize:14 }}>No items yet</div>
              <div style={{ marginTop:6, fontSize:13 }}>Click "Add Item" to add your first piece</div>
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && currentFolder && (
        <Lightbox items={currentFolder.items} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)}/>
      )}

      {/* ── Add Folder Modal ── */}
      {showAddFolder && (
        <Modal title="✦ Create New Folder" onClose={() => setShowAddFolder(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Field label="Folder Name *">
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Pendant, Bangles..." autoFocus/>
            </Field>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-primary" onClick={addFolder} style={{ flex:1 }}>Create Folder</button>
              <button className="btn-ghost" onClick={() => setShowAddFolder(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <div onClick={() => setShowAddItem(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"24px 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"100%", maxWidth:680, padding:28, marginBottom:24 }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>
                ✦ Add Item — {currentFolder?.name}
              </div>
              <button onClick={() => setShowAddItem(false)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Item Name (pre-filled with folder prefix) */}
              <div>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Item Name *</div>
                <input
                  style={{ ...inp, borderColor: itemErrors.name ? theme.danger : theme.borderGold }}
                  value={itemForm.name}
                  onChange={e => { setItemForm(f => ({...f, name:e.target.value})); setItemErrors(p => ({...p, name:null})); }}
                  autoFocus
                />
                {itemErrors.name && <div style={{ fontSize:12, color:theme.danger, marginTop:4 }}>{itemErrors.name}</div>}
              </div>

              {/* Weight row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Gross Weight (g)</div>
                  <input style={inp} type="number" value={itemForm.weight} onChange={e => setItemForm(f => ({...f, weight:e.target.value}))} placeholder="e.g. 8.5"/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Net Weight (g)</div>
                  <input style={inp} type="number" value={itemForm.netWeight} onChange={e => setItemForm(f => ({...f, netWeight:e.target.value}))} placeholder="e.g. 7.2"/>
                </div>
              </div>

              {/* Purity + Tone */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Purity</div>
                  <input style={inp} value={itemForm.purity} onChange={e => setItemForm(f => ({...f, purity:e.target.value}))} placeholder="e.g. 18K, 22K, 925"/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Tone</div>
                  <input style={inp} value={itemForm.tone} onChange={e => setItemForm(f => ({...f, tone:e.target.value}))} placeholder="e.g. Yellow Gold, Rose Gold"/>
                </div>
              </div>

              {/* Gender */}
              <div>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Gender</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {GENDER_OPTIONS.map(g => (
                    <label key={g} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:itemForm.gender===g ? theme.gold : theme.textMuted }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${itemForm.gender===g ? theme.gold : theme.borderGold}`, background:itemForm.gender===g ? theme.gold : "transparent", flexShrink:0, transition:"all 0.15s" }}/>
                      <input type="radio" name="gender" value={g} checked={itemForm.gender===g} onChange={() => setItemForm(f => ({...f, gender:g}))} style={{ display:"none" }}/>
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* Designed By */}
              <div style={{ position:"relative" }}>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Designed By</div>
                <input
                  style={inp}
                  value={itemForm.designedBy}
                  onChange={e => {
                    setItemForm(f => ({...f, designedBy:e.target.value}));
                    setDesignerQuery(e.target.value);
                    setShowDesignerSuggestions(true);
                  }}
                  onFocus={() => setShowDesignerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDesignerSuggestions(false), 180)}
                  placeholder="Designer name..."
                />
                {showDesignerSuggestions && filteredDesigners.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:8, overflow:"hidden", boxShadow:"0 6px 24px rgba(0,0,0,0.4)", marginTop:2 }}>
                    {filteredDesigners.slice(0, 6).map(d => (
                      <div key={d} onClick={() => { setItemForm(f => ({...f, designedBy:d})); setShowDesignerSuggestions(false); }}
                        style={{ padding:"9px 14px", fontSize:13, color:theme.text, cursor:"pointer", borderBottom:`1px solid ${theme.borderGold}` }}
                        onMouseEnter={e => e.currentTarget.style.background = `${theme.gold}10`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >{d}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Description / Notes</div>
                <input style={inp} value={itemForm.desc} onChange={e => setItemForm(f => ({...f, desc:e.target.value}))} placeholder="Design notes, finish, special details..."/>
              </div>

              {/* Image upload */}
              <div>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Item Image</div>
                <input ref={imgRef} type="file" accept=".jpg,.jpeg,.png,.avif,.webp" style={{ display:"none" }} onChange={handleImageChange}/>
                {itemForm.imagePreview ? (
                  <div style={{ position:"relative", textAlign:"center", background:theme.surfaceAlt, borderRadius:10, padding:8, border:`1px solid ${theme.borderGold}` }}>
                    <img src={itemForm.imagePreview} alt="preview" style={{ maxWidth:"100%", maxHeight:220, objectFit:"contain", borderRadius:6 }}/>
                    <button
                      onClick={() => setItemForm(f => ({...f, imagePreview:null, imageFile:null}))}
                      style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.65)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                    ><Icon name="close" size={14} color="#fff"/></button>
                  </div>
                ) : (
                  <div className="img-upload-box" onClick={() => imgRef.current.click()} style={{ cursor:"pointer" }}>
                    <Icon name="image" size={28} color={theme.textMuted}/>
                    <div style={{ color:theme.textMuted, fontSize:13, marginTop:8 }}>Click to upload image</div>
                    <div style={{ color:theme.borderGold, fontSize:11, marginTop:4 }}>JPG · JPEG · PNG · AVIF</div>
                  </div>
                )}
              </div>

              {/* ── Diamonds Used ── */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase" }}>Diamonds Used</div>
                  <button
                    onClick={() => setShowDiamondPicker(v => !v)}
                    style={{ background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"5px 12px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans'" }}
                  >
                    + Add Diamond
                  </button>
                </div>

                {/* Diamond picker */}
                {showDiamondPicker && (
                  <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                    <div style={{ padding:"10px 14px", borderBottom:`1px solid ${theme.borderGold}` }}>
                      <input
                        style={{ ...inp, padding:"7px 12px" }}
                        value={diamondSearch}
                        onChange={e => setDiamondSearch(e.target.value)}
                        placeholder="Search diamond by name or folder..."
                        autoFocus
                      />
                    </div>
                    <div style={{ maxHeight:180, overflowY:"auto" }}>
                      {filteredDiamonds.length === 0 ? (
                        <div style={{ padding:"14px 16px", fontSize:13, color:theme.textMuted }}>
                          {allDiamonds.length === 0 ? "No diamonds configured. Add them in Diamond section first." : "No matching diamonds."}
                        </div>
                      ) : (
                        filteredDiamonds.map(d => (
                          <DiamondRow key={d._id} diamond={d} onAdd={addDiamondToItem}/>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Selected diamonds list */}
                {itemForm.diamonds.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {itemForm.diamonds.map(d => (
                      <div key={d.diamondId} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:9, padding:"10px 14px", display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:theme.text }}>{d.diamondName}</div>
                          <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                            {d.folderName}{d.sizeInMM && ` · ${d.sizeInMM}mm`} · {d.weightPerPc}ct/pc
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:11, color:theme.textMuted }}>Pcs:</span>
                          <input
                            type="number" min="1" value={d.pcs}
                            onChange={e => updateDiamondPcs(d.diamondId, e.target.value)}
                            style={{ width:52, padding:"5px 8px", fontSize:13, background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, borderRadius:6, fontFamily:"'DM Sans'", outline:"none", textAlign:"center" }}
                          />
                          <span style={{ fontSize:12, color:"#7EC8E3", minWidth:52 }}>{d.totalKarats}ct</span>
                        </div>
                        <button onClick={() => removeDiamondFromItem(d.diamondId)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:theme.danger, fontSize:16 }}>×</button>
                      </div>
                    ))}
                    {/* Total karats */}
                    <div style={{ textAlign:"right", fontSize:12, color:"#7EC8E3" }}>
                      Total: {itemForm.diamonds.reduce((s, d) => s + d.totalKarats, 0).toFixed(4)} ct
                    </div>
                  </div>
                )}
              </div>

              {/* Save / Cancel */}
              <div style={{ display:"flex", gap:12, marginTop:4 }}>
                <button className="btn-primary" onClick={addItem} style={{ flex:1 }} disabled={saving}>
                  {saving ? "Uploading..." : "Add Item"}
                </button>
                <button className="btn-ghost" onClick={() => setShowAddItem(false)} disabled={saving}>Cancel</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
