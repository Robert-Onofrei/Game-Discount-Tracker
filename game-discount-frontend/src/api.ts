const API = "http://127.0.0.1:8000";

export async function searchGames(title: string) {
  const res = await fetch(`${API}/search?title=${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function addToWishlist(gameID: string, title: string, targetPrice: number) {
  const res = await fetch(`${API}/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameID, title, targetPrice }),
  });
  if (!res.ok) throw new Error("Add to wishlist failed");
  return res.json();
}

export async function getWishlist() {
  const res = await fetch(`${API}/wishlist`);
  if (!res.ok) throw new Error("Load wishlist failed");
  return res.json();
}

export async function checkWishlist() {
  const res = await fetch(`${API}/wishlist/check`);
  if (!res.ok) throw new Error("Check wishlist failed");
  return res.json();
}

export async function removeFromWishlist(gameID: string) {
  const res = await fetch(`${API}/wishlist/${encodeURIComponent(gameID)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Remove failed");
  return res.json();
}