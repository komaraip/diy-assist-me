import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";

export function AdminLogin({ onLogin, errorMessage = "", isSubmitting = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ username, password });
  }

  return (
    <section className="admin-gate-wrap" aria-labelledby="admin-login-heading">
      <form className="admin-gate admin-login-form" onSubmit={handleSubmit}>
        <span className="admin-gate-icon">
          <LockKeyhole aria-hidden="true" />
        </span>
        <h2 id="admin-login-heading">Admin login</h2>
        <p>Sign in with your admin username and password.</p>

        <label className="field-label">
          Username
          <span className="admin-input-wrap">
            <UserRound aria-hidden="true" />
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              spellCheck="false"
              required
            />
          </span>
        </label>

        <label className="field-label">
          Password
          <span className="admin-input-wrap">
            <LockKeyhole aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </span>
        </label>

        <button type="submit" className="button primary-button form-action" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        {errorMessage ? <p className="status-note error-note" role="alert">{errorMessage}</p> : null}
      </form>
    </section>
  );
}
