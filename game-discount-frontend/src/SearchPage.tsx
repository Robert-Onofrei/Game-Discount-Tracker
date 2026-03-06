import { useState } from "react";
import { addToWishlist, searchGames } from "./api";

//Object
type SearchItem = {
  gameID: string;
  external: string;
  cheapest: string;
  thumb: string;
};

//Orginally had a search bar only, but decided that displaying a large list of games would look better on its own individual page
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [targetPrice, setTargetPrice] = useState(20);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function doSearch() {
    setMsg(null);
    setLoading(true);
    try {
      const data = await searchGames(query.trim());
      const list = Array.isArray(data) ? data : data.results;
      setResults(list || []);
    } catch (e: any) {
      setMsg(e.message ?? "Search error");
    } finally {
      setLoading(false);
    }
  }

  async function track(item: SearchItem) {
    setMsg(null);
    setLoading(true);
    try {
      await addToWishlist(item.gameID, item.external, targetPrice);
      setMsg(`✅ Added "${item.external}" to wishlist at €${targetPrice}`);
    } catch (e: any) {
      setMsg(e.message ?? "Track error");
    } finally {
      setLoading(false);
    }
  }

  //Returns React Page
  return (
    <div className="panel section">
      <div className="h1" style={{ fontSize: 26 }}>🔎 Search</div>
      <div className="sub">Search for games and track them with a target price.</div>

      <div className="row" style={{ marginTop: 14 }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a game (e.g. lego batman)"
          style={{ minWidth: 320 }}
        />
        <button className="btn primary" onClick={doSearch} disabled={loading || query.trim().length < 2}>
          {loading ? "Searching..." : "Search"}
        </button>

        <span className="badge">Target €</span>
        <input
          className="input"
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(Number(e.target.value))}
          style={{ width: 140, minWidth: 140 }}
        />
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div className="grid" style={{ marginTop: 16 }}>
        {results.map((r) => (
          <div key={r.gameID} className="card">
            <div className="card-top">
              <img className="thumb" src={r.thumb} alt="" />
              <div>
                <div className="title">{r.external}</div>
                <div className="meta">Cheapest: €{r.cheapest}</div>
                <div className="meta">gameID: {r.gameID}</div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
              <span className="badge">Track at €{targetPrice}</span>
              <button className="btn" onClick={() => track(r)} disabled={loading}>
                Track
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <p className="sub" style={{ marginTop: 14 }}>
          No results yet — search above.
        </p>
      )}
    </div>
  );
}