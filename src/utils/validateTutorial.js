export function createEmptyTutorialDraft() {
  return {
    id: `tutorial_${Date.now()}`,
    title: "",
    category: "",
    study_role: "catalog",
    guided_session_priority: false,
    thumbnailUrl: "",
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
    risk_level: "low",
    selection_rationale: "",
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
    study_role: rawTutorial.study_role ?? rawTutorial.studyRole ?? fallback.study_role,
    guided_session_priority: Boolean(rawTutorial.guided_session_priority ?? rawTutorial.guidedSessionPriority),
    thumbnailUrl: rawTutorial.thumbnailUrl ?? rawTutorial.thumbnail_url ?? "",
    source_url: normalizeSourceUrl(rawTutorial.source_url ?? rawTutorial.sourceUrl ?? ""),
    verification_level: rawTutorial.verification_level ?? rawTutorial.verificationLevel ?? "",
    materials: normalizeMaterialDrafts(rawTutorial.materials),
    steps: normalizeStepDrafts(rawTutorial.steps),
    optional_images: normalizeOptionalImages(rawTutorial.optional_images ?? rawTutorial.optionalImages),
    estimated_minutes: rawTutorial.estimated_minutes ?? rawTutorial.estimatedMinutes ?? "",
    risk_level: rawTutorial.risk_level ?? rawTutorial.riskLevel ?? "",
    selection_rationale: rawTutorial.selection_rationale ?? rawTutorial.selectionRationale ?? "",
    active: rawTutorial.active !== false,
  };
}

export function prepareTutorialForSave(draft) {
  return {
    id: String(draft.id || "").trim(),
    title: String(draft.title || "").trim(),
    category: String(draft.category || "").trim(),
    study_role: normalizeStudyRole(draft.study_role || draft.studyRole),
    guided_session_priority: Boolean(draft.guided_session_priority ?? draft.guidedSessionPriority),
    thumbnailUrl: String(draft.thumbnailUrl || draft.thumbnail_url || "").trim(),
    tags: normalizeStringList(draft.tags).filter(Boolean),
    source: String(draft.source || "").trim(),
    source_url: normalizeSourceUrl(draft.source_url || ""),
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
    risk_level: String(draft.risk_level || "low").trim(),
    selection_rationale: String(draft.selection_rationale || "").trim(),
    active: draft.active !== false,
  };
}

export function validateTutorialDraft(draft, { isCreate = false } = {}) {
  const errors = {};
  const id = String(draft.id || "").trim();
  const title = String(draft.title || "").trim();
  const category = String(draft.category || "").trim();
  const rawStudyRole = String(draft.study_role || draft.studyRole || "").trim();
  const studyRole = normalizeStudyRole(rawStudyRole);
  const thumbnailUrl = String(draft.thumbnailUrl || draft.thumbnail_url || "").trim();
  const sourceUrl = normalizeSourceUrl(draft.source_url || "");
  const steps = Array.isArray(draft.steps) ? draft.steps : [];
  const materials = Array.isArray(draft.materials) ? draft.materials : [];

  if (isCreate && !id) {
    errors.id = "Tutorial ID is required.";
  } else if (isCreate && !/^[a-z0-9_-]+$/.test(id)) {
    errors.id = "Use lowercase letters, numbers, underscores, or hyphens only.";
  }

  if (!title) errors.title = "Title is required.";
  if (!category) errors.category = "Category is required.";
  if (!isValidStudyRole(rawStudyRole)) {
    errors.study_role = "Select catalog, core practice, or core measured.";
  }
  if (thumbnailUrl && !isValidUrl(thumbnailUrl)) {
    errors.thumbnailUrl = "Enter a valid thumbnail URL.";
  }
  if (!sourceUrl) {
    errors.source_url = "Source URL is required.";
  } else if (!isValidUrl(sourceUrl)) {
    errors.source_url = "Enter a valid URL.";
  }

  const filledSteps = steps.filter((step) => String(step.step_text || "").trim());
  const filledMaterials = materials.filter((material) => hasAnyMaterialValue(material));
  const estimatedMinutes = Number(draft.estimated_minutes);

  if (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 1) {
    errors.estimated_minutes = "Estimated minutes is required.";
  }

  if (!filledMaterials.length) {
    errors.materials = "Add at least one material.";
  }

  if (filledSteps.length < 3) {
    errors.steps = "Add at least three steps for a study-controlled tutorial.";
  }

  steps.forEach((step, index) => {
    if (!String(step.step_text || "").trim()) {
      errors[`steps.${index}.step_text`] = "Step instruction is required.";
    }
    if (String(step.imageUrl || "").trim() && !String(step.imageAlt || "").trim()) {
      errors[`steps.${index}.imageAlt`] = "Image alt text is required when an image URL is provided.";
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

function normalizeStudyRole(value) {
  const role = String(value || "catalog").trim();
  return isValidStudyRole(role) ? role : "catalog";
}

function isValidStudyRole(value) {
  return ["core_practice", "core_measured", "catalog"].includes(String(value || "").trim());
}

function normalizeSourceUrl(value) {
  const text = String(value || "").trim();
  const markdownMatch = text.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  return markdownMatch?.[2] || markdownMatch?.[1] || text;
}
