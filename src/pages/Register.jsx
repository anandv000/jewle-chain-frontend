import React, { useState } from "react";
import { theme } from "../theme";
import { authAPI } from "../services/api";
import Icon from "../components/Icon";
import Field from "../components/Field";

const Register = ({ onGoLogin, onVerifyNeeded }) => {
  const [form,    setForm]    = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name    = "Full name is required.";
    if (!form.email.trim())             e.email   = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.trim())             e.phone   = "Phone number is required.";
    if (!form.password)                 e.password = "Password is required.";
    else if (form.password.length < 6)  e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
      });
      onVerifyNeeded(form.email); // go to verify page
    } catch (err) {
      setErrors({ general: err.response?.data?.error || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => {
    setForm({ ...form, [key]: val });
    setErrors((p) => ({ ...p, [key]: null, general: null }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 28, color: theme.gold, letterSpacing: 2 }}>
            ✦ AtelierGold
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: 2, marginTop: 3 }}>
            JEWELLERY MANAGEMENT
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, color: theme.text, marginBottom: 4 }}>
            Create Admin Account
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>
            A 6-digit verification code will be sent to your Gmail
          </div>
        </div>

        <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <Field label="Full Name *" error={errors.name}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="user" size={15} color={theme.textMuted} />
              </div>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your full name"
                style={{ paddingLeft: 38 }}
                autoFocus
              />
            </div>
          </Field>

          <Field label="Gmail Address *" error={errors.email}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="mail" size={15} color={theme.textMuted} />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="yourgmail@gmail.com"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </Field>

          <Field label="Contact Number *" error={errors.phone}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="phone" size={15} color={theme.textMuted} />
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </Field>

          <Field label="Password *" error={errors.password}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="lock" size={15} color={theme.textMuted} />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 6 characters"
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

          <Field label="Confirm Password *" error={errors.confirmPassword}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="lock" size={15} color={theme.textMuted} />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Repeat your password"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </Field>

          {errors.general && <div className="error-box">{errors.general}</div>}

          {/* Email info note */}
          <div style={{ background: `${theme.gold}0D`, border: `1px solid ${theme.borderGold}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
            📧 A 6-digit verification code will be sent to your Gmail. Make sure it is correct.
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ padding: "13px", fontSize: 15, marginTop: 4, width: "100%" }}
          >
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Sending code...</> : "Register & Send Code →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: theme.textMuted }}>
          Already have an account?{" "}
          <button
            onClick={onGoLogin}
            style={{ background: "none", border: "none", color: theme.gold, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
