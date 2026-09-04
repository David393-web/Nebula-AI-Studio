import api from "./api";

/*
 * Get all characters for the current user.
 */
export async function getCharacters() {
  const response = await api.get("/characters");

  return (
    response.data?.data?.characters ||
    response.data?.data ||
    []
  );
}

/*
 * Get one character.
 */
export async function getCharacter(id) {
  const response = await api.get(
    `/characters/${id}`,
  );

  return (
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

  return (
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

  return (
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