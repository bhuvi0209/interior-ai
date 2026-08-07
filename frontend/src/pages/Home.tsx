import { useEffect, useState } from "react";
import api from "../services/api";

function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>🏠 Interior AI Studio</h1>
      <h2>Backend Response:</h2>
      <p>{message}</p>
    </div>
  );
}

export default Home;