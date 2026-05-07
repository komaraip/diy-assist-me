import { createContext, useContext } from "react";

export const AdminAuthContext = createContext({
  adminProfile: null,
  firebaseUser: null,
});

export function AdminAuthProvider({ adminProfile, firebaseUser, children }) {
  return (
    <AdminAuthContext.Provider value={{ adminProfile, firebaseUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
