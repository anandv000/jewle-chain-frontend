import React, { useState } from "react";
import { theme, STEPS } from "../theme";
import { orderAPI } from "../services/api";
import { Modal, Field } from "../components/Modal";
import Icon from "../components/Icon";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const BagWorkflow = ({ orders, setOrders, customers = [], setCustomers }) => {
  const [selectedId,    setSelectedId]    = useState(null);
  const [showGramModal, setShowGramModal] = useState(false);
  const [gramRemaining, setGramRemaining] = useState("");
  const [gramError,     setGramError]     = useState("");
  const [search,        setSearch]        = useState("");
  const [stepFilter,    setStepFilter]    = useState("");

  const order = orders.find(o => o._id === selectedId);

  // ── Live customer gold lookup ─────────────────────────────────────────────
  // customers state is always kept in sync via setCustomers when gold is added
  const getCustomerGold = (customerId) => {
    const c = customers.find(c => c._id === (customerId?._toString?.() || customerId));
    return c?.gold ?? null;
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = search ? (o.bagId || "").toLowerCase().includes(search.toLowerCase()) : true;
    const matchStep   = stepFilter !== "" ? String(o.currentStep) === String(stepFilter) : true;
    return matchSearch && matchStep;
  });

  // ── Confirm step done ─────────────────────────────────────────────────────
  const confirmStep = async () => {
    const remaining = parseFloat(gramRemaining);
    const prev      = order.gramHistory[order.gramHistory.length - 1];
    if (!gramRemaining || isNaN(remaining)) { setGramError("Please enter remaining gold."); return; }
    if (remaining > prev) { setGramError(`Cannot exceed ${prev}g.`); return; }
    if (remaining < 0)    { setGramError("Cannot be negative."); return; }
    try {
      const res = await orderAPI.updateStep(order._id, remaining);
      setOrders(p => p.map(o => o._id === order._id ? res.data.data : o));
      setShowGramModal(false);
      setGramRemaining("");
    } catch (err) {
      setGramError(err.response?.data?.error || "Failed to update.");
    }
  };

  // ── Order Detail View ─────────────────────────────────────────────────────
  if (selectedId && order) {
    const currG      = order.gramHistory[order.gramHistory.length - 1];
    const startG     = order.gramHistory[0];
    const wastage    = (startG - currG).toFixed(2);
    const prevG      = currG;
    const custGold   = getCustomerGold(order.customer);

    return (
      <div className="fade-in">
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <button className="btn-ghost" onClick={() => setSelectedId(null)}>← Orders</button>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>Bag #{order.bagId}</div>
          <div style={{ color:theme.textMuted, fontSize:13 }}>— {order.customerName} · {order.item}</div>
          <span className="tag" style={{ marginLeft:"auto", background:order.status==="Completed"?`${theme.success}20`:`${theme.gold}18`, color:order.status==="Completed"?theme.success:theme.gold }}>{order.status}</span>
        </div>

        {/* Info row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[
            ["ORDER DATE",    fmt(order.orderDate)],
            ["DELIVERY DATE", fmt(order.deliveryDate)],
            ["LABOUR TOTAL",  order.labourTotal > 0 ? `₹${order.labourTotal.toLocaleString()}` : "—"],
            ["ITEM NO.",      order.itemNumber || "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, color:theme.textMuted, marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:14 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Customer Gold Balance card — live from gold entries */}
        {custGold !== null && (
          <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>CUSTOMER GOLD BALANCE (All Entries)</div>
              <div style={{ fontSize:13, color:theme.textMuted }}>{order.customerName}</div>
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>{custGold}g</div>
          </div>
        )}

        {/* Diamond shapes used */}
        {order.diamondShapes?.length > 0 && (
          <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, color:theme.textMuted, marginBottom:10 }}>DIAMONDS USED</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {order.diamondShapes.map((s, i) => (
                <span key={i} className="tag" style={{ background:`#7EC8E315`, border:`1px solid #7EC8E340`, color:"#7EC8E3" }}>
                  {s.shapeName} · {s.sizeInMM && `${s.sizeInMM}mm · `}{s.pcs} pcs
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Item gold tracking (workflow) */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24 }}>
          {[
            ["CURRENT ITEM GOLD", `${currG}g`,  theme.gold],
            ["INITIAL ITEM GOLD", `${startG}g`, theme.textMuted],
            ["TOTAL WASTAGE",     `${wastage}g`, theme.danger],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
              <div style={{ fontSize:11, color:theme.textMuted, marginBottom:8 }}>{label}</div>
              <div className="gram-display" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:theme.textMuted }}>Progress</span>
            <span style={{ fontSize:12, color:theme.gold }}>{order.currentStep}/{STEPS.length} steps</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width:`${(order.currentStep/STEPS.length)*100}%`}}/>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {STEPS.map((step, i) => {
            const done    = i < order.currentStep;
            const current = i === order.currentStep;
            const before  = order.gramHistory[i];
            const after   = order.gramHistory[i + 1];
            return (
              <div key={i} className={`step-item ${done?"done":""}`}>
                <div className={`step-circle ${done?"done":current?"current":""}`}>
                  {done ? <Icon name="check" size={14} color="#0D0B07"/> : i + 1}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:done?theme.text:current?theme.text:theme.textMuted }}>{step}</div>
                  {done && after !== undefined && (
                    <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
                      {before}g → <span style={{ color:theme.gold }}>{after}g</span>
                      <span style={{ color:theme.danger, marginLeft:8 }}>−{(before-after).toFixed(2)}g used</span>
                    </div>
                  )}
                </div>
                {done && <span className="tag" style={{ background:`${theme.success}18`, color:theme.success, fontSize:11 }}>Done</span>}
                {current && order.status !== "Completed" && (
                  <button className="btn-primary" onClick={() => { setGramRemaining(""); setGramError(""); setShowGramModal(true); }}>
                    Mark Done
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {order.status === "Completed" && (
          <div style={{ marginTop:24, background:`${theme.success}12`, border:`1px solid ${theme.success}40`, borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.success }}>✦ Order Complete</div>
            <div style={{ color:theme.textMuted, fontSize:13, marginTop:6 }}>Final: {currG}g · Wastage: {wastage}g</div>
          </div>
        )}

        {/* Gram entry popup */}
        {showGramModal && (
          <Modal title={`✦ Step ${order.currentStep+1}: ${STEPS[order.currentStep]}`} onClose={() => setShowGramModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:theme.surfaceAlt, borderRadius:10, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginBottom:4 }}>GOLD BEFORE THIS STEP</div>
                  <div className="gram-display" style={{ fontSize:32, color:theme.textMuted }}>{prevG}g</div>
                </div>
                <div style={{ fontSize:12, color:theme.textMuted, textAlign:"right" }}>Weigh gold now<br/>enter remaining</div>
              </div>
              <Field label="Remaining Gold After Step (grams)" error={gramError}>
                <input type="number" value={gramRemaining} onChange={e=>{setGramRemaining(e.target.value);setGramError("");}} placeholder={`max: ${prevG}`} autoFocus/>
              </Field>
              {gramRemaining !== "" && !isNaN(parseFloat(gramRemaining)) && (
                <div style={{ background:`${theme.gold}0D`, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, display:"flex", justifyContent:"space-around", alignItems:"center" }}>
                  {[
                    ["BEFORE",    `${prevG}g`,                                        theme.textMuted],
                    [" "],
                    ["USED",      `${(prevG-parseFloat(gramRemaining)).toFixed(2)}g`, theme.danger],
                    [" "],
                    ["REMAINING", `${parseFloat(gramRemaining)}g`,                    theme.gold],
                  ].map((item, idx) => item[1] ? (
                    <div key={idx} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>{item[0]}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:item[2] }}>{item[1]}</div>
                    </div>
                  ) : <div key={idx} style={{ fontSize:20, color:theme.borderGold }}>−</div>)}
                </div>
              )}
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn-primary" onClick={confirmStep} style={{ flex:1 }}>Confirm Step Done</button>
                <button className="btn-ghost" onClick={() => setShowGramModal(false)}>Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Orders List View ──────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div className="section-title">Bag Workflow</div>
          <div style={{ color:theme.textMuted, fontSize:13, marginTop:4 }}>{orders.length} total orders</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}>
            <Icon name="search" size={15} color={theme.textMuted}/>
          </div>
          <input className="search-input" placeholder="Search by Bag ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Icon name="filter" size={15} color={theme.textMuted}/>
          <select value={stepFilter} onChange={e=>setStepFilter(e.target.value)} style={{ width:200 }}>
            <option value="">All Steps</option>
            {STEPS.map((s,i)=><option key={i} value={i}>Step {i+1}: {s}</option>)}
            <option value={STEPS.length}>Completed</option>
          </select>
        </div>
        {(search || stepFilter !== "") && (
          <button className="btn-ghost" onClick={()=>{setSearch("");setStepFilter("");}} style={{ padding:"8px 14px", fontSize:13 }}>
            Clear filters
          </button>
        )}
        <span style={{ marginLeft:"auto", fontSize:13, color:theme.textMuted }}>
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:48, textAlign:"center", color:theme.textMuted }}>
            <Icon name="bag" size={40} color={theme.borderGold}/><br/><br/>
            {orders.length === 0 ? "No orders yet. Create one first!" : "No orders match your filters."}
          </div>
        )}

        {filtered.map(o => {
          const currG    = o.gramHistory[o.gramHistory.length - 1];
          const prog     = (o.currentStep / STEPS.length) * 100;
          const custGold = getCustomerGold(o.customer);

          return (
            <div key={o._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:22, cursor:"pointer" }}
              onClick={() => setSelectedId(o._id)}
            >
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                  {o.itemImage && <img src={o.itemImage} alt="" style={{ width:48, height:48, objectFit:"cover", borderRadius:8, border:`1px solid ${theme.borderGold}` }}/>}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:theme.gold }}>#{o.bagId}</span>
                      <span style={{ fontSize:15 }}>{o.customerName}</span>
                    </div>
                    <div style={{ fontSize:13, color:theme.textMuted }}>{o.folder} · {o.item}</div>
                    <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>
                      {o.currentStep < STEPS.length ? `Step ${o.currentStep + 1}: ${STEPS[o.currentStep]}` : "Completed"}
                      {o.deliveryDate && ` · Due: ${fmt(o.deliveryDate)}`}
                    </div>
                  </div>
                </div>

                {/* Right side: item gold + customer total gold */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:theme.textMuted }}>ITEM GOLD</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{currG}g</div>
                    </div>
                    {custGold !== null && (
                      <div style={{ textAlign:"right", borderLeft:`1px solid ${theme.borderGold}`, paddingLeft:10 }}>
                        <div style={{ fontSize:10, color:theme.textMuted }}>CUSTOMER TOTAL</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#E8C97A" }}>{custGold}g</div>
                      </div>
                    )}
                    <span className="tag" style={{ background:o.status==="Completed"?`${theme.success}20`:`${theme.gold}18`, color:o.status==="Completed"?theme.success:theme.gold }}>{o.status}</span>
                  </div>
                </div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width:`${prog}%`}}/></div>
              <div style={{ fontSize:11, color:theme.textMuted, marginTop:6 }}>Step {o.currentStep}/{STEPS.length}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BagWorkflow;
