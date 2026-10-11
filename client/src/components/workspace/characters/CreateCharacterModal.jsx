import { useState } from "react";
import {
  X,
  UserRound,
} from "lucide-react";
import api from "@/services/api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import FileDropzone from "@/components/media/FileDropzone";

export default function CreateCharacterModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  character = null,
}) {
  const [name, setName] = useState(character?.name || "");
  const [description, setDescription] =
    useState(character?.description || "");
  const [image, setImage] = useState(resolveMediaUrl(character?.imageUrl || character?.image) || "");
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [formError, setFormError] =
    useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setFormError(
        "Character name is required.",
      );
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      /*
       * Do not create an ID here.
       * The backend/database is responsible
       * for generating the character ID.
       */
      let imageUrl = character?.imageUrl || character?.image || null;
      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const { data: uploadData } = await api.post("/storage/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploadedPath = uploadData?.data?.image?.url || uploadData?.data?.file?.url;
        if (!uploadedPath) throw new Error("The uploaded image could not be saved.");
        imageUrl = resolveMediaUrl(uploadedPath);
      }

      const saveCharacter = character ? onUpdate : onCreate;
      await saveCharacter?.({
        name: trimmedName,
        description: trimmedDescription,
        imageUrl,
      });

      /*
       * Only reset the form after the backend
       * creation succeeds.
       */
      setName("");
      setDescription("");
      setImage("");
      setImageFile(null);
      setFormError("");

      onClose?.();
    } catch (error) {
      console.error(
        "Failed to create character:",
        error,
      );

      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create character. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setFormError("");
    onClose?.();
  };

  const handleImageChange = (files, rejected = []) => {
    if (rejected.length) setFormError(rejected.join(" · "));
    const file = files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError(
        "Please upload a PNG, JPG, or WEBP image.",
      );
      return;
    }

    setFormError("");

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setImageFile(file);
    };

    reader.onerror = () => {
      setFormError(
        "Failed to read the selected image.",
      );
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto border shadow-2xl rounded-2xl border-zinc-800 bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {character ? "Edit Character" : "Create Character"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {character ? "Update the character details used across your projects." : "Create a reusable AI character."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 transition rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >
          {/* Error */}
          {formError && (
            <div className="p-3 text-sm text-red-300 border rounded-xl border-red-500/20 bg-red-500/10">
              {formError}
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">
              Character Reference
            </label>

            {image && <img src={image} alt="Character preview" className="mb-3 h-40 w-full rounded-xl border border-zinc-800 object-contain bg-zinc-900" />}
            <FileDropzone onFiles={handleImageChange} accept="image/png,image/jpeg,image/webp" multiple={false} disabled={isSubmitting} label={image ? "Replace reference image" : "Upload a reference image"} description="Drop a PNG, JPG, or WEBP character image" />
          </div>

          {/* Name */}
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">
              Character Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Amara"
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm text-white border outline-none rounded-xl border-zinc-800 bg-zinc-900 placeholder:text-zinc-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the character's appearance, personality, clothing, age, etc."
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-xl border-zinc-800 bg-zinc-900 placeholder:text-zinc-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Info */}
          <div className="flex gap-3 p-4 border rounded-xl border-purple-500/10 bg-purple-500/5">
            <UserRound
              size={18}
              className="flex-shrink-0 mt-0.5 text-purple-400"
            />

            <p className="text-xs leading-5 text-zinc-400">
              Your character can later be reused
              when generating images and videos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium transition rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !name.trim()
              }
              className="flex items-center justify-center gap-2 min-w-[150px] px-5 py-2.5 text-sm font-medium text-white transition bg-purple-600 rounded-lg hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                character ? "Save Changes" : "Create Character"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
