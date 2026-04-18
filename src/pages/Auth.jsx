import React, { useState } from "react";
import { theme } from "../theme";
import { authAPI } from "../services/api";

const Auth = ({ onAuthSuccess }) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await authAPI.login({ email, password });
      const user = res.data.data;
      localStorage.setItem("token", user.token);
      localStorage.setItem("user", JSON.stringify(user));
      onAuthSuccess(user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check credentials.");
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

  const inp = {
    width:"100%", padding:"11px 14px", boxSizing:"border-box",
    background: theme.bg, border:`1.5px solid ${theme.borderGold}`,
    color: theme.text, borderRadius: 9,
    fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight:"100vh", background:theme.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, transition:"background 0.25s" }}>

      {/* Card */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:20, padding:"44px 40px", width:"100%", maxWidth:420, boxShadow:`0 24px 64px rgba(0,0,0,0.12)` }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold, letterSpacing:1 }}>✦ AtelierGold</div>
          <div style={{ fontSize:11, color:theme.textMuted, letterSpacing:2.5, marginTop:5, textTransform:"uppercase" }}>Jewellery Management</div>
        </div>

        <div style={{ fontSize:20, fontWeight:600, color:theme.text, marginBottom:5 }}>Welcome Back</div>
        <div style={{ fontSize:13, color:theme.textMuted, marginBottom:28 }}>Sign in to your workspace</div>

        {/* Error */}
        {error && (
          <div style={{ background:`${theme.danger}12`, border:`1px solid ${theme.danger}40`, color:theme.danger, padding:"10px 14px", borderRadius:9, fontSize:13, marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, fontWeight:500 }}>Email</div>
          <input
            style={inp} type="email" value={email}
            onChange={e=>setEmail(e.target.value)} onKeyDown={onKey}
            placeholder="your@email.com" autoFocus
            onFocus={e=>e.target.style.borderColor=theme.gold}
            onBlur={e=>e.target.style.borderColor=theme.borderGold}
          />
        </div>

        {/* Password with show/hide toggle */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, fontWeight:500 }}>Password</div>
          <div style={{ position:"relative" }}>
            <input
              style={{ ...inp, paddingRight:46 }}
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={onKey}
              placeholder="Your password"
              onFocus={e=>e.target.style.borderColor=theme.gold}
              onBlur={e=>e.target.style.borderColor=theme.borderGold}
            />
            {/* Eye toggle button */}
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:theme.textMuted, padding:4, display:"flex", alignItems:"center", justifyContent:"center" }}
              title={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? (
                /* Eye-off icon */
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                /* Eye icon */
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:"100%", padding:"13px 0",
            background: loading ? theme.borderGold : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
            color: "#fff", border:"none", borderRadius:10,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15,
            cursor: loading ? "not-allowed" : "pointer",
            transition:"all 0.2s", letterSpacing:0.5,
            boxShadow: loading ? "none" : `0 4px 20px ${theme.gold}40`,
          }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        {/* Footer note */}
        <div style={{ textAlign:"center", marginTop:24, fontSize:12, color:theme.textMuted }}>
          Access is provided by your administrator.
        </div>
      </div>
    </div>
  );
};

export default Auth;
