import { useState } from "react";
import useProjectModalStore from "@/stores/project/projectUIStore";
import useProjectStore from "@/stores/project/projectStore";

export default function CreateProjectModal() {

    const { isOpen, close } = useProjectModalStore();

    const { addProject } = useProjectStore();

    const [name, setName] = useState("");

    const createProject = () => {

        if (!name.trim()) return;

        addProject({
            id: Date.now(),
            name,
            images: 0,
            videos: 0,
            characters: 0,
            updated: "Just now",
        });

        setName("");

        close();

    };

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

            <div className="bg-zinc-900 rounded-2xl w-[500px] p-8 border border-zinc-800">

                <h2 className="mb-6 text-2xl font-bold">
                    Create Project
                </h2>

                <input

                    value={name}

                    onChange={(e)=>setName(e.target.value)}

                    placeholder="Project name"

                    className="w-full px-4 py-3 outline-none bg-zinc-800 rounded-xl"

                />

                <div className="flex justify-end gap-4 mt-8">

                    <button

                        onClick={close}

                        className="px-5 py-3 rounded-xl bg-zinc-700"

                    >

                        Cancel

                    </button>

                    <button

                        onClick={createProject}

                        className="px-5 py-3 bg-purple-600 rounded-xl"

                    >

                        Create

                    </button>

                </div>

            </div>

        </div>

    );

}