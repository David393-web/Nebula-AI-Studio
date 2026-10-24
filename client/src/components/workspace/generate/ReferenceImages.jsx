import { useEffect, useState } from "react";
import { X } from "lucide-react";
import FileDropzone from "@/components/media/FileDropzone";

export default function ReferenceImages({ onImagesChange, value }) {
  const [localImages, setLocalImages] = useState([]);
  const images = value ?? localImages;
  useEffect(() => { if (value) setLocalImages(value); }, [value]);

  const handleFiles = (files) => {
    const newImages = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }));

    const next = [...images, ...newImages];
    setLocalImages(next);
    onImagesChange?.(next);

  };

  const removeImage = (id) => {
    const image = images.find((item) => item.id === id);
    if (image) URL.revokeObjectURL(image.preview);
    const next = images.filter((item) => item.id !== id);
    setLocalImages(next);
    onImagesChange?.(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-white">
          Reference Images
        </h3>

        <p className="mt-1 text-xs text-zinc-500">
          FLUX.2 Pro uses these as actual visual references. It guides identity and appearance, but does not guarantee a pixel-perfect identity lock.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative overflow-hidden border rounded-xl aspect-square border-zinc-800 bg-zinc-950"
          >
            <img
              src={image.preview}
              alt="Reference"
              className="object-cover w-full h-full"
            />

            <button
              type="button"
              onClick={() => removeImage(image.id)}
              className="absolute flex items-center justify-center text-white rounded-full w-7 h-7 top-2 right-2 bg-black/70 hover:bg-black"
              aria-label="Remove reference image"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <FileDropzone onFiles={handleFiles} label="Add reference images" description="Drop multiple reference images" className="col-span-3 sm:col-span-4" />
      </div>
    </div>
  );
}
