import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../theme";
import { orderAPI, diamondAPI } from "../services/api";
import { Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

// ─── Diamond Dropdown ─────────────────────────────────────────────────────────
const DiamondDropdown = ({ shapes, selected, onToggle, onUpdatePcs }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalSelected = selected.length;

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          background:theme.bg, border:`1px solid ${open ? theme.gold : theme.borderGold}`,
          color: totalSelected > 0 ? theme.text : theme.textMuted,
          padding:"10px 14px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:14,
          cursor:"pointer", transition:"border-color 0.2s",
        }}
      >
        <span>
          {totalSelected === 0
            ? "— Select diamond shapes —"
            : `${totalSelected} shape${totalSelected > 1 ? "s" : ""} selected`}
        </span>
        <svg width="14" height="14" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:50,
          background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:10,
          overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {shapes.length === 0 && (
            <div style={{ padding:"14px 16px", fontSize:13, color:theme.textMuted }}>
              No diamond shapes configured. Add them in Diamond Shapes section.
            </div>
          )}
          {shapes.map(s => {
            const sel = selected.find(x => x.shapeId === s._id);
            return (
              <div key={s._id}
                style={{
                  display:"flex", alignItems:"center", gap:12, padding:"11px 16px",
                  background: sel ? `${theme.gold}0D` : "transparent",
                  borderBottom:`1px solid ${theme.borderGold}`,
                  cursor:"pointer", transition:"background 0.15s",
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => onToggle(s)}
                  style={{
                    width:18, height:18, borderRadius:4, flexShrink:0,
                    border:`2px solid ${sel ? theme.gold : theme.borderGold}`,
                    background: sel ? theme.gold : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s", cursor:"pointer",
                  }}
                >
                  {sel && (
                    <svg width="10" height="10" fill="none" stroke="#0D0B07" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div style={{ flex:1 }} onClick={() => onToggle(s)}>
                  <div style={{ fontSize:13, color:theme.text }}>{s.name}</div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:1 }}>
                    {[s.sizeInMM && `${s.sizeInMM}mm`, s.weight && `${s.weight}ct`].filter(Boolean).join(" · ")}
                  </div>
                </div>

                {/* Pcs input — only when selected */}
                {sel && (
                  <div style={{ display:"flex", alignItems:"center", gap:6 }} onClick={e=>e.stopPropagation()}>
                    <span style={{ fontSize:11, color:theme.textMuted, whiteSpace:"nowrap" }}>Pcs:</span>
                    <input
                      type="number" min="1" value={sel.pcs}
                      onChange={e => onUpdatePcs(s._id, e.target.value)}
                      style={{
                        width:56, padding:"4px 8px", fontSize:13,
                        background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`,
                        color:theme.text, borderRadius:6, fontFamily:"'DM Sans'", outline:"none",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected tags shown below dropdown */}
      {selected.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
          {selected.map(s => (
            <span key={s.shapeId} style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:`#7EC8E315`, border:`1px solid #7EC8E340`, color:"#7EC8E3",
              padding:"3px 10px", borderRadius:20, fontSize:12,
            }}>
              {s.shapeName}{s.pcs > 1 ? ` × ${s.pcs}` : ""}
              <span
                style={{ cursor:"pointer", fontSize:14, lineHeight:1, opacity:0.7 }}
                onClick={() => onToggle({ _id: s.shapeId })}
              >×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const CreateOrder = ({ customers, folders, setOrders }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerId:   "",
    folderIdx:    "",
    itemIdx:      "",
    size:         "",
    notes:        "",
    deliveryDate: "",
    labourCharge: "",
  });

  const [diamondShapes,  setDiamondShapes]  = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  const today           = new Date().toISOString().split("T")[0];
  const defaultDelivery = new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0];

  useEffect(() => {
    diamondAPI.getAll().then(res => setDiamondShapes(res.data.data)).catch(() => {});
  }, []);

  const selCustomer = customers.find(c => c._id === form.customerId);
  const selFolder   = form.folderIdx !== "" ? folders[form.folderIdx] : null;
  const selItem     = selFolder && form.itemIdx !== "" ? selFolder.items[form.itemIdx] : null;

  const itemWeight  = parseFloat(selItem?.weight) || 0;
  const labourRate  = parseFloat(form.labourCharge) || 0;
  const labourTotal = parseFloat((itemWeight * labourRate).toFixed(2));

  const toggleShape = (shape) => {
    setSelectedShapes(prev => {
      const exists = prev.find(s => s.shapeId === shape._id);
      if (exists) return prev.filter(s => s.shapeId !== shape._id);
      // find full shape object
      const full = diamondShapes.find(s => s._id === shape._id) || shape;
      return [...prev, { shapeId:full._id, shapeName:full.name, sizeInMM:full.sizeInMM, weight:full.weight, pcs:1 }];
    });
  };

  const updateShapePcs = (shapeId, pcs) => {
    setSelectedShapes(prev => prev.map(s => s.shapeId === shapeId ? {...s, pcs:parseInt(pcs)||1} : s));
  };

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
      });
      setOrders(p => [res.data.data, ...p]);
      navigate("/bag");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:32 }}>
        <div className="section-title">Create Order</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>Assign jewellery work to a customer</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>

        {/* ── Left ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Customer */}
          <Field label="Customer *">
            <select value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value,folderIdx:"",itemIdx:""})}>
              <option value="">— Select customer —</option>
              {customers.map(c=><option key={c._id} value={c._id}>{c.name} — {c.gold}g · {c.diamonds||0} pcs</option>)}
            </select>
          </Field>

          {selCustomer && (
            <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>CUSTOMER</div>
                <div style={{ fontSize:14 }}>{selCustomer.name}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>GOLD</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{selCustomer.gold}g</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>DIAMONDS</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#7EC8E3" }}>{selCustomer.diamonds||0} pcs</div>
              </div>
            </div>
          )}

          {/* Folder */}
          <Field label="Product Folder *">
            <select value={form.folderIdx} onChange={e=>setForm({...form,folderIdx:e.target.value,itemIdx:""})}>
              <option value="">— Select folder —</option>
              {folders.map((f,i)=><option key={i} value={i}>{f.name} ({f.items.length} items)</option>)}
            </select>
          </Field>

          {/* Item */}
          {selFolder && (
            <Field label={`Item from ${selFolder.name} *`}>
              <select value={form.itemIdx} onChange={e=>setForm({...form,itemIdx:e.target.value})}>
                <option value="">— Select item —</option>
                {selFolder.items.map((it,i)=>(
                  <option key={i} value={i}>[{it.itemNumber}] {it.name}{it.weight?` — ${it.weight}g`:""}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Labour */}
          {selItem && (
            <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:14 }}>LABOUR CALCULATION</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, alignItems:"end", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>ITEM WEIGHT</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.gold }}>{itemWeight}g</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>RATE / GRAM (₹)</div>
                  <input type="number" min="0" value={form.labourCharge} onChange={e=>setForm({...form,labourCharge:e.target.value})} placeholder="e.g. 100" style={{ padding:"8px 12px" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>TOTAL LABOUR</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.success }}>₹{labourTotal.toLocaleString()}</div>
                </div>
              </div>
              {labourRate > 0 && (
                <div style={{ fontSize:12, color:theme.textMuted }}>
                  {itemWeight}g × ₹{labourRate} = <strong style={{ color:theme.success }}>₹{labourTotal.toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}

          {/* Diamond Shapes — compact dropdown */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, letterSpacing:0.6, textTransform:"uppercase", marginBottom:8 }}>
              Diamond Shapes (optional)
            </div>
            <DiamondDropdown
              shapes={diamondShapes}
              selected={selectedShapes}
              onToggle={toggleShape}
              onUpdatePcs={updateShapePcs}
            />
          </div>

          {/* Size & Notes */}
          <Field label="Size (optional)">
            <input value={form.size} onChange={e=>setForm({...form,size:e.target.value})} placeholder="e.g. 16, Medium..."/>
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Special instructions..."/>
          </Field>

          {/* Dates */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <div style={{ fontSize:11, color:theme.textMuted, letterSpacing:0.6, textTransform:"uppercase", marginBottom:6 }}>Order Date</div>
              <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:8, padding:"10px 14px", fontSize:14, color:theme.textMuted, display:"flex", alignItems:"center", gap:8 }}>
                <Icon name="calendar" size={14} color={theme.textMuted}/> {fmt(today)} (auto)
              </div>
            </div>
            <Field label="Delivery Date (default: +7 days)">
              <input type="date" value={form.deliveryDate} min={today} onChange={e=>setForm({...form,deliveryDate:e.target.value})} style={{ colorScheme:"dark" }}/>
            </Field>
          </div>

          {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}

          <button className="btn-primary" onClick={create} disabled={saving||!selCustomer||!selItem} style={{ padding:14, fontSize:15 }}>
            {saving ? "Creating..." : "Create Order & Start Workflow →"}
          </button>
        </div>

        {/* ── Right: Preview ── */}
        <div style={{ position:"sticky", top:36 }}>
          <div style={{ fontSize:11, color:theme.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Order Preview</div>

          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${theme.borderGold}`, background:theme.surface, marginBottom:16 }}>
            {selItem?.image
              ? <img src={selItem.image} alt="" style={{ width:"100%", height:200, objectFit:"cover" }}/>
              : <div style={{ width:"100%", height:180, background:theme.surfaceAlt, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <Icon name="image" size={36} color={theme.borderGold}/>
                  <span style={{ fontSize:12, color:theme.borderGold }}>No item selected</span>
                </div>
            }
            {selItem && (
              <div style={{ padding:"14px 20px" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>{selItem.name}</div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>[{selItem.itemNumber}] · {selFolder?.name}</div>
              </div>
            )}
          </div>

          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            {[
              ["Bag ID",        "Auto-generated",                                    theme.textMuted],
              selCustomer && ["Customer",     selCustomer.name,                      theme.text],
              selItem     && ["Item No.",     selItem.itemNumber || "—",             theme.gold],
              selItem     && ["Item Weight",  `${itemWeight}g`,                      theme.gold],
              labourTotal > 0 && ["Labour Total", `₹${labourTotal.toLocaleString()}`,theme.success],
              selectedShapes.length > 0 && ["Diamonds", selectedShapes.map(s=>`${s.shapeName}${s.pcs>1?` ×${s.pcs}`:""}`).join(", "), "#7EC8E3"],
              ["Order Date",    fmt(today),                                           theme.textMuted],
              ["Delivery Date", form.deliveryDate ? fmt(form.deliveryDate) : `${fmt(defaultDelivery)} (default)`, theme.textMuted],
            ].filter(Boolean).map(([label,val,color]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <span style={{ fontSize:12, color:theme.textMuted, flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:13, color, textAlign:"right" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
