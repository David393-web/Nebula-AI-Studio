import { Folder } from "lucide-react";

const projects = [
    "Nike Campaign",
    "Anime Intro",
    "AI Short Film",
    "Product Render",
];

export default function RecentProjects() {
    return (

        <div className="rounded-2xl border border-white/5 bg-[#141418] p-6">

            <h3 className="mb-6 text-xl font-semibold text-white">
                Recent Projects
            </h3>

            <div className="space-y-4">

                {projects.map(project => (

                    <div
                        key={project}
                        className="flex items-center gap-4 rounded-xl bg-[#1A1A20] p-4"
                    >

                        <Folder className="text-violet-500" />

                        <span className="text-white">
                            {project}
                        </span>

                    </div>

                ))}

            </div>

        </div>

    );
}