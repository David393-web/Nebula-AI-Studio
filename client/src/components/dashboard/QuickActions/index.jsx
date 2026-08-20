import {
    Image,
    Video,
    Sparkles,
    FolderPlus,
} from "lucide-react";

const actions = [
    {
        title: "New Image",
        icon: Image,
    },
    {
        title: "New Video",
        icon: Video,
    },
    {
        title: "New Character",
        icon: Sparkles,
    },
    {
        title: "New Project",
        icon: FolderPlus,
    },
];

export default function QuickActions() {

    return (

        <div className="rounded-2xl border border-white/5 bg-[#141418] p-6">

            <h3 className="mb-6 text-xl font-semibold text-white">
                Quick Actions
            </h3>

            <div className="grid gap-4">

                {actions.map(action => {

                    const Icon = action.icon;

                    return (

                        <button
                            key={action.title}
                            className="flex items-center gap-4 rounded-xl bg-[#1A1A20] p-4 transition hover:bg-violet-600"
                        >

                            <Icon />

                            {action.title}

                        </button>

                    );

                })}

            </div>

        </div>

    );
}