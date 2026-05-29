import { Search } from "lucide-react";

export function TutorialSearch({ query, onQueryChange, results, onJumpToStep, copy }) {
  const searchCopy = copy?.search || {
    aria: "Search inside tutorial",
    heading: "Search",
    label: "Find a step",
    placeholder: "Search materials or steps...",
    matchingSteps: (count) => `${count} matching step${count === 1 ? "" : "s"}`,
    stepLabel: (step) => `Step ${step}`,
  };

  return (
    <section className="tutorial-search" aria-label={searchCopy.aria}>
      <label className="search-field" aria-label={searchCopy.label}>
        <span className="search-input-wrap">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchCopy.placeholder}
          />
        </span>
      </label>
      {query.trim() ? (
        <div className="search-results compact-panel-scroll" aria-live="polite">
          <p>{searchCopy.matchingSteps(results.length)}</p>
          {results.length ? (
            <ul>
              {results.map((step) => (
                <li key={step.stepNumber}>
                  <button type="button" onClick={() => onJumpToStep(step.stepNumber - 1)}>
                    {searchCopy.stepLabel(step.stepNumber)}: {step.instruction}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
