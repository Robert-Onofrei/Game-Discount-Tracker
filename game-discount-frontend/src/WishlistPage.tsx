import { useEffect, useState } from "react";
import { checkWishlist, getWishlist, removeFromWishlist } from "./api";

//Objects
type WishlistItem = {
  _id: string;
  gameID: string;
  title: string;
  targetPrice: number;
};

type CheckResult = {
  gameID: string;
  title: string;
  targetPrice: number;
  currentPrice: number | null;
  isDeal: boolean;
  storeName?: string | null;
  buyLink?: string | null;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadWishlistUI() {
    const w = await getWishlist();
    setWishlist(w);
  }

  useEffect(() => {
    loadWishlistUI().catch(() => {});
  }, []);

  //Checks to see if prices differ
  async function runCheck() {
    setMsg(null);
    setLoading(true);
    try {
      const data: CheckResult[] = await checkWishlist();
      const map: Record<string, CheckResult> = {};
      for (const r of data) map[r.gameID] = r;
      setChecks(map);
    } catch (e: any) {
      setMsg(e.message ?? "Check error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(gameID: string) {
    setMsg(null);
    setLoading(true);
    try {
      await removeFromWishlist(gameID);
      await loadWishlistUI();
    } catch (e: any) {
      setMsg(e.message ?? "Remove error");
    } finally {
      setLoading(false);
    }
  }

  //Returns React Page
  return (
    <div className="panel section">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h1" style={{ fontSize: 26 }}>⭐ Wishlist</div>
          <div className="sub">Check if your tracked games hit the target price.</div>
        </div>

        <div className="row">
          <button className="btn primary" onClick={runCheck} disabled={loading}>
            {loading ? "Checking..." : "Check prices"}
          </button>
          <button className="btn" onClick={loadWishlistUI} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {wishlist.length === 0 ? (
        <p className="sub" style={{ marginTop: 14 }}>
          No tracked games yet — go to Search and track one now!
        </p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Target</th>
                <th>Current</th>
                <th>Status</th>
                <th>Buy</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {wishlist.map((w) => {
                const c = checks[w.gameID];
                const isDeal = !!c?.isDeal;

                return (
                  <tr key={w._id} style={{ background: isDeal ? "rgba(0,255,140,0.08)" : "transparent" }}>
                    <td>
                      <div className="title">{w.title}</div>
                    </td>
                    <td>€{Number(w.targetPrice).toFixed(2)}</td>
                    <td>{c?.currentPrice != null ? `€${c.currentPrice.toFixed(2)}` : "-"}</td>
                    <td>
                      {c ? (
                        isDeal ? <span className="badge deal">🔥 Deal</span> : <span className="badge">Not yet</span>
                      ) : (
                        <span className="badge">Not checked</span>
                      )}
                    </td>
                    <td>
                      {c?.buyLink ? (<a href={c.buyLink} target="_blank" rel="noreferrer">{c.storeName ? `Buy (${c.storeName})` : "Buy"}</a>) : ("-")}
                    </td>
                    <td>
                      <button className="btn ghost" onClick={() => remove(w.gameID)} disabled={loading}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}