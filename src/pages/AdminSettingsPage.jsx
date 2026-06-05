import { AlertCircle, Check, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../components/admin/AdminAuthContext.jsx";
import {
  changeAdminPassword,
  createAdminUser,
  deleteAdminUser,
  listAllAdmins,
  updateAdminProfile,
} from "../services/adminManagementService.js";

export function AdminSettingsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="eyebrow">Settings</p>
        <p>Manage your account settings and admin users.</p>
      </div>

      <div className="settings-grid">
        <AccountSettings />
        <ManageAdmins />
      </div>
    </section>
  );
}

function AccountSettings() {
  const { adminProfile } = useAdminAuth();
  const [displayName, setDisplayName] = useState(adminProfile?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (adminProfile?.displayName) {
      setDisplayName(adminProfile.displayName);
    }
  }, [adminProfile]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsUpdating(true);

    const result = await updateAdminProfile(adminProfile.uid, { displayName });

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile." });
    }

    setIsUpdating(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setIsUpdating(true);
    const result = await changeAdminPassword(newPassword);

    if (result.success) {
      setMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: result.error || "Failed to change password." });
    }

    setIsUpdating(false);
  }

  return (
    <section className="admin-panel">
      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: "", text: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-panel-heading">
        <div>
          <h2>Profile Settings</h2>
        </div>
      </div>

      <div className="admin-panel-content">
        <form onSubmit={handleUpdateProfile} className="settings-section">
          <label className="field-label">
            Display Name
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="button primary-button" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>

        <form onSubmit={handleChangePassword} className="settings-section">
          <div className="form-grid">
            <label className="field-label">
              New Password
              <div className="password-input-wrap">
                <input
                  type={showPasswords ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="field-label">
              Confirm New Password
              <input
                type={showPasswords ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="button primary-button" disabled={isUpdating || !newPassword}>
              {isUpdating ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function ManageAdmins() {
  const { adminProfile } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setIsLoading(true);
    const result = await listAllAdmins();
    if (result.success) {
      setAdmins(result.admins);
    }
    setIsLoading(false);
  }

  async function handleDeleteAdmin(uid, username) {
    if (uid === adminProfile?.uid) {
      setMessage({ type: "error", text: "You cannot delete your own account." });
      return;
    }

    if (!confirm(`Are you sure you want to delete admin user "${username}"?`)) {
      return;
    }

    const result = await deleteAdminUser(uid, username);
    if (result.success) {
      setMessage({ type: "success", text: "Admin user deleted successfully." });
      loadAdmins();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete admin user." });
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          {/* <p className="eyebrow">Admin Management</p> */}
          <h2>Manage Admin Users</h2>
        </div>
        <button type="button" className="button primary-button" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      <div className="settings-content">
        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage({ type: "", text: "" })}>
              <X size={16} />
            </button>
          </div>
        )}

        {showAddForm && (
          <AddAdminForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              setMessage({ type: "success", text: "Admin user created successfully." });
              loadAdmins();
            }}
            onError={(error) => setMessage({ type: "error", text: error })}
          />
        )}

        {isLoading ? (
          <p className="status-note">Loading admin users...</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table compact-admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.uid}>
                    <td>
                      <strong>{admin.username}</strong>
                      {admin.uid === adminProfile?.uid && (
                        <span className="badge-current"> (You)</span>
                      )}
                    </td>
                    <td>{admin.displayName || "-"}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`badge ${admin.isActive ? "badge-active" : "badge-inactive"}`}>
                        {admin.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(admin.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="button secondary-action danger-action"
                        onClick={() => handleDeleteAdmin(admin.uid, admin.username)}
                        disabled={admin.uid === adminProfile?.uid}
                        title={admin.uid === adminProfile?.uid ? "Cannot delete your own account" : "Delete admin"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function AddAdminForm({ onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await createAdminUser(formData);

    if (result.success) {
      onSuccess();
    } else {
      onError(result.error || "Failed to create admin user.");
    }

    setIsSubmitting(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Admin User</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <label className="field-label">
              Username *
              <input
                type="text"
                id="add-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </label>

            <label className="field-label">
              Email *
              <input
                type="email"
                id="add-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                required
              />
            </label>

            <label className="field-label">
              Password *
              <div className="password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="add-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="field-hint">Minimum 6 characters</span>
            </label>

            <label className="field-label">
              Display Name
              <input
                type="text"
                id="add-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter display name (optional)"
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="button secondary-action" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="button primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }
  if (value.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

// Made with Bob
