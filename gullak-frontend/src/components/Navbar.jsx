import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <button className="brand" onClick={() => navigate("/home")} aria-label="Go to home">
        <span className="brand-icon">🪙</span>
        <span>Gull<span>ak</span></span>
      </button>
      <nav className="nav-links">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/goals">Goals</NavLink>
        <NavLink to="/friends">Friends</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
      <div className="nav-actions">
        <span className="nav-user">@{user?.username}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
