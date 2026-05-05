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
import { HelpPage } from "../pages/HelpPage.jsx";
import { ExportsPage } from "../pages/ExportsPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminPage /> },
      { path: "export", element: <ExportsPage /> },
    ],
  },
  { path: "/exports", element: <Navigate to="/admin/export" replace /> },
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
