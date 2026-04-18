import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { theme } from "./theme";
import { customerAPI, folderAPI, orderAPI, diamondFolderAPI } from "./services/api";
import GlobalStyles    from "./components/GlobalStyles";
import Icon            from "./components/Icon";
import Auth            from "./pages/Auth";
import Dashboard       from "./pages/Dashboard";
import Customers       from "./pages/Customers";
import Products        from "./pages/Products";
import CreateOrder     from "./pages/CreateOrder";
import BagWorkflow     from "./pages/BagWorkflow";
import WastageReport   from "./pages/WastageReport";
import DiamondShapes   from "./pages/DiamondShapes";
import PartyLedger     from "./pages/PartyLedger";
import BagStatusReport from "./pages/BagStatusReport";
import AdminStock      from "./pages/AdminStock";
import AdminPanel      from "./pages/AdminPanel";
import Host            from "./pages/Host";

// All nav items — each has an id matching a permission key
const ALL_NAV = [
  { id:"dashboard",    path:"/dashboard",    label:"Dashboard",         icon:"dashboard" },
  { id:"admin-stock",  path:"/admin-stock",  label:"Admin Stock",        icon:"gold",     ownerBadge:true },
  { id:"customers",    path:"/customers",    label:"Customers",         icon:"customers" },
  { id:"products",     path:"/products",     label:"Products",          icon:"folder"    },
  { id:"diamonds",     path:"/diamonds",     label:"Diamonds",          icon:"diamond"   },
  { id:"create-order", path:"/create-order", label:"Create Order",      icon:"order"     },
  { id:"bag",          path:"/bag",          label:"Bag Workflow",      icon:"bag"       },
  { id:"wastage",      path:"/wastage",      label:"Wastage Report",    icon:"wastage"   },
  { id:"ledger",       path:"/ledger",       label:"Party Ledger",      icon:"search"    },
  { id:"bag-status",   path:"/bag-status",   label:"Bag Status Report", icon:"order"     },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ user, onLogout, customers, orders, isDark, onToggleTheme }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Filter nav by user permissions (admin/host see everything)
  const userPerms = user?.permissions || [];
  const canSeeAll = ["admin","host"].includes(user?.role);
  const nav = ALL_NAV.filter(n => canSeeAll || userPerms.includes(n.id));

  const roleColor = { host:"#9B59B6", admin:theme.gold, "sub-admin":"#4F8EF7", hr:"#2ECC71", employee:theme.textMuted };

  return (
    <div style={{
      width:240, background:theme.surface, borderRight:`1px solid ${theme.borderGold}`,
      padding:"28px 16px", display:"flex", flexDirection:"column", gap:4,
      position:"sticky", top:0, height:"100vh", overflowY:"auto",
      transition:"background 0.25s ease, border-color 0.2s",
    }}>
      {/* Logo */}
      <div style={{ padding:"0 8px 24px" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, letterSpacing:1 }}>✦ AtelierGold</div>
        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>JEWELLERY MANAGEMENT</div>
      </div>

      {/* Nav */}
      {nav.map(n => (
        <div key={n.id} className={`nav-item ${location.pathname===n.path?"active":""}`}
          onClick={()=>navigate(n.path)}
          style={n.id==="admin-stock"?{marginBottom:8, borderBottom:`1px solid ${theme.borderGold}`, paddingBottom:8}:{}}>
          <Icon name={n.icon} size={16} color={location.pathname===n.path?theme.gold:theme.textMuted}/>
          <span>{n.label}</span>
          {n.ownerBadge && (
            <span style={{ fontSize:10, color:"#B39DDB", background:"#7B5EA715", border:"1px solid #7B5EA750", padding:"1px 6px", borderRadius:8, marginLeft:"auto" }}>
              Owner
            </span>
          )}
        </div>
      ))}

      {/* Admin Panel link (admin/host only) */}
      {["admin","host"].includes(user?.role) && (
        <div className={`nav-item ${location.pathname==="/team"?"active":""}`} onClick={()=>navigate("/team")}
          style={{ marginTop:8, borderTop:`1px solid ${theme.borderGold}`, paddingTop:8 }}>
          <Icon name="customers" size={16} color={location.pathname==="/team"?theme.gold:theme.textMuted}/>
          <span>Team Management</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:"auto", borderTop:`1px solid ${theme.borderGold}`, paddingTop:16, display:"flex", flexDirection:"column", gap:8 }}>
        {/* User info */}
        {user && (
          <div style={{ padding:"0 8px 6px" }}>
            <div style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{user.name}</div>
            <div style={{ fontSize:11, color:theme.textMuted, marginTop:1 }}>{user.email}</div>
            <span style={{ fontSize:10, color:roleColor[user.role]||theme.textMuted, background:`${roleColor[user.role]||theme.textMuted}15`, border:`1px solid ${roleColor[user.role]||theme.textMuted}40`, padding:"1px 7px", borderRadius:8, display:"inline-block", marginTop:4 }}>
              {user.role}
            </span>
          </div>
        )}

        {/* Stats */}
        <div style={{ padding:"0 8px 4px", fontSize:11, color:theme.textMuted }}>
          {customers} Clients · {orders} Orders
        </div>

        {/* Theme toggle */}
        <button className="btn-theme" onClick={onToggleTheme}>
          <span style={{ fontSize:16 }}>{isDark ? "☀️" : "🌙"}</span>
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          <div style={{ marginLeft:"auto", width:36, height:20, background:isDark?theme.borderGold:theme.gold, borderRadius:10, position:"relative", transition:"background 0.3s", flexShrink:0 }}>
            <div style={{ position:"absolute", top:3, left:isDark?3:17, width:14, height:14, background:isDark?theme.textMuted:"#0D0B07", borderRadius:"50%", transition:"left 0.3s, background 0.3s" }}/>
          </div>
        </button>

        {/* Logout */}
        <button onClick={onLogout} style={{ width:"100%", padding:"9px 16px", background:"transparent", color:theme.danger, border:`1px solid ${theme.danger}40`, borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <Icon name="logout" size={14} color={theme.danger}/> Logout
        </button>
      </div>
    </div>
  );
};

// ── Permission-guarded route ───────────────────────────────────────────────────
const GuardedRoute = ({ user, permId, children }) => {
  if (["admin","host"].includes(user?.role)) return children;
  if (!user?.permissions?.includes(permId)) return <Navigate to="/dashboard" replace/>;
  return children;
};

// ── App Layout ────────────────────────────────────────────────────────────────
const AppLayout = ({ user, onLogout, isDark, onToggleTheme }) => {
  const [customers,      setCustomers]      = useState([]);
  const [folders,        setFolders]        = useState([]);
  const [orders,         setOrders]         = useState([]);
  const [diamondFolders, setDiamondFolders] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [c,f,o,df] = await Promise.all([
          customerAPI.getAll(), folderAPI.getAll(),
          orderAPI.getAll(), diamondFolderAPI.getAll(),
        ]);
        setCustomers(c.data.data);
        setFolders(f.data.data);
        setOrders(o.data.data);
        setDiamondFolders(df.data.data);
      } catch { setError("Cannot connect to backend."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:theme.bg, flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>✦ AtelierGold</div>
      <div style={{ fontSize:14, color:theme.textMuted }}>Loading...</div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:theme.bg, flexDirection:"column", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:theme.danger }}>⚠ Connection Error</div>
      <div style={{ fontSize:14, color:theme.textMuted, maxWidth:400 }}>{error}</div>
      <button onClick={()=>window.location.reload()} style={{ padding:"10px 28px", background:theme.gold, color:"#0D0B07", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'DM Sans'", fontWeight:600, fontSize:14 }}>Try Again</button>
    </div>
  );

  const regularCustomers = customers.filter(c => !c.isOwner);
  const G = (id) => ({ user, permId:id }); // helper for GuardedRoute props

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:theme.bg, transition:"background 0.25s ease" }}>
      <Sidebar user={user} onLogout={onLogout} customers={regularCustomers.length} orders={orders.length} isDark={isDark} onToggleTheme={onToggleTheme}/>
      <div style={{ flex:1, padding:"36px 40px", overflowY:"auto" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>

          <Route path="/dashboard"    element={<Dashboard      customers={regularCustomers} orders={orders}/>}/>
          <Route path="/admin-stock"  element={<GuardedRoute {...G("admin-stock")}><AdminStock orders={orders}/></GuardedRoute>}/>
          <Route path="/customers"    element={<GuardedRoute {...G("customers")}><Customers customers={regularCustomers} setCustomers={setCustomers} diamondFolders={diamondFolders}/></GuardedRoute>}/>
          <Route path="/products"     element={<GuardedRoute {...G("products")}><Products folders={folders} setFolders={setFolders} diamondFolders={diamondFolders}/></GuardedRoute>}/>
          <Route path="/diamonds"     element={<GuardedRoute {...G("diamonds")}><DiamondShapes diamondFolders={diamondFolders} setDiamondFolders={setDiamondFolders}/></GuardedRoute>}/>
          <Route path="/create-order" element={<GuardedRoute {...G("create-order")}><CreateOrder customers={regularCustomers} folders={folders} orders={orders} setOrders={setOrders} diamondFolders={diamondFolders}/></GuardedRoute>}/>
          <Route path="/bag"          element={<GuardedRoute {...G("bag")}><BagWorkflow orders={orders} setOrders={setOrders} customers={customers}/></GuardedRoute>}/>
          <Route path="/wastage"      element={<GuardedRoute {...G("wastage")}><WastageReport orders={orders} setOrders={setOrders}/></GuardedRoute>}/>
          <Route path="/ledger"       element={<GuardedRoute {...G("ledger")}><PartyLedger orders={orders} customers={regularCustomers} folders={folders}/></GuardedRoute>}/>
          <Route path="/bag-status"   element={<GuardedRoute {...G("bag-status")}><BagStatusReport orders={orders} customers={regularCustomers} folders={folders}/></GuardedRoute>}/>
          <Route path="/team"         element={["admin","host"].includes(user?.role) ? <AdminPanel/> : <Navigate to="/dashboard" replace/>}/>
          <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("atelierDark");
    const val   = saved !== "false";
    if (typeof window !== "undefined") window.__atelierDark = val;
    return val;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (typeof window !== "undefined") window.__atelierDark = next;
      localStorage.setItem("atelierDark", String(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const onAuthSuccess = (u) => {
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  return (
    <div data-theme={isDark?"dark":"light"}>
      <BrowserRouter>
        <GlobalStyles key={isDark?"dark":"light"}/>
        <Routes>
          {/* ── Host panel — completely separate, no sidebar ── */}
          <Route path="/host" element={<Host/>}/>

          {/* ── Main app ── */}
          <Route path="/*" element={
            !user
              ? <Auth onAuthSuccess={onAuthSuccess}/>
              : <AppLayout user={user} onLogout={logout} isDark={isDark} onToggleTheme={toggleTheme}/>
          }/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
