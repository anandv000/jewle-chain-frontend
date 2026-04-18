import React, { useState, useEffect } from "react";
import { hostAPI } from "../services/api";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "../theme";

// ── Mini theme for host panel (always dark-ish, independent) ─────────────────
const C = {
  bg:      "#0A0F1E",
  surface: "#111827",
  alt:     "#1A2234",
  border:  "#2A3650",
  gold:    "#C9A84C",
  text:    "#E8EDF5",
  muted:   "#6B7A99",
  danger:  "#E05555",
  success: "#3ECF8E",
  blue:    "#4F8EF7",
};

const btn = (bg, color="#fff", extra={}) => ({
  background:bg, color, border:"none", borderRadius:8,
  fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
  padding:"8px 18px", cursor:"pointer", ...extra,
});

const inp = {
  background:C.alt, border:`1px solid ${C.border}`, color:C.text,
  padding:"9px 12px", borderRadius:8, fontFamily:"'DM Sans',sans-serif",
  fontSize:13, outline:"none", width:"100%", boxSizing:"border-box",
};

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = { host:"#9B59B6", admin:C.gold, "sub-admin":C.blue, hr:"#2ECC71", employee:C.muted };
  const c = map[role] || C.muted;
  return <span style={{ fontSize:11, color:c, background:`${c}18`, border:`1px solid ${c}40`, padding:"2px 8px", borderRadius:12 }}>{role}</span>;
};

