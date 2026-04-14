import React, { useState, useMemo } from "react";
import { theme, STEPS } from "../theme";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const getItemDetails = (order, folders) => {
  const folder = folders.find(f => f.name === order.folder);
  if (!folder) return null;
  return folder.items.find(it => it.name === order.item || it.itemNumber === order.itemNumber) || null;
};

const BagStatusReport = ({ orders, customers, folders }) => {
  const [bagId,        setBagId]        = useState("");
  const [party,        setParty]        = useState("");
  const [category,     setCategory]     = useState("");
  const [itemNo,       setItemNo]       = useState("");
  const [purity,       setPurity]       = useState("");
  const [karate,       setKarate]       = useState("");
  const [diamond,      setDiamond]      = useState("");
  const [metalFilter,  setMetalFilter]  = useState("");   // ← NEW: gold|silver|all
  const [statusFilter, setStatusFilter] = useState("all");

  const hasAnyFilter = bagId || party || category || itemNo || purity || karate || diamond || metalFilter || statusFilter !== "all";

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const itemDet = getItemDetails(o, folders);
      if (bagId       && !String(o.bagId||"").toLowerCase().includes(bagId.toLowerCase())) return false;
      if (party       && !(o.customerName||"").toLowerCase().includes(party.toLowerCase())) return false;
      if (category    && !(o.folder||"").toLowerCase().includes(category.toLowerCase())) return false;
      if (itemNo      && !(o.itemNumber||"").toLowerCase().includes(itemNo.toLowerCase()) && !(o.item||"").toLowerCase().includes(itemNo.toLowerCase())) return false;
      if (purity      && !(itemDet?.purity||"").toLowerCase().includes(purity.toLowerCase())) return false;
      if (karate      && !(itemDet?.purity||"").toLowerCase().includes(karate.toLowerCase()) && !(itemDet?.tone||"").toLowerCase().includes(karate.toLowerCase())) return false;
      if (diamond     && !(o.diamondShapes||[]).map(d=>(d.shapeName||"").toLowerCase()).join(" ").includes(diamond.toLowerCase())) return false;
      if (metalFilter && (o.metalType||"gold") !== metalFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, folders, bagId, party, category, itemNo, purity, karate, diamond, metalFilter, statusFilter]);

  const clearAll = () => { setBagId(""); setParty(""); setCategory(""); setItemNo(""); setPurity(""); setKarate(""); setDiamond(""); setMetalFilter(""); setStatusFilter("all"); };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"8px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%", transition:"border-color 0.2s" };

  const uniqueCategories = [...new Set(orders.map(o=>o.folder).filter(Boolean))].sort();
  const uniquePurities   = [...new Set(orders.flatMap(o=>{ const it=getItemDetails(o,folders); return it?.purity?[it.purity]:[]; }))].sort();

  const stepLabel = (o) => {
    if (o.status === "Completed") return { label:"Completed", color:theme.success };
    if (o.currentStep === 0)      return { label:"Not Started", color:theme.textMuted };
    return { label:`Step ${o.currentStep}: ${STEPS[o.currentStep-1]||""}`, color:theme.gold };
  };

  const metalColor = (m) => m === "silver" ? "#C0C0C0" : theme.gold;
  const metalLabel = (m) => m === "silver" ? "◆ Silver" : "✦ Gold";

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div className="section-title">Bag Status Report</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>Search and filter all bags — {orders.length} total</div>
      </div>

      {/* Filter panel */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:13, color:theme.gold, fontWeight:600 }}>🔍 Search Filters</div>
          {hasAnyFilter && <button onClick={clearAll} className="btn-ghost" style={{ padding:"5px 14px", fontSize:12 }}>Clear All</button>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Bag ID</div><input style={inp} value={bagId} onChange={e=>setBagId(e.target.value)} placeholder="e.g. 42"/></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Party Name</div><input style={inp} value={party} onChange={e=>setParty(e.target.value)} placeholder="e.g. Mehta"/></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Category</div>
            <select style={inp} value={category} onChange={e=>setCategory(e.target.value)}><option value="">All Categories</option>{uniqueCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Item Name / Number</div><input style={inp} value={itemNo} onChange={e=>setItemNo(e.target.value)} placeholder="e.g. Ring"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Purity</div>
            <select style={inp} value={purity} onChange={e=>setPurity(e.target.value)}><option value="">All</option>{uniquePurities.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Karate / Tone</div><input style={inp} value={karate} onChange={e=>setKarate(e.target.value)} placeholder="e.g. 18K, Yellow"/></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Diamond Shape</div><input style={inp} value={diamond} onChange={e=>setDiamond(e.target.value)} placeholder="e.g. Round"/></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Metal Type</div>
            <select style={inp} value={metalFilter} onChange={e=>setMetalFilter(e.target.value)}><option value="">All Metals</option><option value="gold">✦ Gold</option><option value="silver">◆ Silver</option></select></div>
          <div><div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Status</div>
            <select style={inp} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select></div>
        </div>
      </div>

      {/* Result count */}
      <div style={{ marginBottom:12, fontSize:13, color:theme.textMuted }}>
        Showing <strong style={{color:theme.gold}}>{filtered.length}</strong> of {orders.length} bags
      </div>

      {/* Table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        {/* Header — add Metal column */}
        <div style={{ display:"grid", gridTemplateColumns:"0.5fr 1.3fr 1.1fr 0.9fr 0.7fr 0.7fr 0.6fr 0.6fr 0.6fr 1fr 1.1fr", background:theme.surfaceAlt, padding:"12px 18px", gap:8 }}>
          {["Bag","Party","Category","Item","Item No.","Purity","Metal","G.Wt","Now","Diamonds","Status"].map(h=>(
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.3 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="search" size={36} color={theme.borderGold}/><br/><br/>
            {hasAnyFilter ? "No bags match your filters." : "No bags found."}
          </div>
        )}

        {filtered.map((o, i) => {
          const itemDet   = getItemDetails(o, folders);
          const castG     = o.castingGold || o.castingSilver || o.gramHistory?.[0] || 0;
          const currG     = o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length - 1] : 0;
          const stepInfo  = stepLabel(o);
          const metal     = o.metalType || "gold";
          const mc        = metalColor(metal);
          const diaText   = (o.diamondShapes||[]).length > 0 ? (o.diamondShapes).map(d=>`${d.shapeName}×${d.pcs}`).join(", ") : "—";

          return (
            <div key={o._id}
              style={{ display:"grid", gridTemplateColumns:"0.5fr 1.3fr 1.1fr 0.9fr 0.7fr 0.7fr 0.6fr 0.6fr 0.6fr 1fr 1.1fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}06`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.gold }}>#{o.bagId}</div>
              <div><div style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{o.customerName}</div><div style={{ fontSize:11, color:theme.textMuted, marginTop:1 }}>{fmt(o.orderDate)}</div></div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder}</div>
              <div><div style={{ fontSize:13, color:theme.text }}>{o.item}</div></div>
              <div style={{ fontSize:12, color:theme.textMuted }}>{o.itemNumber||itemDet?.itemNumber||"—"}</div>
              <div>
                {itemDet?.purity
                  ? <span style={{ fontSize:11, color:theme.text, background:`${theme.gold}15`, border:`1px solid ${theme.borderGold}`, padding:"2px 6px", borderRadius:4 }}>{itemDet.purity}</span>
                  : <span style={{ fontSize:12, color:theme.textMuted }}>—</span>}
              </div>
              {/* Metal type */}
              <div>
                <span style={{ fontSize:11, color:mc, background:`${mc}15`, border:`1px solid ${mc}40`, padding:"2px 6px", borderRadius:10 }}>
                  {metalLabel(metal)}
                </span>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.textMuted }}>{castG>0?`${castG.toFixed(2)}g`:"—"}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:mc }}>{currG>0?`${currG}g`:"—"}</div>
              <div style={{ fontSize:11, color:"#7EC8E3" }}>{diaText}</div>
              <div>
                <span style={{ fontSize:11, color:stepInfo.color, background:`${stepInfo.color}15`, border:`1px solid ${stepInfo.color}40`, padding:"3px 8px", borderRadius:12, whiteSpace:"nowrap" }}>{stepInfo.label}</span>
                {o.status!=="Completed" && <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>Due: {fmt(o.deliveryDate)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {filtered.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginTop:16 }}>
          {[
            ["Total Bags",      filtered.length,                                                                                                              theme.gold],
            ["Completed",       filtered.filter(o=>o.status==="Completed").length,                                                                            theme.success],
            ["In Progress",     filtered.filter(o=>o.status!=="Completed").length,                                                                            theme.textMuted],
            ["Gold Bags",       filtered.filter(o=>(o.metalType||"gold")==="gold").length,                                                                    theme.gold],
            ["Silver Bags",     filtered.filter(o=>o.metalType==="silver").length,                                                                            "#C0C0C0"],
          ].map(([l,v,c])=>(
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
