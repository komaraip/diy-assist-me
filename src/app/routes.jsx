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
import { AdminDataPage } from "../pages/AdminDataPage.jsx";
import { AdminTutorialsPage } from "../pages/AdminTutorialsPage.jsx";
import { SupportPage } from "../pages/SupportPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { ErrorPage } from "../pages/ErrorPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <AdminPage /> },
      { path: "guided-sessions", element: <Navigate to="/admin/data?tab=sessions" replace /> },
      { path: "thesis", element: <Navigate to="/admin/data?tab=analysis" replace /> },
      { path: "tutorials", element: <AdminTutorialsPage /> },
      { path: "data", element: <AdminDataPage /> },
      { path: "sessions", element: <Navigate to="/admin/data?tab=sessions" replace /> },
      { path: "logs", element: <Navigate to="/admin/data?tab=logs" replace /> },
      { path: "metrics", element: <Navigate to="/admin/data?tab=analysis" replace /> },
      { path: "evidence", element: <Navigate to="/admin/data?tab=analysis" replace /> },
      { path: "export", element: <Navigate to="/admin/data?tab=exports" replace /> },
    ],
  },
  { path: "/exports", element: <Navigate to="/admin/data?tab=exports" replace /> },
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "tutorials", element: <TutorialsPage /> },
      { path: "tutorials/:tutorialId", element: <TutorialDetailPage /> },
      { path: "study", element: <StudyPage /> },
      { path: "study/session/:sessionId", element: <StudySessionPage /> },
      { path: "study/session/:sessionId/task/:taskId", element: <StudyTaskPage /> },
      { path: "study/session/:sessionId/sus/:conditionId", element: <SUSPage /> },
      { path: "study/session/:sessionId/debrief", element: <DebriefPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
