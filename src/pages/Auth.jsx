import React, { useState } from "react";
import { authAPI } from "../services/api";

const Register = ({ onSwitchToLogin, onOTPSent }) => {
  const [form, setForm]     = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    setError("");

    // Basic validation
    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
      });

      // OTP sent — go to verify screen
      onOTPSent(form.email);

    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>✦ AtelierGold</div>
        <div style={styles.subtitle}>JEWELLERY MANAGEMENT</div>

        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.desc}>Fill in your details to get started</p>

        {/* Error */}
        {error && <div style={styles.error}>⚠ {error}</div>}

        {/* Fields */}
        <div style={styles.field}>
          <label style={styles.label}>Full Name *</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Anand V"
            autoFocus
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email Address *</label>
          <input
            style={styles.input}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. anand@gmail.com"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Phone Number</label>
          <input
            style={styles.input}
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9106709507"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password *</label>
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Register & Get OTP →"}
        </button>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <span style={styles.link} onClick={onSwitchToLogin}>Login here</span>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const VerifyOTP = ({ email, onVerified, onSwitchToLogin }) => {
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleVerify = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email, otp });
      const { token, ...user } = res.data.data;

      // Save token and user to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user",  JSON.stringify(user));

      onVerified(user);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      await authAPI.resendOTP({ email });
      setSuccess("New OTP sent to your email!");
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>✦ AtelierGold</div>
        <div style={styles.subtitle}>JEWELLERY MANAGEMENT</div>

        <h2 style={styles.title}>Verify OTP</h2>
        <p style={styles.desc}>
          We sent a 6-digit OTP to<br />
          <strong style={{ color: "#C9A84C" }}>{email}</strong>
        </p>

        {error   && <div style={styles.error}>⚠ {error}</div>}
        {success && <div style={styles.successBox}>✓ {success}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Enter OTP *</label>
          <input
            style={{ ...styles.input, textAlign: "center", fontSize: 28, letterSpacing: 12 }}
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
            placeholder="000000"
            autoFocus
          />
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP ✓"}
        </button>

        <p style={styles.switchText}>
          Didn't receive OTP?{" "}
          <span
            style={{ ...styles.link, opacity: resending ? 0.5 : 1 }}
            onClick={!resending ? handleResend : undefined}
          >
            {resending ? "Sending..." : "Resend OTP"}
          </span>
        </p>

        <p style={styles.switchText}>
          <span style={styles.link} onClick={onSwitchToLogin}>← Back to Login</span>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Login = ({ onLoggedIn, onSwitchToRegister }) => {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({
        email:    form.email,
        password: form.password,
      });
      const { token, ...user } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user",  JSON.stringify(user));

      onLoggedIn(user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>✦ AtelierGold</div>
        <div style={styles.subtitle}>JEWELLERY MANAGEMENT</div>

        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.desc}>Login to your account</p>

        {error && <div style={styles.error}>⚠ {error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Email Address *</label>
          <input
            style={styles.input}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. anand@gmail.com"
            autoFocus
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password *</label>
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login →"}
        </button>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={onSwitchToRegister}>Register here</span>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Auth component — handles Register → VerifyOTP → Login flow
// ─────────────────────────────────────────────────────────────────────────────
const Auth = ({ onAuthSuccess }) => {
  const [screen, setScreen] = useState("login");   // "login" | "register" | "verify"
  const [pendingEmail, setPendingEmail] = useState("");

  const handleOTPSent = (email) => {
    setPendingEmail(email);
    setScreen("verify");
  };

  const handleVerified = (user) => {
    onAuthSuccess(user);
  };

  const handleLoggedIn = (user) => {
    onAuthSuccess(user);
  };

  if (screen === "register") {
    return (
      <Register
        onSwitchToLogin={() => setScreen("login")}
        onOTPSent={handleOTPSent}
      />
    );
  }

  if (screen === "verify") {
    return (
      <VerifyOTP
        email={pendingEmail}
        onVerified={handleVerified}
        onSwitchToLogin={() => setScreen("login")}
      />
    );
  }

  return (
    <Login
      onLoggedIn={handleLoggedIn}
      onSwitchToRegister={() => setScreen("register")}
    />
  );
};

export default Auth;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    minHeight:       "100vh",
    background:      "#0D0B07",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    padding:         20,
    fontFamily:      "'DM Sans', sans-serif",
  },
  card: {
    background:   "#151209",
    border:       "1px solid #3A2E15",
    borderRadius: 20,
    padding:      40,
    width:        "100%",
    maxWidth:     440,
  },
  logo: {
    fontFamily:  "'Cormorant Garamond', serif",
    fontSize:    26,
    color:       "#C9A84C",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize:     11,
    color:        "#8A7A5A",
    letterSpacing: 1,
    marginBottom: 28,
  },
  title: {
    fontSize:    22,
    fontWeight:  500,
    color:       "#F0E8D5",
    marginBottom: 6,
  },
  desc: {
    fontSize:    14,
    color:       "#8A7A5A",
    marginBottom: 28,
    lineHeight:  1.6,
  },
  field: {
    display:       "flex",
    flexDirection: "column",
    gap:           6,
    marginBottom:  18,
  },
  label: {
    fontSize:     11,
    color:        "#8A7A5A",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    background:   "#0D0B07",
    border:       "1px solid #3A2E15",
    color:        "#F0E8D5",
    padding:      "11px 14px",
    borderRadius: 8,
    fontFamily:   "'DM Sans', sans-serif",
    fontSize:     14,
    outline:      "none",
    width:        "100%",
    boxSizing:    "border-box",
  },
  btn: {
    width:        "100%",
    padding:      "13px",
    background:   "linear-gradient(135deg, #9A7A2E, #C9A84C)",
    color:        "#0D0B07",
    border:       "none",
    borderRadius: 8,
    fontFamily:   "'DM Sans', sans-serif",
    fontWeight:   500,
    fontSize:     15,
    cursor:       "pointer",
    marginTop:    8,
    marginBottom: 20,
  },
  error: {
    background:   "#C94C4C15",
    border:       "1px solid #C94C4C40",
    color:        "#C94C4C",
    padding:      "10px 14px",
    borderRadius: 8,
    fontSize:     13,
    marginBottom: 18,
  },
  successBox: {
    background:   "#4CC97A15",
    border:       "1px solid #4CC97A40",
    color:        "#4CC97A",
    padding:      "10px 14px",
    borderRadius: 8,
    fontSize:     13,
    marginBottom: 18,
  },
  switchText: {
    textAlign: "center",
    fontSize:  13,
    color:     "#8A7A5A",
    margin:    0,
  },
  link: {
    color:  "#C9A84C",
    cursor: "pointer",
  },
};
