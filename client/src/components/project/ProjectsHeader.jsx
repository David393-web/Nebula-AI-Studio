import { Plus } from "lucide-react";
import useProjectModalStore from "@/stores/project/projectUIStore";

export default function ProjectsHeader() {
  const { open } = useProjectModalStore();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Projects
        </h1>

        <p className="mt-2 text-zinc-400">
          Manage all your AI projects in one place.
        </p>
      </div>

      <button
        onClick={open}
        className="flex items-center gap-2 px-5 py-3 text-white transition bg-purple-600 rounded-xl hover:bg-purple-700"
      >
        <Plus size={18} />
        <span>New Project</span>
      </button>
    </div>
  );
}