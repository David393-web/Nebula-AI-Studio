import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export default function ReferenceImages() {
  const inputRef = useRef(null);
  const [images, setImages] = useState([]);

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);

    const newImages = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }));

    setImages((current) => [...current, ...newImages]);

    event.target.value = "";
  };

  const removeImage = (id) => {
    setImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.preview);
      }

      return current.filter((item) => item.id !== id);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-white">
          Reference Images
        </h3>

        <p className="mt-1 text-xs text-zinc-500">
          Add images to guide the generation.
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

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 transition border border-dashed rounded-xl aspect-square border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-white hover:border-purple-500"
        >
          <ImagePlus size={22} />

          <span className="text-xs">
            Add image
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}