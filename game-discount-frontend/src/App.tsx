import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import SearchPage from "./SearchPage.tsx";
import WishlistPage from "./WishlistPage";

//Used React Router for navigation of sites

export default function App() {
  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            🎮 Game Discount Tracker
          </div>

          {/*Main Page that renders other pages and supplies buttons for navigation*/}

          <div className="nav">
            <NavLink
              to="/"
              className={({ isActive }) => `btn ${isActive ? "active" : ""}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) => `btn ${isActive ? "active" : ""}`}
            >
              Search
            </NavLink>
            <NavLink
              to="/wishlist"
              className={({ isActive }) => `btn ${isActive ? "active" : ""}`}
            >
              Wishlist
            </NavLink>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}