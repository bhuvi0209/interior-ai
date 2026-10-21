import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        padding: "16px 24px",
        background: "#20242c",
        color: "white",
      }}
    >
      <Link
        to="/"
        style={{
          color: "white",
          textDecoration: "none",
        }}
      >
        Home
      </Link>

      <Link
        to="/upload"
        style={{
          color: "white",
          textDecoration: "none",
        }}
      >
        Upload Room
      </Link>

      <Link
        to="/style"
        style={{
          color: "white",
          textDecoration: "none",
        }}
      >
        Style
      </Link>

      <Link
        to="/editor"
        style={{
          color: "white",
          textDecoration: "none",
        }}
      >
        2D and 3D View
      </Link>
    </nav>
  );
}