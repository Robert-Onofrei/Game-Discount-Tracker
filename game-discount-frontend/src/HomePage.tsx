import { useEffect, useMemo, useState } from "react";

//Object
type Deal = {
  dealID: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  dealRating: string;
  thumb: string;
};

const API = "http://localhost:8000";
const PAGE_SIZE = 20;

export default function HomePage() {
  //Sorts alphabetically on load, Scroll though 60 games
  const [sort, setSort] = useState<"title" | "biggest_discount">("title");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function loadDeals() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/deals?sort=popular&page=1&page_size=200`);
      const data = await res.json();
      setDeals(data.results ?? []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals().catch(() => setLoading(false));
  }, []);

  const sortedDeals = useMemo(() => {
    const copy = [...deals];
    if (sort === "title") {
      copy.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
    } else if (sort === "biggest_discount") {
      copy.sort((a, b) => Number(b.savings || 0) - Number(a.savings || 0));
    }
    return copy;
  }, [deals, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedDeals.length / PAGE_SIZE));
  const pageDeals = sortedDeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  //Returns React page
  return (
    <div className="panel section">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h1" style={{ fontSize: 26 }}>🔥 Deals</div>
          <div className="sub">Browse deals</div>
        </div>

        <div className="row">
          <span className="badge">Sort</span>
          <select
            className="input"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as any);
              setPage(1);
            }}
            style={{ minWidth: 220 }}
          >
            <option value="title">Alphabetical (A–Z)</option>
            <option value="biggest_discount">Biggest discount</option>
          </select>

          <button className="btn" onClick={loadDeals} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Change pages */}
      <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
        <div className="sub">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedDeals.length)} of {sortedDeals.length}
        </div>

        <div className="row">
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            Prev
          </button>
          <span className="badge">
            Page {page} / {totalPages}
          </span>
          <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
            Next
          </button>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        {pageDeals.map((d) => {
          const savings = Number(d.savings || 0);
          return (
            <div key={d.dealID} className="card">
              <div className="card-top">
                <img className="thumb" src={d.thumb} alt="" />
                <div>
                  <div className="title">{d.title}</div>
                  <div className="meta">
                    €{d.salePrice}{" "}
                    <span style={{ textDecoration: "line-through", opacity: 0.7 }}>
                      €{d.normalPrice}
                    </span>
                  </div>
                  <div className="meta">Save {savings.toFixed(0)}%</div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                <span className={`badge ${savings >= 70 ? "deal" : ""}`}>{savings >= 70 ? "Huge deal" : "Deal"}</span>
                <a
                  className="btn primary"
                  href={`https://www.cheapshark.com/redirect?dealID=${d.dealID}`}
                  target="_blank"
                  rel="noreferrer">
                  View deal
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}