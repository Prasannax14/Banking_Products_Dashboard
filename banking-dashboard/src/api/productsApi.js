// Mock API layer. Swap this one function for a real endpoint later;
// no UI component needs to change.
export async function fetchProducts() {
  const res = await fetch(import.meta.env.BASE_URL + "api/products.json");
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  return res.json();
}
