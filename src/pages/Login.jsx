import React, { useState } from "react";
import { theme } from "../theme";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import Field from "../components/Field";

const Login = ({ onGoRegister, onNeedsVerify }) => {
  const { loginSuccess } = useAuth();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await authAPI.login(form);
      loginSuccess(res.data.token, res.data.admin);
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerify) {
        onNeedsVerify(data.email);
      } else {
        setError(data?.error || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 32, color: theme.gold, letterSpacing: 2 }}>
            ✦ AtelierGold
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, letterSpacing: 2, marginTop: 4 }}>
            JEWELLERY MANAGEMENT
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, color: theme.text, marginBottom: 4 }}>
            Admin Login
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Sign in to your admin account</div>
        </div>

        <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Email Address">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="mail" size={15} color={theme.textMuted} />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }}
                placeholder="yourgmail@gmail.com"
                style={{ paddingLeft: 38 }}
                autoFocus
              />
            </div>
          </Field>

          <Field label="Password">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="lock" size={15} color={theme.textMuted} />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
                placeholder="Your password"
                style={{ paddingLeft: 38, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 12 }}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error && <div className="error-box">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ padding: "13px", fontSize: 15, marginTop: 4, width: "100%" }}
          >
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Signing in...</> : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: theme.textMuted }}>
          Don't have an account?{" "}
          <button
            onClick={onGoRegister}
            style={{ background: "none", border: "none", color: theme.gold, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
