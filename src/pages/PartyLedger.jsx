import React, { useState, useMemo, useEffect } from "react";
import { theme, STEPS } from "../theme";
import { goldEntryAPI } from "../services/api";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const ENTRY_META = {
  gold_deposit:    { color: theme.gold, icon: "✦", label: "Gold Deposit" },
  silver_deposit:  { color: "#C0C0C0",  icon: "◆", label: "Silver Deposit" },
  diamond_deposit: { color: "#7EC8E3",  icon: "💎", label: "Diamond Deposit" },
  return:          { color: theme.danger, icon: "↩", label: "Return" },
  delivery:        { color: "#FF8C8C",  icon: "📦", label: "Delivered" },
};

const bagFinalWt = (o) => (o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length - 1] : 0);

// ══════════════════════════════════════════════════════════════════════════════
//  VIEW 1 — Customer Labour Summary (clicked customer name)
//  Shows only COMPLETED bags, labour per bag, total labour, owner gold tracking
// ══════════════════════════════════════════════════════════════════════════════
const CustomerSummary = ({ customerName, allOrders, customers, onBack, onSelectBag }) => {
  const customerRecord = customers.find(c => c.name === customerName && !c.isOwner);

  // ── Material ledger entries (gold/silver/diamond deposits + returns) ──────────
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  useEffect(() => {
    if (!customerRecord?._id) { setLoadingEntries(false); return; }
    setLoadingEntries(true);
    goldEntryAPI.getByCustomer(customerRecord._id)
      .then(r => setEntries(r.data.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  }, [customerRecord?._id]);

  // All orders for this customer
  const custOrders = allOrders.filter(o =>
    (o.customerName || "").toLowerCase() === customerName.toLowerCase()
  );

  // ── Diamonds: deposited / returned / used (issued into bags) ──────────────────
  const diaDeposited = entries.filter(e => e.entryType === "diamond_deposit")
    .reduce((a, e) => ({ pcs: a.pcs + (e.totalDiamondPcs || 0), ct: a.ct + (e.totalDiamondKarats || 0) }), { pcs:0, ct:0 });
  const diaReturned = entries.filter(e => e.entryType === "return")
    .reduce((a, e) => ({ pcs: a.pcs + (e.returnDiamonds||[]).reduce((s,d)=>s+(d.pcs||0),0), ct: a.ct + (e.returnDiamondKarats || 0) }), { pcs:0, ct:0 });
  // Bags where diamonds were issued at the D-Center step
  const diaUsageBags = custOrders
    .filter(o => (o.issuedDiamonds || []).length > 0)
    .map(o => ({
      order: o,
      pcs: o.issuedDiamonds.reduce((s,d)=>s+(d.pcs||0),0),
      ct:  o.issuedDiamonds.reduce((s,d)=>s+(d.karats||0),0),
      date: o.updatedAt || o.deliveryDate || o.orderDate,
    }));
  const diaUsed = diaUsageBags.reduce((a, b) => ({ pcs: a.pcs + b.pcs, ct: a.ct + b.ct }), { pcs:0, ct:0 });
  const diaRemaining = {
    pcs: diaDeposited.pcs - diaReturned.pcs - diaUsed.pcs,
    ct:  diaDeposited.ct  - diaReturned.ct  - diaUsed.ct,
  };

  // Only COMPLETED bags
  const completedBags = custOrders.filter(o => o.status === "Completed");

  // Labour totals
  const totalLabour   = completedBags.reduce((s, o) => s + (o.labourTotal || 0), 0);

  // Owner metal tracking — bags where owner's gold OR silver was used
  const ownerGoldBags = completedBags.filter(o => o.usesOwnerGold);
  const totalOwnerGoldUsed = ownerGoldBags.reduce((s, o) => s + (o.castingGold || 0), 0);
  // Gold "collected back" = final gram remaining in completed bags using owner gold
  const totalGoldCollected = ownerGoldBags.reduce((s, o) => s + bagFinalWt(o), 0);

  // ── Metal account (gold + silver): deposits − returns − own castings − delivered
  // "Delivered" = final weight of COMPLETED bags made from the OWNER's metal —
  // the party owes that weight until they deposit metal against it.
  const metalStats = (metal) => {
    const isG = metal === "gold";
    const deposited = entries.filter(e => e.entryType === (isG ? "gold_deposit" : "silver_deposit"))
      .reduce((s, e) => s + (e.totalWeight || 0), 0);
    const returned = entries.filter(e => e.entryType === "return")
      .reduce((s, e) => s + ((isG ? e.returnGold : e.returnSilver) || 0), 0);
    const ownCast = custOrders
      .filter(o => !(isG ? o.usesOwnerGold : o.usesOwnerSilver) && ((isG ? o.castingGold : o.castingSilver) || 0) > 0)
      .reduce((s, o) => s + ((isG ? o.castingGold : o.castingSilver) || 0), 0);
    const delivered = custOrders
      .filter(o => (isG ? o.usesOwnerGold : o.usesOwnerSilver) && o.status === "Completed")
      .reduce((s, o) => s + bagFinalWt(o), 0);
    const opening = (isG ? customerRecord?.openingGold : customerRecord?.openingSilver) || 0;
    return { deposited, returned, ownCast, delivered, net: opening + deposited - returned - ownCast - delivered };
  };
  const goldAcct   = metalStats("gold");
  const silverAcct = metalStats("silver");

  // ── Unified ledger rows: deposits/returns (entries) + deliveries (bags) ──────
  const deliveryRows = custOrders
    .filter(o => (o.usesOwnerGold || o.usesOwnerSilver) && o.status === "Completed")
    .map(o => ({
      kind: "delivery",
      _id:  `delivery-${o._id}`,
      date: o.updatedAt || o.deliveryDate || o.orderDate,
      order: o,
      metal: o.usesOwnerSilver ? "silver" : "gold",
      weight: bagFinalWt(o),
    }));
  const ledgerRows = [
    ...entries.map(e => ({ kind: "entry", _id: e._id, date: e.date, entry: e })),
    ...deliveryRows,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Customer's own gold deposited (from goldEntry records — use customerRecord.gold as proxy)
  const customerGoldBalance = customerRecord?.gold || 0;

  // Total wastage across completed bags
  const totalWastage = completedBags.reduce((s, o) => {
    const start = o.gramHistory?.[0] || 0;
    const end   = o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length - 1] : 0;
    return s + (start - end);
  }, 0);

  // Owner SILVER bags (same tracking as gold)
  const ownerSilverBags = completedBags.filter(o => o.usesOwnerSilver);
  const totalOwnerSilverUsed  = ownerSilverBags.reduce((s, o) => s + (o.castingSilver || 0), 0);
  const totalSilverCollected  = ownerSilverBags.reduce((s, o) => s + bagFinalWt(o), 0);

  const usesOwnerGold  = ownerGoldBags.length > 0;
  const usesOwnerMetal = usesOwnerGold || ownerSilverBags.length > 0;

  return (
    <div className="fade-in">
      {/* Back button + title */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <button className="btn-ghost" onClick={onBack}>← Back to Search</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.gold }}>
          {customerName}
        </div>
        {usesOwnerMetal && (
          <span style={{ fontSize:11, color:"#B39DDB", background:"#7B5EA715", border:"1px solid #7B5EA750", padding:"3px 10px", borderRadius:12 }}>
            ✦ Uses Owner's {ownerGoldBags.length > 0 && ownerSilverBags.length > 0 ? "Metal" : ownerGoldBags.length > 0 ? "Gold" : "Silver"}
          </span>
        )}
      </div>

      {/* Customer info bar — full profile */}
      {customerRecord && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600, marginBottom:12 }}>👤 Customer Profile</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px 24px" }}>
            {[
              ["Company",         customerRecord.company || "—"],
              ["Phone",           customerRecord.phone   || "—"],
              ["Gold Balance",    `${(customerRecord.gold||0).toFixed(3)} g`],
              ["Silver Balance",  `${(customerRecord.silver||0).toFixed(3)} g`],
              ["Gold Carats",     `${customerRecord.goldCarats||0} ct`],
              ["Diamond Pcs",     `${customerRecord.diamonds||0}`],
              ["Diamond Karats",  `${(customerRecord.diamondKarats||0).toFixed(4)} ct`],
              ["Gross / Net Wt",  `${(customerRecord.grossWeight||0).toFixed(3)} / ${(customerRecord.netWeight||0).toFixed(3)} g`],
              ["Labour (Gold)",   customerRecord.labourRateGold ? `₹${customerRecord.labourRateGold}/g` : "—"],
              ["Labour (Silver)", customerRecord.labourRateSilver ? `₹${customerRecord.labourRateSilver}/g` : "—"],
            ].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13, color:theme.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Diamond tracking: deposited / used / returned / remaining ── */}
      {customerRecord && (
        <div style={{ background:"#7EC8E30A", border:"1px solid #7EC8E340", borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#7EC8E3", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600, marginBottom:12 }}>💎 Diamond Tracking</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              ["Deposited", diaDeposited, "#7EC8E3"],
              ["Used (set in bags)", diaUsed, theme.gold],
              ["Returned", diaReturned, theme.danger],
              ["Remaining", diaRemaining, theme.success],
            ].map(([l,v,c]) => (
              <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14, textAlign:"center" }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:c }}>{v.pcs} pcs</div>
                <div style={{ fontSize:12, color:c, marginTop:2 }}>{v.ct.toFixed(4)} ct</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Diamonds used by date (issued into bags) ── */}
      {diaUsageBags.length > 0 && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:"#7EC8E3", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>💎 Diamonds Used — By Date</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 2fr 0.8fr 1fr", padding:"10px 18px", background:theme.surfaceAlt, borderTop:`1px solid ${theme.borderGold}`, gap:8 }}>
            {["Date","Bag / Item","Diamonds","Pcs","Karats"].map(h=>(
              <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase" }}>{h}</span>
            ))}
          </div>
          {diaUsageBags
            .sort((a,b)=>new Date(b.date)-new Date(a.date))
            .map(({ order:o, pcs, ct, date }) => (
              <div key={o._id} onClick={()=>onSelectBag(o._id)}
                style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 2fr 0.8fr 1fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}06`}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(date)}</div>
                <div><span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:theme.gold }}>#{o.bagId}</span><div style={{ fontSize:11, color:theme.textMuted }}>{o.item}</div></div>
                <div style={{ fontSize:12, color:theme.text }}>{o.issuedDiamonds.map(d=>`${d.shapeName}${d.sizeInMM?` ${d.sizeInMM}mm`:""} ×${d.pcs}`).join(", ")}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#7EC8E3" }}>{pcs}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#7EC8E3" }}>{ct.toFixed(4)}</div>
              </div>
            ))}
        </div>
      )}

      {/* ── Metal Account — net balance per metal (deposits − used − delivered) ── */}
      {(goldAcct.deposited>0 || goldAcct.ownCast>0 || goldAcct.delivered>0 || silverAcct.deposited>0 || silverAcct.ownCast>0 || silverAcct.delivered>0) && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>⚖ Metal Account — Net Balance</div>
          <div style={{ display:"grid", gridTemplateColumns:"0.8fr 1fr 1fr 1fr 1fr 1.1fr", padding:"10px 18px", background:theme.surfaceAlt, borderTop:`1px solid ${theme.borderGold}`, gap:8 }}>
            {["Metal","Deposited (+)","Returned (−)","Own Casting (−)","Delivered (−)","Net Balance"].map(h=>(
              <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase" }}>{h}</span>
            ))}
          </div>
          {[["Gold", goldAcct, theme.gold], ["Silver", silverAcct, "#C0C0C0"]].map(([label, a, c]) => (
            (a.deposited>0 || a.returned>0 || a.ownCast>0 || a.delivered>0) && (
              <div key={label} style={{ display:"grid", gridTemplateColumns:"0.8fr 1fr 1fr 1fr 1fr 1.1fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}` }}>
                <div style={{ fontSize:13, color:c, fontWeight:600 }}>{label==="Gold"?"✦":"◆"} {label}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.success }}>{a.deposited.toFixed(3)}g</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.textMuted }}>{a.returned.toFixed(3)}g</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.textMuted }}>{a.ownCast.toFixed(3)}g</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:"#FF8C8C" }}>{a.delivered.toFixed(3)}g</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:a.net>=0?theme.success:theme.danger, fontWeight:700 }}>
                  {a.net>=0?"+":""}{a.net.toFixed(3)}g
                  {a.net<0 && <span style={{ fontSize:10, fontFamily:"'DM Sans'", marginLeft:6, color:theme.danger }}>party owes</span>}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* ── Material ledger: deposits, returns & DELIVERED pieces by date ── */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden", marginBottom:24 }}>
        <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>📋 Material Ledger — Deposits, Returns & Deliveries</div>
        {loadingEntries ? (
          <div style={{ padding:32, textAlign:"center", color:theme.textMuted, fontSize:13 }}>Loading entries…</div>
        ) : ledgerRows.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:theme.textMuted, fontSize:13 }}>No deposit, return or delivery entries recorded.</div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.4fr 2fr 1fr", padding:"10px 18px", background:theme.surfaceAlt, borderTop:`1px solid ${theme.borderGold}`, gap:8 }}>
              {["Date","Receipt / Bag","Type","Details","In / Out"].map(h=>(
                <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase" }}>{h}</span>
              ))}
            </div>
            {ledgerRows.map(row => {
              if (row.kind === "delivery") {
                const meta = ENTRY_META.delivery;
                const o = row.order;
                return (
                  <div key={row._id} onClick={()=>onSelectBag(o._id)} style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.4fr 2fr 1fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${theme.gold}06`}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(row.date)}</div>
                    <div style={{ fontSize:12, color:theme.text }}>Bag #{o.bagId}</div>
                    <div><span style={{ fontSize:11, color:meta.color, background:`${meta.color}15`, border:`1px solid ${meta.color}40`, padding:"2px 9px", borderRadius:10 }}>{meta.icon} {meta.label}</span></div>
                    <div style={{ fontSize:13, color:theme.text }}>{o.item} <span style={{ color:theme.textMuted }}>· made from owner's {row.metal}</span></div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.danger }}>−{row.weight.toFixed(3)}g</div>
                  </div>
                );
              }
              const e = row.entry;
              const meta = ENTRY_META[e.entryType] || { color: theme.gold, icon:"•", label:"Entry" };
              let details = "", inOut = null;
              if (e.entryType === "gold_deposit" || e.entryType === "silver_deposit") {
                details = `${(e.totalWeight||0).toFixed(3)} g ${e.entryType==="gold_deposit"?"gold":"silver"}`;
                inOut = <span style={{ color:theme.success }}>+{(e.totalWeight||0).toFixed(3)}g</span>;
              } else if (e.entryType === "diamond_deposit") {
                details = `${e.totalDiamondPcs||0} pcs · ${(e.totalDiamondKarats||0).toFixed(4)} ct`;
                inOut = <span style={{ color:"#7EC8E3" }}>+{(e.totalDiamondKarats||0).toFixed(4)}ct</span>;
              } else if (e.entryType === "return") {
                const parts = [];
                if (e.returnGold>0)   parts.push(`${e.returnGold.toFixed(3)}g gold`);
                if (e.returnSilver>0) parts.push(`${e.returnSilver.toFixed(3)}g silver`);
                if (e.returnDiamondKarats>0) parts.push(`${e.returnDiamondKarats.toFixed(4)}ct diamonds`);
                details = parts.join(" · ") || "—";
                inOut = <span style={{ color:theme.danger }}>−{((e.returnGold||0)+(e.returnSilver||0)).toFixed(3)}g</span>;
              }
              return (
                <div key={e._id} style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.4fr 2fr 1fr", padding:"12px 18px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}` }}>
                  <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(e.date)}</div>
                  <div style={{ fontSize:12, color:theme.text }}>{e.receiptNo}</div>
                  <div>
                    <span style={{ fontSize:11, color:meta.color, background:`${meta.color}15`, border:`1px solid ${meta.color}40`, padding:"2px 9px", borderRadius:10 }}>{meta.icon} {meta.label}</span>
                  </div>
                  <div style={{ fontSize:13, color:theme.text }}>{details}{e.remark ? <span style={{ color:theme.textMuted }}> — {e.remark}</span> : ""}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16 }}>{inOut}</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Summary stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Completed Bags</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.success }}>{completedBags.length}</div>
          <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>{custOrders.length} total bags</div>
        </div>
        <div style={{ background:theme.surface, border:`2px solid ${theme.gold}40`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Total Labour</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.gold }}>
            ₹{totalLabour.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>all completed bags</div>
        </div>
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Total Loss</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.danger }}>
            {totalWastage.toFixed(3)}g
          </div>
          <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>gold lost in production</div>
        </div>
        {usesOwnerMetal ? (
          <div style={{ background:"#7B5EA712", border:"1px solid #7B5EA750", borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, color:"#B39DDB", textTransform:"uppercase", marginBottom:8 }}>Owner Metal Used</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:"#B39DDB" }}>
              {(totalOwnerGoldUsed + totalOwnerSilverUsed).toFixed(3)}g
            </div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>
              {ownerGoldBags.length + ownerSilverBags.length} bag{ownerGoldBags.length + ownerSilverBags.length > 1 ? "s" : ""} on owner's metal
            </div>
          </div>
        ) : (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Customer Gold</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>
              {customerGoldBalance.toFixed(3)}g
            </div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>current balance</div>
          </div>
        )}
      </div>

      {/* Owner metal detail block — one row per metal actually used */}
      {usesOwnerMetal && (
        <div style={{ background:"#7B5EA710", border:"1px solid #7B5EA750", borderRadius:12, padding:"16px 22px", marginBottom:24 }}>
          <div style={{ fontSize:13, color:"#B39DDB", fontWeight:600, marginBottom:12 }}>
            ✦ Owner's Metal (Laher Jewels) — Tracking
          </div>
          {[
            ownerGoldBags.length   > 0 && ["Gold",   totalOwnerGoldUsed,   totalGoldCollected],
            ownerSilverBags.length > 0 && ["Silver", totalOwnerSilverUsed, totalSilverCollected],
          ].filter(Boolean).map(([metal, used, collected]) => (
            <div key={metal} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:8 }}>
              <div style={{ textAlign:"center", background:"#7B5EA710", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{metal} Sent (Casting)</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:"#B39DDB" }}>
                  {used.toFixed(3)}g
                </div>
                <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>allocated from owner's stock</div>
              </div>
              <div style={{ textAlign:"center", background:"#7B5EA710", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{metal} Delivered to Party</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.success }}>
                  {collected.toFixed(3)}g
                </div>
                <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>final weight of completed items</div>
              </div>
              <div style={{ textAlign:"center", background:"#7B5EA710", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>Production Loss</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.danger }}>
                  {(used - collected).toFixed(3)}g
                </div>
                <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>lost during manufacturing</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed bags table */}
      {completedBags.length === 0 ? (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:48, textAlign:"center", color:theme.textMuted }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:8 }}>No Completed Bags</div>
          <div style={{ fontSize:13 }}>
            {custOrders.length > 0
              ? `${custOrders.length} bag${custOrders.length > 1 ? "s" : ""} in progress — none completed yet.`
              : "No bags found for this customer."}
          </div>
        </div>
      ) : (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"0.6fr 1.4fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1fr", padding:"12px 20px", background:theme.surfaceAlt, gap:8 }}>
            {["Bag ID","Item","Completed","Casting(g)","Final(g)","Loss(g)","Labour (₹)","Gold Source"].map(h => (
              <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.3 }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {completedBags.map((o, i) => {
            const castG   = o.castingGold || o.gramHistory?.[0] || 0;
            const finalG  = o.gramHistory?.length > 0 ? o.gramHistory[o.gramHistory.length - 1] : 0;
            const wastG   = (castG - finalG).toFixed(3);
            const labour  = o.labourTotal || 0;

            return (
              <div
                key={o._id}
                onClick={() => onSelectBag(o._id)}
                style={{ display:"grid", gridTemplateColumns:"0.6fr 1.4fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1fr", padding:"13px 20px", gap:8, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, cursor:"pointer", transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.gold}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Bag ID */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>#{o.bagId}</div>

                {/* Item */}
                <div>
                  <div style={{ fontSize:13, color:theme.text }}>{o.item}</div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>{o.folder}</div>
                </div>

                {/* Completed date */}
                <div style={{ fontSize:12, color:theme.textMuted }}>{fmt(o.updatedAt || o.deliveryDate)}</div>

                {/* Casting gold */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.textMuted }}>
                  {castG > 0 ? `${castG.toFixed(3)}g` : "—"}
                </div>

                {/* Final gold */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>
                  {finalG > 0 ? `${finalG.toFixed(3)}g` : "—"}
                </div>

                {/* Wastage */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.danger }}>
                  {castG > 0 ? `${wastG}g` : "—"}
                </div>

                {/* Labour */}
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.success }}>
                    ₹{labour.toLocaleString("en-IN")}
                  </div>
                  {o.labourCharge > 0 && (
                    <div style={{ fontSize:10, color:theme.textMuted, marginTop:2 }}>₹{o.labourCharge}/g</div>
                  )}
                </div>

                {/* Gold Source */}
                <div>
                  {o.usesOwnerGold ? (
                    <span style={{ fontSize:11, color:"#B39DDB", background:"#7B5EA715", border:"1px solid #7B5EA750", padding:"3px 8px", borderRadius:10 }}>
                      ✦ Owner's Gold
                    </span>
                  ) : (
                    <span style={{ fontSize:11, color:theme.gold, background:`${theme.gold}10`, border:`1px solid ${theme.gold}40`, padding:"3px 8px", borderRadius:10 }}>
                      Customer Gold
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total footer */}
          <div style={{ display:"grid", gridTemplateColumns:"0.6fr 1.4fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1fr", padding:"14px 20px", background:`${theme.gold}08`, borderTop:`2px solid ${theme.gold}30`, gap:8, alignItems:"center" }}>
            <div style={{ fontSize:12, color:theme.gold, fontWeight:700, gridColumn:"1/4" }}>
              TOTAL ({completedBags.length} bags)
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.textMuted }}>
              {completedBags.reduce((s,o)=>s+(o.castingGold||o.gramHistory?.[0]||0),0).toFixed(3)}g
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>
              {completedBags.reduce((s,o)=>s+(o.gramHistory?.length>0?o.gramHistory[o.gramHistory.length-1]:0),0).toFixed(3)}g
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.danger }}>
              {totalWastage.toFixed(3)}g
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold, fontWeight:700 }}>
              ₹{totalLabour.toLocaleString("en-IN")}
            </div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  VIEW 2 — Single Bag Full Detail
