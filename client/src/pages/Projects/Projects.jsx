import {
  FolderOpen,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import useProjectStore from "../../stores/project/projectStore";

export default function Projects() {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");

  const {
    projects,
    loading,
    error,
    fetchProjects,
  } = useProjectStore();

  // Load projects from backend
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Search projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      project.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [projects, search]);

  return (
    <div className="w-full mx-auto max-w-7xl">

      {/* Header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-400">
            Workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Projects
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create, organize and manage your creative projects.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-5 text-sm font-medium text-white transition bg-purple-600 h-11 rounded-xl hover:bg-purple-500"
        >
          <Plus size={18} />
          New Project
        </button>
      </section>

      {/* Toolbar */}
      <section className="flex flex-col gap-3 mt-8 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pr-4 text-sm text-white border outline-none h-11 rounded-xl border-zinc-800 bg-zinc-900/60 pl-11 placeholder:text-zinc-600 focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center p-1 border rounded-xl border-zinc-800 bg-zinc-900/60">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              view === "grid"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <Grid2X2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              view === "list"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </section>

      {/* Projects */}
      <section className="mt-8">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Your Projects
          </h2>

          <span className="text-sm text-zinc-600">
            {filteredProjects.length}{" "}
            {filteredProjects.length === 1
              ? "project"
              : "projects"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
            Loading projects...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-5 text-sm text-red-400 border rounded-2xl border-red-500/20 bg-red-500/10">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-zinc-800/70 bg-zinc-900/40">
              <FolderOpen
                size={42}
                strokeWidth={1.3}
                className="text-zinc-600"
              />

              <h3 className="mt-4 font-medium text-white">
                No projects found
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Create your first project to get started.
              </p>
            </div>
          )}

        {/* Grid */}
        {!loading &&
          !error &&
          filteredProjects.length > 0 &&
          view === "grid" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="overflow-hidden transition border group rounded-2xl border-zinc-800/70 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900"
                >

                  {/* Preview */}
                  <div className="relative flex items-center justify-center h-44 bg-zinc-950">
                    <FolderOpen
                      size={42}
                      strokeWidth={1.3}
                      className="text-purple-400"
                    />

                    <button
                      type="button"
                      className="absolute flex items-center justify-center transition rounded-lg opacity-0 right-3 top-3 h-9 w-9 bg-zinc-900/90 text-zinc-400 group-hover:opacity-100 hover:text-white"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="font-medium text-white">
                      {project.name}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      {project.description ||
                        "Creative project"}
                    </p>

                    <div className="flex items-center justify-between mt-4 text-xs text-zinc-600">
                      <span>
                        {project.status || "ACTIVE"}
                      </span>

                      <span>
                        {project.assets?.length || 0} assets
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* List */}
        {!loading &&
          !error &&
          filteredProjects.length > 0 &&
          view === "list" && (
            <div className="overflow-hidden border rounded-2xl border-zinc-800/70 bg-zinc-900/40">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-center w-10 h-10 text-purple-400 rounded-lg bg-purple-500/10">
                    <FolderOpen size={19} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {project.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {project.description ||
                        "Creative project"}
                    </p>
                  </div>

                  <span className="hidden text-xs text-zinc-600 sm:block">
                    {project.status || "ACTIVE"}
                  </span>

                  <span className="hidden text-xs text-zinc-600 md:block">
                    {project.assets?.length || 0} assets
                  </span>

                  <MoreHorizontal
                    size={18}
                    className="text-zinc-600"
                  />
                </div>
              ))}
            </div>
          )}

      </section>
    </div>
  );
}