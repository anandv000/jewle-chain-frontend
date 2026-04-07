import React, { useState, useMemo } from "react";
import { theme, STEPS } from "../theme";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const PartyLedger = ({ orders, customers, folders }) => {
  const [query,       setQuery]       = useState("");
  const [selectedId,  setSelectedId]  = useState(null);

  // ── Search: match bagId OR customerName ────────────────────────────────────
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return orders.filter(o =>
      (o.bagId||"").toString().toLowerCase().includes(q) ||
      (o.customerName||"").toLowerCase().includes(q)
    );
  }, [query, orders]);

  const selected = selectedId ? orders.find(o => o._id === selectedId) : null;

  // ── Full customer record ───────────────────────────────────────────────────
  const customerRecord = selected
    ? customers.find(c => c._id === (selected.customer?._id || selected.customer))
    : null;

  // ── Full folder + item record ──────────────────────────────────────────────
  const folderRecord = selected
    ? folders.find(f => f.name === selected.folder)
    : null;
  const itemRecord = folderRecord
    ? folderRecord.items.find(it => it.name === selected.item || it.itemNumber === selected.itemNumber)
    : null;

  // ── Gold stats for this customer from all orders ───────────────────────────
  const customerOrders = selected
    ? orders.filter(o => {
        const cId = o.customer?._id || o.customer;
        const selCId = selected.customer?._id || selected.customer;
        return String(cId) === String(selCId);
      })
    : [];

  const currG    = selected ? selected.gramHistory[selected.gramHistory.length - 1] : 0;
  const startG   = selected ? selected.gramHistory[0] : 0;
  const wastage  = (startG - currG).toFixed(3);
  const isCompleted = selected?.status === "Completed";

  // Group results by customer for display
  const grouped = useMemo(() => {
    const map = {};
    results.forEach(o => {
      const key = o.customerName || "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [results]);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div className="section-title">Party Ledger</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>
          Search any bag by Bag ID or customer (party) name — view full order details
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", zIndex:1 }}>
          <Icon name="search" size={18} color={theme.textMuted}/>
        </div>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedId(null); }}
          placeholder="Search by Bag ID (e.g. 42) or Party Name (e.g. Mehta)..."
          autoFocus
          style={{
            width:"100%", padding:"14px 16px 14px 48px",
            background:theme.surface, border:`1.5px solid ${query ? theme.gold : theme.borderGold}`,
            borderRadius:12, color:theme.text, fontFamily:"'DM Sans'", fontSize:15,
            outline:"none", transition:"border-color 0.2s",
          }}
        />
        {query && (
          <button onClick={()=>{ setQuery(""); setSelectedId(null); }} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        )}
      </div>

      {/* Empty state */}
      {!query && (
        <div style={{ background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:14, padding:64, textAlign:"center", color:theme.textMuted }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:theme.borderGold, marginBottom:16 }}>✦</div>
          <div style={{ fontSize:16, marginBottom:8, color:theme.text }}>Search any bag or party</div>
          <div style={{ fontSize:13 }}>Type a Bag ID number or customer name above to instantly find all their bags and full order details.</div>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:40, textAlign:"center", color:theme.textMuted }}>
          No bags found for "{query}"
        </div>
      )}

      {/* Results + Detail split view */}
      {query && results.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:selected?"320px 1fr":"1fr", gap:20, alignItems:"start" }}>

          {/* ── Results list ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:12, color:theme.textMuted, marginBottom:4 }}>
              {results.length} bag{results.length>1?"s":""} found
            </div>
            {Object.entries(grouped).map(([cname, bags]) => (
              <div key={cname}>
                <div style={{ fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, padding:"0 4px" }}>
                  👤 {cname} ({bags.length})
                </div>
                {bags.map(o => {
                  const isSelected = selectedId === o._id;
                  const isComp = o.status === "Completed";
                  return (
                    <div
                      key={o._id}
                      onClick={() => setSelectedId(isSelected ? null : o._id)}
                      style={{
                        background: isSelected ? `${theme.gold}12` : theme.surface,
                        border: `1.5px solid ${isSelected ? theme.gold : theme.borderGold}`,
                        borderRadius:10, padding:"12px 16px", cursor:"pointer",
                        transition:"all 0.2s", marginBottom:6,
                      }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>#{o.bagId}</span>
                            <span className="tag" style={{ fontSize:10, background:isComp?`${theme.success}18`:`${theme.gold}15`, color:isComp?theme.success:theme.gold }}>{o.status}</span>
                          </div>
                          <div style={{ fontSize:12, color:theme.textMuted }}>{o.folder} · {o.item}</div>
                          <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>{fmt(o.orderDate)}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold }}>{o.gramHistory[0]}g</div>
                          <div style={{ fontSize:11, color:theme.textMuted }}>initial</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Full Detail View ── */}
          {selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Title bar */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold }}>
                  Bag #{selected.bagId} — Full Details
                </div>
                <span className="tag" style={{ background:isCompleted?`${theme.success}20`:`${theme.gold}18`, color:isCompleted?theme.success:theme.gold, fontSize:13 }}>{selected.status}</span>
              </div>

              {/* ── CUSTOMER SECTION ── */}
              <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                  👤 Customer / Party Details
                </div>
                <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px 24px" }}>
                  {[
                    ["Name",          selected.customerName],
                    ["Company",       customerRecord?.company || "—"],
                    ["Phone",         customerRecord?.phone || "—"],
                    ["Gold Balance",  customerRecord ? `${(customerRecord.gold||0).toFixed(3)}g` : "—"],
                    ["Diamond Karats",customerRecord ? `${(customerRecord.diamondKarats||0).toFixed(4)} ct` : "—"],
                    ["Diamond Pcs",   customerRecord ? `${customerRecord.diamonds||0} pcs` : "—"],
                    ["Total Orders",  `${customerOrders.length} bags`],
                    ["Completed",     `${customerOrders.filter(o=>o.status==="Completed").length} bags`],
                    ["In Progress",   `${customerOrders.filter(o=>o.status!=="Completed").length} bags`],
                  ].map(([l,v]) => (
                    <div key={l}>
                      <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── ORDER SECTION ── */}
              <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                  📋 Order Details
                </div>
                <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px 24px" }}>
                  {[
                    ["Bag ID",        `#${selected.bagId}`],
                    ["Order Date",    fmt(selected.orderDate)],
                    ["Delivery Date", fmt(selected.deliveryDate)],
                    ["Folder",        selected.folder],
                    ["Item",          selected.item],
                    ["Item Number",   selected.itemNumber || "—"],
                    ["Size",          selected.size || "—"],
                    ["Labour Rate",   selected.labourCharge ? `₹${selected.labourCharge}/g` : "—"],
                    ["Labour Total",  selected.labourTotal > 0 ? `₹${selected.labourTotal.toLocaleString()}` : "—"],
                  ].map(([l,v]) => (
                    <div key={l}>
                      <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div style={{ padding:"0 18px 16px", fontSize:13, color:theme.textMuted }}>
                    <strong style={{color:theme.text}}>Notes:</strong> {selected.notes}
                  </div>
                )}
              </div>

              {/* ── PRODUCT / ITEM SECTION ── */}
              <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                  💎 Product / Item Details
                </div>
                <div style={{ padding:"16px 18px", display:"flex", gap:20 }}>
                  {/* Item image */}
                  <div style={{ width:120, height:120, background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {(selected.itemImage || itemRecord?.image) ? (
                      <img src={selected.itemImage || itemRecord.image} alt="" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
                    ) : (
                      <Icon name="image" size={32} color={theme.borderGold}/>
                    )}
                  </div>
                  {/* Item fields */}
                  <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px" }}>
                    {[
                      ["Item Name",   selected.item],
                      ["Item #",      selected.itemNumber || itemRecord?.itemNumber || "—"],
                      ["Gross Weight",itemRecord?.weight ? `${itemRecord.weight}g` : `${selected.itemWeight||0}g`],
                      ["Net Weight",  itemRecord?.netWeight ? `${itemRecord.netWeight}g` : "—"],
                      ["Purity",      itemRecord?.purity || "—"],
                      ["Tone",        itemRecord?.tone || "—"],
                      ["Gender",      itemRecord?.gender || "—"],
                      ["Designed By", itemRecord?.designedBy || "—"],
                    ].map(([l,v]) => (
                      <div key={l}>
                        <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── GOLD TRACKING ── */}
              <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                  ✦ Gold Tracking
                </div>
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                    {[["Initial Gold",`${startG}g`,theme.textMuted],["Current Gold",`${currG}g`,theme.gold],["Wastage",`${wastage}g`,theme.danger]].map(([l,v,c]) => (
                      <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, textAlign:"center" }}>
                        <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Step by step */}
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {STEPS.map((step, i) => {
                      const done    = i < selected.currentStep;
                      const current = i === selected.currentStep;
                      const before  = selected.gramHistory[i];
                      const after   = selected.gramHistory[i + 1];
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:done?`${theme.success}08`:current?`${theme.gold}08`:"transparent", border:`1px solid ${done?`${theme.success}30`:current?`${theme.gold}30`:theme.borderGold}`, borderRadius:8 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", background:done?theme.success:current?theme.gold:theme.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, color:done||current?"#0D0B07":theme.textMuted, fontWeight:700 }}>
                            {done ? "✓" : i+1}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                            {done && after !== undefined && (
                              <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                                {before}g → {after}g <span style={{color:theme.danger}}>−{(before-after).toFixed(3)}g used</span>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize:11, color:done?theme.success:current?theme.gold:theme.textMuted, fontWeight:500 }}>
                            {done?"Done":current?"In Progress":"Pending"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── DIAMONDS ── */}
              {selected.diamondShapes?.length > 0 && (
                <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:"#7EC8E3", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                    💎 Diamonds Used
                  </div>
                  <div style={{ padding:"16px 18px", display:"flex", flexWrap:"wrap", gap:10 }}>
                    {selected.diamondShapes.map((s, i) => (
                      <div key={i} style={{ background:`#7EC8E310`, border:`1px solid #7EC8E340`, borderRadius:10, padding:"10px 16px" }}>
                        <div style={{ fontSize:13, color:"#7EC8E3", fontWeight:500 }}>{s.shapeName}</div>
                        <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>
                          {s.sizeInMM && `${s.sizeInMM}mm · `}{s.pcs} pcs · {s.weight}ct/pc
                        </div>
                        <div style={{ fontSize:13, color:"#7EC8E3", marginTop:4, fontFamily:"'Cormorant Garamond',serif" }}>
                          {((s.weight||0)*(s.pcs||1)).toFixed(4)} ct total
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ALL BAGS FOR THIS CUSTOMER ── */}
              {customerOrders.length > 1 && (
                <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>
                    📦 All Bags — {selected.customerName} ({customerOrders.length} total)
                  </div>
                  <div style={{ padding:"12px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                    {customerOrders.map(o => {
                      const isComp = o.status === "Completed";
                      const isCurr = o._id === selected._id;
                      return (
                        <div key={o._id} onClick={()=>setSelectedId(o._id)}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:isCurr?`${theme.gold}12`:theme.surfaceAlt, border:`1px solid ${isCurr?theme.gold:theme.borderGold}`, borderRadius:8, cursor:"pointer" }}>
                          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.gold, minWidth:50 }}>#{o.bagId}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, color:theme.text }}>{o.folder} · {o.item}</div>
                            <div style={{ fontSize:11, color:theme.textMuted }}>{fmt(o.orderDate)}</div>
                          </div>
                          <span className="tag" style={{ fontSize:10, background:isComp?`${theme.success}18`:`${theme.gold}15`, color:isComp?theme.success:theme.gold }}>{o.status}</span>
                          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>{o.gramHistory[0]}g</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartyLedger;
