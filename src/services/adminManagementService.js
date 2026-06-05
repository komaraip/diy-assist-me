import { createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, isFirebaseEnabled } from "./firebase.js";
import { normalizeAdminUsername } from "./adminAuthService.js";

export async function listAllAdmins() {
  if (!isFirebaseEnabled || !db) {
    return { success: false, error: "Firebase is required.", admins: [] };
  }

  try {
    const snapshot = await getDocs(collection(db, "admins"));
    const admins = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    return { success: true, admins };
  } catch (error) {
    return { success: false, error: error.message, admins: [] };
  }
}

export async function createAdminUser({ username, email, password, displayName }) {
  if (!isFirebaseEnabled || !auth || !db) {
    return { success: false, error: "Firebase is required." };
  }

  const usernameLower = normalizeAdminUsername(username);
  if (!usernameLower || !email || !password) {
    return { success: false, error: "Username, email, and password are required." };
  }

  try {
    // Check if username already exists
    const usernameDoc = await getDoc(doc(db, "adminUsernames", usernameLower));
    if (usernameDoc.exists()) {
      return { success: false, error: "Username already exists." };
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Create admin profile
    await setDoc(doc(db, "admins", uid), {
      username: usernameLower,
      email,
      displayName: displayName || username,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // Create username lookup
    await setDoc(doc(db, "adminUsernames", usernameLower), {
      uid,
      email,
      isActive: true,
    });

    return { success: true, uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminUser(uid, username) {
  if (!isFirebaseEnabled || !db) {
    return { success: false, error: "Firebase is required." };
  }

  if (!uid) {
    return { success: false, error: "User ID is required." };
  }

  try {
    // Delete admin profile
    await deleteDoc(doc(db, "admins", uid));

    // Delete username lookup if provided
    if (username) {
      const usernameLower = normalizeAdminUsername(username);
      await deleteDoc(doc(db, "adminUsernames", usernameLower));
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminProfile(uid, updates) {
  if (!isFirebaseEnabled || !db) {
    return { success: false, error: "Firebase is required." };
  }

  if (!uid) {
    return { success: false, error: "User ID is required." };
  }

  try {
    await updateDoc(doc(db, "admins", uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function changeAdminPassword(newPassword) {
  if (!isFirebaseEnabled || !auth) {
    return { success: false, error: "Firebase is required." };
  }

  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "No user is currently signed in." };
  }

  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Made with Bob
