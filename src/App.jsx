import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { theme } from "./theme";
import { customerAPI, folderAPI, orderAPI, diamondFolderAPI } from "./services/api";
import GlobalStyles  from "./components/GlobalStyles";
import Icon          from "./components/Icon";
import Auth          from "./pages/Auth";
import Dashboard     from "./pages/Dashboard";
import Customers     from "./pages/Customers";
import Products      from "./pages/Products";
import CreateOrder   from "./pages/CreateOrder";
import BagWorkflow   from "./pages/BagWorkflow";
import WastageReport from "./pages/WastageReport";
import DiamondShapes from "./pages/DiamondShapes";

const NAV = [
  { id:"dashboard",    path:"/dashboard",    label:"Dashboard",      icon:"dashboard" },
  { id:"customers",    path:"/customers",    label:"Customers",      icon:"customers" },
  { id:"products",     path:"/products",     label:"Products",       icon:"folder"    },
  { id:"diamonds",     path:"/diamonds",     label:"Diamonds",       icon:"diamond"   },
  { id:"create-order", path:"/create-order", label:"Create Order",   icon:"order"     },
  { id:"bag",          path:"/bag",          label:"Bag Workflow",   icon:"bag"       },
  { id:"wastage",      path:"/wastage",      label:"Wastage Report", icon:"wastage"   },
];

const Sidebar = ({ user, onLogout, customers, orders }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ width:240, background:theme.surface, borderRight:`1px solid ${theme.borderGold}`, padding:"28px 16px", display:"flex", flexDirection:"column", gap:4, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
      <div style={{ padding:"0 8px 28px" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold, letterSpacing:1 }}>✦ AtelierGold</div>
        <div style={{ fontSize:11, color:theme.textMuted, marginTop:2 }}>JEWELLERY MANAGEMENT</div>
      </div>
      {NAV.map(n => (
        <div key={n.id} className={`nav-item ${location.pathname===n.path?"active":""}`} onClick={()=>navigate(n.path)}>
          <Icon name={n.icon} size={16} color={location.pathname===n.path?theme.gold:theme.textMuted}/>
          <span>{n.label}</span>
        </div>
      ))}
      <div style={{ marginTop:"auto", borderTop:`1px solid ${theme.borderGold}`, paddingTop:16 }}>
        {user && (
          <div style={{ padding:"0 8px", marginBottom:10 }}>
            <div style={{ fontSize:13, color:theme.text }}>{user.name}</div>
            <div style={{ fontSize:11, color:theme.textMuted }}>{user.email}</div>
          </div>
        )}
        <div style={{ padding:"0 8px", marginBottom:10 }}>
          <div style={{ fontSize:11, color:theme.textMuted }}>{customers} Clients · {orders} Orders</div>
        </div>
        <button onClick={onLogout} style={{ width:"100%", padding:"9px 16px", background:"transparent", color:theme.danger, border:`1px solid #C94C4C40`, borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <Icon name="logout" size={14} color={theme.danger}/> Logout
        </button>
      </div>
    </div>
  );
};

const AppLayout = ({ user, onLogout }) => {
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
          customerAPI.getAll(), folderAPI.getAll(), orderAPI.getAll(), diamondFolderAPI.getAll(),
        ]);
        setCustomers(c.data.data); setFolders(f.data.data);
        setOrders(o.data.data);    setDiamondFolders(df.data.data);
      } catch { setError("Cannot connect to backend. Make sure your server is running."); }
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
      <button onClick={()=>window.location.reload()} style={{ padding:"10px 28px", background:theme.goldDark, color:"#0D0B07", border:"none", borderRadius:8, cursor:"pointer" }}>Try Again</button>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:theme.bg }}>
      <Sidebar user={user} onLogout={onLogout} customers={customers.length} orders={orders.length}/>
      <div style={{ flex:1, padding:"36px 40px", overflowY:"auto" }}>
        <Routes>
          <Route path="/"             element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard"    element={<Dashboard    customers={customers} orders={orders}/>}/>
          <Route path="/customers"    element={<Customers    customers={customers} setCustomers={setCustomers} diamondFolders={diamondFolders}/>}/>
          <Route path="/products"     element={<Products     folders={folders} setFolders={setFolders} diamondFolders={diamondFolders}/>}/>
          <Route path="/diamonds"     element={<DiamondShapes diamondFolders={diamondFolders} setDiamondFolders={setDiamondFolders}/>}/>
          <Route path="/create-order" element={<CreateOrder  customers={customers} folders={folders} orders={orders} setOrders={setOrders} diamondFolders={diamondFolders}/>}/>
          <Route path="/bag"          element={<BagWorkflow  orders={orders} setOrders={setOrders} customers={customers} setCustomers={setCustomers}/>}/>
          <Route path="/wastage"      element={<WastageReport orders={orders} setOrders={setOrders}/>}/>
          <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  return (
    <BrowserRouter>
      <GlobalStyles/>
      {!user
        ? <Auth onAuthSuccess={u => setUser(u)}/>
        : <AppLayout user={user} onLogout={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); }}/>
      }
    </BrowserRouter>
  );
}
