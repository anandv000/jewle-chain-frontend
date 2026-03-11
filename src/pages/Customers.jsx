import React, { useState } from "react";
import { theme } from "../theme";
import { customerAPI, goldEntryAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const emptyCustomer = { name:"", company:"", phone:"", gold:"", goldCarats:"", diamonds:"" };
const emptyItem     = { item:"", shape:"", quality:"", accessories:"", size:"", description:"", pieces:"", weight:"", pureWt:"" };

// ─── Receipt Preview Modal ────────────────────────────────────────────────────
const ReceiptModal = ({ entry, onClose }) => {
  if (!entry) return null;
  const dateStr = fmt(entry.date);
  const pdfUrl  = `https://jewle-chain-frontend.vercel.app/${entry._id}`;
  const tdStyle = { border:"1px solid #ccc", padding:"5px 4px", textAlign:"center", fontSize:10 };
  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:12, width:"92vw", maxWidth:820, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
        {/* Top bar */}
        <div style={{ background:"#1C1710", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"12px 12px 0 0" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#C9A84C" }}>Receipt — {entry.receiptNo}</span>
          <div style={{ display:"flex", gap:10 }}>
            <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ background:"#C9A84C", color:"#0D0B07", padding:"7px 16px", borderRadius:7, fontSize:13, textDecoration:"none", fontWeight:500 }}>⬇ Download PDF</a>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#8A7A5A", cursor:"pointer", fontSize:20 }}>✕</button>
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding:28, fontFamily:"Arial, sans-serif", fontSize:11, color:"#000" }}>
          {/* Header */}
          <table style={{ width:"100%", borderCollapse:"collapse", border:"2px solid #000", marginBottom:0 }}>
            <tbody>
              <tr>
                <td style={{ padding:"10px 14px", width:"35%", borderRight:"1px solid #ccc" }}>
                  <div style={{ fontWeight:"bold", fontSize:16 }}>ATELIER GOLD</div>
                  <div style={{ fontSize:10, marginTop:6 }}>From</div>
                  <div style={{ fontWeight:"bold", fontSize:13, marginTop:2 }}>{(entry.customerName||"").toUpperCase()}</div>
                </td>
                <td style={{ padding:"10px", textAlign:"center", width:"30%", borderRight:"1px solid #ccc" }}>
                  <div style={{ fontWeight:"bold", fontSize:14, color:"#9A7A2E" }}>✦</div>
                  <div style={{ fontWeight:"bold", fontSize:12, marginTop:4 }}>ATELIER GOLD</div>
                </td>
                <td style={{ padding:"10px 14px", width:"35%", textAlign:"right" }}>
                  <div style={{ fontWeight:"bold", fontSize:13 }}>Party Receive Gold</div>
                  <table style={{ marginLeft:"auto", marginTop:8, fontSize:11 }}><tbody>
                    <tr><td style={{ fontWeight:"bold", paddingRight:6 }}>NO</td><td>: {entry.receiptNo}</td></tr>
                    <tr><td style={{ fontWeight:"bold" }}>DATE</td><td>: {dateStr}</td></tr>
                    <tr><td style={{ fontWeight:"bold" }}>Party Voucher No</td><td>: {entry.partyVoucherNo||""}</td></tr>
                  </tbody></table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items table */}
          <table style={{ width:"100%", borderCollapse:"collapse", border:"1px solid #000", marginTop:0 }}>
            <thead>
              <tr style={{ background:"#f0f0f0" }}>
                {["Sr.","Item","Shape","Quality","Accessories","Size","Description","Pieces","Weight","Pure Wt"].map(h=>(
                  <th key={h} style={{ border:"1px solid #000", padding:"6px 4px", textAlign:"center", fontWeight:"bold", fontSize:10, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(entry.items||[]).map((it,i)=>(
                <tr key={i}>
                  <td style={tdStyle}>{i+1}</td>
                  <td style={tdStyle}>{it.item}</td>
                  <td style={tdStyle}>{it.shape}</td>
                  <td style={tdStyle}>{it.quality}</td>
                  <td style={tdStyle}>{it.accessories}</td>
                  <td style={tdStyle}>{it.size}</td>
                  <td style={tdStyle}>{it.description}</td>
                  <td style={tdStyle}>{it.pieces||""}</td>
                  <td style={tdStyle}>{it.weight ? Number(it.weight).toFixed(3) : ""}</td>
                  <td style={tdStyle}>{it.pureWt ? Number(it.pureWt).toFixed(3) : ""}</td>
                </tr>
              ))}
              <tr style={{ background:"#f9f9f9", fontWeight:"bold" }}>
                <td colSpan={6} style={tdStyle}><b>Page 1 of 1</b></td>
                <td style={{ ...tdStyle, textAlign:"right" }}><b>Total</b></td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, fontWeight:"bold" }}>{(entry.totalWeight||0).toFixed(3)}</td>
                <td style={{ ...tdStyle, fontWeight:"bold" }}>{(entry.totalPureWt||0).toFixed(3)}</td>
              </tr>
            </tbody>
          </table>

          {/* Grand total */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginTop:20 }}>
            <tbody>
              <tr>
                <td colSpan={7} style={{ ...tdStyle, border:"1px solid #000", textAlign:"right", padding:"7px 8px", fontWeight:"bold" }}>Grand Total</td>
                <td style={{ ...tdStyle, border:"1px solid #000" }}></td>
                <td style={{ ...tdStyle, border:"1px solid #000", fontWeight:"bold" }}>{(entry.totalWeight||0).toFixed(3)}</td>
                <td style={{ ...tdStyle, border:"1px solid #000", fontWeight:"bold" }}>{(entry.totalPureWt||0).toFixed(3)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop:10 }}>Remark : {entry.remark||""}</div>

          <div style={{ marginTop:24, textAlign:"center", fontSize:9, color:"#444" }}>
            <div>NOTE : WEIGHT FOR METALS ARE IN GRAMS &amp; GEMS ARE IN CARAT.</div>
            <div>All Rights Reserved by ATELIER GOLD for any error or mistake while making data entry.</div>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:40 }}>
            <div>
              <div style={{ borderTop:"1px solid #000", width:120, marginBottom:4 }}></div>
              <b>Sign</b>
            </div>
            <div style={{ textAlign:"right" }}>
              <b style={{ color:"#9A7A2E" }}>FOR ATELIER GOLD</b><br/>
              <div style={{ marginTop:30, borderTop:"1px solid #000", width:160, marginLeft:"auto", marginBottom:4 }}></div>
              <b>For, ATELIER GOLD</b><br/>
              <span style={{ fontSize:9 }}>PROPRIETOR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Add Gold Entry Modal ─────────────────────────────────────────────────────
