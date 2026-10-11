export const SCENE_SCRIPT_BLOCK_TYPES = ["character", "action", "dialogue", "narration", "camera", "audio"];
export const NO_VISIBLE_TEXT_INSTRUCTION = "No visible text, captions, subtitles, character labels, dialogue text, typography, UI, logos or written words in the generated scene. Character names are metadata only and must never appear in the image or video.";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeVisualText(value, characterNames = []) {
  const sourceLines = (typeof value === "string" ? value : "").replace(/[“”]/g, '"').split(/\r?\n/);
  const visualLines = [];
  let skippingDialogue = false;
  for (const line of sourceLines) {
    if (/^\s*(?:DIALOGUE|SPOKEN WORDS?|TRANSCRIPT|SUBTITLES?|CAPTIONS?|AUDIO)\s*:/i.test(line)) {
      skippingDialogue = true;
      continue;
    }
    if (skippingDialogue && /^\s*(?:SCENE|ACTION|NARRATION|CAMERA|VISUAL|STORY|REFERENCE|NOTES)\b[^:]*:/i.test(line)) skippingDialogue = false;
    if (!skippingDialogue) visualLines.push(line.replace(/"[^"\n]*"/g, ""));
  }
  let text = visualLines.join("\n").replace(/\b(?:no visible text|no text|without text|no typography)\s*:\s*/gi, "");
  const names = [...new Set(characterNames.filter((name) => typeof name === "string" && name.trim()))]
    .sort((a, b) => b.length - a.length);
  for (const name of names) text = text.replace(new RegExp(escapeRegExp(name.trim()), "gi"), "the referenced character");
  return text.replace(/\s+/g, " ").trim();
}

export function formatVisualSceneScript(value, characterNames = []) {
  const { blocks } = normalizeSceneScript(value);
  const labels = { action: "Action", narration: "Narrative context", camera: "Camera" };
  return blocks
    .filter((block) => ["action", "narration", "camera"].includes(block.type) && block.text.trim())
    .map((block) => `${labels[block.type]}: ${sanitizeVisualText(block.text, characterNames)}`)
    .filter((line) => !line.endsWith(": "))
    .join("\n");
}

export function buildVisualScenePrompt({ title, story, direction, notes, sceneScript, characters = [], characterNames = [], referencePolicy = "", cinematic = true }) {
  const names = [...characterNames, ...characters.map((character) => character?.name), ...(sceneScript?.blocks || []).map((block) => block?.characterName)].filter(Boolean);
  const sections = [
    story ? `Story context (visual events only): ${sanitizeVisualText(story, names)}` : "",
    title ? `Scene: ${sanitizeVisualText(title, names)}` : "",
    direction ? `Visual direction: ${sanitizeVisualText(direction, names)}` : "",
    notes ? `Visual notes: ${sanitizeVisualText(notes, names)}` : "",
    formatVisualSceneScript(sceneScript, names) ? `Scene script context (action, narration and camera only; dialogue is reserved for audio):\n${formatVisualSceneScript(sceneScript, names)}` : "",
    referencePolicy,
    cinematic ? "Preserve the requested visual style and Ultra detail: cinematic composition and lighting, realistic materials and characters, strong depth, detailed environments, atmospheric effects, and natural character integration." : "",
    NO_VISIBLE_TEXT_INSTRUCTION,
  ];
  return sections.filter(Boolean).join("\n\n");
}

export function normalizeSceneScript(value) {
  const blocks = Array.isArray(value?.blocks) ? value.blocks : [];
  return {
    version: 1,
    blocks: blocks.filter((block) => block && SCENE_SCRIPT_BLOCK_TYPES.includes(block.type)).map((block) => ({
      id: block.id || crypto.randomUUID(),
      type: block.type,
      characterId: block.characterId || "",
      characterName: block.characterName || "",
      text: typeof block.text === "string" ? block.text : "",
    })),
  };
}

export function formatSceneScriptPrompt(value) {
  const { blocks } = normalizeSceneScript(value);
  const labels = { character: "CHARACTER", action: "ACTION", dialogue: "DIALOGUE", narration: "NARRATION", camera: "CAMERA", audio: "AUDIO" };
  return blocks.filter((block) => block.type === "character" || block.text.trim()).map((block) => {
    const speaker = block.characterName ? ` (${block.characterName}${block.characterId ? `; character ID ${block.characterId}` : ""})` : "";
    const valueText = block.type === "character" ? block.characterName || "Unspecified character" : block.text.trim();
    return `${labels[block.type]}${["action", "dialogue"].includes(block.type) ? speaker : ""}: ${valueText}`;
  }).join("\n");
}

export function getSceneCharacters(scene, availableCharacters = []) {
  const metadata = scene?.metadata || {};
  const saved = metadata.sceneCharacters?.length
    ? metadata.sceneCharacters
    : metadata.characters?.length
      ? metadata.characters
      : metadata.character ? [metadata.character] : [];
  const blocks = scene?.sceneScript?.blocks || metadata.sceneScript?.blocks || [];
  const seen = new Set();
  const ordered = [];
  const add = (reference) => {
    const id = typeof reference === "string" ? reference : reference?.id || reference?.characterId;
    const name = typeof reference === "object" ? reference.name || reference.characterName : "";
    if ((!id && !name) || (id && seen.has(id))) return;
    if (id) seen.add(id);
    const live = id ? availableCharacters.find((character) => character.id === id) : null;
    ordered.push(live || { ...(typeof reference === "object" ? reference : {}), id: id || null, name: live?.name || name || "Character" });
  };
  saved.forEach(add);
  if (!saved.length) blocks.filter((block) => ["character", "action", "dialogue"].includes(block.type)).forEach((block) => add({ id: block.characterId, name: block.characterName }));
  return ordered;
}
