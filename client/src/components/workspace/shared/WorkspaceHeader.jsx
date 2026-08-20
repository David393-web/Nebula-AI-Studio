import { Sparkles } from "lucide-react";

export default function WorkspaceHeader() {

    return (

        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-4xl font-bold">
                    Nike Commercial
                </h1>

                <p className="mt-2 text-zinc-400">
                    Last updated 2 minutes ago
                </p>

            </div>

            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-xl">

                <Sparkles size={18}/>

                Generate

            </button>

        </div>

    );

}