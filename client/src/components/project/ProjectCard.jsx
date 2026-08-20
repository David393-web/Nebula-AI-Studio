import { Folder, Image, Video, Users, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  return (
    <div
    onClick={() => navigate(`/projects/${project.id}`)}
    className="overflow-hidden transition border cursor-pointer rounded-3xl bg-zinc-900 border-zinc-800 hover:border-purple-600"
>
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-purple-700 via-violet-600 to-fuchsia-500">
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 text-xs rounded-full bg-white/10 backdrop-blur">
            AI Project
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{project.name}</h3>

          <MoreVertical size={18} className="text-zinc-400" />
        </div>

        {/* Stats */}

        <div className="flex gap-5 mt-5 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Image size={15} />
            {project.images}
          </div>

          <div className="flex items-center gap-2">
            <Video size={15} />
            {project.videos}
          </div>

          <div className="flex items-center gap-2">
            <Users size={15} />
            {project.characters}
          </div>
        </div>

        {/* Footer */}

        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-zinc-500">{project.updated}</span>

          <Folder size={18} className="text-purple-500" />
        </div>
      </div>
    </div>
  );
}
