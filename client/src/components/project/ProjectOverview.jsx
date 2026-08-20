import useProjectStore from "@/stores/project/projectStore";

export default function ProjectOverview() {
  const { selectedProject } = useProjectStore();

  if (!selectedProject) return null;

  return (
    <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">

      <h2 className="text-2xl font-bold">
        {selectedProject.name}
      </h2>

      <p className="mt-2 text-zinc-400">
        Manage everything related to this project from one workspace.
      </p>

    </div>
  );
}