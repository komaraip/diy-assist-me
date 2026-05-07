import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirebaseConfigStatus } from "../../config/firebaseConfig.js";
import { AdminAuthProvider } from "./AdminAuthContext.jsx";
import { AdminLogin } from "./AdminLogin.jsx";
import {
  loginAdminWithUsername,
  subscribeToAdminAuth,
} from "../../services/adminAuthService.js";

export function AdminGate({ children }) {
  const firebaseStatus = getFirebaseConfigStatus();
  const [authState, setAuthState] = useState({
    isLoading: firebaseStatus.enabled,
    firebaseUser: null,
    adminProfile: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firebaseStatus.enabled) {
      setAuthState({ isLoading: false, firebaseUser: null, adminProfile: null });
      return undefined;
    }

    return subscribeToAdminAuth(({ user, profile, error }) => {
      setAuthState({
        isLoading: false,
        firebaseUser: user,
        adminProfile: profile,
      });
      if (error) {
        setErrorMessage(error);
      } else if (profile) {
        setErrorMessage("");
      }
    });
  }, [firebaseStatus.enabled]);

  async function handleLogin({ username, password }) {
    setIsSubmitting(true);
    setErrorMessage("");
    const result = await loginAdminWithUsername(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setAuthState({
      isLoading: false,
      firebaseUser: result.user,
      adminProfile: result.profile,
    });
  }

  if (!firebaseStatus.enabled) {
    return (
      <section className="admin-gate-wrap" aria-labelledby="admin-gate-heading">
        <div className="admin-gate">
          <span className="admin-gate-icon">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h2 id="admin-gate-heading">Firebase is required for admin login</h2>
          <p>
            Configure Firebase Auth and Firestore before using the admin dashboard.
          </p>
          <p className="status-note error-note" role="alert">
            {firebaseStatus.warning}
          </p>
        </div>
      </section>
    );
  }

  if (authState.isLoading) {
    return (
      <section className="admin-gate-wrap" aria-labelledby="admin-gate-loading">
        <div className="admin-gate">
          <span className="admin-gate-icon">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h2 id="admin-gate-loading">Checking admin session</h2>
          <p className="status-note">Loading admin authentication...</p>
        </div>
      </section>
    );
  }

  if (authState.adminProfile) {
    return (
      <AdminAuthProvider adminProfile={authState.adminProfile} firebaseUser={authState.firebaseUser}>
        {children}
      </AdminAuthProvider>
    );
  }

  return (
    <AdminLogin
      onLogin={handleLogin}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
    />
  );
}
