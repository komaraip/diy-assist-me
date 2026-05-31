import { Filter, Search } from "lucide-react";

export function CatalogControls({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  resultCount,
  errorMessage = "",
}) {
  return (
    <section className="catalog-controls" aria-labelledby="catalog-heading">
      <div className="catalog-toolbar-top">
        <div className="catalog-header-copy">
          <p className="eyebrow">Tutorials</p>
          <h1 id="catalog-heading">Choose a tutorial</h1>
          <p>Browse practical DIY guides, check what you need, and follow each step at your own pace.</p>
        </div>
        <p className="result-count" aria-live="polite">
          <span>{resultCount}</span>
          tutorial{resultCount === 1 ? "" : "s"} shown
        </p>
      </div>

      <div className="catalog-toolbar-controls">
        <label className="search-field">
          <span>Search tutorials</span>
          <span className="search-input-wrap">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by title, material, or step..."
            />
          </span>
        </label>

        <label className="category-select-field">
          <span>Category</span>
          <span className="category-select-control">
            <Filter aria-hidden="true" />
            <select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="filter-row" aria-label="Category filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "filter-chip active" : "filter-chip"}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {errorMessage ? <p className="data-source-note error">{errorMessage}</p> : null}
    </section>
  );
}
