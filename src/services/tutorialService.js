import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseEnabled } from "./firebase.js";
import { tutorials } from "../seed/tutorials.js";
import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";
import { normalizeTutorialFromFirestore } from "../utils/normalizeTutorial.js";

const FIREBASE_FALLBACK_WARNING = "We could not refresh tutorials online. Showing saved tutorials instead.";
const FIREBASE_EMPTY_FALLBACK_WARNING = "No online tutorials were available. Showing saved tutorials instead.";
const LOCAL_CONFIG_WARNING = "Showing saved tutorials.";

export async function listTutorials() {
  if (!isFirebaseEnabled || !db) {
    return serviceSuccess(getActiveLocalTutorials(), "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const snapshot = await getDocs(collection(db, "tutorials"));
    const data = snapshot.docs
      .map((doc) => normalizeTutorialFromFirestore(doc.id, doc.data()))
      .filter((tutorial) => tutorial.active);
    if (!data.length) {
      return serviceSuccess(getActiveLocalTutorials(), "local", FIREBASE_EMPTY_FALLBACK_WARNING);
    }
    return serviceSuccess(data, "firebase");
  } catch (error) {
    return serviceSuccess(getActiveLocalTutorials(), "local", FIREBASE_FALLBACK_WARNING);
  }
}

export async function getTutorialById(id) {
  if (!id) {
    return serviceFailure("Tutorial id is required.", isFirebaseEnabled ? "firebase" : "local");
  }

  if (!isFirebaseEnabled || !db) {
    const tutorial = findLocalTutorial(id);
    if (!tutorial) return serviceFailure("Tutorial not found.", "local");
    return serviceSuccess(tutorial, "local", LOCAL_CONFIG_WARNING);
  }

  try {
    const snapshot = await getDocs(collection(db, "tutorials"));
    const data = snapshot.docs
      .map((doc) => normalizeTutorialFromFirestore(doc.id, doc.data()))
      .find((tutorial) => tutorial.id === id || tutorial.slug === id);

    if (!data) {
      const fallbackTutorial = findLocalTutorial(id);
      if (fallbackTutorial) {
        return serviceSuccess(fallbackTutorial, "local", FIREBASE_EMPTY_FALLBACK_WARNING);
      }
      return serviceFailure("Tutorial not found.", "firebase");
    }

    return serviceSuccess(data, "firebase");
  } catch (error) {
    const tutorial = findLocalTutorial(id);
    if (!tutorial) {
      return serviceFailure(error, "local", null, FIREBASE_FALLBACK_WARNING);
    }
    return serviceSuccess(tutorial, "local", FIREBASE_FALLBACK_WARNING);
  }
}

function getActiveLocalTutorials() {
  return tutorials.filter((tutorial) => tutorial.active);
}

function findLocalTutorial(id) {
  return tutorials.find((tutorial) => tutorial.id === id || tutorial.slug === id) || null;
}
