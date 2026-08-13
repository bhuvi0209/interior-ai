import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import UploadRoom from "./pages/UploadRoom";
import StyleSelection from "./pages/StyleSelection";
import FurnitureLibrary from "./pages/FurnitureLibrary";
import RoomEditor from "./pages/RoomEditor";
import Room3D from "./pages/Room3D";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/upload"
          element={<UploadRoom />}
        />

        <Route
          path="/style"
          element={<StyleSelection />}
        />

        <Route
          path="/furniture"
          element={<FurnitureLibrary />}
        />

        <Route
          path="/editor"
          element={<RoomEditor />}
        />

        <Route
          path="/3d"
          element={<Room3D />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;