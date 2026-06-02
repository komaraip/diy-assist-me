import { Link } from "react-router-dom";

export function AdminTabs({ tabs, activeTab, basePath, endContent = null }) {
  return (
    <div className="admin-tabs-row">
      <div className="admin-tabs" role="tablist" aria-label="Admin page sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              className={isActive ? "admin-tab-link active" : "admin-tab-link"}
              to={`${basePath}?tab=${tab.id}`}
              role="tab"
              aria-selected={isActive}
            >
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {endContent ? <div className="admin-tabs-end">{endContent}</div> : null}
    </div>
  );
}
