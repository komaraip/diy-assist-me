import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CatalogControls } from "../components/tutorial/CatalogControls.jsx";
import { TutorialCard } from "../components/tutorial/TutorialCard.jsx";
import { logTouchInteraction } from "../services/logService.js";
import { listTutorials } from "../services/tutorialService.js";

export function TutorialsPage() {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [resultMeta, setResultMeta] = useState({ source: "local", warning: null, error: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTutorials() {
      setIsLoading(true);
      const result = await listTutorials();
      if (!isMounted) return;
      setTutorials(result.data || []);
      setResultMeta({ source: result.source, warning: result.warning, error: result.error });
      setIsLoading(false);
    }

    loadTutorials();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ["All", ...Array.from(new Set(tutorials.map((tutorial) => tutorial.category))).sort()];
  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesCategory = activeCategory === "All" || tutorial.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || tutorialMatchesQuery(tutorial, searchQuery);
    return matchesCategory && matchesSearch;
  });

  function handleSearchChange(value) {
    setSearchQuery(value);
    void logTouchInteraction({
      eventType: "catalog_search",
      metadata: { query: value },
    });
  }

  function handleCategoryChange(category) {
    setActiveCategory(category);
    void logTouchInteraction({
      eventType: "catalog_filter_change",
      metadata: { category },
    });
  }

  function handleOpenTutorial(tutorial) {
    void logTouchInteraction({
      eventType: "catalog_open_tutorial",
      tutorialId: tutorial.id,
      metadata: { title: tutorial.title, category: tutorial.category },
    });
    navigate(`/tutorials/${tutorial.id}`);
  }

  return (
    <section className="page-section">
      <CatalogControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        resultCount={filteredTutorials.length}
        errorMessage={resultMeta.error ? "We could not load tutorials right now. Please try again." : ""}
      />

      {isLoading ? (
        <CatalogState title="Loading tutorials..." text="Preparing the tutorial catalog." />
      ) : tutorials.length === 0 ? (
        <CatalogState title="No tutorials are available." text="Check back later for practical DIY guides." />
      ) : filteredTutorials.length === 0 ? (
        <CatalogState title="No matching tutorials." text="Try a different search term or category." />
      ) : (
        <div className="tutorial-grid">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              onOpen={() => handleOpenTutorial(tutorial)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CatalogState({ title, text }) {
  return (
    <section className="catalog-state-panel" role="status">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function tutorialMatchesQuery(tutorial, query) {
  const normalizedQuery = query.trim().toLowerCase();
  const searchableText = [
    tutorial.title,
    tutorial.description,
    tutorial.category,
    ...(tutorial.tags || []),
    ...(tutorial.materials || []).map((material) => material.name),
    ...(tutorial.steps || []).flatMap((step) => [
      step.title,
      step.instruction,
      ...(step.keywords || []),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}
