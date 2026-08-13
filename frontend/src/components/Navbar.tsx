import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "20px",
        padding: "15px 25px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link to="/">Home</Link>

      <Link to="/upload">
        Upload Room
      </Link>

      <Link to="/style">
        Style
      </Link>

      <Link to="/furniture">
        Furniture
      </Link>

      <Link to="/editor">
        2D Editor
      </Link>

      <Link to="/3d">
        3D View
      </Link>
    </nav>
  );
}

export default Navbar;