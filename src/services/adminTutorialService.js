import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { normalizeTutorialFromFirestore } from "../utils/normalizeTutorial.js";
import dataset from "../../data.json";
import {
  createTutorialDraftFromRaw,
  prepareTutorialForSave,
  validateTutorialDraft,
} from "../utils/validateTutorial.js";

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

export async function importLocalTutorialDataset() {
  if (!isAdminTutorialCrudAvailable()) {
    return { success: false, data: null, error: FIREBASE_REQUIRED_MESSAGE };
  }

  const localTutorials = Array.isArray(dataset.tutorials) ? dataset.tutorials : [];
  const preparedTutorials = [];
  const invalidTutorials = [];

  localTutorials.forEach((rawTutorial) => {
    const draft = createTutorialDraftFromRaw(rawTutorial);
    const validation = validateTutorialDraft(draft, { isCreate: true });
    if (!validation.isValid) {
      invalidTutorials.push({
        id: draft.id || rawTutorial?.id || "unknown",
        errors: validation.errors,
      });
      return;
    }

    preparedTutorials.push(prepareTutorialForSave(draft));
  });

  if (invalidTutorials.length) {
    return {
      success: false,
      data: { imported: 0, failedValidation: invalidTutorials },
      error: `Local dataset validation failed for: ${invalidTutorials.map((tutorial) => tutorial.id).join(", ")}.`,
    };
  }

  try {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    preparedTutorials.forEach((tutorial) => {
      batch.set(doc(db, "tutorials", tutorial.id), {
        ...tutorial,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });

    await batch.commit();

    return {
      success: true,
      data: {
        imported: preparedTutorials.length,
        failedValidation: [],
      },
      error: null,
    };
  } catch (error) {
    return { success: false, data: null, error: getErrorMessage(error) };
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
