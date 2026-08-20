import { useState } from "react";

export default function PromptBox({ onPromptChange }) {
  const [prompt, setPrompt] = useState("");

  const handleChange = (event) => {
    const value = event.target.value;

    setPrompt(value);

    if (onPromptChange) {
      onPromptChange(value);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-white">
          Prompt
        </label>

        <p className="mt-1 text-xs text-zinc-500">
          Describe exactly what you want the AI to generate.
        </p>
      </div>

      <textarea
        value={prompt}
        onChange={handleChange}
        rows={7}
        placeholder="Example: A cinematic portrait of a young African man standing in Lagos at sunset, realistic skin texture, dramatic lighting..."
        className="w-full p-4 text-sm text-white border outline-none resize-none rounded-xl bg-zinc-950 border-zinc-800 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      />

      <div className="flex justify-between text-xs text-zinc-600">
        <span>Be descriptive for better results.</span>

        <span>{prompt.length} characters</span>
      </div>
    </div>
  );
}