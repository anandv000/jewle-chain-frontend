import React, { useState, useEffect } from "react";
import { theme, ALL_PERMISSIONS, PERMISSION_LABELS } from "../theme";
import { adminAPI } from "../services/api";
import Icon from "../components/Icon";

const TEAM_ROLES = [
  { value:"sub-admin", label:"Sub Admin" },
  { value:"hr",        label:"HR" },
  { value:"employee",  label:"Employee" },
];

// ── Permission toggle grid ────────────────────────────────────────────────────
const PermGrid = ({ value, onChange }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
    {ALL_PERMISSIONS.map(p => {
      const on = value.includes(p);
      return (
        <button key={p} type="button"
          onClick={() => onChange(on ? value.filter(x=>x!==p) : [...value, p])}
          style={{
            padding:"5px 12px", borderRadius:8, fontSize:12,
            fontFamily:"'DM Sans',sans-serif", cursor:"pointer", border:"none",
            background: on ? `${theme.gold}20` : theme.surfaceAlt,
            color: on ? theme.gold : theme.textMuted,
            outline: on ? `1.5px solid ${theme.gold}` : `1px solid ${theme.borderGold}`,
            transition:"all 0.2s",
          }}>
          {PERMISSION_LABELS[p] || p}
        </button>
      );
    })}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:16, padding:28, width:"92vw", maxWidth:560, maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:theme.gold }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:theme.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = { "sub-admin":"#4F8EF7", hr:"#2ECC71", employee:theme.textMuted };
  const c = map[role] || theme.textMuted;
  return <span style={{ fontSize:11, color:c, background:`${c}18`, border:`1px solid ${c}40`, padding:"2px 8px", borderRadius:12 }}>{role}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const AdminPanel = () => {
  const [team,      setTeam]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState("");

  // Modals
  const [showAdd,    setShowAdd]    = useState(false);
  const [editMember, setEditMember] = useState(null);  // member obj for edit
  const [resetMember,setResetMember]= useState(null);  // member obj for pwd reset

  // Add form
  const emptyForm = { name:"", email:"", phone:"", password:"", role:"sub-admin", permissions:["dashboard"] };
  const [form,    setForm]    = useState(emptyForm);
  const [formErr, setFormErr] = useState("");

  // Reset pwd
  const [newPwd, setNewPwd] = useState("");

  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3500); };

  const load = async () => {
    try { const r = await adminAPI.getTeam(); setTeam(r.data.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const create = async () => {
    if (!form.name || !form.email || !form.password || !form.role) { setFormErr("Name, email, password, role required."); return; }
    setFormErr("");
    try {
      await adminAPI.createMember(form);
      notify("✓ Team member created"); setShowAdd(false); setForm(emptyForm); load();
    } catch (err) { setFormErr(err.response?.data?.error || "Failed."); }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const update = async () => {
    try {
      await adminAPI.updateMember(editMember._id, {
        name: editMember.name, phone: editMember.phone,
        role: editMember.role, permissions: editMember.permissions,
        isActive: editMember.isActive,
      });
      notify("✓ Updated"); setEditMember(null); load();
    } catch (err) { notify(err.response?.data?.error || "Failed"); }
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const resetPwd = async () => {
    if (!newPwd || newPwd.length < 6) return;
    try {
      await adminAPI.resetPassword(resetMember._id, { password: newPwd });
      notify("✓ Password reset"); setResetMember(null); setNewPwd("");
    } catch {}
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const remove = async (m) => {
    if (!window.confirm(`Remove "${m.name}"?`)) return;
    try { await adminAPI.deleteMember(m._id); notify("✓ Removed"); load(); } catch {}
  };

  const inp = {
    background:theme.bg, border:`1px solid ${theme.borderGold}`,
    color:theme.text, padding:"9px 12px", borderRadius:8,
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", width:"100%",
  };

  if (loading) return <div style={{ padding:40, color:theme.textMuted }}>Loading team...</div>;

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, background:theme.success, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, zIndex:9999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div className="section-title">Team Management</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginTop:4 }}>
            Manage your sub-admins, HR, and employees
          </div>
        </div>
        <button className="btn-primary" onClick={()=>{ setForm(emptyForm); setFormErr(""); setShowAdd(true); }}>
          <span style={{ display:"flex", alignItems:"center", gap:7 }}><Icon name="plus" size={14} color="#0D0B07"/>Add Member</span>
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          ["Total Members",   team.length,                              theme.gold],
          ["Active",          team.filter(m=>m.isActive).length,        theme.success],
          ["Inactive",        team.filter(m=>!m.isActive).length,       theme.danger],
          ["Sub-admins",      team.filter(m=>m.role==="sub-admin").length, "#4F8EF7"],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Team table */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1.8fr 0.8fr 0.7fr 2fr 1.2fr", padding:"12px 20px", background:theme.surfaceAlt }}>
          {["Name","Email","Role","Status","Permissions","Actions"].map(h=>(
            <span key={h} style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.4 }}>{h}</span>
          ))}
        </div>

        {team.length === 0 && (
          <div style={{ padding:48, textAlign:"center", color:theme.textMuted }}>No team members yet. Add your first one above.</div>
        )}

        {team.map(m=>(
          <div key={m._id} style={{ display:"grid", gridTemplateColumns:"1.4fr 1.8fr 0.8fr 0.7fr 2fr 1.2fr", padding:"14px 20px", borderTop:`1px solid ${theme.borderGold}`, alignItems:"center", transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=theme.surfaceAlt}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ fontSize:14, fontWeight:500, color:theme.text }}>{m.name}</div>
            <div style={{ fontSize:12, color:theme.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.email}</div>
            <div><RoleBadge role={m.role}/></div>
            <div>
              <span style={{ fontSize:11, color:m.isActive?theme.success:theme.danger, background:`${m.isActive?theme.success:theme.danger}15`, padding:"2px 8px", borderRadius:10 }}>
                {m.isActive?"Active":"Off"}
              </span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {(m.permissions||[]).slice(0,3).map(p=>(
                <span key={p} style={{ fontSize:10, color:theme.gold, background:`${theme.gold}12`, border:`1px solid ${theme.gold}30`, padding:"1px 6px", borderRadius:8 }}>
                  {PERMISSION_LABELS[p]||p}
                </span>
              ))}
              {(m.permissions||[]).length > 3 && (
                <span style={{ fontSize:10, color:theme.textMuted }}>+{m.permissions.length-3} more</span>
              )}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>setEditMember({...m})} className="btn-edit" style={{ padding:"4px 10px", fontSize:11 }}>Edit</button>
              <button onClick={()=>{ setResetMember(m); setNewPwd(""); }} style={{ background:`#4F8EF715`, border:"1px solid #4F8EF740", color:"#4F8EF7", padding:"4px 10px", borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans'" }}>Pwd</button>
              <button onClick={()=>remove(m)} className="btn-icon-danger"><Icon name="trash" size={12} color={theme.danger}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Member Modal ── */}
      {showAdd && (
        <Modal title="✦ Add Team Member" onClose={()=>setShowAdd(false)}>
          {formErr && <div style={{ color:theme.danger, background:`${theme.danger}12`, padding:"8px 12px", borderRadius:8, marginBottom:14, fontSize:13 }}>⚠ {formErr}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            {[["Full Name *","name","text"],["Email *","email","email"],["Phone","phone","text"],["Password *","password","password"]].map(([l,k,t])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                <input style={inp} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l.replace(" *","")}/>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Role *</div>
            <div style={{ display:"flex", gap:10 }}>
              {TEAM_ROLES.map(r=>(
                <button key={r.value} type="button" onClick={()=>setForm({...form,role:r.value})}
                  style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans'", fontSize:13, fontWeight:form.role===r.value?600:400, background:form.role===r.value?`${theme.gold}20`:theme.surfaceAlt, color:form.role===r.value?theme.gold:theme.textMuted, outline:form.role===r.value?`1.5px solid ${theme.gold}`:`1px solid ${theme.borderGold}` }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Page Access</div>
            <PermGrid value={form.permissions} onChange={p=>setForm({...form,permissions:p})}/>
          </div>

          <div style={{ display:"flex", gap:12 }}>
            <button className="btn-primary" onClick={create} style={{ flex:1, padding:13 }}>Create Member</button>
            <button className="btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Edit Member Modal ── */}
      {editMember && (
        <Modal title={`Edit — ${editMember.name}`} onClose={()=>setEditMember(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            {[["Name","name"],["Phone","phone"]].map(([l,k])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                <input style={inp} value={editMember[k]||""} onChange={e=>setEditMember({...editMember,[k]:e.target.value})} placeholder={l}/>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>Role</div>
            <div style={{ display:"flex", gap:10 }}>
              {TEAM_ROLES.map(r=>(
                <button key={r.value} type="button" onClick={()=>setEditMember({...editMember,role:r.value})}
                  style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans'", fontSize:13, background:editMember.role===r.value?`${theme.gold}20`:theme.surfaceAlt, color:editMember.role===r.value?theme.gold:theme.textMuted, outline:editMember.role===r.value?`1.5px solid ${theme.gold}`:`1px solid ${theme.borderGold}` }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:8 }}>Page Access</div>
            <PermGrid value={editMember.permissions||[]} onChange={p=>setEditMember({...editMember,permissions:p})}/>
          </div>

          {/* Active toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, cursor:"pointer" }}
            onClick={()=>setEditMember({...editMember,isActive:!editMember.isActive})}>
            <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${editMember.isActive?theme.success:theme.borderGold}`, background:editMember.isActive?theme.success:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {editMember.isActive && <Icon name="check" size={12} color="#fff"/>}
            </div>
            <div style={{ fontSize:13, color:theme.text }}>Account Active</div>
            <div style={{ fontSize:12, color:theme.textMuted, marginLeft:"auto" }}>
              {editMember.isActive ? "Member can log in" : "Member cannot log in"}
            </div>
          </div>

          <div style={{ display:"flex", gap:12 }}>
            <button className="btn-primary" onClick={update} style={{ flex:1, padding:13 }}>Save Changes</button>
            <button className="btn-ghost" onClick={()=>setEditMember(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {resetMember && (
        <Modal title={`Reset Password — ${resetMember.name}`} onClose={()=>setResetMember(null)}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5 }}>New Password (min 6 chars)</div>
            <input style={inp} type="text" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Enter new password"/>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button className="btn-primary" onClick={resetPwd} style={{ flex:1, padding:13 }}>Reset Password</button>
            <button className="btn-ghost" onClick={()=>setResetMember(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;
