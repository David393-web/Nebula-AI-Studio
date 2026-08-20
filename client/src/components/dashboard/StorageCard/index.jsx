import { HardDrive } from "lucide-react";

export default function StorageCard() {
  return (
    <div className="p-6 border rounded-2xl border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-3">
        <HardDrive className="text-violet-500" size={22} />

        <h3 className="text-lg font-semibold text-white">
          Storage
        </h3>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="w-2/5 h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"></div>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          8 GB used of 20 GB
        </p>
      </div>
    </div>
  );
}