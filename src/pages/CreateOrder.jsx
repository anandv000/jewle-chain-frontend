import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { orderAPI, diamondFolderAPI } from "../services/api";
import { Field } from "../components/Modal";
import Icon from "../components/Icon";
import { useNavigate } from "react-router-dom";

// ── Searchable dropdown ────────────────────────────────────────────────────────
const SearchableDropdown = ({ options, value, onChange, getLabel, getValue, placeholder }) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => getLabel(o).toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => getValue(o) === value);
  return (
    <div style={{ position:"relative" }}>
      <div onClick={()=>setOpen(v=>!v)} style={{ width:"100%", background:theme.bg, border:`1px solid ${open?theme.gold:theme.borderGold}`, color:theme.text, padding:"9px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:selected?theme.text:theme.textMuted }}>{selected?getLabel(selected):placeholder}</span>
        <Icon name="chevron" size={13} color={theme.textMuted}/>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:100, background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:10, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxHeight:220, overflowY:"auto" }}>
          <div style={{ padding:"8px 10px", borderBottom:`1px solid ${theme.borderGold}` }}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{ width:"100%", background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"6px 10px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:12, outline:"none" }}/>
          </div>
          {filtered.length === 0 && <div style={{ padding:"12px 16px", fontSize:13, color:theme.textMuted }}>No results</div>}
          {filtered.map(o => (
            <div key={getValue(o)} onClick={()=>{ onChange(getValue(o)); setOpen(false); setSearch(""); }}
              style={{ padding:"10px 16px", fontSize:13, color:getValue(o)===value?theme.gold:theme.text, background:getValue(o)===value?`${theme.gold}10`:"transparent", cursor:"pointer", borderBottom:`1px solid ${theme.borderGold}`, transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}15`}
              onMouseLeave={e=>e.currentTarget.style.background=getValue(o)===value?`${theme.gold}10`:"transparent"}
            >{getLabel(o)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const CreateOrder = ({ customers, folders, orders, setOrders, diamondFolders = [] }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerId:   "",
    folderIdx:    "",
    itemIdx:      "",
    size:         "",
    notes:        "",
    deliveryDate: "",
    labourCharge: "",
    metalType:    "gold",   // ← NEW: "gold" | "silver"
  });

  const [selectedShapes, setSelectedShapes] = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  // Flatten all diamonds from diamondFolders
  const allDiamonds = (diamondFolders || []).flatMap(f => (f.diamonds || []).map(d => ({ ...d, folderName:f.name })));

  const selCustomer = customers.find(c => c._id === form.customerId);
  const selFolder   = form.folderIdx !== "" ? folders[form.folderIdx] : null;
  const selItem     = selFolder && form.itemIdx !== "" ? selFolder.items[form.itemIdx] : null;

  const itemWeight  = parseFloat(selItem?.weight) || 0;
  const labourRate  = parseFloat(form.labourCharge) || 0;
  const labourTotal = parseFloat((itemWeight * labourRate).toFixed(2));

  // Auto-suggest diamond shapes from selected item
  useEffect(() => {
    if (selItem?.diamonds?.length > 0 && selectedShapes.length === 0) {
      const shapes = selItem.diamonds.map(d => ({
        shapeId:   d.shapeId   || d._id || "",
        shapeName: d.shapeName || d.name || "",
        sizeInMM:  d.sizeInMM  || "",
        weight:    d.weight    || 0,
        pcs:       d.pcs       || 1,
      }));
      setSelectedShapes(shapes);
    }
    // eslint-disable-next-line
  }, [selItem]);

  const toggleShape = (diamond) => {
    setSelectedShapes(prev => {
      const exists = prev.find(s => s.shapeId === diamond._id);
      if (exists) return prev.filter(s => s.shapeId !== diamond._id);
      return [...prev, { shapeId:diamond._id, shapeName:diamond.name, sizeInMM:diamond.sizeInMM||"", weight:diamond.weight||0, pcs:1 }];
    });
  };

  const updateShapePcs = (shapeId, pcs) => {
    setSelectedShapes(prev => prev.map(s => s.shapeId===shapeId ? {...s, pcs:parseInt(pcs)||1} : s));
  };

  // Metal balance for selected customer
  const metalBalance = selCustomer
    ? (form.metalType === "silver" ? (selCustomer.silver||0) : (selCustomer.gold||0))
    : null;
  const metalColor   = form.metalType === "silver" ? "#C0C0C0" : theme.gold;
  const metalLabel   = form.metalType === "silver" ? "Silver" : "Gold";
  const willUseOwner = metalBalance !== null && metalBalance <= 0;

  const create = async () => {
    if (!selCustomer) { setError("Please select a customer."); return; }
    if (!selFolder)   { setError("Please select a product folder."); return; }
    if (!selItem)     { setError("Please select an item."); return; }
    setSaving(true); setError("");
    try {
      const res = await orderAPI.create({
        customerId:    selCustomer._id,
        folder:        selFolder.name,
        item:          selItem.name,
        itemNumber:    selItem.itemNumber || "",
        itemWeight,
        itemImage:     selItem.image || null,
        diamondShapes: selectedShapes,
        labourCharge:  labourRate,
        deliveryDate:  form.deliveryDate || null,
        size:          form.size,
        notes:         form.notes,
        metalType:     form.metalType,   // ← NEW
      });
      setOrders(p => [res.data.data, ...p]);
      navigate("/bag");
    } catch (err) { setError(err.response?.data?.error || "Failed to create order."); }
    finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"9px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, outline:"none", width:"100%" };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:32 }}>
        <div className="section-title">Create Order</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>Assign jewellery work to a customer</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>

        {/* ── LEFT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Customer */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Customer *</div>
            <SearchableDropdown
              options={customers}
              value={form.customerId}
              onChange={v=>setForm({...form, customerId:v, folderIdx:"", itemIdx:""})}
              getLabel={c=>`${c.name}${c.company?` (${c.company})`:""} · G:${c.gold}g S:${c.silver||0}g`}
              getValue={c=>c._id}
              placeholder="— Select customer —"
            />
          </div>

          {/* Customer balance card */}
          {selCustomer && (
            <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
              <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>CUSTOMER</div><div style={{ fontSize:13 }}>{selCustomer.name}</div></div>
              <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>GOLD</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{selCustomer.gold}g</div></div>
              <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>SILVER</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#C0C0C0" }}>{selCustomer.silver||0}g</div></div>
              <div><div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>DIAMONDS</div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>{selCustomer.diamonds||0} pcs</div></div>
            </div>
          )}

          {/* ── Metal Type Selector (NEW) ── */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Metal Type *</div>
            <div style={{ display:"flex", gap:10 }}>
              {[["gold","✦ Gold",theme.gold],["silver","◆ Silver","#C0C0C0"]].map(([val,lbl,col])=>(
                <button key={val} onClick={()=>setForm({...form,metalType:val})}
                  style={{ flex:1, padding:"12px 16px", borderRadius:10, border:`2px solid ${form.metalType===val?col:theme.borderGold}`, background:form.metalType===val?`${col}15`:"transparent", color:form.metalType===val?col:theme.textMuted, fontFamily:"'DM Sans'", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
                  {lbl}
                </button>
              ))}
            </div>
            {/* Owner gold warning */}
            {selCustomer && willUseOwner && (
              <div style={{ marginTop:10, background:"#7B5EA712", border:"1px solid #7B5EA750", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#B39DDB" }}>
                ✦ Customer has 0 {metalLabel.toLowerCase()} — <strong>Owner's {metalLabel} (Lariot Jweles)</strong> will be used at casting step.
              </div>
            )}
            {selCustomer && !willUseOwner && metalBalance !== null && metalBalance > 0 && (
              <div style={{ marginTop:10, background:`${metalColor}0A`, border:`1px solid ${metalColor}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:metalColor }}>
                {metalLabel} balance: <strong>{metalBalance.toFixed(3)}g</strong> available for this order.
              </div>
            )}
          </div>

          {/* Folder */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Product Folder *</div>
            <SearchableDropdown
              options={folders}
              value={form.folderIdx !== "" ? String(form.folderIdx) : ""}
              onChange={v=>setForm({...form,folderIdx:v,itemIdx:""})}
              getLabel={f=>f.name}
              getValue={(_,i)=>String(folders.indexOf(_))}
              placeholder="— Select folder —"
            />
          </div>

          {/* Item */}
          {selFolder && (
            <div>
              <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Item *</div>
              <SearchableDropdown
                options={selFolder.items}
                value={form.itemIdx !== "" ? String(form.itemIdx) : ""}
                onChange={v=>{ setForm({...form,itemIdx:v}); setSelectedShapes([]); }}
                getLabel={it=>`${it.name}${it.itemNumber?` (${it.itemNumber})`:""}`}
                getValue={(_,i)=>String(selFolder.items.indexOf(_))}
                placeholder="— Select item —"
              />
            </div>
          )}

          {/* Item details */}
          {selItem && (
            <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                {selItem.image && (
                  <img src={selItem.image} alt="" style={{ width:80, height:80, objectFit:"contain", borderRadius:8, border:`1px solid ${theme.borderGold}`, background:theme.bg, padding:4, flexShrink:0 }}/>
                )}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 24px" }}>
                  {[
                    selItem     && ["Item No.",   selItem.itemNumber || "—",         theme.gold],
                    itemWeight  && ["Gross Wt",   `${itemWeight}g`,                  theme.textMuted],
                    selItem?.netWeight && ["Net Wt", `${selItem.netWeight}g`,        theme.gold],
                    selItem?.purity    && ["Purity",  selItem.purity,                theme.textMuted],
                    selItem?.tone      && ["Tone",    selItem.tone,                  theme.textMuted],
                  ].filter(Boolean).map(([l,v,c])=>(
                    <div key={l}><div style={{ fontSize:10, color:theme.textMuted }}>{l}</div><div style={{ fontSize:13, color:c }}>{v}</div></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Labour */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Labour Charge (₹/gram)</div>
            <input style={inp} type="number" value={form.labourCharge} onChange={e=>setForm({...form,labourCharge:e.target.value})} placeholder="e.g. 500" min="0"/>
            {labourTotal > 0 && (
              <div style={{ marginTop:8, fontSize:13, color:theme.gold }}>
                Labour Total: ₹{labourTotal.toLocaleString("en-IN")} ({itemWeight}g × ₹{labourRate}/g)
              </div>
            )}
          </div>

          {/* Size + Delivery */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Size</div>
              <input style={inp} value={form.size} onChange={e=>setForm({...form,size:e.target.value})} placeholder="e.g. 16, M, Free"/>
            </div>
            <div>
              <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Delivery Date</div>
              <input style={{ ...inp, colorScheme:"dark" }} type="date" value={form.deliveryDate} onChange={e=>setForm({...form,deliveryDate:e.target.value})}/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Notes</div>
            <textarea style={{ ...inp, height:72, resize:"vertical" }} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Special instructions..."/>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Item preview */}
          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${theme.borderGold}`, background:theme.surface, marginBottom:0 }}>
            <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", background:theme.surfaceAlt }}>
              {selItem?.image
                ? <img src={selItem.image} alt="" style={{ maxHeight:"100%", maxWidth:"100%", objectFit:"contain", padding:16 }}/>
                : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:theme.textMuted }}>
                    <Icon name="image" size={36} color={theme.borderGold}/>
                    <span style={{ fontSize:12 }}>No item selected</span>
                  </div>
              }
            </div>
          </div>

          {/* Summary card */}
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:12, color:theme.gold, fontWeight:600, marginBottom:4 }}>Order Summary</div>
            {[
              selCustomer && ["Customer",    selCustomer.name,              theme.text],
              form.metalType && ["Metal",    form.metalType === "silver" ? "◆ Silver" : "✦ Gold", metalColor],
              selFolder   && ["Folder",     selFolder.name,                 theme.textMuted],
              selItem     && ["Item",        selItem.name,                  theme.text],
              selItem     && ["Item No.",    selItem.itemNumber || "—",      theme.gold],
              itemWeight  && ["Gross Wt",   `${itemWeight}g`,               theme.textMuted],
              labourTotal && ["Labour",     `₹${labourTotal.toLocaleString("en-IN")}`, theme.success],
              form.size   && ["Size",        form.size,                     theme.textMuted],
            ].filter(Boolean).map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${theme.borderGold}` }}>
                <span style={{ fontSize:12, color:theme.textMuted }}>{l}</span>
                <span style={{ fontSize:13, color:c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Diamond shapes */}
          {allDiamonds.length > 0 && (
            <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:12, color:theme.gold, fontWeight:600, marginBottom:12 }}>Add Diamond Shapes</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:200, overflowY:"auto" }}>
                {allDiamonds.map(d => {
                  const sel = selectedShapes.find(s => s.shapeId === d._id);
                  return (
                    <div key={d._id} style={{ display:"flex", alignItems:"center", gap:12, background:sel?`${theme.gold}08`:theme.surfaceAlt, border:`1px solid ${sel?theme.gold:theme.borderGold}`, borderRadius:8, padding:"9px 13px", transition:"all 0.2s" }}>
                      <div style={{ flex:1, cursor:"pointer" }} onClick={()=>toggleShape(d)}>
                        <div style={{ fontSize:13, color:sel?theme.gold:theme.text }}>{d.name}</div>
                        <div style={{ fontSize:11, color:theme.textMuted }}>{d.sizeInMM&&`${d.sizeInMM}mm · `}{d.weight}ct/pc</div>
                      </div>
                      {sel && (
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:11, color:theme.textMuted }}>Pcs:</span>
                          <input type="number" min="1" value={sel.pcs} onChange={e=>updateShapePcs(d._id, e.target.value)}
                            style={{ width:52, background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"4px 8px", borderRadius:6, fontFamily:"'DM Sans'", fontSize:12, textAlign:"center", outline:"none" }}
                            onClick={e=>e.stopPropagation()}/>
                        </div>
                      )}
                      <button onClick={()=>toggleShape(d)} style={{ background:sel?`${theme.gold}20`:"transparent", border:`1px solid ${sel?theme.gold:theme.borderGold}`, color:sel?theme.gold:theme.textMuted, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {sel ? "✓" : "+"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {selectedShapes.length > 0 && (
                <div style={{ marginTop:12, padding:"10px 14px", background:`#7EC8E310`, border:"1px solid #7EC8E340", borderRadius:8, fontSize:12, color:"#7EC8E3" }}>
                  Selected: {selectedShapes.map(s=>`${s.shapeName} ×${s.pcs}`).join(", ")}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"12px 16px", borderRadius:8 }}>⚠ {error}</div>}

          {/* Submit */}
          <button
            onClick={create}
            disabled={saving || !selCustomer || !selFolder || !selItem}
            style={{ padding:16, background:saving||!selCustomer||!selFolder||!selItem?"#2a2210":`linear-gradient(135deg,#9A7A2E,#C9A84C)`, color:saving||!selCustomer||!selFolder||!selItem?theme.textMuted:"#0D0B07", border:"none", borderRadius:12, fontFamily:"'DM Sans'", fontWeight:700, fontSize:15, cursor:saving||!selCustomer||!selFolder||!selItem?"not-allowed":"pointer", transition:"all 0.2s" }}
          >
            {saving ? "Creating Order..." : `✦ Create ${form.metalType === "silver" ? "Silver" : "Gold"} Order →`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
