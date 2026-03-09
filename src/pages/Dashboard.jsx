import React from "react";
import { theme } from "../theme";
import StatBox from "../components/StatBox";

const Dashboard = ({ customers, orders }) => {
  const totalGold = customers.reduce((s, c) => s + (parseFloat(c.gold) || 0), 0);
  const inProgress = orders.filter(o => o.status === "In Progress").length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div className="section-title" style={{ marginBottom: 4 }}>Dashboard</div>
        <div style={{ color: theme.textMuted, fontSize: 13 }}>Welcome back — Here's what's happening at your Jewel Chain today</div>
      </div>

      {/* Stat boxes */}
      <div className="stat-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatBox label="Total Customers" value={customers.length}    sub="All time"           icon="customers" />
        <StatBox label="Active Orders"   value={inProgress}          sub="In progress"        icon="order"     color="#7AC9A8" />
        <StatBox label="Gold in Custody" value={`${totalGold}g`}     sub="Across all clients" icon="gold"      />
      </div>

      {/* Two column tables */}
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Recent customers */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.borderGold}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 18, marginBottom: 16, color: theme.text }}>
            Recent Customers
          </div>
          {customers.slice(-5).reverse().map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.borderGold}` }}>
              <div>
                <div style={{ fontSize: 14, color: theme.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{c.company || c.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, color: theme.gold }}>{c.gold}g</div>
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>No customers yet</div>
          )}
        </div>

        {/* Recent orders */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.borderGold}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 18, marginBottom: 16, color: theme.text }}>
            Recent Orders
          </div>
          {orders.slice(-5).reverse().map((o, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.borderGold}` }}>
              <div>
                <div style={{ fontSize: 14, color: theme.text }}>{o.customerName}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{o.folder} · {o.item}</div>
              </div>
              <span className="tag" style={{ background: o.status === "Completed" ? `${theme.success}18` : `${theme.gold}18`, color: o.status === "Completed" ? theme.success : theme.gold }}>
                {o.status}
              </span>
            </div>
          ))}
          {orders.length === 0 && (
            <div style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
