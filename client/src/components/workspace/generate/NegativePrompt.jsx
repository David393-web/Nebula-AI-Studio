import { useState } from "react";

export default function NegativePrompt({ onNegativePromptChange }) {
  const [negativePrompt, setNegativePrompt] = useState("");

  const handleChange = (event) => {
    const value = event.target.value;

    setNegativePrompt(value);

    if (onNegativePromptChange) {
      onNegativePromptChange(value);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-white">
          Negative Prompt
        </label>

        <p className="mt-1 text-xs text-zinc-500">
          Tell the AI what you don't want to appear in the result.
        </p>
      </div>

      <textarea
        value={negativePrompt}
        onChange={handleChange}
        rows={4}
        placeholder="Example: blurry, distorted face, extra fingers, low quality..."
        className="w-full p-4 text-sm text-white border outline-none resize-none rounded-xl bg-zinc-950 border-zinc-800 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      />

      <div className="text-xs text-right text-zinc-600">
        {negativePrompt.length} characters
      </div>
    </div>
  );
}