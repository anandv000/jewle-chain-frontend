import React, { useState } from "react";
import { theme } from "../theme";
import { authAPI } from "../services/api";
import { Field } from "../components/Modal";

const Auth = ({ onAuthSuccess }) => {
  const [screen,        setScreen]       = useState("login");
  const [form,          setForm]         = useState({ name:"", email:"", phone:"", password:"", otp:"" });
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");
  const [success,       setSuccess]      = useState("");
  const [pendingEmail,  setPendingEmail] = useState("");

  const go = (screen) => { setScreen(screen); setError(""); setSuccess(""); };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError("Name, email and password are required."); return; }
    setLoading(true); setError("");
    try {
      await authAPI.register({ name:form.name, email:form.email, phone:form.phone, password:form.password });
      setPendingEmail(form.email);
      setSuccess(`OTP sent to ${form.email}`);
      go("verify");
    } catch (err) { setError(err.response?.data?.error || "Registration failed."); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!form.otp || form.otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true); setError("");
    try {
      const res = await authAPI.verifyOTP({ email:pendingEmail, otp:form.otp });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onAuthSuccess(user);
    } catch (err) { setError(err.response?.data?.error || "Invalid OTP."); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await authAPI.login({ email:form.email, password:form.password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onAuthSuccess(user);
    } catch (err) { setError(err.response?.data?.error || "Login failed. Check credentials."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setSuccess("");
    try {
      await authAPI.resendOTP({ email: pendingEmail });
      setSuccess(`OTP resent to ${pendingEmail}`);
    } catch (err) { setError(err.response?.data?.error || "Could not resend."); }
  };

  // Styles use theme Proxy — auto-switch on dark/light toggle
  const s = {
    wrap:    { minHeight:"100vh", background:theme.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, transition:"background 0.25s" },
    card:    { background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:20, padding:44, width:"100%", maxWidth:430, boxShadow:`0 20px 60px rgba(0,0,0,0.3)` },
    inp:     { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"11px 14px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", transition:"border-color 0.2s" },
    btn:     { width:"100%", padding:13, background:`linear-gradient(135deg,${theme.goldDark},${theme.gold})`, color:"#0D0B07", border:"none", borderRadius:9, fontFamily:"'DM Sans'", fontWeight:600, fontSize:15, cursor:"pointer", marginTop:8, marginBottom:16, transition:"all 0.2s" },
    err:     { background:`${theme.danger}15`, border:`1px solid ${theme.danger}40`, color:theme.danger, padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:14 },
    ok:      { background:`${theme.success}15`, border:`1px solid ${theme.success}40`, color:theme.success, padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:14 },
    link:    { color:theme.gold, cursor:"pointer", fontWeight:500 },
    sub:     { textAlign:"center", fontSize:13, color:theme.textMuted, marginTop:4 },
  };

  const Inp = ({ label, type="text", k, ph, extra }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", marginBottom:5, letterSpacing:0.5 }}>{label}</div>
      <input style={{ ...s.inp, ...(extra||{}) }} type={type} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph}
        onFocus={e=>e.target.style.borderColor=theme.gold} onBlur={e=>e.target.style.borderColor=theme.borderGold}/>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Logo */}
        <div style={{ marginBottom:32, textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:theme.gold, letterSpacing:1 }}>✦ AtelierGold</div>
          <div style={{ fontSize:11, color:theme.textMuted, letterSpacing:2, marginTop:4 }}>JEWELLERY MANAGEMENT</div>
        </div>

        {/* Error / Success */}
        {error   && <div style={s.err}>⚠ {error}</div>}
        {success && <div style={s.ok}>✓ {success}</div>}

        {/* ── LOGIN ─────────────────────────────────────────────── */}
        {screen === "login" && <>
          <div style={{ fontSize:20, color:theme.text, fontWeight:500, marginBottom:6 }}>Welcome Back</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>Sign in to your workspace</div>
          <Inp label="Email" type="email" k="email" ph="your@email.com"/>
          <Inp label="Password" type="password" k="password" ph="Your password"/>
          <button style={{ ...s.btn, opacity:loading?0.7:1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Login →"}
          </button>
          <p style={s.sub}>No account? <span style={s.link} onClick={()=>go("register")}>Register here</span></p>
        </>}

        {/* ── REGISTER ──────────────────────────────────────────── */}
        {screen === "register" && <>
          <div style={{ fontSize:20, color:theme.text, fontWeight:500, marginBottom:6 }}>Create Account</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>Fill in your details to get started</div>
          <Inp label="Full Name *" k="name" ph="e.g. Anand Kumar"/>
          <Inp label="Email *" type="email" k="email" ph="your@email.com"/>
          <Inp label="Phone" k="phone" ph="9106709551"/>
          <Inp label="Password *" type="password" k="password" ph="Min 6 characters"/>
          <button style={{ ...s.btn, opacity:loading?0.7:1 }} onClick={handleRegister} disabled={loading}>
            {loading ? "Sending OTP..." : "Register & Get OTP →"}
          </button>
          <p style={s.sub}>Already have an account? <span style={s.link} onClick={()=>go("login")}>Login</span></p>
        </>}

        {/* ── VERIFY OTP ────────────────────────────────────────── */}
        {screen === "verify" && <>
          <div style={{ fontSize:20, color:theme.text, fontWeight:500, marginBottom:6 }}>Verify OTP</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginBottom:24 }}>
            OTP sent to <strong style={{ color:theme.gold }}>{pendingEmail}</strong>
          </div>
          <Inp
            label="Enter 6-digit OTP"
            k="otp"
            ph="000000"
            extra={{ textAlign:"center", fontSize:28, letterSpacing:12 }}
          />
          <button style={{ ...s.btn, opacity:loading?0.7:1 }} onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP ✓"}
          </button>
          <p style={s.sub}>
            Didn't receive?{" "}
            <span style={s.link} onClick={handleResend}>Resend OTP</span>
            {" · "}
            <span style={s.link} onClick={()=>go("login")}>← Back to Login</span>
          </p>
        </>}
      </div>
    </div>
  );
};

export default Auth;
