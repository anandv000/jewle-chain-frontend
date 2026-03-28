import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../theme";
import { orderAPI } from "../services/api";
import { Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

// ═══════════════════════════════════════════════════════════════════════════════
//  SEARCHABLE SELECT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const SearchSelect = ({ options, value, onChange, placeholder, getLabel, getValue, disabled }) => {
  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected  = options.find(o => getValue(o) === value);
  const displayed = open ? query : (selected ? getLabel(selected) : "");
  const filtered  = options.filter(o => getLabel(o).toLowerCase().includes(query.toLowerCase()));

  const inp = {
    width:"100%", background:theme.bg, border:`1px solid ${open ? theme.gold : theme.borderGold}`,
    color: selected && !open ? theme.text : theme.textMuted,
    padding:"10px 14px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:14,
    outline:"none", cursor: disabled ? "not-allowed" : "text", transition:"border-color 0.2s",
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input
        value={displayed}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (!disabled) { setQuery(""); setOpen(true); } }}
        placeholder={placeholder}
        style={inp}
        readOnly={disabled}
      />
      {/* Down arrow */}
      <div style={{ position:"absolute", right:12, top:"50%", transform:`translateY(-50%) ${open?"rotate(180deg)":""}`, transition:"transform 0.2s", pointerEvents:"none" }}>
        <svg width="13" height="13" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </div>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:100, background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:10, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxHeight:220, overflowY:"auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"12px 16px", fontSize:13, color:theme.textMuted }}>No results for "{query}"</div>
          ) : (
            filtered.map(o => (
              <div
                key={getValue(o)}
                onClick={() => { onChange(getValue(o)); setOpen(false); setQuery(""); }}
                style={{ padding:"10px 16px", fontSize:13, color: getValue(o)===value ? theme.gold : theme.text, background: getValue(o)===value ? `${theme.gold}10` : "transparent", cursor:"pointer", borderBottom:`1px solid ${theme.borderGold}`, transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.gold}15`}
                onMouseLeave={e => e.currentTarget.style.background = getValue(o)===value ? `${theme.gold}10` : "transparent"}
              >{getLabel(o)}</div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
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
  });

  const [selectedShapes, setSelectedShapes] = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  const today           = new Date().toISOString().split("T")[0];
  const defaultDelivery = new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0];

  const selCustomer = customers.find(c => c._id === form.customerId);
  const selFolder   = form.folderIdx !== "" ? folders[form.folderIdx] : null;
  const selItem     = selFolder && form.itemIdx !== "" ? selFolder.items[form.itemIdx] : null;

  const itemWeight  = parseFloat(selItem?.weight) || 0;
  const labourRate  = parseFloat(form.labourCharge) || 0;
  const labourTotal = parseFloat((itemWeight * labourRate).toFixed(2));

  // ── Auto-fill diamonds when item changes ───────────────────────────────────
  useEffect(() => {
    if (!selItem) { setSelectedShapes([]); return; }
    if (selItem.diamonds && selItem.diamonds.length > 0) {
      // Auto-populate from item's stored diamond data
      setSelectedShapes(selItem.diamonds.map(d => ({
        shapeId:     d.diamondId || "",
        shapeName:   d.diamondName,
        sizeInMM:    d.sizeInMM  || "",
        weight:      d.weightPerPc || 0,
        pcs:         d.pcs || 1,
        totalKarats: d.totalKarats || 0,
      })));
    } else {
      setSelectedShapes([]);
    }
  }, [form.itemIdx, form.folderIdx]);

  // Reset item when folder changes
  useEffect(() => {
    setForm(f => ({ ...f, itemIdx: "" }));
    setSelectedShapes([]);
  }, [form.folderIdx]);

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

  // Prepare item options (include item number + name + weight)
  const itemOptions = selFolder
    ? selFolder.items.map((it, i) => ({ value: String(i), label: `[${it.itemNumber}] ${it.name}${it.weight ? ` — ${it.weight}g` : ""}` }))
    : [];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:32 }}>
        <div className="section-title">Create Order</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>Assign jewellery work to a customer</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>

        {/* ── Left ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Customer — searchable */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Customer *</div>
            <SearchSelect
              options={customers}
              value={form.customerId}
              onChange={val => setForm(f => ({ ...f, customerId:val, folderIdx:"", itemIdx:"" }))}
              placeholder={`— Search from ${customers.length} customers —`}
              getLabel={c => `${c.name}${c.company ? ` (${c.company})` : ""} · ${c.gold}g`}
              getValue={c => c._id}
            />
          </div>

          {/* Customer summary */}
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

          {/* Product Folder — searchable */}
          <div>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Product Folder *</div>
            <SearchSelect
              options={folders.map((f,i) => ({ value:String(i), label:`${f.name} (${f.items.length} items)` }))}
              value={form.folderIdx}
              onChange={val => setForm(f => ({ ...f, folderIdx:val, itemIdx:"" }))}
              placeholder="— Search folders —"
              getLabel={o => o.label}
              getValue={o => o.value}
            />
          </div>

          {/* Item — searchable */}
          {selFolder && (
            <div>
              <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Item from {selFolder.name} *</div>
              <SearchSelect
                options={itemOptions}
                value={form.itemIdx}
                onChange={val => setForm(f => ({ ...f, itemIdx:val }))}
                placeholder={`— Search from ${itemOptions.length} items —`}
                getLabel={o => o.label}
                getValue={o => o.value}
              />
            </div>
          )}

          {/* Labour calculation */}
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
                  <input type="number" min="0" value={form.labourCharge} onChange={e=>setForm(f=>({...f,labourCharge:e.target.value}))} placeholder="e.g. 100" style={{ padding:"8px 12px", width:"100%" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginBottom:6 }}>TOTAL LABOUR</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.success }}>₹{labourTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Diamond section — auto-populated from item */}
          {selItem && (
            <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>DIAMONDS</span>
                {selectedShapes.length > 0 && selItem?.diamonds?.length > 0 && (
                  <span style={{ fontSize:11, color:theme.success, background:`${theme.success}15`, padding:"2px 8px", borderRadius:20 }}>✓ Auto-filled from item</span>
                )}
              </div>
              {selectedShapes.length === 0 ? (
                <div style={{ fontSize:13, color:theme.textMuted }}>No diamonds configured for this item.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selectedShapes.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:theme.bg, border:`1px solid ${theme.borderGold}`, borderRadius:8, padding:"9px 13px" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:theme.text }}>{s.shapeName}</div>
                        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                          {s.sizeInMM && `${s.sizeInMM}mm · `}{s.weight}ct/pc
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:"#7EC8E3" }}>{s.pcs} pcs</span>
                      <span style={{ fontSize:12, color:"#7EC8E3", minWidth:56, textAlign:"right" }}>
                        {s.totalKarats || parseFloat((s.pcs * s.weight).toFixed(4))} ct
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize:12, color:"#7EC8E3", textAlign:"right" }}>
                    Total: {selectedShapes.reduce((s, d) => s + (d.totalKarats || d.pcs * d.weight), 0).toFixed(4)} ct
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Item details if available */}
          {selItem && (selItem.purity || selItem.tone || selItem.gender || selItem.designedBy) && (
            <div style={{ background:`${theme.gold}08`, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:14, display:"flex", flexWrap:"wrap", gap:16 }}>
              {selItem.purity    && <div><div style={{ fontSize:10, color:theme.textMuted }}>PURITY</div><div style={{ fontSize:13 }}>{selItem.purity}</div></div>}
              {selItem.tone      && <div><div style={{ fontSize:10, color:theme.textMuted }}>TONE</div><div style={{ fontSize:13 }}>{selItem.tone}</div></div>}
              {selItem.gender    && <div><div style={{ fontSize:10, color:theme.textMuted }}>GENDER</div><div style={{ fontSize:13 }}>{selItem.gender}</div></div>}
              {selItem.designedBy && <div><div style={{ fontSize:10, color:theme.textMuted }}>DESIGNED BY</div><div style={{ fontSize:13 }}>{selItem.designedBy}</div></div>}
              {selItem.netWeight > 0 && <div><div style={{ fontSize:10, color:theme.textMuted }}>NET WEIGHT</div><div style={{ fontSize:13, color:theme.gold }}>{selItem.netWeight}g</div></div>}
            </div>
          )}

          {/* Size & Notes */}
          <Field label="Size (optional)">
            <input value={form.size} onChange={e=>setForm(f=>({...f,size:e.target.value}))} placeholder="e.g. 16, Medium..."/>
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Special instructions..."/>
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
              <input type="date" value={form.deliveryDate} min={today} onChange={e=>setForm(f=>({...f,deliveryDate:e.target.value}))} style={{ colorScheme:"dark" }}/>
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
            {selItem?.image ? (
              <div style={{ width:"100%", height:220, background:theme.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <img src={selItem.image} alt="" style={{ maxWidth:"100%", maxHeight:220, objectFit:"contain" }}/>
              </div>
            ) : (
              <div style={{ width:"100%", height:180, background:theme.surfaceAlt, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                <Icon name="image" size={36} color={theme.borderGold}/>
                <span style={{ fontSize:12, color:theme.borderGold }}>No item selected</span>
              </div>
            )}
            {selItem && (
              <div style={{ padding:"14px 20px" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>{selItem.name}</div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>[{selItem.itemNumber}] · {selFolder?.name}</div>
              </div>
            )}
          </div>

          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            {[
              ["Bag ID",      "Auto-generated",                                  theme.textMuted],
              selCustomer && ["Customer",     selCustomer.name,                  theme.text],
              selItem     && ["Item No.",     selItem.itemNumber || "—",         theme.gold],
              selItem     && ["Item Weight",  `${itemWeight}g`,                  theme.gold],
              selItem?.purity && ["Purity",   selItem.purity,                    theme.textMuted],
              selItem?.gender && ["Gender",   selItem.gender,                    theme.textMuted],
              labourTotal > 0 && ["Labour Total", `₹${labourTotal.toLocaleString()}`, theme.success],
              selectedShapes.length > 0 && ["Diamonds",
                selectedShapes.map(s => `${s.shapeName} ×${s.pcs}`).join(", "), "#7EC8E3"],
              ["Order Date",    fmt(today),                                       theme.textMuted],
              ["Delivery Date", form.deliveryDate ? fmt(form.deliveryDate) : `${fmt(defaultDelivery)} (default)`, theme.textMuted],
            ].filter(Boolean).map(([label, val, color]) => (
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
