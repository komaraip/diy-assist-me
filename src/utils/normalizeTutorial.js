const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516972810927-80185027ca84?auto=format&fit=crop&w=900&q=80",
];

const CATEGORY_LABELS = {
  cooking: "Cooking",
  cleaning: "Cleaning",
  organizing: "Organizing",
};

export function normalizeTutorial(rawTutorial, index = 0) {
  const title = rawTutorial.title || `Tutorial ${index + 1}`;
  const category = CATEGORY_LABELS[rawTutorial.category] || toTitleCase(rawTutorial.category || "general");
  const steps = Array.isArray(rawTutorial.steps) ? rawTutorial.steps : [];
  const estimatedMinutesValue = Number(rawTutorial.estimated_minutes ?? rawTutorial.estimatedMinutes);
  const estimatedMinutes = estimatedMinutesValue > 0 ? estimatedMinutesValue : Math.max(5, steps.length * 5);

  const normalizedSteps = steps.map((step, stepIndex) => {
    const stepNumber = Number(step.step_index || step.stepNumber || stepIndex + 1);
    const instruction = step.step_text || step.instruction || "";
    return {
      stepNumber,
      title: `Step ${stepNumber}`,
      instruction,
      imageUrl: step.imageUrl || step.image || step.image_url || "",
      imageAlt: step.imageAlt || step.image_alt || `${title} step ${stepNumber}`,
      keywords: buildKeywords([title, instruction, ...(rawTutorial.tags || [])]),
      estimatedSeconds: step.estimatedSeconds || 60,
    };
  });

  return {
    id: rawTutorial.id || `tutorial_${String(index + 1).padStart(3, "0")}`,
    title,
    slug: slugify(title),
    category,
    description: rawTutorial.summary || rawTutorial.description || "Structured DIY tutorial prepared for study use.",
    difficulty: rawTutorial.difficulty || "Beginner",
    estimatedMinutes,
    thumbnailUrl: rawTutorial.thumbnailUrl || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
    tags: rawTutorial.tags || [],
    active: rawTutorial.active !== false,
    materials: normalizeMaterials(rawTutorial.materials),
    steps: normalizedSteps,
    navigationMetadata: {
      hasMaterials: Array.isArray(rawTutorial.materials) && rawTutorial.materials.length > 0,
      supportsSearch: true,
      totalSteps: normalizedSteps.length,
    },
    sourceMetadata: {
      source: rawTutorial.source || "",
      sourceUrl: rawTutorial.source_url || rawTutorial.sourceUrl || "",
      verificationLevel: rawTutorial.verification_level || rawTutorial.verificationLevel || "",
    },
    createdAt: rawTutorial.createdAt || null,
    updatedAt: rawTutorial.updatedAt || null,
  };
}

export function normalizeTutorialFromFirestore(id, data) {
  return normalizeTutorial({ id, ...data });
}

function normalizeMaterials(materials = []) {
  return materials.map((material) => {
    if (typeof material === "object" && material !== null) {
      return {
        name: material.name || "",
        quantity: material.quantity || "",
        unit: material.unit || "",
        notes: material.notes || "",
      };
    }

    return {
      name: String(material),
      quantity: "",
      unit: "",
      notes: "",
    };
  });
}

function buildKeywords(values) {
  const words = values
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  return Array.from(new Set(words)).slice(0, 12);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}
