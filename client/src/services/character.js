import api from "./api";
import { resolveMediaUrl } from "@/utils/mediaUrl";

function normalizeCharacter(character) {
  if (!character) return character;
  const imageUrl = resolveMediaUrl(character.imageUrl || character.image);
  return { ...character, imageUrl, image: imageUrl };
}

/*
 * Get all characters for the current user.
 */
export async function getCharacters() {
  const response = await api.get("/characters");

  const characters = (
    response.data?.data?.characters ||
    response.data?.data ||
    []
  );
  return Array.isArray(characters) ? characters.map(normalizeCharacter) : [];
}

/*
 * Get one character.
 */
export async function getCharacter(id) {
  const response = await api.get(
    `/characters/${id}`,
  );

  return normalizeCharacter(
    response.data?.data?.character ||
    response.data?.data ||
    null
  );
}

/*
 * Create a character.
 */
export async function createCharacter(
  characterData,
) {
  const response = await api.post(
    "/characters",
    characterData,
  );

  return normalizeCharacter(
    response.data?.data?.character ||
    response.data?.data ||
    null
  );
}

/*
 * Update a character.
 */
export async function updateCharacter(
  id,
  characterData,
) {
  const response = await api.patch(
    `/characters/${id}`,
    characterData,
  );

  return normalizeCharacter(
    response.data?.data?.character ||
    response.data?.data ||
    null
  );
}

/*
 * Delete a character.
 */
export async function deleteCharacter(id) {
  await api.delete(`/characters/${id}`);

  return true;
}
