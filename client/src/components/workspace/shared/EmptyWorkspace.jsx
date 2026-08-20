import { ImagePlus } from "lucide-react";

export default function EmptyWorkspace() {

    return (

        <div className="h-[500px] rounded-3xl border border-dashed border-zinc-700 flex flex-col items-center justify-center">

            <ImagePlus

                size={70}

                className="text-purple-500"

            />

            <h2 className="mt-6 text-3xl font-bold">

                Nothing here yet

            </h2>

            <p className="mt-2 text-zinc-500">

                Generate your first AI image.

            </p>

        </div>

    );

}