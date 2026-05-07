import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { normalizeTutorialFromFirestore } from "../utils/normalizeTutorial.js";

const FIREBASE_REQUIRED_MESSAGE = "Firebase is required to manage tutorial content.";

export function isAdminTutorialCrudAvailable() {
  return isFirebaseEnabled && !!db;
}

export async function listAdminTutorials() {
  if (!isAdminTutorialCrudAvailable()) {
    return { success: false, data: [], error: FIREBASE_REQUIRED_MESSAGE };
  }

  try {
    const snapshot = await getDocs(collection(db, "tutorials"));
    const data = snapshot.docs
      .map((documentSnapshot) => {
        const raw = { id: documentSnapshot.id, ...documentSnapshot.data() };
        return {
          id: documentSnapshot.id,
          raw,
          normalized: normalizeTutorialFromFirestore(documentSnapshot.id, documentSnapshot.data()),
        };
      })
      .sort((a, b) => a.normalized.title.localeCompare(b.normalized.title));
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: [], error: getErrorMessage(error) };
  }
}

export async function createAdminTutorial(tutorial) {
  if (!isAdminTutorialCrudAvailable()) {
    return { success: false, error: FIREBASE_REQUIRED_MESSAGE };
  }

  const id = tutorial.id;
  const tutorialRef = doc(db, "tutorials", id);
  const existing = await getDoc(tutorialRef);
  if (existing.exists()) {
    return { success: false, error: "A tutorial with this ID already exists." };
  }

  try {
    await setDoc(tutorialRef, {
      ...tutorial,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateAdminTutorial(id, tutorial) {
  if (!isAdminTutorialCrudAvailable()) {
    return { success: false, error: FIREBASE_REQUIRED_MESSAGE };
  }

  try {
    await updateDoc(doc(db, "tutorials", id), {
      ...tutorial,
      id,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteAdminTutorial(id) {
  if (!isAdminTutorialCrudAvailable()) {
    return { success: false, error: FIREBASE_REQUIRED_MESSAGE };
  }

  try {
    await deleteDoc(doc(db, "tutorials", id));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

function getErrorMessage(error) {
  if (typeof error === "string") return error;
  return error?.message || "Tutorial content could not be saved.";
}
