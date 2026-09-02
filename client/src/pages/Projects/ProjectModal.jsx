import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import useProjectStore from "../../stores/project/projectStore";
import useProjectModalStore from "../../stores/project/projectUIStore";

export default function ProjectModal() {
  const { isOpen, close } = useProjectModalStore();

  const createProject = useProjectStore(
    (state) => state.createProject
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    try {
      setLoading(true);

      await createProject({
        name: name.trim(),
        description: description.trim() || null,
        status: "DRAFT",
      });

      setName("");
      setDescription("");
      close();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create project."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setName("");
    setDescription("");
    setError("");
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden border shadow-2xl rounded-2xl border-zinc-800 bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
              <FolderPlus
                size={20}
                className="text-purple-400"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Create New Project
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Start a new creative workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-2 transition rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >
          {error && (
            <div className="px-4 py-3 text-sm text-red-400 border rounded-xl border-red-500/20 bg-red-500/10">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="project-name"
              className="block mb-2 text-sm font-medium text-zinc-300"
            >
              Project name
            </label>

            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. My Short Film"
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 text-sm text-white transition border outline-none placeholder-zinc-600 rounded-xl border-zinc-800 bg-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className="block mb-2 text-sm font-medium text-zinc-300"
            >
              Description
              <span className="ml-2 text-xs text-zinc-600">
                Optional
              </span>
            </label>

            <textarea
              id="project-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="What are you creating?"
              rows={4}
              disabled={loading}
              className="w-full px-4 py-3 text-sm text-white transition border outline-none resize-none placeholder-zinc-600 rounded-xl border-zinc-800 bg-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-3 text-sm font-medium transition rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-semibold text-white transition bg-purple-600 rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Creating..."
                : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}