import { Routes, Route } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout/MainLayout";

// Main Pages
import Dashboard from "@/pages/Dashboard/Dashboard";
import Projects from "@/pages/Projects/Projects";
import Gallery from "@/pages/Gallery/Gallery";
import Downloads from "@/pages/Downloads/Downloads";
import Settings from "@/pages/Settings/Settings";
import Generate from "@/pages/Generate/Generate";

// Workspace
import ProjectWorkspace from "@/pages/ProjectWorkspace";

// Authentication
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";

// Temporary section pages
import Images from "@/pages/Images/Images";
import Videos from "@/pages/Videos/Videos";
import Characters from "@/pages/Characters/Characters";
import Storyboard from "@/pages/Storyboard/Storyboard";

// Fallback
import NotFound from "@/pages/NotFound/NotFound";

export default function AppRouter() {
  return (
    <Routes>
      {/* ========================================
          MAIN APPLICATION
          ======================================== */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        {/* ----------------------------------------
            Project Workspace
            ----------------------------------------
            This is intentionally explicit.

            Projects navigates to:
            /projects/:id/workspace
        ----------------------------------------- */}
        <Route
          path="/projects/:id/workspace"
          element={<ProjectWorkspace />}
        />

        <Route
          path="/generate"
          element={<Generate />}
        />

        <Route
          path="/images"
          element={<Images />}
        />

        <Route
          path="/videos"
          element={<Videos />}
        />

        <Route
          path="/characters"
          element={<Characters />}
        />

        <Route
          path="/storyboard"
          element={<Storyboard />}
        />

        <Route
          path="/gallery"
          element={<Gallery />}
        />

        <Route
          path="/downloads"
          element={<Downloads />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Route>

      {/* ========================================
          AUTHENTICATION
          ======================================== */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* ========================================
          FALLBACK
          ======================================== */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}