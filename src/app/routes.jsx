import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/admin/AdminLayout.jsx";
import { RootLayout } from "../components/layout/RootLayout.jsx";
import { LandingPage } from "../pages/LandingPage.jsx";
import { TutorialsPage } from "../pages/TutorialsPage.jsx";
import { TutorialDetailPage } from "../pages/TutorialDetailPage.jsx";
import { StudyPage } from "../pages/StudyPage.jsx";
import { StudySessionPage } from "../pages/StudySessionPage.jsx";
import { StudyTaskPage } from "../pages/StudyTaskPage.jsx";
import { SUSPage } from "../pages/SUSPage.jsx";
import { DebriefPage } from "../pages/DebriefPage.jsx";
import { AdminPage } from "../pages/AdminPage.jsx";
import { AdminGuidedSessionsPage } from "../pages/AdminGuidedSessionsPage.jsx";
import { AdminThesisPage } from "../pages/AdminThesisPage.jsx";
import { AdminTutorialsPage } from "../pages/AdminTutorialsPage.jsx";
import { HelpPage } from "../pages/HelpPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminPage /> },
      { path: "guided-sessions", element: <AdminGuidedSessionsPage /> },
      { path: "thesis", element: <AdminThesisPage /> },
      { path: "tutorials", element: <AdminTutorialsPage /> },
      { path: "data", element: <Navigate to="/admin/guided-sessions?tab=sessions" replace /> },
      { path: "sessions", element: <Navigate to="/admin/guided-sessions?tab=sessions" replace /> },
      { path: "logs", element: <Navigate to="/admin/guided-sessions?tab=logs" replace /> },
      { path: "metrics", element: <Navigate to="/admin/thesis?tab=overview" replace /> },
      { path: "evidence", element: <Navigate to="/admin/thesis?tab=overview" replace /> },
      { path: "export", element: <Navigate to="/admin/thesis?tab=exports" replace /> },
    ],
  },
  { path: "/exports", element: <Navigate to="/admin/thesis?tab=exports" replace /> },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "tutorials", element: <TutorialsPage /> },
      { path: "tutorials/:tutorialId", element: <TutorialDetailPage /> },
      { path: "study", element: <StudyPage /> },
      { path: "study/session/:sessionId", element: <StudySessionPage /> },
      { path: "study/session/:sessionId/task/:taskId", element: <StudyTaskPage /> },
      { path: "study/session/:sessionId/sus/:conditionId", element: <SUSPage /> },
      { path: "study/session/:sessionId/debrief", element: <DebriefPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
