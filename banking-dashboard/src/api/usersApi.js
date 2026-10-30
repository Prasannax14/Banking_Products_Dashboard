// Mock API layer for users. Same pattern as productsApi.js.
export async function fetchUsers() {
  const res = await fetch(import.meta.env.BASE_URL + "api/users.json");
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  return res.json();
}
