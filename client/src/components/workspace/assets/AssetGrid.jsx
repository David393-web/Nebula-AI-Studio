import AssetCard from "./AssetCard";

export default function AssetGrid({
  assets = [],
  view = "grid",
  onSelect,
  onDelete,
}) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border rounded-2xl border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-center mb-4 w-14 h-14 rounded-2xl bg-purple-500/10">
          <span className="text-2xl">🖼️</span>
        </div>

        <h3 className="text-lg font-semibold text-white">
          No assets yet
        </h3>

        <p className="max-w-md mt-2 text-sm text-zinc-500">
          Generated images, videos, and uploaded files
          will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        view === "list"
          ? "space-y-3"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          view={view}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}