const AddGoldModal = ({ customer, onClose, onSaved }) => {
  const [rows,          setRows]          = useState([{ ...emptyItem }]);
  const [partyVoucherNo,setPartyVoucherNo]= useState("");
  const [remark,        setRemark]        = useState("");
  const [date,          setDate]          = useState(new Date().toISOString().split("T")[0]);
  const [sending,       setSending]       = useState(false);
  const [sendWA,        setSendWA]        = useState(true);
  const [error,         setError]         = useState("");

  const addRow    = () => setRows(r => [...r, { ...emptyItem }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(r => r.filter((_,idx)=>idx!==i)); };
  const updateRow = (i, field, val) => setRows(r => r.map((row,idx) => idx===i ? {...row,[field]:val} : row));

  const totalWeight = rows.reduce((s,r) => s+(parseFloat(r.weight)||0), 0);
  const totalPureWt = rows.reduce((s,r) => s+(parseFloat(r.pureWt)||0), 0);

  const submit = async () => {
    if (rows.every(r => !r.weight)) { setError("Please enter weight for at least one item."); return; }
    setSending(true); setError("");
    try {
      const res = await goldEntryAPI.create({
        customerId:    customer._id,
        partyVoucherNo,
        date,
        items: rows.map(r => ({ ...r, pieces:parseFloat(r.pieces)||0, weight:parseFloat(r.weight)||0, pureWt:parseFloat(r.pureWt)||0 })),
        remark,
        sendWhatsapp: sendWA,
      });
      onSaved(res.data.data, res.data.whatsapp, res.data.newGoldTotal);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save entry.");
    } finally { setSending(false); }
  };

  const thS = { border:`1px solid ${theme.borderGold}`, padding:"8px 6px", textAlign:"center", fontSize:10, color:theme.textMuted, textTransform:"uppercase", whiteSpace:"nowrap", background:theme.surfaceAlt };
  const tdS = { border:`1px solid ${theme.borderGold}`, padding:"5px 4px" };
  const inS = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"5px 7px", borderRadius:5, fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%" };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"96vw", maxWidth:1040, animation:"slideUp 0.3s ease", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>✦ Add Gold Entry — {customer.name}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        </div>

        {/* Top row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
          <Field label="Date">
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ colorScheme:"dark" }}/>
          </Field>
          <Field label="Party Voucher No (optional)">
            <input value={partyVoucherNo} onChange={e=>setPartyVoucherNo(e.target.value)} placeholder="e.g. PVN-001"/>
          </Field>
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:9, padding:"12px 14px", display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ fontSize:10, color:theme.textMuted }}>CUSTOMER PHONE (WhatsApp)</div>
            <div style={{ fontSize:15, color:theme.text }}>{customer.phone || "—"}</div>
          </div>
        </div>

        {/* Items table */}
        <div style={{ overflowX:"auto", marginBottom:14 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={thS}>#</th>
                {["Item","Shape","Quality","Accessories","Size","Description"].map(h=><th key={h} style={thS}>{h}</th>)}
                <th style={thS}>Pieces</th>
                <th style={thS}>Weight (g)</th>
                <th style={thS}>Pure Wt (g)</th>
                <th style={thS}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row,i) => (
                <tr key={i}>
                  <td style={{ ...tdS, textAlign:"center", color:theme.textMuted, fontSize:12 }}>{i+1}</td>
                  {["item","shape","quality","accessories","size","description"].map(f=>(
                    <td key={f} style={tdS}>
                      <input value={row[f]} onChange={e=>updateRow(i,f,e.target.value)} style={inS} placeholder="—"/>
                    </td>
                  ))}
                  {["pieces","weight","pureWt"].map(f=>(
                    <td key={f} style={tdS}>
                      <input type="number" value={row[f]} onChange={e=>updateRow(i,f,e.target.value)} style={{ ...inS, textAlign:"right" }} placeholder="0" min="0" step="0.001"/>
                    </td>
                  ))}
                  <td style={{ ...tdS, textAlign:"center" }}>
                    <button onClick={()=>removeRow(i)} className="btn-icon-danger" title="Remove" style={{ opacity: rows.length===1 ? 0.3 : 1 }}>
                      <Icon name="trash" size={12} color={theme.danger}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add row + totals */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <button className="btn-ghost" onClick={addRow} style={{ padding:"7px 16px", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="plus" size={14} color={theme.gold}/> Add Another Item
          </button>
          <div style={{ display:"flex", gap:28 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:theme.textMuted }}>TOTAL WEIGHT</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.gold }}>{totalWeight.toFixed(3)} g</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:theme.textMuted }}>TOTAL PURE WT</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.success }}>{totalPureWt.toFixed(3)} g</div>
            </div>
          </div>
        </div>

        <Field label="Remark (optional)">
          <input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Any notes..." style={{ marginBottom:14 }}/>
        </Field>

        {/* WhatsApp toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:theme.surfaceAlt, border:`1px solid ${sendWA?"#25D36640":theme.borderGold}`, borderRadius:9, marginBottom:18, cursor:"pointer", transition:"all 0.2s" }} onClick={()=>setSendWA(v=>!v)}>
          <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${sendWA?"#25D366":theme.borderGold}`, background:sendWA?"#25D366":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
            {sendWA && <Icon name="check" size={13} color="#fff"/>}
          </div>
          <div>
            <div style={{ fontSize:13, color:theme.text }}>📱 Send receipt to customer's WhatsApp</div>
            <div style={{ fontSize:11, color:theme.textMuted }}>Will send formatted receipt to <b style={{ color:theme.text }}>{customer.phone}</b></div>
          </div>
        </div>

        {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8, marginBottom:12 }}>⚠ {error}</div>}

        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-primary" onClick={submit} disabled={sending} style={{ flex:1, padding:14, fontSize:15 }}>
            {sending ? "Saving & Sending..." : "Save Entry & Generate Receipt →"}
          </button>
          <button className="btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Gold History Panel ───────────────────────────────────────────────────────
const GoldHistory = ({ customer, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  React.useEffect(() => {
    goldEntryAPI.getByCustomer(customer._id)
      .then(r => setEntries(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customer._id]);

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try { await goldEntryAPI.delete(id); setEntries(p=>p.filter(e=>e._id!==id)); }
    catch { alert("Delete failed."); }
  };

  return (
    <>
      <div className="overlay" onClick={onClose}>
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"88vw", maxWidth:680, maxHeight:"88vh", overflowY:"auto", animation:"slideUp 0.3s ease" }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>Gold History — {customer.name}</div>
              <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>{entries.length} receipt(s)</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
          </div>

          {loading && <div style={{ color:theme.textMuted, textAlign:"center", padding:40 }}>Loading...</div>}

          {!loading && entries.length === 0 && (
            <div style={{ color:theme.textMuted, textAlign:"center", padding:48 }}>No gold entries yet for this customer.</div>
          )}

          {!loading && entries.map(entry => (
            <div key={entry._id} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold }}>{entry.receiptNo}</div>
                  <div style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>
                    {fmt(entry.date)} · {entry.items?.length} item(s)
                    {entry.partyVoucherNo && ` · PVN: ${entry.partyVoucherNo}`}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.text }}>{(entry.totalWeight||0).toFixed(3)} g</div>
                  <div style={{ fontSize:11, color:theme.textMuted }}>Pure: {(entry.totalPureWt||0).toFixed(3)} g</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <button className="btn-edit" style={{ fontSize:12, padding:"5px 12px" }} onClick={()=>setPreview(entry)}>
                  👁 View Receipt
                </button>
                <a href={`https://jewle-chain-frontend.vercel.app/${entry._id}`} target="_blank" rel="noreferrer"
                  style={{ background:"transparent", color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"5px 12px", borderRadius:7, fontSize:12, textDecoration:"none" }}>
                  ⬇ PDF
                </a>
                {entry.whatsappSent && (
                  <span className="tag" style={{ background:"#25D36615", border:"1px solid #25D36640", color:"#25D366", fontSize:11 }}>✓ WhatsApp</span>
                )}
                <button className="btn-icon-danger" style={{ marginLeft:"auto" }} onClick={()=>remove(entry._id)}>
                  <Icon name="trash" size={13} color={theme.danger}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {preview && <ReceiptModal entry={preview} onClose={()=>setPreview(null)}/>}
    </>
  );
};

// ─── Main Customers Page ──────────────────────────────────────────────────────
const Customers = ({ customers, setCustomers }) => {
  const [showModal,    setShowModal]    = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(emptyCustomer);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [goldCustomer, setGoldCustomer] = useState(null);
  const [histCustomer, setHistCustomer] = useState(null);
  const [toast,        setToast]        = useState("");

  const openAdd  = ()  => { setForm(emptyCustomer); setEditId(null); setError(""); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ name:c.name, company:c.company||"", phone:c.phone, gold:String(c.gold||0), goldCarats:String(c.goldCarats||0), diamonds:String(c.diamonds||0) });
    setEditId(c._id); setError(""); setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setError("Name and Phone are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name:form.name, company:form.company, phone:form.phone, gold:parseFloat(form.gold)||0, goldCarats:parseFloat(form.goldCarats)||0, diamonds:parseInt(form.diamonds)||0 };
      if (editId) {
        const res = await customerAPI.update(editId, payload);
        setCustomers(p => p.map(c => c._id===editId ? res.data.data : c));
      } else {
        const res = await customerAPI.create(payload);
        setCustomers(p => [...p, res.data.data]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try { await customerAPI.remove(id); setCustomers(p=>p.filter(c=>c._id!==id)); }
    catch { alert("Delete failed."); }
  };

  const handleGoldSaved = (entry, whatsapp, newGoldTotal) => {
    setGoldCustomer(null);
    // ── Update customer's gold total in local state immediately ──
    if (newGoldTotal != null) {
      setCustomers(prev => prev.map(c =>
        c._id === entry.customer ? { ...c, gold: newGoldTotal } : c
      ));
    }
    const msg = whatsapp?.sent
      ? `✅ Receipt ${entry.receiptNo} saved! WhatsApp sent to ${entry.customerPhone}`
      : `✅ Receipt ${entry.receiptNo} saved.${whatsapp?.reason ? ` (WhatsApp: ${whatsapp.reason})` : ""}`;
    setToast(msg);
    setTimeout(() => setToast(""), 6000);
  };

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, background:"#151209", border:"1px solid #4CC97A50", color:"#4CC97A", padding:"12px 20px", borderRadius:10, fontSize:13, zIndex:9999, maxWidth:380, lineHeight:1.5, animation:"fadeIn 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Customers</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{customers.length} total clients</div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <span style={{ display:"flex", alignItems:"center", gap:7 }}>
            <Icon name="plus" size={15} color="#0D0B07"/> Add Customer
          </span>
        </button>
      </div>

      {/* Table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        <div className="table-row" style={{ gridTemplateColumns:"2fr 1.5fr 1.5fr 0.7fr 0.7fr 0.7fr 2.2fr", background:theme.surfaceAlt }}>
          {["Name","Company","Phone","Gold (g)","Carats","Diamonds","Actions"].map(h=>(
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</span>
          ))}
        </div>

        {customers.map(c => (
          <div key={c._id} className="table-row" style={{ gridTemplateColumns:"2fr 1.5fr 1.5fr 0.7fr 0.7fr 0.7fr 2.2fr" }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{c.name}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{c.company||"—"}</div>
            <div style={{ fontSize:13, color:theme.textMuted }}>{c.phone}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold }}>{c.gold}g</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#E8C97A" }}>{c.goldCarats||0}ct</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:"#7EC8E3" }}>{c.diamonds||0}</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={()=>setGoldCustomer(c)} style={{ background:"linear-gradient(135deg,#1a3020,#1e3a24)", color:"#4CC97A", border:"1px solid #2d5a3a", padding:"5px 10px", borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans'", whiteSpace:"nowrap" }}>
                ✦ Add Gold
              </button>
              <button onClick={()=>setHistCustomer(c)} style={{ background:theme.surfaceAlt, color:theme.gold, border:`1px solid ${theme.borderGold}`, padding:"5px 10px", borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans'" }}>
                📋 History
              </button>
              <button className="btn-edit" style={{ padding:"5px 9px", fontSize:11 }} onClick={()=>openEdit(c)}>
                <Icon name="edit" size={12} color={theme.gold}/>
              </button>
              <button className="btn-icon-danger" onClick={()=>remove(c._id, c.name)}>
                <Icon name="trash" size={12} color={theme.danger}/>
              </button>
            </div>
          </div>
        ))}
        {customers.length===0 && (
          <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>No customers yet.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editId?"✦ Edit Customer":"✦ Add New Customer"} onClose={()=>setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Field label="Customer Name *"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Priya Mehta" autoFocus/></Field>
            <Field label="Company"><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="e.g. Mehta Jewellers"/></Field>
            <Field label="Phone * (for WhatsApp)"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210"/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <Field label="Gold (grams)"><input type="number" value={form.gold} onChange={e=>setForm({...form,gold:e.target.value})} placeholder="e.g. 100" min="0"/></Field>
              <Field label="Gold Carats"><input type="number" value={form.goldCarats} onChange={e=>setForm({...form,goldCarats:e.target.value})} placeholder="e.g. 22" min="0"/></Field>
              <Field label="Diamonds (pcs)"><input type="number" value={form.diamonds} onChange={e=>setForm({...form,diamonds:e.target.value})} placeholder="e.g. 50" min="0"/></Field>
            </div>
            {error && <div style={{ color:theme.danger, fontSize:13, background:`${theme.danger}12`, padding:"10px 14px", borderRadius:8 }}>⚠ {error}</div>}
            <div style={{ display:"flex", gap:12, marginTop:4 }}>
              <button className="btn-primary" onClick={save} style={{ flex:1 }} disabled={saving}>{saving?"Saving...":editId?"Save Changes":"Create Customer"}</button>
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {goldCustomer && <AddGoldModal customer={goldCustomer} onClose={()=>setGoldCustomer(null)} onSaved={handleGoldSaved}/>}
      {histCustomer && <GoldHistory customer={histCustomer} onClose={()=>setHistCustomer(null)}/>}
    </div>
  );
};

export default Customers;
