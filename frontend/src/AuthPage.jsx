import { useState } from "react";
import "./AuthPage.css";

function AuthPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSignup ? "/register" : "/login";

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      if (isSignup) {
        setIsSignup(false);
        setPassword("");
        setError("Account created! Please log in.");
      } else {
        onLogin(data.access_token, data.email, data.expires_in);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="auth-logo">
          <span>🛡️</span>
          <h1>FinSecure</h1>
        </div>

        <div className="brand-content">
          <p className="brand-tag">SMART FINANCIAL PROTECTION</p>
          <h2>
            Your money.
            <br />
            Your security.
            <br />
            <span>Our priority.</span>
          </h2>

          <p className="brand-description">
            Stay one step ahead of financial fraud with intelligent transaction
            monitoring and AI-powered security.
          </p>
        </div>

        <p className="brand-footer">Secure transactions. Smarter decisions.</p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="mobile-logo">🛡️ FinSecure</div>

          <p className="welcome-label">
            {isSignup ? "GET STARTED" : "WELCOME BACK"}
          </p>

          <h2>{isSignup ? "Create your account" : "Sign in to FinSecure"}</h2>

          <p className="auth-subtitle">
            {isSignup
              ? "Create an account to protect your transactions."
              : "Enter your details to access your dashboard."}
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {error && <p className="auth-message">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setShowPassword(false);
                setPassword("");
              }}
            >
              {isSignup ? "Sign in" : "Create account"}
            </span>
          </p>

          <p className="auth-security">
            🔒 Your financial security matters to us.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
