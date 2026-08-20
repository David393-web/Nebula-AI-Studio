import { Sparkles } from "lucide-react";

import GeneratePanel from "@/components/workspace/generate/GeneratePanel";

export default function Generate() {
  return (
    <div className="min-h-full text-white bg-zinc-950">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-purple-400">
          <Sparkles size={16} />
          <span>AI Creation Studio</span>
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Generate
        </h1>

        <p className="max-w-2xl mt-2 text-sm leading-6 text-zinc-500">
          Turn your ideas into images and videos using characters,
          references, prompts and generation settings.
        </p>
      </div>

      <GeneratePanel />
    </div>
  );
}