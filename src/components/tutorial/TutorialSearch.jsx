import { Search } from "lucide-react";

export function TutorialSearch({ query, onQueryChange, results, onJumpToStep }) {
  return (
    <section className="tutorial-search" aria-label="Search inside tutorial">
      <label className="search-field">
        <span>Search within this tutorial</span>
        <span className="search-input-wrap">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Find a material, action, or keyword..."
          />
        </span>
      </label>
      {query.trim() ? (
        <div className="search-results compact-panel-scroll" aria-live="polite">
          <p>{results.length} matching step{results.length === 1 ? "" : "s"}</p>
          {results.length ? (
            <ul>
              {results.map((step) => (
                <li key={step.stepNumber}>
                  <button type="button" onClick={() => onJumpToStep(step.stepNumber - 1)}>
                    Step {step.stepNumber}: {step.instruction}
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
