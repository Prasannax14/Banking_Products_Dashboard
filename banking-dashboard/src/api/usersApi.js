// Mock API layer for users.
export async function fetchUsers() {
  let res;
  try {
    res = await fetch(import.meta.env.BASE_URL + "api/users.json");
  } catch (err) {
    throw new Error("Network error: Unable to reach the accounts service. Please check your connection.");
  }

  if (!res.ok) {
    throw new Error(`Server error: Request failed with status ${res.status} (${res.statusText || "Error"})`);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new Error("Data error: Received invalid or corrupted JSON response from the server.");
  }
}
