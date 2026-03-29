import React, { useState, useRef, useEffect, useMemo } from "react";
import { theme } from "../theme";
import { folderAPI } from "../services/api";
import Icon  from "../components/Icon";
import Modal from "../components/Modal";
import Field from "../components/Field";

const GENDER_OPTIONS = ["Gents", "Ladies", "Kids", "Unisex"];

const flattenDiamonds = (diamondFolders) =>
  (diamondFolders || []).flatMap(f =>
    (f.diamonds || []).map(d => ({ ...d, folderName: f.name, folderId: f._id }))
  );

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ items, startIdx, onClose }) => {
  const [idx, setIdx] = useState(startIdx);
  const item = items[idx];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") setIdx(i => Math.min(i+1, items.length-1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i-1, 0));
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, onClose]);

  if (!item) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <button onClick={onClose} style={{ position:"fixed", top:20, right:24, background:"none", border:"none", cursor:"pointer", color:"#fff", fontSize:28, zIndex:10 }}>✕</button>
      <div style={{ position:"fixed", top:22, left:"50%", transform:"translateX(-50%)", fontSize:13, color:"rgba(255,255,255,0.5)", zIndex:10 }}>{idx+1} / {items.length}</div>
      <div onClick={e=>e.stopPropagation()} style={{ maxWidth:"88vw", maxHeight:"78vh" }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ maxWidth:"88vw", maxHeight:"78vh", objectFit:"contain", borderRadius:10, boxShadow:"0 8px 40px rgba(0,0,0,0.8)" }}/>
          : <div style={{ width:300, height:300, background:theme.surfaceAlt, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, color:theme.textMuted }}>
              <Icon name="image" size={48} color={theme.borderGold}/><span style={{ fontSize:13 }}>No Image</span>
            </div>
        }
      </div>
      <div style={{ marginTop:20, textAlign:"center", color:"#fff", padding:"0 20px" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22 }}>{item.name}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:6, display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
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
            💎 {item.diamonds.map(d=>`${d.diamondName} × ${d.pcs}pc (${d.totalKarats}ct)`).join("  ·  ")}
          </div>
        )}
      </div>
      {idx > 0 && (
        <button onClick={e=>{e.stopPropagation();setIdx(i=>i-1);}} style={{ position:"fixed", left:16, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:48, height:48, fontSize:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
      )}
      {idx < items.length-1 && (
        <button onClick={e=>{e.stopPropagation();setIdx(i=>i+1);}} style={{ position:"fixed", right:16, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:48, height:48, fontSize:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
      )}
    </div>
  );
};

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
  const [showDesignerSug, setShowDesignerSug] = useState(false);
  const imgRef = useRef();

  const emptyItemForm = (folderName = "") => ({
    name:"", weight:"", netWeight:"", purity:"", tone:"",
    gender:"Unisex", designedBy:"", desc:"",
    imagePreview:null, imageFile:null, diamonds:[],
    // name starts blank; user types after folder prefix shown as placeholder
    namePrefix: folderName ? `${folderName}_` : "",
  });

  const [itemForm, setItemForm] = useState(emptyItemForm());

  const allDesigners = useMemo(() =>
    [...new Set(folders.flatMap(f => f.items.map(it=>it.designedBy)).filter(Boolean))].sort(),
    [folders]
  );
  const filteredDesigners = useMemo(() =>
    allDesigners.filter(d => d.toLowerCase().includes(designerQuery.toLowerCase()) && d !== itemForm.designedBy),
    [allDesigners, designerQuery, itemForm.designedBy]
  );

  const allDiamonds = useMemo(() => flattenDiamonds(diamondFolders), [diamondFolders]);
  const filteredDiamonds = useMemo(() =>
    allDiamonds.filter(d =>
      d.name.toLowerCase().includes(diamondSearch.toLowerCase()) ||
      d.folderName.toLowerCase().includes(diamondSearch.toLowerCase())
    ),
    [allDiamonds, diamondSearch]
  );

  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await folderAPI.create({ name: newFolderName.trim() });
      setFolders(prev => [...prev, res.data.data]);
      setNewFolderName(""); setShowAddFolder(false);
    } catch (err) { alert(err.response?.data?.error || "Failed to create folder."); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setItemForm(f => ({...f, imagePreview:ev.target.result, imageFile:file}));
    reader.readAsDataURL(file);
  };

  const openAddItem = () => {
    const name = folders[selectedFolder]?.name || "";
    setItemForm(emptyItemForm(name));
    setItemErrors({}); setDiamondSearch(""); setShowDiamondPicker(false);
    setShowAddItem(true);
  };

  const addDiamondToItem = (diamond) => {
    if (itemForm.diamonds.find(d => d.diamondId === diamond._id)) return;
    const weightPerPc  = diamond.weight || 0;
    const totalKarats  = parseFloat((1 * weightPerPc).toFixed(4));
    setItemForm(f => ({
      ...f,
      diamonds: [...f.diamonds, { diamondId:diamond._id, diamondName:diamond.name, folderName:diamond.folderName, sizeInMM:diamond.sizeInMM||"", weightPerPc, pcs:1, totalKarats }],
    }));
    setDiamondSearch(""); setShowDiamondPicker(false);
  };

  const updateDiamondPcs = (diamondId, pcs) => {
    setItemForm(f => ({
      ...f,
      diamonds: f.diamonds.map(d => {
        if (d.diamondId !== diamondId) return d;
        const np = parseInt(pcs)||1;
        return { ...d, pcs:np, totalKarats:parseFloat((np*d.weightPerPc).toFixed(4)) };
      }),
    }));
  };

  const removeDiamondFromItem = (diamondId) => {
    setItemForm(f => ({ ...f, diamonds: f.diamonds.filter(d => d.diamondId !== diamondId) }));
  };

  const addItem = async () => {
    const fullName = itemForm.namePrefix + itemForm.name;
    const errs = {};
    if (!fullName.trim() || fullName.trim() === itemForm.namePrefix.trim()) {
      errs.name = "Item name is required.";
    } else {
      const isDupe = folders[selectedFolder].items.some(
        it => it.name.trim().toLowerCase() === fullName.trim().toLowerCase()
      );
      if (isDupe) errs.name = `"${fullName}" already exists in this folder.`;
    }
    setItemErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const res = await folderAPI.addItem(
        folders[selectedFolder]._id,
        { name:fullName, weight:itemForm.weight, netWeight:itemForm.netWeight, purity:itemForm.purity, tone:itemForm.tone, gender:itemForm.gender, designedBy:itemForm.designedBy, desc:itemForm.desc, diamonds:itemForm.diamonds },
        itemForm.imageFile
      );
      setFolders(prev => prev.map((f,i) =>
        i === selectedFolder ? { ...f, items: [...f.items, res.data.data] } : f
      ));
      setShowAddItem(false);
    } catch (err) {
      setItemErrors({ name: err.response?.data?.error || "Failed to add item." });
    } finally { setSaving(false); }
  };

  const currentFolder = selectedFolder !== null ? folders[selectedFolder] : null;

  // Shared input style
  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"8px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, outline:"none", width:"100%" };
  const lbl = { fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5, display:"block" };

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
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button className="btn-ghost" onClick={() => setSelectedFolder(null)}>← Back</button>
            <button className="btn-primary" onClick={openAddItem}>
              <span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={15} color="#0D0B07"/> Add Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Folder title bar */}
      {selectedFolder !== null && (
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, marginBottom:20 }}>
          {currentFolder?.name}
          <span style={{ fontFamily:"'DM Sans'", fontSize:13, color:theme.textMuted, marginLeft:12 }}>{currentFolder?.items.length} items</span>
        </div>
      )}

      {/* Folder grid */}
      {selectedFolder === null && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:18 }}>
          {folders.map((f, i) => (
            <div key={f._id} className="card-hover fade-in" onClick={()=>setSelectedFolder(i)}
              style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24, cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=`${theme.gold}60`}
              onMouseLeave={e=>e.currentTarget.style.borderColor=theme.borderGold}
            >
              <div style={{ width:52, height:52, borderRadius:14, background:`${theme.gold}18`, border:`1px solid ${theme.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <Icon name="folder" size={24} color={theme.gold}/>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.text, marginBottom:6 }}>{f.name}</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{f.items.length} {f.items.length===1?"item":"items"}</div>
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

      {/* Items grid */}
      {selectedFolder !== null && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:16 }}>
          {currentFolder?.items.map((item, j) => (
            <div key={item._id} className="card-hover" onClick={()=>setLightboxIdx(j)}
              style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:13, overflow:"hidden", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=`${theme.gold}60`}
              onMouseLeave={e=>e.currentTarget.style.borderColor=theme.borderGold}
            >
              <div style={{ width:"100%", height:180, background:theme.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", padding:6 }}/>
                  : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                      <Icon name="image" size={34} color={theme.borderGold}/>
                      <span style={{ fontSize:11, color:theme.borderGold }}>No image</span>
                    </div>
                }
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:14, color:theme.text, fontWeight:500, marginBottom:6 }}>{item.name}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:4 }}>
                  {item.weight>0 && <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>{item.weight}g</span>}
                  {item.purity && <span style={{ fontSize:11, color:theme.textMuted, background:`${theme.gold}15`, border:`1px solid ${theme.borderGold}`, padding:"1px 7px", borderRadius:4 }}>{item.purity}</span>}
                  {item.gender && item.gender!=="Unisex" && <span style={{ fontSize:11, color:theme.textMuted }}>{item.gender}</span>}
                </div>
                {item.diamonds?.length>0 && (
                  <div style={{ fontSize:11, color:"#7EC8E3", marginTop:2 }}>💎 {item.diamonds.length} diamond{item.diamonds.length>1?"s":""}</div>
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
              <div style={{ marginTop:6, fontSize:13 }}>Click "Add Item" to get started</div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && currentFolder && (
        <Lightbox items={currentFolder.items} startIdx={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <Modal title="✦ Create New Folder" onClose={()=>setShowAddFolder(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <Field label="Folder Name *">
              <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="e.g. Pendant, Bangles..." autoFocus/>
            </Field>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-primary" onClick={addFolder} style={{ flex:1 }}>Create Folder</button>
              <button className="btn-ghost" onClick={()=>setShowAddFolder(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Item Modal — IMAGE LEFT, FIELDS RIGHT ── */}
      {showAddItem && (
        <div
          onClick={()=>setShowAddItem(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"20px 12px" }}
        >
          <div
            onClick={e=>e.stopPropagation()}
            style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, width:"100%", maxWidth:900, marginBottom:20, display:"flex", flexDirection:"column" }}
          >
            {/* Modal header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${theme.borderGold}` }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>
                ✦ Add Item — {currentFolder?.name}
              </div>
              <button onClick={()=>setShowAddItem(false)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:22, lineHeight:1 }}>✕</button>
            </div>

            {/* Two-column body */}
            <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", minHeight:0 }}>

              {/* ── LEFT: Image ── */}
              <div style={{ borderRight:`1px solid ${theme.borderGold}`, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:2 }}>Item Image</div>
                <input ref={imgRef} type="file" accept=".jpg,.jpeg,.png,.avif,.webp" style={{ display:"none" }} onChange={handleImageChange}/>

                {/* Image display area — full height */}
                <div
                  style={{ flex:1, minHeight:280, background:theme.surfaceAlt, border:`1px dashed ${theme.borderGold}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", cursor:"pointer", position:"relative" }}
                  onClick={()=>imgRef.current.click()}
                >
                  {itemForm.imagePreview ? (
                    <>
                      <img src={itemForm.imagePreview} alt="preview" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
                      <button
                        onClick={e=>{e.stopPropagation(); setItemForm(f=>({...f,imagePreview:null,imageFile:null}));}}
                        style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14 }}
                      >✕</button>
                    </>
                  ) : (
                    <div style={{ textAlign:"center", color:theme.textMuted }}>
                      <Icon name="image" size={36} color={theme.borderGold}/>
                      <div style={{ fontSize:13, marginTop:10 }}>Click to upload</div>
                      <div style={{ fontSize:11, color:theme.borderGold, marginTop:4 }}>JPG · PNG · AVIF</div>
                    </div>
                  )}
                </div>

                {itemForm.imagePreview && (
                  <button
                    onClick={()=>imgRef.current.click()}
                    style={{ background:"transparent", border:`1px solid ${theme.borderGold}`, color:theme.gold, padding:"8px 0", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans'" }}
                  >
                    Change Image
                  </button>
                )}
              </div>

              {/* ── RIGHT: Fields ── */}
              <div style={{ padding:24, overflowY:"auto", maxHeight:"80vh", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Name with prefix */}
                <div>
                  <label style={lbl}>Item Name *</label>
                  <div style={{ display:"flex", alignItems:"center", border:`1px solid ${itemErrors.name ? theme.danger : theme.borderGold}`, borderRadius:8, background:theme.bg, overflow:"hidden" }}>
                    <span style={{ padding:"8px 10px", fontSize:13, color:theme.gold, background:`${theme.gold}10`, borderRight:`1px solid ${theme.borderGold}`, whiteSpace:"nowrap", flexShrink:0 }}>
                      {itemForm.namePrefix}
                    </span>
                    <input
                      value={itemForm.name}
                      onChange={e => { setItemForm(f=>({...f,name:e.target.value})); setItemErrors(p=>({...p,name:null})); }}
                      placeholder="item suffix..."
                      autoFocus
                      style={{ flex:1, background:"transparent", border:"none", color:theme.text, padding:"8px 12px", fontSize:13, outline:"none", fontFamily:"'DM Sans'" }}
                    />
                  </div>
                  {itemErrors.name && <div style={{ fontSize:12, color:theme.danger, marginTop:4 }}>{itemErrors.name}</div>}
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>Full name: {itemForm.namePrefix}{itemForm.name || "…"}</div>
                </div>

                {/* Weight + Net Weight */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={lbl}>Gross Weight (g)</label>
                    <input style={inp} type="number" step="0.01" value={itemForm.weight} onChange={e=>setItemForm(f=>({...f,weight:e.target.value}))} placeholder="e.g. 8.5"/>
                  </div>
                  <div>
                    <label style={lbl}>Net Weight (g)</label>
                    <input style={inp} type="number" step="0.01" value={itemForm.netWeight} onChange={e=>setItemForm(f=>({...f,netWeight:e.target.value}))} placeholder="e.g. 7.2"/>
                  </div>
                </div>

                {/* Purity + Tone */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={lbl}>Purity</label>
                    <input style={inp} value={itemForm.purity} onChange={e=>setItemForm(f=>({...f,purity:e.target.value}))} placeholder="e.g. 18K, 22K"/>
                  </div>
                  <div>
                    <label style={lbl}>Tone</label>
                    <input style={inp} value={itemForm.tone} onChange={e=>setItemForm(f=>({...f,tone:e.target.value}))} placeholder="e.g. Yellow Gold"/>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label style={lbl}>Gender</label>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                    {GENDER_OPTIONS.map(g => (
                      <label key={g} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:itemForm.gender===g?theme.gold:theme.textMuted }}>
                        <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${itemForm.gender===g?theme.gold:theme.borderGold}`, background:itemForm.gender===g?theme.gold:"transparent", flexShrink:0 }}/>
                        <input type="radio" name="gender" value={g} checked={itemForm.gender===g} onChange={()=>setItemForm(f=>({...f,gender:g}))} style={{ display:"none" }}/>
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Designed By */}
                <div style={{ position:"relative" }}>
                  <label style={lbl}>Designed By</label>
                  <input
                    style={inp}
                    value={itemForm.designedBy}
                    onChange={e=>{setItemForm(f=>({...f,designedBy:e.target.value}));setDesignerQuery(e.target.value);setShowDesignerSug(true);}}
                    onFocus={()=>setShowDesignerSug(true)}
                    onBlur={()=>setTimeout(()=>setShowDesignerSug(false),180)}
                    placeholder="Designer name..."
                  />
                  {showDesignerSug && filteredDesigners.length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:8, overflow:"hidden", boxShadow:"0 6px 24px rgba(0,0,0,0.5)", marginTop:2 }}>
                      {filteredDesigners.slice(0,5).map(d=>(
                        <div key={d} onClick={()=>{setItemForm(f=>({...f,designedBy:d}));setShowDesignerSug(false);}}
                          style={{ padding:"9px 14px", fontSize:13, color:theme.text, cursor:"pointer", borderBottom:`1px solid ${theme.borderGold}` }}
                          onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}10`}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >{d}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={lbl}>Description / Notes</label>
                  <input style={inp} value={itemForm.desc} onChange={e=>setItemForm(f=>({...f,desc:e.target.value}))} placeholder="Design notes, finish, special details..."/>
                </div>

                {/* Diamonds */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <label style={{ ...lbl, marginBottom:0 }}>Diamonds Used</label>
                    <button
                      onClick={()=>setShowDiamondPicker(v=>!v)}
                      style={{ background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"5px 12px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans'" }}
                    >+ Add Diamond</button>
                  </div>

                  {showDiamondPicker && (
                    <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${theme.borderGold}` }}>
                        <input style={{ ...inp, padding:"7px 12px" }} value={diamondSearch} onChange={e=>setDiamondSearch(e.target.value)} placeholder="Search diamond..." autoFocus/>
                      </div>
                      <div style={{ maxHeight:180, overflowY:"auto" }}>
                        {filteredDiamonds.length === 0
                          ? <div style={{ padding:"14px 16px", fontSize:13, color:theme.textMuted }}>{allDiamonds.length===0?"No diamonds configured yet. Add them in Diamonds section.":"No matching diamonds."}</div>
                          : filteredDiamonds.map(d=>(
                            <div key={d._id} onClick={()=>addDiamondToItem(d)}
                              style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", cursor:"pointer", borderBottom:`1px solid ${theme.borderGold}` }}
                              onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}10`}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                            >
                              <div style={{ width:8, height:8, borderRadius:"50%", background:theme.gold, flexShrink:0 }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, color:theme.text }}>{d.name}</div>
                                <div style={{ fontSize:11, color:theme.textMuted }}>{d.folderName}{d.sizeInMM&&` · ${d.sizeInMM}mm`}{d.weight>0&&` · ${d.weight}ct/pc`}</div>
                              </div>
                              <span style={{ fontSize:11, color:theme.gold }}>+ Add</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {itemForm.diamonds.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {itemForm.diamonds.map(d=>(
                        <div key={d.diamondId} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:9, padding:"10px 14px", display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, color:theme.text }}>{d.diamondName}</div>
                            <div style={{ fontSize:11, color:theme.textMuted }}>{d.folderName}{d.sizeInMM&&` · ${d.sizeInMM}mm`} · {d.weightPerPc}ct/pc</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:11, color:theme.textMuted }}>Pcs:</span>
                            <input type="number" min="1" value={d.pcs} onChange={e=>updateDiamondPcs(d.diamondId,e.target.value)}
                              style={{ width:50, padding:"4px 8px", fontSize:13, background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, borderRadius:6, fontFamily:"'DM Sans'", outline:"none", textAlign:"center" }}/>
                            <span style={{ fontSize:12, color:"#7EC8E3", minWidth:50, textAlign:"right" }}>{d.totalKarats}ct</span>
                          </div>
                          <button onClick={()=>removeDiamondFromItem(d.diamondId)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.danger, fontSize:18, padding:"0 4px" }}>×</button>
                        </div>
                      ))}
                      <div style={{ textAlign:"right", fontSize:12, color:"#7EC8E3" }}>
                        Total: {itemForm.diamonds.reduce((s,d)=>s+d.totalKarats,0).toFixed(4)} ct
                      </div>
                    </div>
                  )}
                </div>

                {/* Save buttons */}
                <div style={{ display:"flex", gap:12, paddingTop:8 }}>
                  <button className="btn-primary" onClick={addItem} style={{ flex:1 }} disabled={saving}>
                    {saving?"Uploading...":"Add Item"}
                  </button>
                  <button className="btn-ghost" onClick={()=>setShowAddItem(false)} disabled={saving}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
