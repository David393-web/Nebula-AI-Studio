import { useMemo, useState } from "react";

import AssetSidebar from "./AssetSidebar";
import AssetToolbar from "./AssetToolbar";
import AssetGrid from "./AssetGrid";

import useAssetStore from "@/stores/assets/assetStore";

export default function AssetsPanel() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const assets = useAssetStore((state) => state.assets);
  const deleteAsset = useAssetStore((state) => state.deleteAsset);

  const counts = useMemo(() => {
    return {
      all: assets.length,

      image: assets.filter(
        (asset) => asset.type === "image",
      ).length,

      video: assets.filter(
        (asset) => asset.type === "video",
      ).length,

      character: assets.filter(
        (asset) => asset.type === "character",
      ).length,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesFilter =
        activeFilter === "all" ||
        asset.type === activeFilter;

      const matchesSearch =
        !normalizedSearch ||
        asset.name
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [assets, activeFilter, search]);

  const handleDelete = (id) => {
    deleteAsset(id);
  };

  const handleSelect = (asset) => {
    console.log("Selected asset:", asset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Assets
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Your generated images, videos and reusable
          creative assets.
        </p>
      </div>

      {/* Toolbar */}
      <AssetToolbar
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
      />

      {/* Asset Workspace */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <AssetSidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />

        <div className="flex-1 min-w-0">
          <AssetGrid
            assets={filteredAssets}
            view={view}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}