// ── Permission picker ────────────────────────────────────────────────────────
const PermPicker = ({ value, onChange }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
    {ALL_PERMISSIONS.map(p => {
      const on = value.includes(p);
      return (
        <button key={p} type="button"
          onClick={() => onChange(on ? value.filter(x=>x!==p) : [...value, p])}
          style={{ ...btn(on?`${C.gold}20`:"transparent", on?C.gold:C.muted), border:`1px solid ${on?C.gold:C.border}`, padding:"4px 12px", fontSize:12 }}>
          {PERMISSION_LABELS[p] || p}
        </button>
      );
    })}
  </div>
);

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:"92vw", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.gold }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:20, cursor:"pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  HOST PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const Host = () => {
  const [authed,    setAuthed]    = useState(() => !!localStorage.getItem("hostToken"));
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loginErr,  setLoginErr]  = useState("");
  const [loading,   setLoading]   = useState(false);

  const [tab,       setTab]       = useState("admins"); // "admins" | "users"
  const [admins,    setAdmins]    = useState([]);
  const [users,     setUsers]     = useState([]);
  const [toast,     setToast]     = useState("");

  // Modals
  const [showCreate,  setShowCreate]  = useState(false);
  const [showReset,   setShowReset]   = useState(null); // user object
  const [showPerms,   setShowPerms]   = useState(null); // user object
  const [newPerms,    setNewPerms]    = useState([]);

  // Create admin form
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [formErr, setFormErr] = useState("");

  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3500); };

  // ── Login ─────────────────────────────────────────────────────────────────
  const doLogin = async () => {
    setLoginErr(""); setLoading(true);
    try {
      const res = await hostAPI.login({ email, password });
      localStorage.setItem("hostToken", res.data.data.token);
      setAuthed(true);
    } catch (err) { setLoginErr(err.response?.data?.error || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadAdmins = async () => {
    try { const r = await hostAPI.getAdmins(); setAdmins(r.data.data); } catch {}
  };
  const loadUsers = async () => {
    try { const r = await hostAPI.getAllUsers(); setUsers(r.data.data); } catch {}
  };

  useEffect(() => { if (authed) { loadAdmins(); loadUsers(); } }, [authed]);

  // ── Create admin ──────────────────────────────────────────────────────────
  const createAdmin = async () => {
    if (!form.name || !form.email || !form.password) { setFormErr("Name, email, password required"); return; }
    setFormErr("");
    try {
      await hostAPI.createAdmin(form);
      notify("✓ Admin created");
      setShowCreate(false); setForm({ name:"", email:"", phone:"", password:"" });
      loadAdmins(); loadUsers();
    } catch (err) { setFormErr(err.response?.data?.error || "Failed"); }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (user) => {
    try {
      await hostAPI.toggleActive(user._id);
      notify(`${user.isActive ? "Deactivated" : "Activated"}: ${user.name}`);
      loadAdmins(); loadUsers();
    } catch {}
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const [newPwd, setNewPwd] = useState("");
  const doReset = async () => {
    if (!newPwd || newPwd.length < 6) return;
    try {
      await hostAPI.resetPassword(showReset._id, { password: newPwd });
      notify("✓ Password reset"); setShowReset(null); setNewPwd("");
    } catch {}
  };

  // ── Update permissions ────────────────────────────────────────────────────
  const savePerms = async () => {
    try {
      await hostAPI.updatePerms(showPerms._id, { permissions: newPerms });
      notify("✓ Permissions updated"); setShowPerms(null);
      loadAdmins(); loadUsers();
    } catch {}
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const deleteUser = async (user) => {
    if (!window.confirm(`Remove "${user.name}"? This cannot be undone.`)) return;
    try { await hostAPI.deleteUser(user._id); notify("✓ User removed"); loadAdmins(); loadUsers(); } catch {}
  };

  const logout = () => { localStorage.removeItem("hostToken"); setAuthed(false); };

  // ─────────────────────────────────────────────────────────────────────────
  //  LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:44, width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.gold }}>✦ Host Panel</div>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, marginTop:5 }}>ATELIERGOLD PLATFORM</div>
        </div>
        {loginErr && <div style={{ color:C.danger, background:`${C.danger}12`, border:`1px solid ${C.danger}30`, padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16 }}>⚠ {loginErr}</div>}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:5 }}>Host Email</div>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="host@email.com" onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:5 }}>Password</div>
          <div style={{ position:"relative" }}>
            <input style={{ ...inp, paddingRight:44 }} type={showPwd?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Host password" onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer" }}>
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
        </div>
        <button onClick={doLogin} disabled={loading} style={{ ...btn(`linear-gradient(135deg,#7B3F1E,${C.gold})`), width:"100%", padding:"13px 0", fontSize:15, boxShadow:`0 4px 20px ${C.gold}30` }}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN HOST DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const displayList = tab === "admins" ? admins : users;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, background:C.success, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:C.gold }}>✦ Host Panel</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Platform-level administration</div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={()=>setShowCreate(true)} style={btn(`linear-gradient(135deg,#7B3F1E,${C.gold})`)}>+ Create Admin</button>
          <button onClick={logout} style={btn("transparent", C.danger, { border:`1px solid ${C.danger}40` })}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, padding:"24px 32px 0" }}>
        {[
          ["Total Admins",   admins.length,                             C.gold],
          ["Active Admins",  admins.filter(a=>a.isActive).length,       C.success],
          ["Total Users",    users.length,                              C.blue],
          ["Inactive",       [...admins,...users].filter(u=>!u.isActive).length, C.danger],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:8 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ padding:"20px 32px 0", display:"flex", gap:4 }}>
        {[["admins","Admins"],["users","All Users"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={btn(tab===k?`${C.gold}20`:"transparent", tab===k?C.gold:C.muted, { border:`1px solid ${tab===k?C.gold:C.border}`, padding:"8px 20px" })}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding:"16px 32px 32px" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1.8fr 0.8fr 0.7fr 1fr 1.4fr", padding:"12px 20px", background:C.alt }}>
            {["Name","Email","Role","Status","Phone","Actions"].map(h=>(
              <span key={h} style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:0.5 }}>{h}</span>
            ))}
          </div>
          {displayList.length === 0 && (
            <div style={{ padding:48, textAlign:"center", color:C.muted }}>No users found.</div>
          )}
          {displayList.map(u=>(
            <div key={u._id} style={{ display:"grid", gridTemplateColumns:"1.6fr 1.8fr 0.8fr 0.7fr 1fr 1.4fr", padding:"14px 20px", borderTop:`1px solid ${C.border}`, alignItems:"center" }}>
              <div style={{ fontSize:14, fontWeight:500 }}>{u.name}</div>
              <div style={{ fontSize:13, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
              <div><RoleBadge role={u.role}/></div>
              <div>
                <span style={{ fontSize:11, color:u.isActive?C.success:C.danger, background:`${u.isActive?C.success:C.danger}15`, padding:"2px 8px", borderRadius:10 }}>
                  {u.isActive?"Active":"Inactive"}
                </span>
              </div>
              <div style={{ fontSize:13, color:C.muted }}>{u.phone||"—"}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button onClick={()=>toggleActive(u)} style={btn(u.isActive?`${C.danger}18`:`${C.success}18`, u.isActive?C.danger:C.success, { padding:"4px 10px", fontSize:11, border:`1px solid ${u.isActive?C.danger:C.success}40` })}>
                  {u.isActive?"Deactivate":"Activate"}
                </button>
                <button onClick={()=>{ setShowReset(u); setNewPwd(""); }} style={btn(`${C.blue}18`, C.blue, { padding:"4px 10px", fontSize:11, border:`1px solid ${C.blue}40` })}>Reset Pwd</button>
                <button onClick={()=>{ setShowPerms(u); setNewPerms(u.permissions||[]); }} style={btn(`${C.gold}18`, C.gold, { padding:"4px 10px", fontSize:11, border:`1px solid ${C.gold}40` })}>Perms</button>
                <button onClick={()=>deleteUser(u)} style={btn(`${C.danger}18`, C.danger, { padding:"4px 10px", fontSize:11, border:`1px solid ${C.danger}40` })}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Admin Modal ── */}
      {showCreate && (
        <Modal title="✦ Create Admin Account" onClose={()=>setShowCreate(false)}>
          {formErr && <div style={{ color:C.danger, background:`${C.danger}12`, padding:"8px 12px", borderRadius:8, marginBottom:14, fontSize:13 }}>⚠ {formErr}</div>}
          {[["Full Name *","name","text","e.g. Anand Kumar"],["Email *","email","email","admin@email.com"],["Phone","phone","text","9106709551"],["Password *","password","password","Min 6 characters"]].map(([l,k,t,ph])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:5 }}>{l}</div>
              <input style={inp} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph}/>
            </div>
          ))}
          <div style={{ display:"flex", gap:12, marginTop:4 }}>
            <button onClick={createAdmin} style={btn(`linear-gradient(135deg,#7B3F1E,${C.gold})`, "#fff", { flex:1, padding:"12px 0" })}>Create Admin</button>
            <button onClick={()=>setShowCreate(false)} style={btn("transparent", C.muted, { border:`1px solid ${C.border}` })}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {showReset && (
        <Modal title={`Reset Password — ${showReset.name}`} onClose={()=>setShowReset(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:5 }}>New Password</div>
            <input style={inp} type="text" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min 6 characters"/>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={doReset} style={btn(C.blue, "#fff", { flex:1, padding:"11px 0" })}>Reset Password</button>
            <button onClick={()=>setShowReset(null)} style={btn("transparent", C.muted, { border:`1px solid ${C.border}` })}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Permissions Modal ── */}
      {showPerms && (
        <Modal title={`Permissions — ${showPerms.name}`} onClose={()=>setShowPerms(null)}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Select which sidebar pages this user can access:</div>
          <PermPicker value={newPerms} onChange={setNewPerms}/>
          <div style={{ display:"flex", gap:12, marginTop:20 }}>
            <button onClick={savePerms} style={btn(`linear-gradient(135deg,#7B3F1E,${C.gold})`, "#fff", { flex:1, padding:"11px 0" })}>Save Permissions</button>
            <button onClick={()=>setShowPerms(null)} style={btn("transparent", C.muted, { border:`1px solid ${C.border}` })}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Host;
