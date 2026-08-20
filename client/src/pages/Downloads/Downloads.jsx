import {
  Download,
  FileImage,
  FileVideo,
  Search,
  MoreHorizontal,
  CheckCircle2,
  Clock3,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";

const downloads = [
  {
    id: 1,
    name: "Neon City",
    type: "Image",
    format: "PNG",
    size: "4.8 MB",
    date: "Today, 10:42 AM",
    status: "Completed",
  },
  {
    id: 2,
    name: "AI Short Film",
    type: "Video",
    format: "MP4",
    size: "82.4 MB",
    date: "Yesterday, 4:18 PM",
    status: "Completed",
  },
  {
    id: 3,
    name: "Fashion Campaign",
    type: "Image",
    format: "JPG",
    size: "6.2 MB",
    date: "Yesterday, 1:05 PM",
    status: "Completed",
  },
  {
    id: 4,
    name: "Cinematic Product Reveal",
    type: "Video",
    format: "MP4",
    size: "64.7 MB",
    date: "Aug 18, 2026",
    status: "Processing",
  },
  {
    id: 5,
    name: "Creative Workspace",
    type: "Image",
    format: "PNG",
    size: "5.1 MB",
    date: "Aug 17, 2026",
    status: "Failed",
  },
];

export default function Downloads() {
  const [search, setSearch] = useState("");

  const filteredDownloads = downloads.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full text-white bg-zinc-950">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
          <Download size={16} />
          <span>File Manager</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Downloads
        </h1>

        <p className="mt-2 text-zinc-500">
          Manage your generated files and downloaded creative assets.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard
          label="Total Downloads"
          value="148"
          icon={<Download size={19} />}
        />

        <StatCard
          label="Completed"
          value="142"
          icon={<CheckCircle2 size={19} />}
        />

        <StatCard
          label="Processing"
          value="4"
          icon={<Clock3 size={19} />}
        />

        <StatCard
          label="Failed"
          value="2"
          icon={<XCircle size={19} />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-3 mb-6 border rounded-2xl border-zinc-800 bg-zinc-900/60 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute -translate-y-1/2 left-4 top-1/2 text-zinc-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search downloads..."
            className="w-full pr-4 text-sm text-white border outline-none h-11 rounded-xl border-zinc-800 bg-zinc-950 pl-11 placeholder:text-zinc-600 focus:border-purple-500/50"
          />
        </div>

        <button
          type="button"
          className="px-5 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
        >
          All files
        </button>

        <button
          type="button"
          className="px-5 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
        >
          Images
        </button>

        <button
          type="button"
          className="px-5 py-3 text-sm border rounded-xl border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
        >
          Videos
        </button>
      </div>

      {/* Downloads list */}
      <div className="overflow-hidden border rounded-2xl border-zinc-800 bg-zinc-900/60">

        {/* Desktop header */}
        <div className="hidden grid-cols-[minmax(220px,1.5fr)_120px_100px_170px_140px_50px] gap-4 border-b border-zinc-800 px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-600 md:grid">
          <span>File</span>
          <span>Type</span>
          <span>Format</span>
          <span>Date</span>
          <span>Status</span>
          <span />
        </div>

        {filteredDownloads.map((item) => (
          <DownloadRow key={item.id} item={item} />
        ))}

        {filteredDownloads.length === 0 && (
          <div className="py-20 text-center">
            <Download
              size={40}
              className="mx-auto mb-4 text-zinc-700"
            />

            <h3 className="font-medium text-zinc-300">
              No downloads found
            </h3>

            <p className="mt-2 text-sm text-zinc-600">
              Try another search term.
            </p>
          </div>
        )}
      </div>

      {/* Storage information */}
      <div className="flex flex-col gap-4 p-5 mt-6 border rounded-2xl border-zinc-800 bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-purple-400 rounded-xl bg-purple-600/10">
            <FolderOpen size={19} />
          </div>

          <div>
            <p className="text-sm font-medium text-white">
              Download storage
            </p>

            <p className="text-xs text-zinc-500">
              0.8 GB of 20 GB used
            </p>
          </div>
        </div>

        <div className="h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-[4%] rounded-full bg-purple-500" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="p-5 border rounded-2xl border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {label}
        </p>

        <div className="text-purple-400">
          {icon}
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function DownloadRow({ item }) {
  const isVideo = item.type === "Video";

  return (
    <div className="grid gap-4 border-b border-zinc-800 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(220px,1.5fr)_120px_100px_170px_140px_50px] md:items-center">

      {/* File */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 text-purple-400 shrink-0 rounded-xl bg-purple-600/10">
          {isVideo ? (
            <FileVideo size={19} />
          ) : (
            <FileImage size={19} />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {item.name}
          </p>

          <p className="text-xs text-zinc-600">
            {item.size}
          </p>
        </div>
      </div>

      {/* Type */}
      <span className="text-sm text-zinc-400">
        {item.type}
      </span>

      {/* Format */}
      <span className="text-sm text-zinc-400">
        {item.format}
      </span>

      {/* Date */}
      <span className="text-sm text-zinc-500">
        {item.date}
      </span>

      {/* Status */}
      <Status status={item.status} />

      {/* Actions */}
      <button
        type="button"
        className="flex items-center justify-center rounded-lg h-9 w-9 text-zinc-500 hover:bg-zinc-800 hover:text-white"
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function Status({ status }) {
  const styles = {
    Completed:
      "bg-emerald-500/10 text-emerald-400",
    Processing:
      "bg-amber-500/10 text-amber-400",
    Failed:
      "bg-red-500/10 text-red-400",
  };

  const icons = {
    Completed: <CheckCircle2 size={14} />,
    Processing: <Clock3 size={14} />,
    Failed: <XCircle size={14} />,
  };

  return (
    <span
      className={`flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}