import { Routes, Route } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout/MainLayout";
import { routes } from "./routes";

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
          All of these use the same Sidebar + Navbar
          ======================================== */}
      <Route element={<MainLayout />}>
        <Route path={routes.dashboard} element={<Dashboard />} />

        <Route path={routes.projects} element={<Projects />} />

        <Route path="/generate" element={<Generate />} />

        <Route path={routes.images} element={<Images />} />

        <Route path={routes.videos} element={<Videos />} />

        <Route path={routes.characters} element={<Characters />} />

        <Route path={routes.storyboard} element={<Storyboard />} />

        <Route path={routes.gallery} element={<Gallery />} />

        <Route path={routes.downloads} element={<Downloads />} />

        <Route path={routes.settings} element={<Settings />} />

        <Route path={routes.projectWorkspace} element={<ProjectWorkspace />} />
      </Route>

      {/* ========================================
          AUTHENTICATION
          These do NOT use MainLayout
          ======================================== */}
      <Route path={routes.login} element={<Login />} />

      <Route path={routes.register} element={<Register />} />

      <Route path={routes.forgotPassword} element={<ForgotPassword />} />

      {/* ========================================
          FALLBACK
          ======================================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
