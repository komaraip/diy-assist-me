import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "diyAssist.adminUnlocked";

export function clearAdminUnlock() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function AdminGate({ children }) {
  const configuredPasscode = import.meta.env.VITE_ADMIN_PASSCODE || "";
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsUnlocked(window.sessionStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (!configuredPasscode.trim()) {
    return (
      <section className="admin-gate-wrap" aria-labelledby="admin-gate-heading">
        <div className="admin-gate">
          <span className="admin-gate-icon">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h2 id="admin-gate-heading">Admin passcode is not configured</h2>
          <p>
            Add <code>VITE_ADMIN_PASSCODE</code> to the local environment before using admin or export tools.
          </p>
          <p className="status-note error-note" role="alert">
            Access is locked until the passcode is configured.
          </p>
        </div>
      </section>
    );
  }

  if (isUnlocked) {
    return children;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (enteredPasscode === configuredPasscode) {
      window.sessionStorage.setItem(STORAGE_KEY, "true");
      setIsUnlocked(true);
      setErrorMessage("");
      return;
    }
    setErrorMessage("Incorrect admin passcode.");
  }

  return (
    <section className="admin-gate-wrap" aria-labelledby="admin-gate-heading">
      <form className="admin-gate" onSubmit={handleSubmit}>
        <span className="admin-gate-icon">
          <LockKeyhole aria-hidden="true" />
        </span>
        <h2 id="admin-gate-heading">Researcher admin access</h2>
        <p>Enter the admin passcode to review guided sessions and export session data.</p>
        <label className="field-label">
          Admin passcode
          <input
            type="password"
            value={enteredPasscode}
            onChange={(event) => setEnteredPasscode(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="button primary-button form-action">
          Unlock admin
        </button>
        {errorMessage ? <p className="status-note error-note" role="alert">{errorMessage}</p> : null}
      </form>
    </section>
  );
}
