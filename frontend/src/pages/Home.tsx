import { Link } from "react-router-dom";

function Home() {
  return (
    <div
      style={{
        padding: "60px",
        textAlign: "center",
      }}
    >
      <h1>🏠 Interior AI Studio</h1>

      <h2>Design Your Dream Room</h2>

      <p>
        Upload your room, choose a style,
        add furniture and create your design.
      </p>

      <Link to="/upload">
        <button
          style={{
            padding: "15px 30px",
            marginTop: "20px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Start Designing
        </button>
      </Link>
    </div>
  );
}

export default Home;