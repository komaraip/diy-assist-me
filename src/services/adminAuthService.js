import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseEnabled } from "./firebase.js";

export const GENERIC_ADMIN_LOGIN_ERROR = "Invalid username or password.";

export function normalizeAdminUsername(username) {
  return String(username || "").trim().toLowerCase();
}

export function isAdminAuthConfigured() {
  return isFirebaseEnabled && !!auth && !!db;
}

export function subscribeToAdminAuth(callback) {
  if (!isAdminAuthConfigured()) {
    callback({ user: null, profile: null, error: "Firebase is required for admin login." });
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, profile: null, error: null });
      return;
    }

    try {
      const profileResult = await loadAdminProfile(user.uid);
      if (!profileResult.success) {
        await signOut(auth);
        callback({ user: null, profile: null, error: GENERIC_ADMIN_LOGIN_ERROR });
        return;
      }

      callback({ user, profile: profileResult.profile, error: null });
    } catch {
      await signOut(auth);
      callback({ user: null, profile: null, error: GENERIC_ADMIN_LOGIN_ERROR });
    }
  });
}

export async function loginAdminWithUsername(username, password) {
  if (!isAdminAuthConfigured()) {
    return { success: false, error: "Firebase is required for admin login." };
  }

  const usernameLower = normalizeAdminUsername(username);
  if (!usernameLower || !password) {
    return { success: false, error: GENERIC_ADMIN_LOGIN_ERROR };
  }

  try {
    const lookupSnapshot = await getDoc(doc(db, "adminUsernames", usernameLower));
    if (!lookupSnapshot.exists()) {
      return { success: false, error: GENERIC_ADMIN_LOGIN_ERROR };
    }

    const lookup = lookupSnapshot.data();
    if (!lookup?.isActive || !lookup.email || !lookup.uid) {
      return { success: false, error: GENERIC_ADMIN_LOGIN_ERROR };
    }

    const credential = await signInWithEmailAndPassword(auth, lookup.email, password);
    const profileResult = await loadAdminProfile(credential.user.uid);
    if (!profileResult.success) {
      await signOut(auth);
      return { success: false, error: GENERIC_ADMIN_LOGIN_ERROR };
    }

    return {
      success: true,
      user: credential.user,
      profile: profileResult.profile,
    };
  } catch {
    return { success: false, error: GENERIC_ADMIN_LOGIN_ERROR };
  }
}

export async function loadAdminProfile(uid) {
  if (!isAdminAuthConfigured() || !uid) {
    return { success: false, profile: null };
  }

  const profileSnapshot = await getDoc(doc(db, "admins", uid));
  if (!profileSnapshot.exists()) {
    return { success: false, profile: null };
  }

  const profile = { uid, ...profileSnapshot.data() };
  if (!profile.isActive) {
    return { success: false, profile: null };
  }

  return { success: true, profile };
}

export async function logoutAdmin() {
  if (!auth) return;
  await signOut(auth);
}
