import React, { useState, useRef, useEffect } from "react";
import { theme } from "../theme";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = ({ email, onGoLogin }) => {
  const { loginSuccess } = useAuth();
  const [code,      setCode]      = useState(["", "", "", "", "", ""]);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // resend cooldown
  const inputs = useRef([]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Handle each digit input
  const handleDigit = (idx, val) => {
    const v = val.replace(/\D/, "").slice(-1); // only 1 digit
    const next = [...code];
    next[idx] = v;
    setCode(next);
    setError("");
    if (v && idx < 5) inputs.current[idx + 1]?.focus();
  };

  // Backspace: move to previous
  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  // Paste full code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const verify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) { setError("Please enter all 6 digits."); return; }
    setLoading(true); setError("");
    try {
      const res = await authAPI.verify({ email, code: fullCode });
      loginSuccess(res.data.token, res.data.admin);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed. Try again.");
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (countdown > 0) return;
    setResending(true); setError(""); setSuccess("");
    try {
      await authAPI.resendCode({ email });
      setSuccess("New code sent to your Gmail!");
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ textAlign: "center" }}>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${theme.gold}18`, border: `2px solid ${theme.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ fontSize: 28 }}>📧</span>
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 24, color: theme.text, marginBottom: 8 }}>
          Check Your Gmail
        </div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          We sent a 6-digit verification code to:
        </div>
        <div style={{ fontSize: 14, color: theme.gold, marginBottom: 28, fontWeight: 500 }}>{email}</div>

        {/* OTP inputs */}
        <div className="otp-row" style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputs.current[idx] = el)}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {error   && <div className="error-box"   style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}

        <button
          className="btn-primary"
          onClick={verify}
          disabled={loading || code.join("").length < 6}
          style={{ width: "100%", padding: "13px", fontSize: 15, marginBottom: 16 }}
        >
          {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Verifying...</> : "Verify & Login →"}
        </button>

        {/* Resend */}
        <div style={{ fontSize: 13, color: theme.textMuted }}>
          Didn't receive the code?{" "}
          <button
            onClick={resend}
            disabled={countdown > 0 || resending}
            style={{ background: "none", border: "none", color: countdown > 0 ? theme.textMuted : theme.gold, cursor: countdown > 0 ? "default" : "pointer", fontSize: 13, textDecoration: countdown > 0 ? "none" : "underline" }}
          >
            {resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </button>
        </div>

        <button
          onClick={onGoLogin}
          style={{ marginTop: 20, background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, margin: "20px auto 0" }}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
