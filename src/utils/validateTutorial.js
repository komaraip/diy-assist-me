export function createEmptyTutorialDraft() {
  return {
    id: `tutorial_${Date.now()}`,
    title: "",
    category: "",
    tags: [""],
    source: "",
    source_url: "",
    verification_level: "",
    summary: "",
    materials: [{ name: "", quantity: "", unit: "", notes: "" }],
    steps: [{ step_index: 1, step_text: "", imageUrl: "", imageAlt: "", keywords: [] }],
    optional_images: [],
    estimated_minutes: "",
    difficulty: "Beginner",
    risk_level: "",
    active: true,
  };
}

export function createTutorialDraftFromRaw(rawTutorial = {}) {
  const fallback = createEmptyTutorialDraft();
  return {
    ...fallback,
    ...rawTutorial,
    id: rawTutorial.id || fallback.id,
    tags: normalizeStringList(rawTutorial.tags),
    source_url: rawTutorial.source_url ?? rawTutorial.sourceUrl ?? "",
    verification_level: rawTutorial.verification_level ?? rawTutorial.verificationLevel ?? "",
    materials: normalizeMaterialDrafts(rawTutorial.materials),
    steps: normalizeStepDrafts(rawTutorial.steps),
    optional_images: normalizeOptionalImages(rawTutorial.optional_images ?? rawTutorial.optionalImages),
    estimated_minutes: rawTutorial.estimated_minutes ?? rawTutorial.estimatedMinutes ?? "",
    risk_level: rawTutorial.risk_level ?? rawTutorial.riskLevel ?? "",
    active: rawTutorial.active !== false,
  };
}

export function prepareTutorialForSave(draft) {
  return {
    id: String(draft.id || "").trim(),
    title: String(draft.title || "").trim(),
    category: String(draft.category || "").trim(),
    tags: normalizeStringList(draft.tags).filter(Boolean),
    source: String(draft.source || "").trim(),
    source_url: String(draft.source_url || "").trim(),
    verification_level: String(draft.verification_level || "").trim(),
    summary: String(draft.summary || "").trim(),
    materials: normalizeMaterialDrafts(draft.materials).filter((material) => hasAnyMaterialValue(material)),
    steps: normalizeStepDrafts(draft.steps)
      .filter((step) => String(step.step_text || "").trim())
      .map((step, index) => ({
        ...step,
        step_index: index + 1,
      })),
    optional_images: normalizeOptionalImages(draft.optional_images).filter((image) => image.url || image.alt),
    estimated_minutes: draft.estimated_minutes === "" ? "" : Number(draft.estimated_minutes),
    difficulty: String(draft.difficulty || "").trim(),
    risk_level: String(draft.risk_level || "").trim(),
    active: draft.active !== false,
  };
}

export function validateTutorialDraft(draft, { isCreate = false } = {}) {
  const errors = {};
  const id = String(draft.id || "").trim();
  const title = String(draft.title || "").trim();
  const category = String(draft.category || "").trim();
  const sourceUrl = String(draft.source_url || "").trim();
  const steps = Array.isArray(draft.steps) ? draft.steps : [];
  const materials = Array.isArray(draft.materials) ? draft.materials : [];

  if (isCreate && !id) {
    errors.id = "Tutorial ID is required.";
  } else if (isCreate && !/^[a-z0-9_-]+$/.test(id)) {
    errors.id = "Use lowercase letters, numbers, underscores, or hyphens only.";
  }

  if (!title) errors.title = "Title is required.";
  if (!category) errors.category = "Category is required.";
  if (!sourceUrl) {
    errors.source_url = "Source URL is required.";
  } else if (!isValidUrl(sourceUrl)) {
    errors.source_url = "Enter a valid URL.";
  }

  if (!steps.length || !steps.some((step) => String(step.step_text || "").trim())) {
    errors.steps = "Add at least one step.";
  }

  steps.forEach((step, index) => {
    if (!String(step.step_text || "").trim()) {
      errors[`steps.${index}.step_text`] = "Step instruction is required.";
    }
  });

  materials.forEach((material, index) => {
    if (hasAnyMaterialValue(material) && !String(material.name || "").trim()) {
      errors[`materials.${index}.name`] = "Material name is required.";
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [""];
  return value.length ? value.map((item) => String(item || "")) : [""];
}

function normalizeMaterialDrafts(materials) {
  if (!Array.isArray(materials) || !materials.length) {
    return [{ name: "", quantity: "", unit: "", notes: "" }];
  }

  return materials.map((material) => {
    if (typeof material === "string") {
      return { name: material, quantity: "", unit: "", notes: "" };
    }
    return {
      name: material?.name || "",
      quantity: material?.quantity || "",
      unit: material?.unit || "",
      notes: material?.notes || "",
    };
  });
}

function normalizeStepDrafts(steps) {
  if (!Array.isArray(steps) || !steps.length) {
    return [{ step_index: 1, step_text: "", imageUrl: "", imageAlt: "", keywords: [] }];
  }

  return steps.map((step, index) => ({
    step_index: Number(step?.step_index || step?.stepNumber || index + 1),
    step_text: step?.step_text || step?.instruction || "",
    imageUrl: step?.imageUrl || step?.image || step?.image_url || "",
    imageAlt: step?.imageAlt || step?.image_alt || "",
    keywords: Array.isArray(step?.keywords) ? step.keywords : [],
  }));
}

function normalizeOptionalImages(images) {
  if (!Array.isArray(images) || !images.length) {
    return [{ url: "", alt: "" }];
  }
  return images.map((image) => {
    if (typeof image === "string") return { url: image, alt: "" };
    return { url: image?.url || image?.imageUrl || "", alt: image?.alt || image?.imageAlt || "" };
  });
}

function hasAnyMaterialValue(material) {
  return Boolean(
    String(material?.name || "").trim() ||
      String(material?.quantity || "").trim() ||
      String(material?.unit || "").trim() ||
      String(material?.notes || "").trim()
  );
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
