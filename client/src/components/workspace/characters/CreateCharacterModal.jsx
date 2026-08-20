import { useState } from "react";
import { X, Upload, UserRound } from "lucide-react";

export default function CreateCharacterModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate?.({
      id: Date.now(),
      name: name.trim(),
      description: description.trim(),
      image,
    });

    setName("");
    setDescription("");
    setImage("");

    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto border shadow-2xl rounded-2xl border-zinc-800 bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Create Character
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a reusable AI character.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 transition rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image */}
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">
              Character Reference
            </label>

            <label className="flex flex-col items-center justify-center w-full h-40 transition border border-dashed cursor-pointer rounded-xl border-zinc-700 bg-zinc-900/50 hover:border-purple-500/50">
              {image ? (
                <img
                  src={image}
                  alt="Character preview"
                  className="object-cover w-full h-full rounded-xl"
                />
              ) : (
                <>
                  <Upload size={24} className="mb-2 text-zinc-500" />

                  <span className="text-sm text-zinc-400">
                    Upload a reference image
                  </span>

                  <span className="mt-1 text-xs text-zinc-600">
                    PNG, JPG or WEBP
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  const reader = new FileReader();

                  reader.onload = () => {
                    setImage(reader.result);
                  };

                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">
              Character Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amara"
              className="w-full px-4 py-3 text-sm text-white border outline-none rounded-xl border-zinc-800 bg-zinc-900 placeholder:text-zinc-600 focus:border-purple-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the character's appearance, personality, clothing, age, etc."
              rows={4}
              className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-xl border-zinc-800 bg-zinc-900 placeholder:text-zinc-600 focus:border-purple-500"
            />
          </div>

          {/* Info */}
          <div className="flex gap-3 p-4 border rounded-xl border-purple-500/10 bg-purple-500/5">
            <UserRound
              size={18}
              className="flex-shrink-0 mt-0.5 text-purple-400"
            />

            <p className="text-xs leading-5 text-zinc-400">
              Your character can later be reused when generating
              images and videos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium transition rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-500"
            >
              Create Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}