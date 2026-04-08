import React, { useState, useMemo } from "react";
import { theme, STEPS } from "../theme";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

// ── Resolve item details from folders ─────────────────────────────────────────
const getItemDetails = (order, folders) => {
  const folder = folders.find(f => f.name === order.folder);
  if (!folder) return null;
  return folder.items.find(it => it.name === order.item || it.itemNumber === order.itemNumber) || null;
};

const BagStatusReport = ({ orders, customers, folders }) => {
  const [bagId,     setBagId]     = useState("");
  const [party,     setParty]     = useState("");
  const [category,  setCategory]  = useState("");
  const [itemNo,    setItemNo]    = useState("");
  const [purity,    setPurity]    = useState("");
  const [karate,    setKarate]    = useState("");
  const [diamond,   setDiamond]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const hasAnyFilter = bagId || party || category || itemNo || purity || karate || diamond || statusFilter !== "all";

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const itemDet = getItemDetails(o, folders);

      if (bagId && !String(o.bagId||"").toLowerCase().includes(bagId.toLowerCase())) return false;
      if (party && !(o.customerName||"").toLowerCase().includes(party.toLowerCase())) return false;
      if (category && !(o.folder||"").toLowerCase().includes(category.toLowerCase())) return false;
      if (itemNo && !(o.itemNumber||"").toLowerCase().includes(itemNo.toLowerCase()) &&
                   !(o.item||"").toLowerCase().includes(itemNo.toLowerCase())) return false;
      if (purity && !(itemDet?.purity||"").toLowerCase().includes(purity.toLowerCase())) return false;
      if (karate && !(itemDet?.purity||"").toLowerCase().includes(karate.toLowerCase()) &&
                   !(itemDet?.tone||"").toLowerCase().includes(karate.toLowerCase())) return false;
      if (diamond) {
        const diaNames = (o.diamondShapes||[]).map(d=>(d.shapeName||"").toLowerCase()).join(" ");
        if (!diaNames.includes(diamond.toLowerCase())) return false;
      }
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, folders, bagId, party, category, itemNo, purity, karate, diamond, statusFilter]);

  const clearAll = () => {
    setBagId(""); setParty(""); setCategory(""); setItemNo("");
    setPurity(""); setKarate(""); setDiamond(""); setStatusFilter("all");
  };

  const inp = {
    background: theme.bg, border:`1px solid ${theme.borderGold}`,
    color: theme.text, padding:"8px 12px", borderRadius:8,
    fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%",
    transition:"border-color 0.2s",
  };

  const stepLabel = (o) => {
    if (o.status === "Completed") return { label:"Completed", color:theme.success };
    if (o.currentStep === 0)      return { label:"Not Started", color:theme.textMuted };
    return { label:`Step ${o.currentStep}: ${STEPS[o.currentStep-1]||""}`, color:theme.gold };
  };

  // Unique values for dropdowns
  const uniqueCategories = [...new Set(orders.map(o=>o.folder).filter(Boolean))].sort();
  const uniquePurities   = [...new Set(
    orders.flatMap(o => {
      const it = getItemDetails(o, folders);
      return it?.purity ? [it.purity] : [];
    })
  )].sort();

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div className="section-title">Bag Status Report</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>
          Search and filter all bags — {orders.length} total bags
        </div>
      </div>

      {/* ── Search / Filter Panel ── */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:13, color:theme.gold, fontWeight:600 }}>🔍 Search Filters</div>
          {hasAnyFilter && (
            <button onClick={clearAll} className="btn-ghost" style={{ padding:"5px 14px", fontSize:12 }}>
              Clear All
            </button>
          )}
        </div>

        {/* Row 1 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Bag ID</div>
            <input style={inp} value={bagId} onChange={e=>setBagId(e.target.value)} placeholder="e.g. 42"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Party Name</div>
            <input style={inp} value={party} onChange={e=>setParty(e.target.value)} placeholder="e.g. Mehta"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Category / Folder</div>
            <select style={inp} value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {uniqueCategories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Item Name / Number</div>
            <input style={inp} value={itemNo} onChange={e=>setItemNo(e.target.value)} placeholder="e.g. a101 or Ring"/>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Purity</div>
            <select style={inp} value={purity} onChange={e=>setPurity(e.target.value)}>
              <option value="">All Purities</option>
              {uniquePurities.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Karate / Tone</div>
            <input style={inp} value={karate} onChange={e=>setKarate(e.target.value)} placeholder="e.g. 18K, 22K, Yellow"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Diamond Shape</div>
            <input style={inp} value={diamond} onChange={e=>setDiamond(e.target.value)} placeholder="e.g. Oval, Round"/>
          </div>
          <div>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Status</div>
            <select style={inp} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:13, color:theme.textMuted }}>
          Showing <strong style={{color:theme.gold}}>{filtered.length}</strong> of {orders.length} bags
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>

        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"0.6fr 1.4fr 1.2fr 1fr 0.8fr 0.8fr 0.7fr 0.7fr 1fr 1.2fr", background:theme.surfaceAlt, padding:"12px 18px", gap:8 }}>
          {["Bag ID","Party","Category","Item","Item No.","Purity","Gross Wt","Gold Now","Diamonds","Status"].map(h => (
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.3 }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="search" size={36} color={theme.borderGold}/><br/><br/>
            {hasAnyFilter ? "No bags match your filters — try clearing some." : "No bags found."}
          </div>
        )}

        {filtered.map((o, i) => {
          const itemDet  = getItemDetails(o, folders);
          const currG    = o.gramHistory[o.gramHistory.length - 1];
          const stepInfo = stepLabel(o);
          const diaText  = (o.diamondShapes||[]).length > 0
            ? (o.diamondShapes).map(d=>`${d.shapeName}×${d.pcs}`).join(", ")
            : "—";

          return (
            <div
              key={o._id}
              style={{ display:"grid", gridTemplateColumns:"0.6fr 1.4fr 1.2fr 1fr 0.8fr 0.8fr 0.7fr 0.7fr 1fr 1.2fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}06`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              {/* Bag ID */}
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>#{o.bagId}</div>

              {/* Party */}
              <div>
                <div style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{o.customerName}</div>
                <div style={{ fontSize:11, color:theme.textMuted, marginTop:1 }}>{fmt(o.orderDate)}</div>
              </div>

              {/* Category */}
              <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder}</div>

              {/* Item */}
              <div>
                <div style={{ fontSize:13, color:theme.text }}>{o.item}</div>
                {itemDet?.desc && <div style={{ fontSize:11, color:theme.textMuted, marginTop:1 }}>{itemDet.desc.slice(0,30)}{itemDet.desc.length>30?"…":""}</div>}
              </div>

              {/* Item Number */}
              <div style={{ fontSize:12, color:theme.textMuted }}>{o.itemNumber || itemDet?.itemNumber || "—"}</div>

              {/* Purity */}
              <div>
                {itemDet?.purity
                  ? <span style={{ fontSize:12, color:theme.text, background:`${theme.gold}15`, border:`1px solid ${theme.borderGold}`, padding:"2px 8px", borderRadius:4 }}>{itemDet.purity}</span>
                  : <span style={{ fontSize:12, color:theme.textMuted }}>—</span>
                }
                {itemDet?.tone && <div style={{ fontSize:10, color:theme.textMuted, marginTop:3 }}>{itemDet.tone}</div>}
              </div>

              {/* Gross Weight */}
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.textMuted }}>
                {o.itemWeight || itemDet?.weight || "—"}{(o.itemWeight||itemDet?.weight) ? "g" : ""}
              </div>

              {/* Current Gold */}
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>
                {currG}g
              </div>

              {/* Diamonds */}
              <div style={{ fontSize:11, color:"#7EC8E3" }}>{diaText}</div>

              {/* Status */}
              <div>
                <span style={{ fontSize:11, color:stepInfo.color, background:`${stepInfo.color}15`, border:`1px solid ${stepInfo.color}40`, padding:"3px 10px", borderRadius:12, whiteSpace:"nowrap" }}>
                  {stepInfo.label}
                </span>
                {o.status !== "Completed" && (
                  <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>
                    Due: {fmt(o.deliveryDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
          {[
            ["Total Bags",      filtered.length,                                                          theme.gold],
            ["Completed",       filtered.filter(o=>o.status==="Completed").length,                        theme.success],
            ["In Progress",     filtered.filter(o=>o.status!=="Completed").length,                        theme.textMuted],
            ["Total Initial Wt",`${filtered.reduce((s,o)=>s+(o.gramHistory[0]||0),0).toFixed(3)}g`,      theme.gold],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"14px 18px" }}>
              <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BagStatusReport;