// ══════════════════════════════════════════════════════════════════════════════
const BagDetail = ({ order, customers, folders, onBack }) => {
  const customerRecord = customers.find(c => {
    const cId = order.customer?._id || order.customer;
    return String(c._id) === String(cId);
  });
  const folderRecord = folders.find(f => f.name === order.folder);
  const itemRecord   = folderRecord?.items.find(it => it.name === order.item || it.itemNumber === order.itemNumber);

  const castG    = order.castingGold || order.gramHistory?.[0] || 0;
  const currG    = order.gramHistory?.length > 0 ? order.gramHistory[order.gramHistory.length - 1] : 0;
  const wastage  = castG > 0 ? (castG - currG).toFixed(3) : "0.000";
  const isComp   = order.status === "Completed";

  // All orders for this customer
  const allOrders = []; // passed through props not needed here — we just show this bag

  return (
    <div className="fade-in">
      {/* Back */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold }}>
          Bag #{order.bagId} — Full Details
        </div>
        {order.usesOwnerGold && (
          <span style={{ fontSize:11, color:"#B39DDB", background:"#7B5EA715", border:"1px solid #7B5EA750", padding:"3px 10px", borderRadius:12 }}>
            ✦ Using Owner's Gold
          </span>
        )}
        <span className="tag" style={{ marginLeft:"auto", background:isComp?`${theme.success}20`:`${theme.gold}18`, color:isComp?theme.success:theme.gold }}>{order.status}</span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Customer */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>👤 Customer / Party</div>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px 24px" }}>
            {[
              ["Name",          order.customerName],
              ["Company",       customerRecord?.company || "—"],
              ["Phone",         customerRecord?.phone   || "—"],
              ["Gold Balance",  customerRecord ? `${(customerRecord.gold||0).toFixed(3)}g` : "—"],
              ["Diamond Karats",customerRecord ? `${(customerRecord.diamondKarats||0).toFixed(4)} ct` : "—"],
              ["Gold Source",   order.usesOwnerGold ? "Owner's Gold (Laher Jewels)" : "Customer's Own Gold"],
            ].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13, color:l==="Gold Source"&&order.usesOwnerGold?"#B39DDB":theme.text }}>{v||"—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order details */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>📋 Order Details</div>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px 24px" }}>
            {[
              ["Bag ID",       `#${order.bagId}`],
              ["Order Date",   fmt(order.orderDate)],
              ["Delivery Date",fmt(order.deliveryDate)],
              ["Folder",       order.folder],
              ["Item",         order.item],
              ["Item Number",  order.itemNumber || "—"],
              ["Size",         order.size || "—"],
              ["Labour Rate",  order.labourCharge ? `₹${order.labourCharge}/g` : "—"],
              ["Labour Total", order.labourTotal > 0 ? `₹${order.labourTotal.toLocaleString("en-IN")}` : "—"],
            ].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
              </div>
            ))}
          </div>
          {order.notes && <div style={{ padding:"0 18px 16px", fontSize:13, color:theme.textMuted }}><strong style={{color:theme.text}}>Notes:</strong> {order.notes}</div>}
        </div>

        {/* Product */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>💎 Product Details</div>
          <div style={{ padding:"16px 18px", display:"flex", gap:20 }}>
            <div style={{ width:120, height:120, background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {(order.itemImage || itemRecord?.image) ? (
                <img src={order.itemImage || itemRecord.image} alt="" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
              ) : (
                <Icon name="image" size={32} color={theme.borderGold}/>
              )}
            </div>
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px" }}>
              {[
                ["Item Name",  order.item],
                ["Item #",     order.itemNumber || itemRecord?.itemNumber || "—"],
                ["Gross Wt",   itemRecord?.weight ? `${itemRecord.weight}g` : `${order.itemWeight||0}g`],
                ["Net Wt",     itemRecord?.netWeight ? `${itemRecord.netWeight}g` : "—"],
                ["Purity",     itemRecord?.purity || "—"],
                ["Tone",       itemRecord?.tone   || "—"],
                ["Gender",     itemRecord?.gender || "—"],
                ["Designed By",itemRecord?.designedBy || "—"],
              ].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13, color:theme.text }}>{v||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gold tracking */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:theme.gold, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>✦ Gold Tracking</div>
          <div style={{ padding:"16px 18px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                ["Casting Gold", castG > 0 ? `${castG.toFixed(3)}g` : "Not cast", theme.textMuted],
                ["Current Gold", currG > 0 ? `${currG.toFixed(3)}g` : "—", theme.gold],
                ["Loss",         castG > 0 ? `${wastage}g` : "—", theme.danger],
                ["Labour",       order.labourTotal > 0 ? `₹${order.labourTotal.toLocaleString("en-IN")}` : "—", theme.success],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Step-by-step */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {STEPS.map((step, i) => {
                const done    = i < order.currentStep;
                const current = i === order.currentStep && !isComp;
                // Step 0 = Design&Wax (no gram), Step 1 = Casting (gramHistory[0]), Steps 2+ = gramHistory[i-1]
                const gramBefore = i === 1 ? (order.castingGold || 0) : order.gramHistory?.[i - 1] ?? null;
                const gramAfter  = i >= 1 ? order.gramHistory?.[i - 1] ?? null : null;

                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:done?`${theme.success}08`:current?`${theme.gold}08`:"transparent", border:`1px solid ${done?`${theme.success}30`:current?`${theme.gold}30`:theme.borderGold}`, borderRadius:8 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:done?theme.success:current?theme.gold:theme.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, color:done||current?"#0D0B07":theme.textMuted, fontWeight:700 }}>
                      {done ? "✓" : i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                      {/* Design & Wax sub-step info */}
                      {i === 0 && done && (
                        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2, display:"flex", gap:12 }}>
                          <span style={{ color:order.designDone?theme.success:theme.textMuted }}>{order.designDone ? "✓ Design" : "○ Design"}</span>
                          <span style={{ color:order.waxDone?theme.success:theme.textMuted }}>{order.waxDone ? "✓ Wax" : "○ Wax"}</span>
                        </div>
                      )}
                      {/* Casting info */}
                      {i === 1 && done && order.castingGold > 0 && (
                        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                          Allocated: <span style={{color:theme.gold}}>{order.castingGold}g</span>
                          {order.usesOwnerGold && <span style={{color:"#B39DDB", marginLeft:6}}>from Laher Jewels</span>}
                        </div>
                      )}
                      {/* Filing+ step gram info */}
                      {i >= 2 && done && order.gramHistory?.[i-1] !== undefined && order.gramHistory?.[i] !== undefined && (
                        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                          {order.gramHistory[i-1]}g → <span style={{color:theme.gold}}>{order.gramHistory[i]}g</span>
                          <span style={{color:theme.danger, marginLeft:8}}>−{(order.gramHistory[i-1]-order.gramHistory[i]).toFixed(3)}g</span>
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

        {/* Diamonds */}
        {order.diamondShapes?.length > 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ background:theme.surfaceAlt, padding:"10px 18px", fontSize:11, color:"#7EC8E3", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>💎 Diamonds Used</div>
            <div style={{ padding:"16px 18px", display:"flex", flexWrap:"wrap", gap:10 }}>
              {order.diamondShapes.map((s, i) => (
                <div key={i} style={{ background:"#7EC8E310", border:"1px solid #7EC8E340", borderRadius:10, padding:"10px 16px" }}>
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
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN — Party Ledger
// ══════════════════════════════════════════════════════════════════════════════
const PartyLedger = ({ orders, customers, folders }) => {
  const [query,   setQuery]   = useState("");
  const [view,    setView]    = useState("search");    // "search" | "customer" | "bag"
  const [activeCustomer, setActiveCustomer] = useState(null); // customer name string
  const [activeBagId,    setActiveBagId]    = useState(null); // order _id

  // Search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return orders.filter(o =>
      (o.bagId||"").toString().toLowerCase().includes(q) ||
      (o.customerName||"").toLowerCase().includes(q)
    );
  }, [query, orders]);

  // Group by customer name
  const grouped = useMemo(() => {
    const map = {};
    results.forEach(o => {
      const key = o.customerName || "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [results]);

  const openCustomer = (name) => {
    setActiveCustomer(name);
    setView("customer");
  };

  const openBag = (bagId) => {
    setActiveBagId(bagId);
    setView("bag");
  };

  const goBack = () => {
    if (view === "bag" && activeCustomer) {
      setView("customer");
    } else {
      setView("search");
      setActiveCustomer(null);
      setActiveBagId(null);
    }
  };

  // Render customer summary view
  if (view === "customer" && activeCustomer) {
    return (
      <CustomerSummary
        customerName={activeCustomer}
        allOrders={orders}
        customers={customers}
        onBack={goBack}
        onSelectBag={openBag}
      />
    );
  }

  // Render single bag detail view
  if (view === "bag" && activeBagId) {
    const bagOrder = orders.find(o => o._id === activeBagId);
    if (!bagOrder) return null;
    return (
      <BagDetail
        order={bagOrder}
        customers={customers}
        folders={folders}
        onBack={goBack}
      />
    );
  }

  // ── SEARCH VIEW (default) ──────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div className="section-title">Party Ledger</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>
          Search by Bag ID or party name · Click a customer name to see their labour summary
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", zIndex:1 }}>
          <Icon name="search" size={18} color={theme.textMuted}/>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by Bag ID (e.g. 42) or Party Name (e.g. Mehta)..."
          autoFocus
          style={{ width:"100%", padding:"14px 16px 14px 48px", background:theme.surface, border:`1.5px solid ${query?theme.gold:theme.borderGold}`, borderRadius:12, color:theme.text, fontFamily:"'DM Sans'", fontSize:15, outline:"none", transition:"border-color 0.2s" }}
        />
        {query && (
          <button onClick={()=>setQuery("")} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:20 }}>✕</button>
        )}
      </div>

      {/* Empty state */}
      {!query && (
        <div style={{ background:theme.surface, border:`1px dashed ${theme.borderGold}`, borderRadius:14, padding:64, textAlign:"center", color:theme.textMuted }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:theme.borderGold, marginBottom:16 }}>✦</div>
          <div style={{ fontSize:16, marginBottom:8, color:theme.text }}>Search any bag or party</div>
          <div style={{ fontSize:13 }}>Type a Bag ID or customer name to instantly find their bags.</div>
          <div style={{ fontSize:12, color:theme.textMuted, marginTop:8 }}>
            💡 Click a <strong style={{color:theme.gold}}>customer name</strong> to view their completed bags with full labour summary.
          </div>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:40, textAlign:"center", color:theme.textMuted }}>
          No bags found for "{query}"
        </div>
      )}

      {/* Results grouped by customer */}
      {query && results.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ fontSize:12, color:theme.textMuted }}>
            {results.length} bag{results.length>1?"s":""} found across {Object.keys(grouped).length} customer{Object.keys(grouped).length>1?"s":""}
          </div>

          {Object.entries(grouped).map(([cname, bags]) => {
            const completedCount = bags.filter(b => b.status === "Completed").length;
            const usesOwner      = bags.some(b => b.usesOwnerGold);

            return (
              <div key={cname} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>

                {/* ── Customer name header — BIG and CLICKABLE ── */}
                <div
                  onClick={() => openCustomer(cname)}
                  style={{ padding:"18px 22px", background:theme.surfaceAlt, borderBottom:`1px solid ${theme.borderGold}`, cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${theme.gold}10`}
                  onMouseLeave={e => e.currentTarget.style.background = theme.surfaceAlt}
                >
                  {/* Big customer name */}
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.gold, lineHeight:1 }}>
                    {cname}
                  </div>

                  {/* Meta tags */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:theme.textMuted, background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, padding:"3px 10px", borderRadius:12 }}>
                      {bags.length} bag{bags.length>1?"s":""}
                    </span>
                    {completedCount > 0 && (
                      <span style={{ fontSize:12, color:theme.success, background:`${theme.success}12`, border:`1px solid ${theme.success}40`, padding:"3px 10px", borderRadius:12 }}>
                        {completedCount} completed
                      </span>
                    )}
                    {usesOwner && (
                      <span style={{ fontSize:11, color:"#B39DDB", background:"#7B5EA715", border:"1px solid #7B5EA750", padding:"3px 10px", borderRadius:12 }}>
                        ✦ Owner's Gold
                      </span>
                    )}
                  </div>

                  {/* Arrow + hint */}
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:theme.gold }}>View Labour Summary →</span>
                  </div>
                </div>

                {/* Bag cards under this customer */}
                <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {bags.map(o => {
                    const isComp  = o.status === "Completed";
                    const castG   = o.castingGold || o.gramHistory?.[0] || 0;

                    return (
                      <div
                        key={o._id}
                        onClick={() => openBag(o._id)}
                        style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 16px", background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, cursor:"pointer", transition:"all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = theme.gold; e.currentTarget.style.background = `${theme.gold}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.borderGold; e.currentTarget.style.background = theme.surfaceAlt; }}
                      >
                        {/* Bag image if exists */}
                        {o.itemImage && (
                          <img src={o.itemImage} alt="" style={{ width:40, height:40, objectFit:"contain", borderRadius:6, border:`1px solid ${theme.borderGold}`, background:theme.bg, padding:2, flexShrink:0 }}/>
                        )}

                        {/* Bag ID + item */}
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
                            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>#{o.bagId}</span>
                            <span style={{ fontSize:13, color:theme.text }}>{o.item}</span>
                            <span style={{ fontSize:11, color:theme.textMuted }}>· {o.folder}</span>
                          </div>
                          <div style={{ display:"flex", gap:12, fontSize:11, color:theme.textMuted }}>
                            <span>{fmt(o.orderDate)}</span>
                            {castG > 0 && <span>Cast: {castG}g</span>}
                            {o.labourTotal > 0 && <span>Labour: ₹{o.labourTotal.toLocaleString("en-IN")}</span>}
                          </div>
                        </div>

                        {/* Status + gold source */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                          <span className="tag" style={{ fontSize:11, background:isComp?`${theme.success}18`:`${theme.gold}15`, color:isComp?theme.success:theme.gold }}>
                            {o.status}
                          </span>
                          {o.usesOwnerGold && (
                            <span style={{ fontSize:10, color:"#B39DDB" }}>✦ Owner's</span>
                          )}
                        </div>

                        <span style={{ fontSize:12, color:theme.textMuted }}>→</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartyLedger;
