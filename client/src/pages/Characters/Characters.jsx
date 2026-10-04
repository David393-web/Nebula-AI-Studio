import CharactersPanel from "@/components/workspace/characters/CharactersPanel";

export default function Characters() {
  return <div className="space-y-6"><header><p className="text-sm text-violet-400">Creative workspace</p><h1 className="mt-2 text-3xl font-semibold text-white">Characters</h1><p className="mt-2 text-sm text-zinc-500">Create and manage reusable characters from your account.</p></header><CharactersPanel/></div>;
}
