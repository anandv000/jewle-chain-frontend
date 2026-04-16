import React from "react";
import { theme, STEPS } from "../theme";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

// ── Stat Box ──────────────────────────────────────────────────────────────────
const StatBox = ({ label, value, sub, icon, color }) => {
  const c = color || theme.gold;
  return (
    <div className="stat-box card-hover fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <span style={{ fontSize:11, color:theme.textMuted, letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
        <div style={{ width:38, height:38, borderRadius:10, background:`${c}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name={icon} size={18} color={c}/>
        </div>
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:c, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:theme.textMuted, marginTop:8 }}>{sub}</div>}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ customers = [], orders = [] }) => {
  const completed  = orders.filter(o => o.status === "Completed");
  const inProgress = orders.filter(o => o.status !== "Completed");

  // Gold & Silver totals across all non-owner customers
  const totalGold   = customers.filter(c=>!c.isOwner).reduce((s,c) => s + (parseFloat(c.gold)||0), 0);
  const totalSilver = customers.filter(c=>!c.isOwner).reduce((s,c) => s + (parseFloat(c.silver)||0), 0);

  // Bags by metal
  const goldBags   = orders.filter(o => (o.metalType||"gold") === "gold").length;
  const silverBags = orders.filter(o => o.metalType === "silver").length;

  // Recent items
  const recentCustomers = [...customers].filter(c=>!c.isOwner).reverse().slice(0, 5);
  const recentOrders    = [...orders].reverse().slice(0, 5);

  // Today's deliveries
  const today = new Date(); today.setHours(0,0,0,0);
  const dueToday = orders.filter(o => {
    if (!o.deliveryDate || o.status === "Completed") return false;
    const d = new Date(o.deliveryDate); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });

  const stepName = (o) => o.currentStep < STEPS.length ? STEPS[o.currentStep] : "Completed";

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div className="section-title">Dashboard</div>
        <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>
          {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatBox label="Total Customers" value={customers.filter(c=>!c.isOwner).length} icon="customers" sub="active parties"/>
        <StatBox label="Active Orders"   value={inProgress.length} icon="bag" color={theme.success} sub="in production"/>
        <StatBox label="Completed"       value={completed.length}  icon="order" color={theme.textMuted} sub="delivered bags"/>
        <StatBox label="Due Today"       value={dueToday.length}   icon="wastage" color={dueToday.length>0?theme.danger:theme.textMuted} sub="bags to deliver"/>
      </div>

      {/* ── Metal & bag summary ─────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {[
          ["Gold in Custody",   `${totalGold.toFixed(2)}g`,   theme.gold,    "across all customers"],
          ["Silver in Custody", `${totalSilver.toFixed(2)}g`, "#C0C0C0",     "across all customers"],
          ["Gold Bags",         `${goldBags}`,                theme.gold,    "total gold orders"],
          ["Silver Bags",       `${silverBags}`,              "#C0C0C0",     "total silver orders"],
        ].map(([l,v,c,sub])=>(
          <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Due today alert ─────────────────────────────────────────────────── */}
      {dueToday.length > 0 && (
        <div style={{ background:`${theme.danger}10`, border:`1px solid ${theme.danger}40`, borderRadius:12, padding:"14px 20px", marginBottom:24 }}>
          <div style={{ fontSize:13, color:theme.danger, fontWeight:600, marginBottom:8 }}>
            ⚠ {dueToday.length} Bag{dueToday.length>1?"s":""} Due Today
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {dueToday.map(o=>(
              <div key={o._id} style={{ background:theme.surface, border:`1px solid ${theme.danger}30`, borderRadius:8, padding:"6px 14px", fontSize:12 }}>
                <span style={{ color:theme.gold, fontFamily:"'Cormorant Garamond',serif" }}>#{o.bagId}</span>
                <span style={{ color:theme.text, marginLeft:8 }}>{o.customerName}</span>
                <span style={{ color:theme.textMuted, marginLeft:8 }}>{o.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Two panels: Recent Customers + Recent Orders ─────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Recent Customers */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${theme.borderGold}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>✦ Recent Customers</div>
            <span style={{ fontSize:11, color:theme.textMuted }}>{customers.filter(c=>!c.isOwner).length} total</span>
          </div>
          {recentCustomers.length === 0 ? (
            <div style={{ padding:32, textAlign:"center", color:theme.textMuted, fontSize:13 }}>No customers yet</div>
          ) : recentCustomers.map((c,i)=>(
            <div key={c._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderBottom:i<recentCustomers.length-1?`1px solid ${theme.borderGold}`:"none", transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=theme.surfaceAlt}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div>
                <div style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{c.name}</div>
                <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>{c.company||"—"} · {c.phone}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {c.gold > 0  && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:theme.gold }}>{c.gold.toFixed(2)}g ✦</div>}
                {c.silver > 0 && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:"#C0C0C0" }}>{c.silver.toFixed(2)}g ◆</div>}
                {!c.gold && !c.silver && <div style={{ fontSize:12, color:theme.textMuted }}>No stock</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${theme.borderGold}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>✦ Recent Orders</div>
            <span style={{ fontSize:11, color:theme.textMuted }}>{orders.length} total</span>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding:32, textAlign:"center", color:theme.textMuted, fontSize:13 }}>No orders yet</div>
          ) : recentOrders.map((o,i)=>{
            const isComp = o.status === "Completed";
            const mc     = o.metalType === "silver" ? "#C0C0C0" : theme.gold;
            return (
              <div key={o._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderBottom:i<recentOrders.length-1?`1px solid ${theme.borderGold}`:"none", transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=theme.surfaceAlt}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:mc }}>#{o.bagId}</span>
                    <span style={{ fontSize:13, color:theme.text }}>{o.customerName}</span>
                    {o.metalType==="silver" && <span style={{ fontSize:10, color:"#C0C0C0" }}>◆</span>}
                  </div>
                  <div style={{ fontSize:11, color:theme.textMuted }}>{o.item} · {stepName(o)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span className="tag" style={{ background:isComp?`${theme.success}20`:`${theme.gold}18`, color:isComp?theme.success:theme.gold, fontSize:11 }}>
                    {o.status}
                  </span>
                  {o.deliveryDate && <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>Due: {fmt(o.deliveryDate)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step progress overview ─────────────────────────────────────────────── */}
      {inProgress.length > 0 && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden", marginTop:20 }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${theme.borderGold}` }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>✦ Production at a Glance</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginTop:3 }}>Bags per workflow step</div>
          </div>
          <div style={{ padding:"14px 20px", display:"flex", gap:8, flexWrap:"wrap" }}>
            {STEPS.map((step,i)=>{
              const count = inProgress.filter(o=>o.currentStep===i).length;
              if (!count) return null;
              return (
                <div key={i} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:100 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:theme.gold }}>{count}</div>
                  <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginTop:4, lineHeight:1.3 }}>{step}</div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
